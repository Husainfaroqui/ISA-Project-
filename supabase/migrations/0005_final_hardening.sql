-- 0005: final verification fixes.

-- 1. Review audit trail must survive scholar deletion (was ON DELETE CASCADE).
alter table editorial_reviews drop constraint editorial_reviews_scholar_id_fkey;
alter table editorial_reviews add constraint editorial_reviews_scholar_id_fkey foreign key (scholar_id) references scholars(id) on delete restrict;

-- 2. A reviewer must state the revision they reviewed; it is verified (not silently stamped) under a row lock,
--    so content that changed after the reviewer started cannot be approved by mistake or in a race.
create or replace function private.prepare_review() returns trigger language plpgsql security definer set search_path = '' as $$
declare st public.pub_status; rev int;
begin
  select status, content_rev into st, rev from public.scholars where id = new.scholar_id for share;
  if st is distinct from 'in_review' then raise exception 'Reviews can only be recorded while the scholar is in_review'; end if;
  if new.content_rev is null then raise exception 'A review must state the content_rev that was reviewed'; end if;
  if new.content_rev <> rev then raise exception 'Content changed since review started (reviewed revision %, current %)', new.content_rev, rev; end if;
  new.reviewer := coalesce(auth.uid(), new.reviewer); return new; end $$;

-- 3. Source-removal guard takes the scholar row lock first, so it serialises with publishing and with other
--    source removals (the check then runs on up-to-date data under READ COMMITTED).
create or replace function private.guard_published_sources() returns trigger language plpgsql security definer set search_path = '' as $$
declare sid uuid;
begin
  if tg_table_name = 'claim_sources' then sid := private.scholar_of(old.contribution_id, old.work_id); else sid := old.scholar_id; end if;
  if sid is null then return null; end if;
  perform 1 from public.scholars where id = sid for update;
  if exists (select 1 from public.scholars where id = sid and status = 'published') and not private.check_scholar_sourced(sid)
    then raise exception 'Published scholar must keep at least one source'; end if;
  return null; end $$;
