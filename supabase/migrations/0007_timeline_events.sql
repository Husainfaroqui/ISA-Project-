-- 0007 (Phase 3, Batch 3): scholar-associated timeline events with uncertain dates, claim-level sources,
-- wired into the publication gate, the source guards, change tracking and RLS.
create type event_type as enum ('birth','death','work_composed','publication','contribution','manuscript','institution','historical_event','translation');
create type date_certainty as enum ('exact','approximate','disputed');

create table timeline_events(
  id uuid primary key default gen_random_uuid(),
  scholar_id uuid not null references scholars on delete cascade,
  event_type event_type not null,
  title text not null check (length(trim(title)) > 0),
  description text,
  year_earliest int not null, year_latest int not null,
  date_certainty date_certainty not null,
  date_note text,
  confidence text not null check (confidence in ('high','medium','low','uncertain')),
  label verif_label not null default 'under_review',
  created_at timestamptz default now(),
  constraint year_range check (year_earliest <= year_latest),
  constraint exact_means_single_year check (date_certainty <> 'exact' or year_earliest = year_latest),
  constraint disputed_needs_note check (date_certainty <> 'disputed' or date_note is not null));
create index on timeline_events(scholar_id); create index on timeline_events(year_earliest, year_latest); create index on timeline_events(event_type);

-- claim_sources may now cite an event (exactly one target per row)
do $$ declare c text; begin
  for c in select conname from pg_constraint where conrelid = 'public.claim_sources'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%num_nonnulls%' loop
    execute format('alter table claim_sources drop constraint %I', c); end loop; end $$;
alter table claim_sources add column timeline_event_id uuid references timeline_events on delete cascade;
alter table claim_sources add constraint one_target check (num_nonnulls(contribution_id, work_id, timeline_event_id) = 1);
create index on claim_sources(timeline_event_id);

-- RLS: public sees events of published scholars only; editors manage; anon has no write privileges
alter table timeline_events enable row level security;
create policy pub_read on timeline_events for select using (exists (select 1 from scholars s where s.id = scholar_id and s.status = 'published'));
create policy editor_all on timeline_events for all to authenticated using (private.is_editor()) with check (private.is_editor());
revoke insert, update, delete on timeline_events from anon;
drop policy pub_read on claim_sources;
create policy pub_read on claim_sources for select using (
  exists (select 1 from contributions c join scholars s on s.id = c.scholar_id where c.id = contribution_id and s.status = 'published')
  or exists (select 1 from works w join scholars s on s.id = w.scholar_id where w.id = work_id and s.status = 'published')
  or exists (select 1 from timeline_events e join scholars s on s.id = e.scholar_id where e.id = timeline_event_id and s.status = 'published'));
drop policy pub_read on sources;
create policy pub_read on sources for select using (exists (
  select 1 from claim_sources cs
  left join contributions c on c.id = cs.contribution_id left join works w on w.id = cs.work_id left join timeline_events e on e.id = cs.timeline_event_id
  join scholars s on s.id = coalesce(c.scholar_id, w.scholar_id, e.scholar_id)
  where cs.source_id = sources.id and s.status = 'published'));

-- scholar_of gains the event target (replace the 2-arg version)
drop function private.scholar_of(uuid, uuid);
create function private.scholar_of(cid uuid, wid uuid, eid uuid default null) returns uuid language sql stable security definer set search_path = '' as
$$ select coalesce((select scholar_id from public.contributions where id = cid), (select scholar_id from public.works where id = wid), (select scholar_id from public.timeline_events where id = eid)) $$;
revoke execute on function private.scholar_of(uuid, uuid, uuid) from public, anon, authenticated;

create or replace function private.touch_from_child() returns trigger language plpgsql security definer set search_path = '' as $$
declare s_old uuid; s_new uuid;
begin
  if tg_table_name = 'claim_sources' then
    if tg_op <> 'INSERT' then s_old := private.scholar_of(old.contribution_id, old.work_id, old.timeline_event_id); end if;
    if tg_op <> 'DELETE' then s_new := private.scholar_of(new.contribution_id, new.work_id, new.timeline_event_id); end if;
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
  for r in select distinct coalesce(c.scholar_id, w.scholar_id, e.scholar_id) as sid from public.claim_sources cs
           left join public.contributions c on c.id = cs.contribution_id left join public.works w on w.id = cs.work_id left join public.timeline_events e on e.id = cs.timeline_event_id
           where cs.source_id = new.id loop
    if r.sid is not null then perform private.touch_scholar(r.sid); end if;
  end loop; return null; end $$;
create trigger zz_touch_events after insert or update or delete on timeline_events for each row execute function private.touch_from_child();

-- A published scholar keeps at least one source overall, and every event keeps at least one source.
create or replace function private.guard_published_sources() returns trigger language plpgsql security definer set search_path = '' as $$
declare sid uuid; eid uuid;
begin
  if tg_table_name = 'claim_sources' then sid := private.scholar_of(old.contribution_id, old.work_id, old.timeline_event_id); eid := old.timeline_event_id; else sid := old.scholar_id; end if;
  if sid is null then return null; end if;
  perform 1 from public.scholars where id = sid for update;
  if exists (select 1 from public.scholars where id = sid and status = 'published') then
    if not private.check_scholar_sourced(sid) then raise exception 'Published scholar must keep at least one source'; end if;
    if eid is not null and exists (select 1 from public.timeline_events where id = eid) and not exists (select 1 from public.claim_sources where timeline_event_id = eid)
      then raise exception 'Published scholar''s timeline events must keep a source'; end if;
  end if;
  return null; end $$;

create or replace function private.enforce_publish() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if new.status = 'published' then raise exception 'Scholars cannot be created as published'; end if;
    new.created_by := coalesce(auth.uid(), new.created_by); new.last_edited_by := auth.uid(); new.content_rev := 1;
  else
    new.created_by := old.created_by;
    if pg_trigger_depth() = 1 then
      new.content_rev := old.content_rev; new.last_edited_by := old.last_edited_by;
      if (new.slug, new.birth_year, new.death_year, new.dates_note, new.region, new.period_group)
         is distinct from (old.slug, old.birth_year, old.death_year, old.dates_note, old.region, old.period_group) then
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
      if not exists (select 1 from public.editorial_reviews r
          where r.scholar_id = new.id and r.content_rev = new.content_rev and r.decision = 'approved'
            and r.reviewer is distinct from new.created_by and r.reviewer is distinct from new.last_edited_by
            and not exists (select 1 from public.editorial_reviews x where x.scholar_id = r.scholar_id and x.content_rev = r.content_rev and x.seq > r.seq and x.decision <> 'approved'))
      then raise exception 'Cannot publish: needs an approved review of the current content from an editor who neither created nor last edited it'; end if;
    end if;
  end if;
  new.updated_at := now(); return new; end $$;
revoke execute on all functions in schema private from public, anon, authenticated;
grant execute on function private.is_editor() to authenticated;
