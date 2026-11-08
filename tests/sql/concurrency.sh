#!/bin/bash
# Concurrency tests against a LOCAL Postgres (run as the postgres OS user). Real parallel psql sessions + pg_sleep to force overlap.
# Usage: tests/sql/concurrency.sh [migrations-glob]
cd "$(dirname "$0")/../.."
E1=00000000-0000-0000-0000-0000000000e1; E2=00000000-0000-0000-0000-0000000000e2; E3=00000000-0000-0000-0000-0000000000e3
DB=isa_conc; P="psql -X -q -v ON_ERROR_STOP=1 -U postgres"
$P -c "drop database if exists $DB" -c "create database $DB" 2>/dev/null; P="$P -d $DB"
$P -c 'drop role if exists anon' -c 'drop role if exists authenticated' >/dev/null 2>&1
$P -f tests/sql/00_stubs.sql >/dev/null; for f in ${1:-supabase/migrations/*.sql}; do $P -f "$f" >/dev/null; done; $P -f supabase/seed.sql >/dev/null; $P -f tests/sql/conc_setup.sql >/dev/null
Q(){ psql -X -q -t -A -d $DB -c "$1"; }
sess(){ printf "begin; set local role authenticated; select set_config('request.jwt.claims','{\"sub\":\"%s\",\"app_metadata\":{\"role\":\"editor\"}}',true) \\\\g /dev/null\n%s\n" "$1" "$2" | psql -X -q -d $DB 2>&1 | grep -E 'ERROR' | sed 's/^psql:<stdin>:[0-9]*: //'; }
FAIL=0; ok(){ if [ "$2" = "$3" ]; then echo "ok: $1"; else echo "FAIL: $1 (got '$2', expected '$3')"; FAIL=1; fi; }
inv1(){ ok "$1: no published scholar lacks a source" "$(Q "select count(*) from scholars s where status='published' and not private.check_scholar_sourced(s.id)")" 0; }
inv2(){ ok "$1: every published scholar has a current approval" "$(Q "select count(*) from scholars s where status='published' and not exists(select 1 from editorial_reviews r where r.scholar_id=s.id and r.content_rev=s.content_rev and r.decision='approved')")" 0; }
cs(){ echo "(select cs.id from claim_sources cs join contributions c on c.id=cs.contribution_id join scholars s on s.id=c.scholar_id where s.slug='$1' and cs.locator='p$2')"; }
run2(){ # A (holds ~2s) then B (starts 0.8s later). Prints each session's error, if any.
  sess "$1" "$2 select pg_sleep(2); commit;" > /tmp/conc_a & sleep 0.8; sess "$3" "$4 commit;" > /tmp/conc_b; wait; echo "   A: $(cat /tmp/conc_a|head -1) | B: $(cat /tmp/conc_b|head -1)"; }

echo "--- S1: two concurrent DELETEs of different sources of a published scholar"
Q "select conc_make('s1',2,true)" >/dev/null
run2 $E2 "delete from claim_sources where id=$(cs s1 1);" $E3 "delete from claim_sources where id=$(cs s1 2);"
inv1 S1; inv2 S1
echo "--- S2: two concurrent TRANSFERS (move each source to another scholar)"
Q "select conc_make('s2',2,true)" >/dev/null; Q "select conc_make('s2x',1,false)" >/dev/null
K=$(Q "select c.id from contributions c join scholars s on s.id=c.scholar_id where s.slug='s2x'")
run2 $E2 "update claim_sources set contribution_id='$K' where id=$(cs s2 1);" $E3 "update claim_sources set contribution_id='$K' where id=$(cs s2 2);"
inv1 S2; inv2 S2
echo "--- S3: PUBLISH holds the row; DELETE of the only source arrives meanwhile"
Q "select conc_make('s3',1,false)" >/dev/null
run2 $E2 "update scholars set status='published' where slug='s3';" $E3 "delete from claim_sources where id=$(cs s3 1);"
inv1 S3; inv2 S3
ok "S3: source removal rejected; scholar stays published with its source" "$(Q "select s.status||'|'||(select count(*) from claim_sources cs join contributions c on c.id=cs.contribution_id where c.scholar_id=s.id) from scholars s where slug='s3'")" "published|1"
grep -q "must keep at least one source" /tmp/conc_b && echo "ok: S3: rejected with the guard error" || { echo "FAIL: S3: expected the guard error"; FAIL=1; }
echo "--- S3b: DELETE of the only source holds; PUBLISH arrives meanwhile"
Q "select conc_make('s3b',1,false)" >/dev/null
run2 $E3 "delete from claim_sources where id=$(cs s3b 1);" $E2 "update scholars set status='published' where slug='s3b';"
inv1 S3b; inv2 S3b; ok "S3b: scholar not published" "$(Q "select status from scholars where slug='s3b'")" in_review
echo "--- S4: CONTENT CHANGE holds; PUBLISH (with the old approval) arrives meanwhile"
Q "select conc_make('s4',1,false)" >/dev/null
run2 $E3 "update contributions set description='changed' where description='s4-c1';" $E2 "update scholars set status='published' where slug='s4';"
inv1 S4; inv2 S4; ok "S4: stale approval cannot publish" "$(Q "select status from scholars where slug='s4'")" in_review
echo "--- S4b: PUBLISH holds; CONTENT CHANGE arrives meanwhile"
Q "select conc_make('s4b',1,false)" >/dev/null
run2 $E2 "update scholars set status='published' where slug='s4b';" $E3 "update contributions set description='changed' where description='s4b-c1';"
inv1 S4b; inv2 S4b; ok "S4b: change after publish demotes" "$(Q "select status from scholars where slug='s4b'")" in_review
echo "--- S5: reviewer reads revision, content changes, reviewer then submits the review"
Q "select conc_make('s5',1,false)" >/dev/null
R=$(Q "select content_rev from scholars where slug='s5'")
sess $E2 "update contributions set description='changed' where description='s5-c1'; commit;" >/dev/null
sess $E3 "insert into editorial_reviews(scholar_id,decision,content_rev) select id,'approved',$R from scholars where slug='s5'; commit;" > /tmp/conc_b; echo "   reviewer: $(head -1 /tmp/conc_b)"
grep -q "Content changed since review started" /tmp/conc_b && echo "ok: S5: stale review rejected with the revision error" || { echo "FAIL: S5: expected revision error"; FAIL=1; }
ok "S5: no approval exists for the changed content" "$(Q "select count(*) from editorial_reviews r join scholars s on s.id=r.scholar_id where s.slug='s5' and r.reviewer='$E3' and r.content_rev=s.content_rev")" 0
echo "--- S5b: content change holds; reviewer submits review of the old revision meanwhile"
Q "select conc_make('s5b',1,false)" >/dev/null
R=$(Q "select content_rev from scholars where slug='s5b'")
run2 $E2 "update contributions set description='changed' where description='s5b-c1';" $E3 "insert into editorial_reviews(scholar_id,decision,content_rev) select id,'approved',$R from scholars where slug='s5b';"
grep -q "Content changed since review started" /tmp/conc_b && echo "ok: S5b: blocked reviewer is rejected once the change commits" || { echo "FAIL: S5b: expected revision error"; FAIL=1; }
ok "S5b: no valid approval for the changed content" "$(Q "select count(*) from editorial_reviews r join scholars s on s.id=r.scholar_id where s.slug='s5b' and r.reviewer='$E3' and r.content_rev=s.content_rev")" 0
inv1 FINAL; inv2 FINAL
[ $FAIL = 0 ] && echo "ALL CONCURRENCY TESTS PASSED" || echo "CONCURRENCY TESTS FAILED"
