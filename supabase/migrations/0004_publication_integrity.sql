-- 0004: content-revision tracking, UPDATE guards, SECURITY DEFINER lockdown.

-- A. Private schema for internal functions: not exposed through the API, no RPC access.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
alter default privileges in schema private revoke execute on functions from public, anon, authenticated;
alter function public.is_editor() set schema private;
alter function public.check_scholar_sourced(uuid) set schema private;
alter function public.enforce_publish() set schema private;
alter function public.guard_published_sources() set schema private;
alter function public.fill_name_normalized() set schema private;
alter function private.fill_name_normalized() set search_path = '';

create or replace function private.is_editor() returns boolean language sql stable set search_path = '' as
$$ select coalesce(auth.jwt()->'app_metadata'->>'role','') in ('editor','admin') $$;
create or replace function private.scholar_of(cid uuid, wid uuid) returns uuid language sql stable security definer set search_path = '' as
$$ select coalesce((select scholar_id from public.contributions where id = cid), (select scholar_id from public.works where id = wid)) $$;
create or replace function private.check_scholar_sourced(sid uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.claim_sources cs join public.works w on w.id = cs.work_id where w.scholar_id = sid)
      or exists(select 1 from public.claim_sources cs join public.contributions c on c.id = cs.contribution_id where c.scholar_id = sid) $$;

-- B. Content revision: every substantive change bumps content_rev and records the editor.
alter table scholars add column if not exists content_rev int not null default 1, add column if not exists last_edited_by uuid;
alter table editorial_reviews add column if not exists content_rev int, add column if not exists seq bigint generated always as identity;
update editorial_reviews r set content_rev = s.content_rev from scholars s where s.id = r.scholar_id and r.content_rev is null;
alter table editorial_reviews alter column content_rev set not null;

create or replace function private.touch_scholar(sid uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.scholars set content_rev = content_rev + 1, last_edited_by = auth.uid(),
    status = case when status = 'published' then 'in_review'::public.pub_status else status end
  where id = sid;
end $$;

create or replace function private.touch_from_child() returns trigger language plpgsql security definer set search_path = '' as $$
declare s_old uuid; s_new uuid;
begin
  if tg_table_name = 'claim_sources' then
    if tg_op <> 'INSERT' then s_old := private.scholar_of(old.contribution_id, old.work_id); end if;
    if tg_op <> 'DELETE' then s_new := private.scholar_of(new.contribution_id, new.work_id); end if;
  else
    if tg_op <> 'INSERT' then s_old := old.scholar_id; end if;
    if tg_op <> 'DELETE' then s_new := new.scholar_id; end if;
  end if;
  if s_old is not null then perform private.touch_scholar(s_old); end if;
  if s_new is not null and s_new is distinct from s_old then perform private.touch_scholar(s_new); end if;
  return null; end $$;

create or replace function private.touch_from_source() returns trigger language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  for r in select distinct coalesce(c.scholar_id, w.scholar_id) as sid from public.claim_sources cs
           left join public.contributions c on c.id = cs.contribution_id left join public.works w on w.id = cs.work_id
           where cs.source_id = new.id loop
    if r.sid is not null then perform private.touch_scholar(r.sid); end if;
  end loop; return null; end $$;

create or replace function private.enforce_publish() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if new.status = 'published' then raise exception 'Scholars cannot be created as published'; end if;
    new.created_by := coalesce(auth.uid(), new.created_by); new.last_edited_by := auth.uid(); new.content_rev := 1;
  else
    new.created_by := old.created_by;                                   -- immutable
    if pg_trigger_depth() = 1 then                                      -- direct edit: revision fields are server-controlled
      new.content_rev := old.content_rev; new.last_edited_by := old.last_edited_by;
      if (new.slug, new.birth_year, new.death_year, new.dates_note, new.region, new.period_group)
         is distinct from (old.slug, old.birth_year, old.death_year, old.dates_note, old.region, old.period_group) then
        new.content_rev := old.content_rev + 1; new.last_edited_by := auth.uid();
        if new.status = 'published' then new.status := 'in_review'; end if;   -- changed content must be re-approved
      end if;
    end if;
    if new.status = 'published' then
      if old.status = 'draft' then raise exception 'Scholar must be in_review before publishing'; end if;
      if not private.check_scholar_sourced(new.id) then raise exception 'Cannot publish: no source attached'; end if;
      if not exists (select 1 from public.editorial_reviews r
          where r.scholar_id = new.id and r.content_rev = new.content_rev and r.decision = 'approved'
            and r.reviewer is distinct from new.created_by and r.reviewer is distinct from new.last_edited_by
            and not exists (select 1 from public.editorial_reviews x where x.scholar_id = r.scholar_id and x.content_rev = r.content_rev and x.seq > r.seq and x.decision <> 'approved'))
      then raise exception 'Cannot publish: needs an approved review of the current content from an editor who neither created nor last edited it'; end if;
    end if;
  end if;
  new.updated_at := now(); return new; end $$;

create or replace function private.guard_published_sources() returns trigger language plpgsql security definer set search_path = '' as $$
declare sid uuid;
begin
  if tg_table_name = 'claim_sources' then sid := private.scholar_of(old.contribution_id, old.work_id); else sid := old.scholar_id; end if;
  if sid is not null and exists (select 1 from public.scholars where id = sid and status = 'published') and not private.check_scholar_sourced(sid)
    then raise exception 'Published scholar must keep at least one source'; end if;
  return null; end $$;

create or replace function private.prepare_review() returns trigger language plpgsql security definer set search_path = '' as $$
declare st public.pub_status; rev int;
begin
  select status, content_rev into st, rev from public.scholars where id = new.scholar_id;
  if st is distinct from 'in_review' then raise exception 'Reviews can only be recorded while the scholar is in_review'; end if;
  new.content_rev := rev; new.reviewer := coalesce(auth.uid(), new.reviewer); return new; end $$;

-- Triggers fire alphabetically: guards (g*) run before touch (zz*) so a guard error is never masked by demotion.
create trigger guard_cs_upd after update on claim_sources for each row execute function private.guard_published_sources();
create trigger guard_contrib_upd after update of scholar_id on contributions for each row execute function private.guard_published_sources();
create trigger guard_works_upd after update of scholar_id on works for each row execute function private.guard_published_sources();
create trigger zz_touch_cs after insert or update or delete on claim_sources for each row execute function private.touch_from_child();
create trigger zz_touch_contrib after insert or update or delete on contributions for each row execute function private.touch_from_child();
create trigger zz_touch_works after insert or update or delete on works for each row execute function private.touch_from_child();
create trigger zz_touch_trans after insert or update or delete on scholar_translations for each row execute function private.touch_from_child();
create trigger zz_touch_disc after insert or update or delete on scholar_disciplines for each row execute function private.touch_from_child();
create trigger zz_touch_sources after update of title, author, publication, url, source_type on sources for each row execute function private.touch_from_source();
create trigger prepare_review before insert on editorial_reviews for each row execute function private.prepare_review();

-- C. Execute privileges: nothing in private is callable through the API; only the RLS helper for signed-in users.
revoke execute on all functions in schema private from public, anon, authenticated;
grant execute on function private.is_editor() to authenticated;
revoke truncate, references, trigger on all tables in schema public from anon, authenticated;
alter default privileges in schema public revoke truncate, references, trigger on tables from anon, authenticated;
