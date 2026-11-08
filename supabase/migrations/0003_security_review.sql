-- 0003: security review (Phase 2 follow-up)

-- 1. sources: explicit published-scholar check (defence in depth; does not rely on nested RLS alone)
drop policy if exists pub_read on sources;
create policy pub_read on sources for select using (exists (
  select 1 from claim_sources cs
  left join contributions c on c.id = cs.contribution_id
  left join works w on w.id = cs.work_id
  join scholars s on s.id = coalesce(c.scholar_id, w.scholar_id)
  where cs.source_id = sources.id and s.status = 'published'));
comment on column claim_sources.evidence_notes is 'PUBLIC-FACING when the claim is published. Internal editor notes belong in editorial_reviews.notes.';

-- 2. scholars.created_by: needed to forbid self-approval; hidden from anon
alter table scholars add column if not exists created_by uuid default auth.uid();
revoke select on scholars from anon;
grant select (id, slug, birth_year, death_year, dates_note, region, period_group, status, created_at, updated_at) on scholars to anon;

-- 3. Publication gate enforced by the database
create or replace function check_scholar_sourced(sid uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from claim_sources cs join works w on w.id = cs.work_id where w.scholar_id = sid)
      or exists(select 1 from claim_sources cs join contributions c on c.id = cs.contribution_id where c.scholar_id = sid) $$;

create or replace function enforce_publish() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'published' then
    if tg_op = 'INSERT' then raise exception 'Scholars cannot be created as published'; end if;
    if old.status = 'draft' then raise exception 'Scholar must be in_review before publishing'; end if;
    if not check_scholar_sourced(new.id) then raise exception 'Cannot publish: no source attached'; end if;
    if not exists (select 1 from editorial_reviews r where r.scholar_id = new.id and r.decision = 'approved' and r.reviewer is distinct from new.created_by)
      then raise exception 'Cannot publish: needs an approved review from someone other than the creator'; end if;
  end if;
  new.updated_at = now(); return new; end $$;

-- A published scholar can never lose its last source.
create or replace function guard_published_sources() returns trigger language plpgsql security definer set search_path = public as $$
declare sid uuid;
begin
  if tg_table_name = 'claim_sources' then
    select coalesce((select scholar_id from contributions where id = old.contribution_id), (select scholar_id from works where id = old.work_id)) into sid;
  else sid := old.scholar_id; end if;
  if sid is not null and exists (select 1 from scholars where id = sid and status = 'published') and not check_scholar_sourced(sid)
    then raise exception 'Published scholar must keep at least one source'; end if;
  return null; end $$;
create trigger guard_cs after delete on claim_sources for each row execute function guard_published_sources();
create trigger guard_contrib after delete on contributions for each row execute function guard_published_sources();
create trigger guard_works after delete on works for each row execute function guard_published_sources();
