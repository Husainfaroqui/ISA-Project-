# Islamic Science Archive (ISA)

## Run locally
    npm install
    npm run dev          # local archive if Supabase is not configured
                          # browse http://localhost:5187/en/
    npm test             # unit tests
    npm run build        # typecheck + production build
    npm run preview      # serves dist/ with SPA fallback

Keep the terminal running after `npm run dev`; closing it stops the local website. This project uses port `5187` so it does not open alongside an older ISA preview on port `5173`.

The public archive uses bundled, source-linked local records when Supabase is not configured or a configured Supabase service is unreachable. Generic placeholder profiles are excluded. With Supabase configured, published database records take priority. The admin page requires Supabase credentials and an authorized editor/admin account.

## Connect Supabase (needs your own project)
1. Create a Supabase project. Run `supabase/migrations/0001_core_schema.sql`, `0002_hardening.sql`, `0003_security_review.sql`, `0004_publication_integrity.sql`, `0005_final_hardening.sql`, `0006_contribution_layer.sql`, `0007_timeline_events.sql`, `0008_scholar_relationships.sql`, `0009_admin_rbac_audit_media.sql` (see `docs/MIGRATIONS.md`), then `supabase/seed.sql` (SQL editor or `supabase db push`).
2. `cp .env.example .env.local` and fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (anon/public key only; the app refuses a service-role key).
3. Create editors as described in `docs/EDITORIAL_WORKFLOW.md` (server-side `app_metadata.role`).
4. Restart `npm run dev`. The public directory uses live published data; the editor area becomes available to authorized accounts.

## Hosting
Clean URLs need an SPA fallback: `public/_redirects` (Netlify/Cloudflare) and `vercel.json` are included.

