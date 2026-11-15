# ISA Admin Dashboard

The dashboard is available at `/{lang}/admin` (for example, `/en/admin`). It uses the configured Supabase project and the signed-in user's access token.

## Access and security

- Sign in with Supabase Auth. Dashboard access is granted only when `app_metadata.role` is `editor` or `admin`; editable `user_metadata` is ignored.
- All data reads and writes use the existing Supabase client and migrations. Row level security and database triggers remain the authorization and publication boundary.
- Use only `VITE_SUPABASE_URL` and the Supabase anon/publishable key in the frontend environment. Never set a service-role key in a `VITE_` variable.
- Assign roles through the trusted Supabase administration process that manages `app_metadata`; this UI intentionally does not edit roles because no role-management API/table exists in the project schema.
- Publishing still requires the current revision to have a separate editor's approved review and to pass all source/evidence checks in the database.

## Dashboard sections

- Overview: scholar status counts and research record totals.
- Scholars: server-side search, status filtering, pagination, profile fields, English/Urdu/Arabic name and biography fields, and research record maintenance.
- Review queue: scholars in `in_review`, review decisions, and status actions exposed by the existing workflow.
- Sources: source search and source creation. Scholar records can link an existing source to a work, contribution, or timeline event with an evidence tier and locator.
- Audit log: the latest append-only audit events available to the signed-in editor.

Child-record creation uses the existing table constraints and reports database errors in the page. Publication readiness remains determined by the database; the dashboard does not claim a publish succeeded if Supabase rejects it.

## Setup and deployment

1. Install dependencies with `npm ci`.
2. Configure the deployed frontend with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (or the provider's publishable key).
3. Apply the existing migrations in order through `0009_admin_rbac_audit_media.sql` to the target Supabase project.
4. Create editor/admin accounts and set their role in server-controlled `app_metadata` using the trusted Supabase administration process.
5. Run `npm run build` and `npm test`, then deploy the generated `dist/` directory using the existing hosting configuration and SPA fallback rules.
6. Sign in at `/en/admin` with a test editor and verify that a regular account is refused and that review/publish operations follow the database publication gate.

No new migration is required for this UI implementation.
