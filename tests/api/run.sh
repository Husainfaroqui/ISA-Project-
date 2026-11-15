#!/bin/bash
# API integration tests: a REAL PostgREST in front of a LOCAL PostgreSQL, with locally minted JWTs.
# Tests PostgREST + RLS + the app's data layer. It does NOT test Supabase Auth (GoTrue) or hosted Supabase.
# Needs: local PostgreSQL (reachable via `su postgres -c psql`), a PostgREST binary (.tools/postgrest, $POSTGREST_BIN, or auto-download).
cd "$(dirname "$0")/../.."
BIN=${POSTGREST_BIN:-.tools/postgrest}; mkdir -p .tools
if [ ! -x "$BIN" ]; then echo "downloading PostgREST 12.2.3 ..."; curl -sL -o .tools/p.tar.xz https://github.com/PostgREST/postgrest/releases/download/v12.2.3/postgrest-v12.2.3-linux-static-x64.tar.xz && tar -xJf .tools/p.tar.xz -C .tools && BIN=.tools/postgrest; fi
export JWT_SECRET=${JWT_SECRET:-test-only-secret-at-least-32-characters-long-xyz} API_URL=http://127.0.0.1:3100
W=/tmp/isa_api_sql; rm -rf $W; mkdir -p $W; cp tests/sql/00_stubs.sql tests/api/fixtures.sql supabase/seed.sql $W/; for f in supabase/migrations/*.sql; do cp $f $W/$(basename $f); done; cp supabase/content/*.sql $W/; chmod -R a+rX $W
PG(){ su postgres -c "psql -X -q -v ON_ERROR_STOP=1 $*"; }
PG -c "'drop database if exists isa_api'" -c "'create database isa_api'" 2>/dev/null
PG -d isa_api -f $W/00_stubs.sql >/dev/null 2>&1 || true   # roles may already exist cluster-wide; stubs are idempotent for roles
for f in $W/000*.sql; do PG -d isa_api -f $f >/dev/null || { echo "migration failed: $f"; exit 1; }; done
PG -d isa_api -f $W/seed.sql >/dev/null && PG -d isa_api -f $W/ala_hazrat_draft.sql >/dev/null && PG -d isa_api -f $W/batch_2a_draft.sql >/dev/null && PG -d isa_api -f $W/fixtures.sql >/dev/null || { echo "content/fixtures failed"; exit 1; }
PG -d isa_api -c "\"do \\\$\\\$ begin if not exists (select from pg_roles where rolname='authenticator') then create role authenticator login noinherit password 'pgrst'; end if; end \\\$\\\$; grant anon, authenticated to authenticator;\"" >/dev/null
PGRST_DB_URI="postgres://authenticator:pgrst@127.0.0.1:5432/isa_api" PGRST_DB_SCHEMAS=public PGRST_DB_ANON_ROLE=anon PGRST_JWT_SECRET="$JWT_SECRET" PGRST_SERVER_PORT=3100 PGRST_LOG_LEVEL=error $BIN >/tmp/postgrest.log 2>&1 &
PID=$!; trap "kill $PID 2>/dev/null" EXIT
for i in $(seq 1 25); do curl -s -o /dev/null http://127.0.0.1:3100/ && break; sleep 0.4; done
curl -s -o /dev/null http://127.0.0.1:3100/ || { echo "PostgREST did not start:"; tail -5 /tmp/postgrest.log; exit 1; }
npx vitest run --config vitest.api.config.ts "$@"
