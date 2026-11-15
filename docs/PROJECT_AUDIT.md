# ISA project audit and development roadmap

Audit scope: current extracted Vite + TypeScript project, content JSON, route/page modules, Supabase migrations, tests, and project documentation. The referenced raw `/mnt/data/isa-vite.zipnew.zip` was not mounted in the current filesystem, so this audit could not compare against the original archive byte-for-byte. A production build and all unit tests were run. No Supabase project credentials or local PostgreSQL tools were available, so database deployment state was not inferred.

## Current status

| Category | Findings |
|---|---|
| Working | Vite/TypeScript build; home, scholar directory/profile, contribution, timeline, library and admin routes; English/Urdu/Arabic strings and RTL direction; public local archive when Supabase is absent; local fallback for recognizable network failures; citation rendering; search, filters, sorting and pagination; 100 unit tests (current project revision). |
| Partially working | Supabase public reads, admin sign-in, CRUD and editorial workflow require a configured project. The dashboard uses the existing anon key and database policies, but authentication and the workflow have not been exercised against a hosted project. Content is a collection of research drafts, not a complete international catalogue. |
| Content present | `content/ala-hazrat.json`: 24 claims, 5 sources, 6 works, 2 contributions, 7 events. `content/batch-2a.json`: 6 records (al-Khwarizmi, Banu Musa group and three brothers, al-Kindi), 53 claims, 10 sources, 20 works, 13 contributions, 11 events, 3 relationships. `content/batch-2b.json`: 11 additional scholars, 20 sources, 23 works, 11 contributions and 11 events. |
| Content gaps | Ala Hazrat has no narrative biography field in the dossier, and the dossier is not a complete works catalogue. Batch 2A entries have no biographies in their source JSON. Many biographical, original-edition and manuscript details across all batches remain open. Manuscript, historical-books, institution and contact catalogues do not exist. |
| Previously not connected | Local records were behind an opt-in demo flag; production without Supabase selected an unconfigured repository. Batch 2B was not wired to profiles. Phase 1 now uses the bundled source-linked records locally, excludes generic placeholder-only scholars and includes Batch 2B in the local profile mapper. Ala Hazrat updates embedded in Batch 2B are still not merged into the Ala Hazrat dossier. |
| Not implemented | Dedicated discipline, book/publication, manuscript library, knowledge-network visualization, institutional history and contact pages. Live editor/media acceptance testing and migration deployment verification. |

## Application and content architecture

- `src/lib/router.ts` routes to home, scholars, profiles, contribution records, timeline and admin. There are no manuscript, book, institution, discipline or contact routes.
- `src/lib/repo.ts` selects published Supabase records when configured, and otherwise uses `src/lib/local.ts`. It uses the local archive on detected network failures while retaining ordinary permission/schema errors.
- `src/data/sample.ts` maps the three research files into scholar records. Generic placeholder profiles were removed from the public local set. The local directory only returns records with linked references.
- Local search covers names, slug, region, disciplines, biography, works, contributions, events and relationships. Live Supabase search currently covers scholar names and database filters, not the full text of works and contributions.
- `src/pages/profile.ts`, `contribution.ts`, `timeline.ts` and `directory.ts` retain bibliographic references while omitting public editorial labels. Internal status, evidence and confidence fields remain in the content model and database.
- `content/batch-2a.json` and `content/ala-hazrat.json` generate draft SQL and dossiers. Batch 2B currently has JSON and tests but no generated SQL loader or dossier generator.

## Database and security

- Migrations `0001`–`0007` define scholars, translations, disciplines, sources, works, contributions, timeline events, source links, review gates, and RLS policies. Migration `0008` adds sourced scholar relationships and group records; public visibility requires both scholars to be published and source guards remain attached to publication.
- Migration `0009` adds server-controlled `app_metadata.role` admin checks, admin-only delete/archive/restore, append-only audit records, media metadata and private storage policies. The frontend uses Supabase URL plus anon/publishable key; it rejects a service-role key.
- `supabase/seed.sql` seeds the discipline taxonomy only. No scholar content is inserted into a live database by default. Draft loaders are under `supabase/content/` for Ala Hazrat and Batch 2A; there is no Batch 2B loader.
- This audit did not apply migrations or connect to a remote project. Whether migrations are applied anywhere remains unknown. SQL, PostgREST and concurrency test scripts were not run because `psql`, `pg_isready` and `bash` are unavailable in the current environment.

## Verification run

- `npm run build`: passed (TypeScript check and Vite production build).
- `npm test`: passed, 96 tests across 7 files.
- Browser/mobile accessibility review and Supabase-hosted acceptance test: not run.

## Phase 1 changes in this revision

- Local content becomes the default public repository without Supabase; recognized connectivity failures use the local repository.
- Batch 2B profiles join the local archive, and the local search index covers profile and research-record text.
- Generic placeholder scholars are removed from the public dataset. Missing biography sections are omitted instead of rendered empty.
- Public verification, confidence and evidence-tier badges and the `/method` verification page are removed; citations and bibliographic links remain.
- `tests/phase4.test.ts`, `tests/phase3.test.ts`, `tests/core.test.ts`, `tests/timeline.test.ts` and `tests/batch2a.test.ts` cover the revised behavior; `tests/batch2b.test.ts` checks source-backed integration.

## Roadmap and dependencies

1. **Phase 1 — content foundation (current):** local-first reads, source-backed records, clean public presentation, search and references. Done for the present content files; the Batch 2B Ala Hazrat updates still need integration.
2. **Phase 2 — core research:** write evidence-led biographies and structured contributions for Ala Hazrat, al-Khwarizmi, Banu Musa and al-Kindi. Merge only claims backed by the ledgers; preserve explicit open questions. Add translations after human review.
3. **Phase 3 — scholar expansion:** complete Batch 2B review, then add the remaining initial-priority scholars in researched batches; create one content validator/schema before increasing volume.
4. **Phase 4 — historical library:** add only catalogue-backed book and manuscript records with repository, identifier, language and edition details when documented.
5. **Phase 5 — knowledge network:** visualize only the sourced relationship records already stored in content and the database.
6. **Phase 6 — admin:** retain the current dashboard; verify roles, RLS, review, publication, audit and storage against a configured staging project before real editorial use.
7. **Phase 7 — launch quality:** accessibility, responsive-browser review, translation review, performance, SEO, security and deployment verification.
