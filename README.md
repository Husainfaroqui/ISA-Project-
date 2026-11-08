# Islamic Science Archive (ISA), Phase 2

## Run locally
    npm install
    npm run dev          # http://localhost:5173/en/
    npm test             # unit tests
    npm run build        # typecheck + production build
    npm run preview      # serves dist/ with SPA fallback

With no `.env.local`, the app uses clearly labeled SAMPLE data.

## Connect Supabase (needs your own project)
1. Create a Supabase project. Run `supabase/migrations/0001_core_schema.sql`, `0002_hardening.sql`, `0003_security_review.sql`, `0004_publication_integrity.sql`, `0005_final_hardening.sql`, then `supabase/seed.sql` (SQL editor or `supabase db push`).
2. `cp .env.example .env.local` and fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (anon/public key only; the app refuses a service-role key).
3. Create editors as described in `docs/EDITORIAL_WORKFLOW.md` (server-side `app_metadata.role`).
4. Restart `npm run dev`. The directory banner disappears when live data loads.

## Hosting
Clean URLs need an SPA fallback: `public/_redirects` (Netlify/Cloudflare) and `vercel.json` are included.

## Layout
- src/main.ts: render loop, language switch, click routing, canonical/hreflang
- src/lib/router.ts: /:lang/..., /:lang/scholars, /:lang/scholars/:slug
- src/lib/{supabase,repo}.ts: client + data access (falls back to sample)
- src/lib/search.ts: normalization, filters, sorting, pagination
- src/lib/i18n.ts: EN/UR/AR strings; src/lib/dom.ts: escaping helpers
- src/pages/: home, directory, profile (+ header/footer/home HTML)
- src/data/sample.ts: SAMPLE data; tests/core.test.ts

## Tests
    npm test            # unit tests: routing, search, filters, pagination, translations, citation mapping
    npm run typecheck && npm run build
    npm run test:sql    # RLS, publication gate, privileges, FKs/cascades (needs LOCAL PostgreSQL; run as the postgres OS user)
    npm run test:usage  # raw probe: do editors need USAGE on schema private? (no; see docs/SECURITY_NOTES.md)
    npm run test:conc   # real parallel sessions: concurrent source removals/transfers, publish vs change, review vs change

The SQL tests create throwaway databases (`isa_test`, `isa_conc`) with stubbed Supabase auth/roles. Never run them against a real project.
Ubuntu example: `sudo apt-get install postgresql && sudo service postgresql start && sudo su postgres -c "cd $(pwd) && tests/sql/run.sh && tests/sql/concurrency.sh"`
