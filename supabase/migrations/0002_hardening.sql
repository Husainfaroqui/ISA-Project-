-- Review fixes for 0001
create or replace function is_editor() returns boolean language sql stable set search_path = public as
$$ select coalesce(auth.jwt()->'app_metadata'->>'role','') in ('editor','admin') $$;
create or replace function fill_name_normalized() returns trigger language plpgsql set search_path = public as
$$ begin new.name_normalized := lower(regexp_replace(translate(new.name,'أإآيىك','ااايیک'),'[\u064B-\u065F\u0670]','','g')); return new; end $$;
create trigger translations_norm before insert or update on scholar_translations for each row execute function fill_name_normalized();
alter function enforce_publish() set search_path = public;
create index if not exists claim_sources_source_idx on claim_sources(source_id);
create index if not exists claim_sources_work_idx on claim_sources(work_id);
create index if not exists claim_sources_contrib_idx on claim_sources(contribution_id);
create index if not exists reviews_scholar_idx on editorial_reviews(scholar_id);
-- Public API is read-only; writes are RLS-gated to editors only.
revoke insert, update, delete, truncate on all tables in schema public from anon;
revoke all on editorial_reviews from anon;
-- Reviewers may not edit or delete past reviews (audit trail).
drop policy editor_all on editorial_reviews;
create policy editor_read on editorial_reviews for select to authenticated using (is_editor());
create policy editor_insert on editorial_reviews for insert to authenticated with check (is_editor() and reviewer = auth.uid());
