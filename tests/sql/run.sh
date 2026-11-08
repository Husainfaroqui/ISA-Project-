#!/bin/sh
# Usage: tests/sql/run.sh [migrations-glob]   (needs a local Postgres; creates a throwaway DB "isa_test")
set -e; cd "$(dirname "$0")/../.."
P="psql -X -q -v ON_ERROR_STOP=1 -U postgres"
$P -c 'drop database if exists isa_test' -c 'create database isa_test' 2>/dev/null; P="$P -d isa_test"
$P -c 'drop role if exists anon' -c 'drop role if exists authenticated' >/dev/null 2>&1 || true
$P -f tests/sql/00_stubs.sql
for f in ${1:-supabase/migrations/*.sql}; do $P -f "$f"; done
$P -f supabase/seed.sql
$P -f tests/sql/rls_test.sql 2>&1 | grep -E 'ok:|FAIL|ALL SQL|ERROR'
