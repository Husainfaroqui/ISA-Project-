-- 0009 (Phase 4): admin RBAC, archive state, append-only audit log, media records + private storage bucket.
alter type pub_status add value if not exists 'archived';

-- public API needs these columns (0003 granted anon a column list; scholar_kind from 0008 was missing)
alter table scholars add column period_rank int generated always as (case period_group when 'early' then 1 when 'classical' then 2 when 'modern' then 3 else 9 end) stored;
create index on scholars(period_rank);
grant select (scholar_kind, period_rank) on scholars to anon;

-- roles: 'editor' (editorial work), 'admin' (editor + delete/archive/restore). Role lives in app_metadata (server-side only).
create function private.is_admin() returns boolean language sql stable set search_path = '' as
$$ select coalesce(auth.jwt()->'app_metadata'->>'role','') = 'admin' $$;
grant execute on function private.is_admin() to authenticated;

drop policy editor_all on scholars;
create policy editor_select on scholars for select to authenticated using (private.is_editor());
create policy editor_insert on scholars for insert to authenticated with check (private.is_editor());
create policy editor_update on scholars for update to authenticated using (private.is_editor()) with check (private.is_editor());
create policy admin_delete on scholars for delete to authenticated using (private.is_admin());

-- enforce_publish: archive/restore are admin-only; archived records can only return via in_review
create or replace function private.enforce_publish() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if new.status = 'published' then raise exception 'Scholars cannot be created as published'; end if;
    if new.status = 'archived' then raise exception 'Scholars cannot be created as archived'; end if;
    new.created_by := coalesce(auth.uid(), new.created_by); new.last_edited_by := auth.uid(); new.content_rev := 1;
  else
    new.created_by := old.created_by;
    if new.status = 'archived' and old.status is distinct from 'archived' and auth.uid() is not null and not private.is_admin()
      then raise exception 'Only an administrator can archive a scholar'; end if;
    if old.status = 'archived' and new.status is distinct from 'archived' then
      if auth.uid() is not null and not private.is_admin() then raise exception 'Only an administrator can restore an archived scholar'; end if;
      if new.status = 'published' then raise exception 'Restore an archived scholar to in_review, not published'; end if;
    end if;
    if pg_trigger_depth() = 1 then
      new.content_rev := old.content_rev; new.last_edited_by := old.last_edited_by;
      if (new.slug, new.birth_year, new.death_year, new.dates_note, new.region, new.period_group, new.scholar_kind)
         is distinct from (old.slug, old.birth_year, old.death_year, old.dates_note, old.region, old.period_group, old.scholar_kind) then
        new.content_rev := old.content_rev + 1; new.last_edited_by := auth.uid();
        if new.status = 'published' then new.status := 'in_review'; end if;
      end if;
    end if;
    if new.status = 'published' then
      if old.status = 'draft' then raise exception 'Scholar must be in_review before publishing'; end if;
      if not private.check_scholar_sourced(new.id) then raise exception 'Cannot publish: no source attached'; end if;
      if exists (select 1 from public.contributions c where c.scholar_id = new.id and c.kind in ('original_invention','original_discovery')
                 and not exists (select 1 from public.claim_sources cs where cs.contribution_id = c.id and cs.evidence_tier in ('primary','academic_research')))
        then raise exception 'Cannot publish: invention/discovery claims need primary or academic evidence'; end if;
      if exists (select 1 from public.timeline_events e where e.scholar_id = new.id and not exists (select 1 from public.claim_sources cs where cs.timeline_event_id = e.id))
        then raise exception 'Cannot publish: every timeline event needs a source'; end if;
      if exists (select 1 from public.scholar_relationships r where r.scholar_id = new.id and not exists (select 1 from public.claim_sources cs where cs.relationship_id = r.id))
        then raise exception 'Cannot publish: every relationship needs a source'; end if;
      if not exists (select 1 from public.editorial_reviews r
          where r.scholar_id = new.id and r.content_rev = new.content_rev and r.decision = 'approved'
            and r.reviewer is distinct from new.created_by and r.reviewer is distinct from new.last_edited_by
            and not exists (select 1 from public.editorial_reviews x where x.scholar_id = r.scholar_id and x.content_rev = r.content_rev and x.seq > r.seq and x.decision <> 'approved'))
      then raise exception 'Cannot publish: needs an approved review of the current content from an editor who neither created nor last edited it'; end if;
    end if;
  end if;
  new.updated_at := now(); return new; end $$;

