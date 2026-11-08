create extension if not exists pg_trgm;
create type pub_status as enum ('draft','in_review','published');
create type verif_label as enum ('verified','under_review','disputed','unverified','primary_source','modern_assessment');
create type lang_code as enum ('en','ur','ar');

create or replace function is_editor() returns boolean language sql stable as
$$ select coalesce(auth.jwt()->'app_metadata'->>'role','') in ('editor','admin') $$;

create table scholars(
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug ~ '^[a-z0-9-]+$'),
  birth_year int, death_year int, dates_note text,
  region text not null, period_group text not null,
  status pub_status not null default 'draft',
  created_at timestamptz default now(), updated_at timestamptz default now(),
  check (birth_year is null or death_year is null or birth_year <= death_year));
create table scholar_translations(
  scholar_id uuid references scholars on delete cascade, lang lang_code,
  name text not null, name_normalized text, biography text,
  primary key(scholar_id, lang));
create table disciplines(id serial primary key, slug text unique not null, name_en text not null, name_ur text, name_ar text);
create table scholar_disciplines(scholar_id uuid references scholars on delete cascade, discipline_id int references disciplines on delete cascade, primary key(scholar_id, discipline_id));
create table sources(id uuid primary key default gen_random_uuid(), title text not null, author text, publication text, url text check (url is null or url ~ '^https?://'), source_type text, created_at timestamptz default now());
create table contributions(id uuid primary key default gen_random_uuid(), scholar_id uuid not null references scholars on delete cascade, lang lang_code not null default 'en', description text not null, label verif_label not null default 'under_review');
create table works(id uuid primary key default gen_random_uuid(), scholar_id uuid not null references scholars on delete cascade, original_title text not null, alt_spellings text[], original_language text, subject text, authorship_status verif_label not null default 'under_review', publication_note text);
create table claim_sources(id uuid primary key default gen_random_uuid(), contribution_id uuid references contributions on delete cascade, work_id uuid references works on delete cascade, source_id uuid not null references sources, locator text, evidence_notes text, check (num_nonnulls(contribution_id, work_id) = 1));
create table editorial_reviews(id uuid primary key default gen_random_uuid(), scholar_id uuid not null references scholars on delete cascade, reviewer uuid not null default auth.uid(), decision text not null check (decision in ('approved','changes_requested','rejected')), notes text, created_at timestamptz default now());

create index on scholars(status, region, period_group);
create index on scholar_translations using gin (name_normalized gin_trgm_ops);
create index on scholar_disciplines(discipline_id);
create index on contributions(scholar_id); create index on works(scholar_id);

-- A scholar cannot be published without a source and an approving review.
create or replace function enforce_publish() returns trigger language plpgsql as $$
begin
  if new.status='published' and not (
    exists(select 1 from claim_sources cs join works w on w.id=cs.work_id where w.scholar_id=new.id)
    or exists(select 1 from claim_sources cs join contributions c on c.id=cs.contribution_id where c.scholar_id=new.id))
  then raise exception 'Cannot publish: no source attached'; end if;
  if new.status='published' and not exists(select 1 from editorial_reviews r where r.scholar_id=new.id and r.decision='approved')
  then raise exception 'Cannot publish: no approved review'; end if;
  new.updated_at=now(); return new; end $$;
create trigger scholars_publish before insert or update on scholars for each row execute function enforce_publish();

alter table scholars enable row level security; alter table scholar_translations enable row level security;
alter table disciplines enable row level security; alter table scholar_disciplines enable row level security;
alter table sources enable row level security; alter table contributions enable row level security;
alter table works enable row level security; alter table claim_sources enable row level security;
alter table editorial_reviews enable row level security;

create policy pub_read on scholars for select using (status='published');
create policy pub_read on scholar_translations for select using (exists(select 1 from scholars s where s.id=scholar_id and s.status='published'));
create policy pub_read on scholar_disciplines for select using (exists(select 1 from scholars s where s.id=scholar_id and s.status='published'));
create policy pub_read on contributions for select using (exists(select 1 from scholars s where s.id=scholar_id and s.status='published'));
create policy pub_read on works for select using (exists(select 1 from scholars s where s.id=scholar_id and s.status='published'));
create policy pub_read on claim_sources for select using (exists(select 1 from contributions c join scholars s on s.id=c.scholar_id where c.id=contribution_id and s.status='published') or exists(select 1 from works w join scholars s on s.id=w.scholar_id where w.id=work_id and s.status='published'));
create policy pub_read on sources for select using (exists(select 1 from claim_sources cs where cs.source_id=sources.id));
create policy pub_read on disciplines for select using (true);

do $$ declare t text; begin
 foreach t in array array['scholars','scholar_translations','disciplines','scholar_disciplines','sources','contributions','works','claim_sources','editorial_reviews'] loop
  execute format('create policy editor_all on %I for all to authenticated using (is_editor()) with check (is_editor())', t);
 end loop; end $$;
