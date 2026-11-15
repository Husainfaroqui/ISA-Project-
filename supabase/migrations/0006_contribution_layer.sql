-- 0006 (Phase 3, Batch 0): contribution classification, confidence and evidence tiers.
alter type verif_label add value if not exists 'academically_supported';
alter type verif_label add value if not exists 'attribution_uncertain';
create type contribution_kind as enum ('original_invention','original_discovery','mathematical_development','experimental_contribution','theoretical_contribution','technical_improvement','observational_contribution','translation_or_preservation','commentary_or_synthesis','disputed_attribution');
create type evidence_tier as enum ('primary','contemporary_account','academic_research','later_traditional','community_devotional','disputed_uncertain','modern_assessment');

alter table contributions
  add column title text, add column kind contribution_kind,
  add column confidence text check (confidence in ('high','medium','low','uncertain')),
  add column discipline_id int references disciplines(id) on delete set null,
  add column period_text text, add column prior_state text, add column detail text,
  add constraint kind_needs_confidence check (kind is null or confidence is not null),
  add constraint strong_claims_need_high_confidence check (kind not in ('original_invention','original_discovery') or confidence = 'high'),
  add constraint disputed_is_low_confidence check (kind is distinct from 'disputed_attribution' or confidence in ('low','uncertain'));
alter table claim_sources add column evidence_tier evidence_tier;
create index on contributions(kind); create index on contributions(discipline_id);

-- Publication gate: "invention"/"discovery" claims need primary or academic evidence (in addition to the Phase 2 rules).
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
      if not exists (select 1 from public.editorial_reviews r
          where r.scholar_id = new.id and r.content_rev = new.content_rev and r.decision = 'approved'
            and r.reviewer is distinct from new.created_by and r.reviewer is distinct from new.last_edited_by
            and not exists (select 1 from public.editorial_reviews x where x.scholar_id = r.scholar_id and x.content_rev = r.content_rev and x.seq > r.seq and x.decision <> 'approved'))
      then raise exception 'Cannot publish: needs an approved review of the current content from an editor who neither created nor last edited it'; end if;
    end if;
  end if;
  new.updated_at := now(); return new; end $$;