-- A no-op UPDATE (a form re-saved without changes) is not a content change and must not demote a published scholar.
create or replace function private.touch_from_child() returns trigger language plpgsql security definer set search_path = '' as $$
declare s_old uuid; s_new uuid;
begin
  if tg_op = 'UPDATE' and (to_jsonb(new) - 'name_normalized') = (to_jsonb(old) - 'name_normalized') then return null; end if;
  if tg_table_name = 'claim_sources' then
    if tg_op <> 'INSERT' then s_old := private.scholar_of(old.contribution_id, old.work_id, old.timeline_event_id, old.relationship_id); end if;
    if tg_op <> 'DELETE' then s_new := private.scholar_of(new.contribution_id, new.work_id, new.timeline_event_id, new.relationship_id); end if;
  else
    if tg_op <> 'INSERT' then s_old := old.scholar_id; end if;
    if tg_op <> 'DELETE' then s_new := new.scholar_id; end if;
  end if;
  if s_old is not null then perform private.touch_scholar(s_old); end if;
  if s_new is not null and s_new is distinct from s_old then perform private.touch_scholar(s_new); end if;
  return null; end $$;

-- Name search normalisation: fold Arabic yeh (ي) to Persian/Urdu yeh (ی) as the client does; backfill (a no-op for revisions/audit).
create or replace function private.fill_name_normalized() returns trigger language plpgsql set search_path = '' as
$$ begin new.name_normalized := lower(regexp_replace(translate(new.name, 'أإآيىك', 'اااییک'), '[\u064B-\u065F\u0670]', '', 'g')); return new; end $$;
update scholar_translations set name = name;

-- Performance: RLS plans are large; PostgreSQL's JIT compiler can add 0.2-3 s to the first call (measured locally: ~3.3 s with JIT, ~9 ms without).
alter role anon set jit = off;
alter role authenticated set jit = off;

-- media records: licence and attribution are mandatory; changes are content changes (demote for re-review)
create type media_kind as enum ('image','document');
create table media_assets(
  id uuid primary key default gen_random_uuid(),
  scholar_id uuid not null references scholars on delete cascade,
  kind media_kind not null,
  storage_path text not null unique check (storage_path like 'scholars/%'),
  title text not null check (length(trim(title)) > 0),
  alt_text text, license text not null check (length(trim(license)) > 0), attribution text not null check (length(trim(attribution)) > 0),
  source_url text check (source_url is null or source_url ~ '^https?://'), provenance_note text,
  created_at timestamptz default now(),
  constraint image_needs_alt check (kind <> 'image' or length(trim(coalesce(alt_text,''))) > 0));
create index on media_assets(scholar_id);
alter table media_assets enable row level security;
create policy pub_read on media_assets for select using (exists (select 1 from scholars s where s.id = scholar_id and s.status = 'published'));
create policy editor_all on media_assets for all to authenticated using (private.is_editor()) with check (private.is_editor());
revoke insert, update, delete on media_assets from anon;
create trigger zz_touch_media after insert or update or delete on media_assets for each row execute function private.touch_from_child();

-- audit log: append-only record of editorial actions (written only by triggers)
create table audit_log(
  id bigint generated always as identity primary key, at timestamptz not null default now(),
  actor uuid, actor_role text, action text not null, table_name text not null, row_id text, scholar_id uuid, details jsonb);
