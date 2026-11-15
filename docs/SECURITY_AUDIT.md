# Security audit (Phase 4)

Method: code and migration review; 338 SQL checks (RLS, roles, gate, privileges, audit, media, storage policies on a stub); 30 API tests through a real PostgREST with locally minted JWTs; mutation checks (a protection is removed on purpose and a specific test must fail).

| Area | Result |
|---|---|
| Public reads | Published scholars only (RLS). Drafts, archived records, reviews, audit log, `created_by`, `content_rev` are not readable. Verified through the API as anon. |
| Roles | `app_metadata.role` only (`editor`, `admin`). A role placed in `user_metadata` grants nothing (tested). Forged signatures and expired tokens are rejected (tested). |
| Writes | Editors/admins only; anon and non-editors are denied on every table (tested). Delete, archive and restore of scholars are admin-only. |
| Publication | Database-enforced: sources, independent approved review of the current content, per-type rules. Any content change demotes a published record. Cannot be bypassed through the API (tested). |
| Audit | Append-only, trigger-written, readable by editors; not alterable by anyone (tested). |
| Storage | Private bucket, 10 MB limit, image/PDF allow-list; policies tested on a stub schema; the real Storage service is untested. |
| Secrets | Only the anon key is used in the frontend; a service-role key makes the app refuse to start. No credentials in the repository. |
| RPC surface | No project functions in the exposed schema (tested). |

**Residual risks (not resolved):** Supabase Auth and MFA are not verified here (disable public sign-ups and require MFA for editors in the Supabase dashboard); the Storage service is untested; hosted-Supabase behaviour (PostgREST version, default grants) is untested; `evidence_notes` on published claims are public by design; no application-level rate limiting; the admin UI does not exist yet, so editor accounts should stay few and trusted.
