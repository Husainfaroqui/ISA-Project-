# Setup, environment and deployment

## Environment variables (frontend; build-time)
| Variable | Meaning |
|---|---|
| `VITE_SUPABASE_URL` | Project URL |
| `VITE_SUPABASE_ANON_KEY` | Public/anon key ONLY. Never the service-role key (the app refuses to start if it detects one). |

Without Supabase variables, the public site reads the bundled local research archive. When configured Supabase reads fail because the service/network is unreachable, public data pages fall back to the bundled archive. Authorization and admin operations still require Supabase.

## Supabase setup
1. Create a project. In SQL editor (or `supabase db push`) run `supabase/migrations/0001` ... `0009` in order, then `supabase/seed.sql`.
2. Authentication: disable public sign-ups; require MFA for editors; configure SMTP and the site URL.
3. Create editor/admin users in Auth, then (SQL editor, server-side only): `update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"editor"}' where email = '...';` (use `"admin"` for administrators).
4. Confirm the `scholar-media` bucket exists and is private (created by 0009).
5. Copy `.env.example` to `.env.local`; fill the two variables. `npm install && npm run build`; host `dist/` with an SPA fallback (`public/_redirects` and `vercel.json` included).
6. Content: draft research lives in `supabase/content/*.sql` (loads as drafts only).

## Production checklist
- [ ] Migrations 0001-0009 applied in order; seed applied
- [ ] Public sign-ups disabled; MFA required; SMTP configured
- [ ] Editor/admin roles set via `app_metadata` only
- [ ] Only the anon key in the build; no service-role key in frontend variables
- [ ] Run `npm run test:sql` against a local copy of the schema before each deploy
- [ ] Verify a draft record is invisible when signed out; verify publishing needs a second editor
- [ ] Storage: test an upload as an editor and a read as anon on staging
- [ ] SPA fallback configured; custom domain and HTTPS
- [ ] Backups enabled; log retention for `audit_log` agreed
