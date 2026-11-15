# Phase 4 status: production backend integration and admin

**Phase 4 is partially complete.** The role-gated admin dashboard UI is implemented; live Supabase Auth and hosted-project acceptance still need configuration and verification.

## Done and tested
- **Audit** of the Phase 3 codebase (findings below).
- **Public data layer** (`src/lib/repo.ts`, `src/lib/local.ts`): published Supabase data is used when configured; source-linked local archive records serve as the public fallback with no credentials or when network requests fail. Local-only placeholder entries are excluded. Loading, error, empty and not-found states remain available.
- **Migration `0009_admin_rbac_audit_media.sql`:** admin role (delete, archive, restore are admin-only; editors keep editorial work); `archived` state; append-only `audit_log` written by triggers; `media_assets` (licence and attribution mandatory) and a private `scholar-media` storage bucket with policies; fixes for no-op updates demoting published records, the Arabic search-normalisation mismatch, and a missing column grant; `jit = off` for API roles.
- **Admin data layer** (`src/lib/admin.ts`, `src/lib/auth.ts`, `src/lib/forms.ts`): create/edit scholars, translations (EN/UR/AR), disciplines, contributions, works, events, relationships, sources, citations, media records, review and status workflow, audit queries. Every rule is enforced by the database; the layer only reports its errors.
- **Admin dashboard UI** (`src/pages/admin.ts`): login, overview, scholar search/edit, source management, review queue, publication workflow and audit log. Authorization and publication integrity remain enforced by Supabase RLS and database triggers.
- **Tests executed in the current workspace audit:** unit suite (96); production build/typecheck. Database/API/concurrency suites were not rerun because PostgreSQL and shell test tools are unavailable in this environment.

## NOT done
- **Not tested:** Supabase Auth (GoTrue) sign-in; the Supabase Storage service (only the storage policies are tested, against a stub schema); a hosted Supabase project; MFA. The UI still needs acceptance testing against a configured Supabase project.
- **Known limits:** filter-option queries read all published scholars' regions/disciplines (fine for hundreds, needs a view at larger scale); no rate limiting beyond Supabase defaults.

## Phase 4 audit findings (fixed unless noted)
1. The data layer previously required an opt-in demo flag without Supabase: it now uses the local research archive by default and only falls back on recognized network failures when live reads are configured.
2. The whole published dataset was loaded and filtered in the browser: now server-side.
3. Editors could delete scholars: now admin-only.
4. No audit trail: append-only log (tested: not alterable by editors, admins, or the table owner).
5. The `scholar_kind` column (migration 0008) was not readable by anonymous API calls: fixed in 0009 (found by building the API test harness).
6. Re-saving unchanged data demoted published scholars: fixed.
7. Arabic yeh (ي) was not folded in database search normalisation: fixed and tested with an Arabic-only name.
8. Slow first query under row-level security: PostgreSQL JIT; fixed with `jit = off` for API roles.
9. No media/storage controls: added.
