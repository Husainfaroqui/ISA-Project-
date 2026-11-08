#!/bin/bash
# Probe: can authenticated editors evaluate RLS policies that call private.is_editor() WITHOUT USAGE on schema private?
# Prints raw results (not just pass/fail). Run as the postgres OS user. Uses throwaway DB isa_probe.
cd "$(dirname "$0")/../.."
P="psql -X -q -v ON_ERROR_STOP=1 -U postgres"; $P -c 'drop database if exists isa_probe' -c 'create database isa_probe' 2>/dev/null; P="$P -d isa_probe"
$P -f tests/sql/00_stubs.sql >/dev/null; for f in supabase/migrations/*.sql; do $P -f "$f" >/dev/null; done; $P -f supabase/seed.sql >/dev/null
E=00000000-0000-0000-0000-0000000000e2; U=00000000-0000-0000-0000-0000000000a1
run(){ # $1 = label, $2 = role, $3 = jwt sub, $4 = app role, rest = sql
  echo "[$1]"; printf "set role %s;\nselect set_config('request.jwt.claims','{\"sub\":\"%s\",\"app_metadata\":{\"role\":\"%s\"}}',false) \\\\g /dev/null\n%s\n" "$2" "$3" "$4" "$5" | psql -X -d isa_probe -t -A 2>&1 | sed 's/^psql:<stdin>:[0-9]*: //' | sed 's/^/    /'; }
echo "=== catalog facts"; psql -X -d isa_probe -t -A -c "select 'authenticated has USAGE on schema private: '||has_schema_privilege('authenticated','private','USAGE'), 'authenticated has EXECUTE on private.is_editor(): '||has_function_privilege('authenticated','private.is_editor()','EXECUTE'), 'anon has EXECUTE on private.is_editor(): '||has_function_privilege('anon','private.is_editor()','EXECUTE')" | tr '|' '\n'
echo "=== editor, no USAGE on private (shipped configuration)"
run "editor SELECT editorial_reviews (policy editor_read calls private.is_editor())" authenticated $E editor "select count(*) from editorial_reviews;"
run "editor INSERT/UPDATE/DELETE on disciplines (policy editor_all)" authenticated $E editor "insert into disciplines(slug,name_en) values ('probe','Probe'); update disciplines set name_en='P2' where slug='probe'; delete from disciplines where slug='probe'; select 'ok';"
run "editor INSERT scholar + translation (editor_all + translations trigger)" authenticated $E editor "insert into scholars(slug,region,period_group) values ('probe','R','early'); insert into scholar_translations(scholar_id,lang,name) select id,'en','P' from scholars where slug='probe'; select count(*) from scholars where slug='probe';"
run "non-editor INSERT disciplines" authenticated $U user "insert into disciplines(slug,name_en) values ('x','x');"
run "non-editor SELECT editorial_reviews" authenticated $U user "select count(*) from editorial_reviews;"
run "anon SELECT scholars (public policies only)" anon $U user "select count(*) from scholars;"
run "authenticated references private.is_editor() BY NAME" authenticated $E editor "select private.is_editor();"
run "authenticated calls private.touch_scholar()" authenticated $E editor "select private.touch_scholar(gen_random_uuid());"
run "anon calls private.is_editor()" anon $U user "select private.is_editor();"
echo "=== control experiment: revoke EXECUTE on private.is_editor() from authenticated"
psql -X -q -d isa_probe -c "revoke execute on function private.is_editor() from authenticated"
run "editor SELECT editorial_reviews" authenticated $E editor "select count(*) from editorial_reviews;"
psql -X -q -d isa_probe -c "grant execute on function private.is_editor() to authenticated"
echo "=== variant: also GRANT USAGE on schema private to authenticated"
psql -X -q -d isa_probe -c "grant usage on schema private to authenticated"
run "editor SELECT editorial_reviews" authenticated $E editor "select count(*) from editorial_reviews;"
run "authenticated references private.is_editor() BY NAME" authenticated $E editor "select private.is_editor();"
run "authenticated calls private.touch_scholar()" authenticated $E editor "select private.touch_scholar(gen_random_uuid());"
run "authenticated calls private.check_scholar_sourced()" authenticated $E editor "select private.check_scholar_sourced(gen_random_uuid());"