## Layout
- src/main.ts: render loop, language switch, click routing, canonical/hreflang
- src/lib/router.ts: /:lang/..., /:lang/scholars, /:lang/scholars/:slug
- src/lib/{supabase,repo,local}.ts: client, live data access, local content and network fallback
- src/lib/search.ts: normalization, filters, sorting, pagination
- src/lib/i18n.ts: EN/UR/AR strings; src/lib/dom.ts: escaping helpers
- src/pages/: museum-style home, live directory, scholar profiles, source-linked library and work records, timeline, admin`n- public/images/: original explanatory SVG illustrations (not manuscript scans or authenticated portraits)
- src/data/sample.ts: research-file to local profile integration; tests/core.test.ts

## Phase 4 (production backend)
See `docs/PHASE4_STATUS.md` (what is and is NOT done), `docs/SETUP.md` (environment, Supabase setup, deployment checklist) and `docs/SECURITY_AUDIT.md`. To preview the research drafts, run `npm run dev` and open `/en/scholars`.

## Phase 3
Sub-batch 2A drafts (al-Khwarizmi, Banu Musa, al-Kindi): `docs/BATCH_2A_DOSSIERS_DRAFT.md` (from `content/batch-2a.json`; `python3 tools/build_batch.py`; optional load `supabase/content/batch_2a_draft.sql`).
Ala Hazrat research draft: `docs/ALA_HAZRAT_DOSSIER_DRAFT.md` (generated from `content/ala-hazrat.json`; run `python3 tools/build_content.py` after editing). Optional draft load: `supabase/content/ala_hazrat_draft.sql` (after migrations + seed).
Sub-batch 2B research records (11 additional scholars): `content/batch-2b.json`; included in the local scholar directory and profiles.
See `docs/PHASE3_STATUS.md` (what is done, what is not, source leads). Editorial workflow details are in the docs; timeline: `/en/timeline`.

## Tests
    npm test            # unit tests: routing, search, filters, pagination, translations, citation mapping
    npm run typecheck && npm run build
    npm run test:sql    # RLS, publication gate, privileges, FKs/cascades (needs LOCAL PostgreSQL; run as the postgres OS user)
    npm run test:usage  # raw probe: do editors need USAGE on schema private? (no; see docs/SECURITY_NOTES.md)
    npm run test:content # loads the draft content into local PostgreSQL and checks it stays draft-only
    npm run test:api    # REAL PostgREST in front of local PostgreSQL + the app data layer (downloads PostgREST 12.2.3 if missing; tests do not cover Supabase Auth)
    npm run test:conc   # real parallel sessions: concurrent source removals/transfers, publish vs change, review vs change

The SQL tests create throwaway databases (`isa_test`, `isa_conc`) with stubbed Supabase auth/roles. Never run them against a real project.
Ubuntu example: `sudo apt-get install postgresql && sudo service postgresql start && sudo su postgres -c "cd $(pwd) && tests/sql/run.sh && tests/sql/concurrency.sh"`
# Admin dashboard

The role-gated editorial dashboard is available at `/en/admin`. Setup, access requirements, capabilities, and deployment steps are documented in [docs/ADMIN_DASHBOARD.md](docs/ADMIN_DASHBOARD.md).


## Manuscript & historical books library
Open `/en/library` (or `/ur/library`, `/ar/library`). The gallery is assembled from works already present in scholar records and only includes entries with linked sources. A work detail record shows its source references and only displays subject, language, or period notes when present in the underlying record. Repository/edition, century, language, and collection filters are omitted where the current database has no reliable values. Illustrations are original educational diagrams and are labeled as such; they are not historical scans. Add authenticated collection images only after checking the repository’s rights and linking to its catalogue record.

## Visual redesign (2026-11-13)
The homepage presents featured scholars from existing archive records, searchable directory filters, source-linked work highlights, discipline links, sourced contributions/relationships, and the existing timeline. Profile pages use an editorial contents rail and clearly labeled scientific diagrams where authenticated portraits are unavailable; the Dargah profile uses the attributed dome photograph. The hero now features an accessible, restrained animated astrolabe, a date-based source-linked scholar selection, and a QDL manuscript record spotlight. The library gallery opens ISA educational illustrations in an accessible image viewer, explicitly distinguishing them from historical scans. QDL provides direct access to digitized folios and a IIIF manifest for a later commentary on al-Khwarizmi's algebra; the site labels it as a later commentary, not his own surviving manuscript. The footer adds archive navigation and language links. The local-first behavior and existing Vite/Supabase architecture are unchanged. No database migration or new backend capability is required. See [the living museum Phase 0 audit](docs/LIVING_MUSEUM_PHASE_0_AUDIT.md) for current gaps and browser-review status.

## Brand colours and image credits
The original ISA palette is preserved: green `#0f3d2e`, emerald `#1b7a5a`, gold `#a8812c`, ivory `#faf6ec`. The homepage uses a slow, CSS/SVG geometric atmosphere in those colours, with a static reduced-motion mode. Imam Ahmad Raza Khan’s profile and featured card use a Dargah-e-Ala Hazrat dome photograph by Wp masifnoor, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Gumbad_Of_Dargah_Aala_Hazrat_4.jpg), CC0 1.0. If that remote image is unavailable, the site falls back to a separately labeled architectural illustration. The remaining scholar visuals are explanatory diagrams rather than authenticated portraits.


# Authentic manuscript archive

Scholar profile manuscript galleries are powered by the local-first catalogue in `content/manuscripts.json`. Only source-linked records with a verified image are rendered as manuscript cards; scholars without one see an explicit research-pending state. The implementation and per-scholar coverage register are in [`docs/MANUSCRIPT_RESEARCH_STATUS.md`](docs/MANUSCRIPT_RESEARCH_STATUS.md). No migration or Supabase setup is required for public manuscript display.

# Universal research dossiers

Use the shared JSON Schema in `content/schemas/scientist-dossier.schema.json` and typed interfaces in `src/lib/types.ts` for structured, evidence-linked investigations, original works, passages, citations and recognition. Local dossiers are loaded by `src/data/research-dossiers.ts`; the first implementation batch is al-Rāzī in `content/research/al-razi.json`. Its coverage and remaining verification work are recorded in [`docs/UNIVERSAL_RESEARCH_AUDIT.md`](docs/UNIVERSAL_RESEARCH_AUDIT.md). New dossiers should remain drafts until original text, locators and attribution have been checked.

