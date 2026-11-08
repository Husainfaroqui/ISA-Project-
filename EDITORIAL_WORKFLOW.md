# Editorial workflow (secure, no public dashboard)

There is deliberately no public editor UI. Records are created through the Supabase dashboard (SQL editor / Table editor) or a private tool, by authenticated editors only.

## One-time setup
1. In Supabase Auth, create each editor's user (invite by email). Enable MFA for them.
2. Grant roles server-side only, via the dashboard SQL editor (never from the app):
   `update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"editor"}' where email = '...';`
   `app_metadata` cannot be changed by users themselves; `user_metadata` must never be used for authorization.
3. Keep the service-role key out of the repo and the frontend. The app accepts only the anon key and refuses a service-role key.

## Lifecycle (enforced by database triggers and RLS)
1. **Draft** (creator): insert into `scholars` (status `draft`; `created_by` is set automatically and cannot be changed). Add `scholar_translations`, `scholar_disciplines`, `contributions`, `works`.
2. **Source**: insert `sources`, then `claim_sources` linking each claim (a contribution or a work) to a source with a `locator` (page/folio). `evidence_notes` on a claim becomes PUBLIC when published; internal remarks go in `editorial_reviews.notes`.
3. **Label** each claim (`verified`, `under_review`, `disputed`, `unverified`, `primary_source`, `modern_assessment`). Do not mark `verified` without adequate evidence.
4. **Submit**: set `scholars.status = 'in_review'`.
5. **Review**: another editor reads `scholars.content_rev` when starting the review, then inserts an `editorial_reviews` row (`approved`, `changes_requested` or `rejected`) that states **that revision** in `content_rev`. The database rejects the review if the content has changed since (`Content changed since review started`), if the scholar is not `in_review`, or if no revision is stated. The reviewer id is always the signed-in user (a supplied value is overwritten). Reviews are insert-only (audit trail).
6. **Publish**: set `status = 'published'`. The database rejects this unless the scholar was `in_review`, has at least one source, and has an `approved` review that (a) is for the *current* `content_rev`, (b) comes from an editor who is neither the creator nor the last editor of the content, and (c) is not followed by a later `changes_requested`/`rejected` review at the same revision. Scholars cannot be inserted as published.

## Changing published content
Any substantive change (scholar fields: slug, dates, region, period; translations; disciplines; contributions; works; claim sources; or the title/author/publication/url/type of a cited source) increments `content_rev`, records the editor in `last_edited_by`, and **automatically moves a published scholar back to `in_review`** (the record leaves the public site until re-approved). Old approvals no longer count. A fresh independent review, from someone who is not the creator and not the person who made the latest change, is required before republishing. Fixing a typo therefore also needs a review; this is deliberate. Records created through the service role (no signed-in user) have no creator on file, so independence cannot be checked for them: avoid service-role edits to content.

A published scholar can never lose its last source: moving, re-pointing or deleting the last `claim_sources` row (or the sourced contribution/work) is rejected.

## Notes
- Public (anon) visitors can read only published scholars and their translations, disciplines, contributions, works, claim sources and the sources those cite. Drafts, orphan sources, reviews and `scholars.created_by` are not readable.
- A scholar that has any review cannot be deleted (reviews are the audit trail; the foreign key is `ON DELETE RESTRICT`). Take records out of circulation by changing status instead. Unreviewed drafts can be deleted and cascade cleanly. A source cited by any claim cannot be deleted.
- Concurrent edits to one scholar serialise on that scholar's row. In rare cases PostgreSQL may abort one of two overlapping transactions with a deadlock error; simply retry it.
- To take a record down, set status back to `in_review`/`draft`; reviews stay as history.
- Internal helper functions live in the `private` schema (not exposed through the API; no RPC access). Do not move them back into `public`.
- Run `npm run test:sql` (local Postgres) after changing any migration.
