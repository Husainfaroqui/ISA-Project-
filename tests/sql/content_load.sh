#!/bin/bash
# Loads supabase/content/ala_hazrat_draft.sql into a throwaway DB and checks it is draft-only, constraint-clean and publication-gated.
cd "$(dirname "$0")/../.."
P="psql -X -q -v ON_ERROR_STOP=1 -U postgres"; $P -c 'drop database if exists isa_content' -c 'create database isa_content' 2>/dev/null; P="$P -d isa_content"
$P -f tests/sql/00_stubs.sql >/dev/null; for f in supabase/migrations/*.sql; do $P -f "$f" >/dev/null; done; $P -f supabase/seed.sql >/dev/null
$P -f supabase/content/ala_hazrat_draft.sql && echo "ok: draft content loads without violating any constraint or trigger"
$P <<'SQL' 2>&1 | grep -E 'ok:|FAIL|ERROR'
create function chk(c boolean, m text) returns void language plpgsql as $$ begin if not c then raise exception 'FAIL: %', m; end if; raise notice 'ok: %', m; end $$;
select chk((select status::text from scholars where slug='ahmad-raza-khan')='draft', 'scholar is loaded as draft');
select chk((select count(*) from sources)=4 and (select count(*) from contributions)=2 and (select count(*) from works)=6 and (select count(*) from claim_sources)=14 and (select count(*) from timeline_events)=7, 'row counts: 4 sources, 2 contributions, 6 works, 7 events, 14 claim sources');
select chk((select count(*) from timeline_events e where not exists (select 1 from claim_sources c where c.timeline_event_id=e.id))=1 and (select label::text from timeline_events where title like 'Death%')='unverified', 'exactly one event is unsourced (the death year) and it is labeled unverified');
select chk((select count(*) from claim_sources where locator is null)=0 and (select count(*) from claim_sources where evidence_tier is null)=0, 'every claim source has a locator and evidence tier');
select chk((select count(*) from works where authorship_status<>'under_review')=0, 'all works are under_review');
select chk((select count(*) from contributions where kind in ('original_invention','original_discovery'))=0, 'no contribution is classified as invention/discovery');
grant execute on all functions in schema public to anon;
set role anon;
select chk((select count(*) from scholars)=0 and (select count(*) from contributions)=0 and (select count(*) from works)=0 and (select count(*) from sources)=0 and (select count(*) from claim_sources)=0 and (select count(*) from timeline_events)=0, 'public (anon) sees none of the draft content');
reset role;
do $$ begin begin update scholars set status='published' where slug='ahmad-raza-khan'; raise exception 'FAIL: published a draft'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; raise notice 'ok: cannot publish straight from draft (%)', sqlerrm; end; end $$;
update scholars set status='in_review' where slug='ahmad-raza-khan';
do $$ begin begin update scholars set status='published' where slug='ahmad-raza-khan'; raise exception 'FAIL: published without an approved review'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; raise notice 'ok: in_review without an approved independent review cannot publish (%)', sqlerrm; end; end $$;
SQL

# ---- Batch 2A draft content ----
$P -f supabase/content/batch_2a_draft.sql && echo "ok: Batch 2A draft content loads without violating any constraint or trigger"
set -- $(python3 - <<'PY'
import json;d=json.load(open('content/batch-2a.json'))
cs=sum(len(c['refs']) for c in d['contributions'])+sum(len(w['sources']) for w in d['works'])+sum(len(e['sources']) for e in d['events'])+sum(len(r['sources']) for r in d['relationships'])
print(len(d['scholars']),len([s for s in d['sources'] if s['read']]),len(d['works']),len(d['contributions']),len(d['events']),len(d['relationships']),cs)
PY
)
$P -v ns=$1 -v nsrc=$2 -v nw=$3 -v nc=$4 -v ne=$5 -v nr=$6 -v ncs=$7 <<'SQL' 2>&1 | grep -E 'ok:|FAIL|ERROR'
select chk((select count(*) from scholars where slug<>'ahmad-raza-khan')=:ns and (select count(*) from scholars where slug<>'ahmad-raza-khan' and status<>'draft')=0, 'batch scholars loaded, all draft');
select chk((select count(*) from sources)-4=:nsrc and (select count(*) from works)-6=:nw and (select count(*) from contributions)-2=:nc and (select count(*) from timeline_events)-7=:ne and (select count(*) from scholar_relationships)=:nr and (select count(*) from claim_sources)-14=:ncs, 'batch row counts match the ledger');
select chk((select scholar_kind from scholars where slug='banu-musa')='group' and (select count(*) from scholar_relationships r join scholars m on m.id=r.scholar_id join scholars g on g.id=r.related_scholar_id where r.relation_type='member_of' and g.slug='banu-musa' and m.scholar_kind='individual')=3, 'Banu Musa is a group with exactly three individual members');
select chk((select count(*) from works w join scholars s on s.id=w.scholar_id where s.slug='al-hasan-ibn-musa-ibn-shakir')=0 and (select count(*) from works w join scholars s on s.id=w.scholar_id where s.slug='banu-musa')=3, 'works are not copied onto every brother: group works stay on the group; al-Hasan has none');
select chk((select count(*) from works where authorship_status in ('attribution_uncertain'))>=3, 'disputed attributions are recorded as attribution_uncertain');
select chk((select count(*) from timeline_events e where not exists (select 1 from claim_sources c where c.timeline_event_id=e.id) and e.title not like 'Death (year%')=0, 'every batch event has a source');
select chk((select count(*) from scholar_relationships r where not exists (select 1 from claim_sources c where c.relationship_id=r.id))=0, 'every relationship has a source');
select chk((select count(*) from contributions where kind in ('original_invention','original_discovery'))=0, 'no invention/discovery classifications');
grant execute on all functions in schema public to anon;
set role anon;
select chk((select count(*) from scholars)=0 and (select count(*) from scholar_relationships)=0 and (select count(*) from timeline_events)=0 and (select count(*) from claim_sources)=0 and (select count(*) from sources)=0, 'public (anon) sees none of the batch content');
reset role;
do $$ begin begin update scholars set status='in_review' where slug='al-kindi'; update scholars set status='published' where slug='al-kindi'; raise exception 'FAIL: published without review'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; raise notice 'ok: batch scholar cannot publish without an independent approved review (%)', sqlerrm; end; end $$;
SQL