create index on audit_log(scholar_id, at desc); create index on audit_log(at desc); create index on audit_log(actor);
alter table audit_log enable row level security;
create policy editor_read on audit_log for select to authenticated using (private.is_editor());
revoke all on audit_log from anon, authenticated; grant select on audit_log to authenticated;
create function private.reject_change() returns trigger language plpgsql set search_path = '' as $$ begin raise exception 'audit_log is append-only'; end $$;
create trigger audit_append_only before update or delete on audit_log for each row execute function private.reject_change();

create function private.audit_row() returns trigger language plpgsql security definer set search_path = '' as $$
declare j jsonb; sid uuid; rid text; ch jsonb;
begin
  if tg_op = 'DELETE' then j := to_jsonb(old); else j := to_jsonb(new); end if;
  sid := case tg_table_name
    when 'scholars' then (j->>'id')::uuid
    when 'claim_sources' then private.scholar_of((j->>'contribution_id')::uuid, (j->>'work_id')::uuid, (j->>'timeline_event_id')::uuid, (j->>'relationship_id')::uuid)
    when 'sources' then null
    else (j->>'scholar_id')::uuid end;
  rid := coalesce(j->>'id', (j->>'scholar_id') || ':' || coalesce(j->>'lang', j->>'discipline_id'));
  if tg_op = 'UPDATE' then
    select coalesce(jsonb_object_agg(n.key, jsonb_build_object('old', left(o.value::text, 500), 'new', left(n.value::text, 500))), '{}'::jsonb) into ch
      from jsonb_each(to_jsonb(new)) n join jsonb_each(to_jsonb(old)) o on o.key = n.key
      where n.value is distinct from o.value and n.key not in ('updated_at','content_rev','last_edited_by','name_normalized');
    if ch = '{}'::jsonb then return null; end if;
  else ch := jsonb_build_object('row', left(j::text, 2000)); end if;
  insert into public.audit_log(actor, actor_role, action, table_name, row_id, scholar_id, details)
  values (auth.uid(), case when auth.uid() is null then 'system' else coalesce(auth.jwt()->'app_metadata'->>'role', 'none') end, lower(tg_op), tg_table_name, rid, sid, ch);
  return null; end $$;
do $$ declare t text; begin
  foreach t in array array['scholars','scholar_translations','scholar_disciplines','contributions','works','timeline_events','scholar_relationships','claim_sources','sources','media_assets'] loop
    execute format('create trigger zz_audit after insert or update or delete on %I for each row execute function private.audit_row()', t);
  end loop; end $$;
create trigger zz_audit after insert on editorial_reviews for each row execute function private.audit_row();

-- private storage bucket (no-op on a plain PostgreSQL without Supabase's storage schema)
do $$ begin
  if to_regclass('storage.buckets') is not null and to_regclass('storage.objects') is not null then
    insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
      values ('scholar-media','scholar-media', false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf'])
      on conflict (id) do update set public = false, file_size_limit = 10485760, allowed_mime_types = excluded.allowed_mime_types;
    create policy scholar_media_public_read on storage.objects for select to anon, authenticated using (bucket_id = 'scholar-media' and exists (
      select 1 from public.media_assets m join public.scholars s on s.id = m.scholar_id where m.storage_path = name and s.status = 'published'));
    create policy scholar_media_editor_read on storage.objects for select to authenticated using (bucket_id = 'scholar-media' and private.is_editor());
    create policy scholar_media_editor_insert on storage.objects for insert to authenticated with check (bucket_id = 'scholar-media' and name like 'scholars/%' and private.is_editor());
    create policy scholar_media_editor_update on storage.objects for update to authenticated using (bucket_id = 'scholar-media' and private.is_editor()) with check (bucket_id = 'scholar-media' and name like 'scholars/%' and private.is_editor());
    create policy scholar_media_delete on storage.objects for delete to authenticated using (bucket_id = 'scholar-media' and (private.is_admin() or (private.is_editor() and not exists (select 1 from public.media_assets m where m.storage_path = name))));
  end if; end $$;
revoke execute on all functions in schema private from public, anon, authenticated;
grant execute on function private.is_editor() to authenticated; grant execute on function private.is_admin() to authenticated;
