# Security notes: the `private` schema and USAGE

**Design.** Internal functions live in schema `private`, which is not exposed through the API. `anon` and `authenticated` have **no USAGE** on it and **no EXECUTE** on anything in it except `private.is_editor()` (authenticated only), which the RLS policies call.

**Is USAGE needed for policies that call `private.is_editor()`?** Not in PostgreSQL. Schema USAGE is checked when a *name* is looked up (parsing `private.is_editor()` in a query). A policy stores the function by OID, so evaluating it checks only EXECUTE on the function. This was verified, not assumed, on a local PostgreSQL 16 (`npm run test:usage` prints the raw results; `tests/sql/rls_test.sql` block 5 asserts them):
- an editor can SELECT/INSERT/UPDATE/DELETE under every policy without USAGE;
- revoking EXECUTE on `private.is_editor()` immediately breaks editors (so the function *is* being evaluated, and EXECUTE is the control);
- referencing `private.is_editor()` by name as `authenticated` or `anon` fails with "permission denied for schema private", which is the intended hardening.

**Why not grant USAGE anyway?** It would add nothing the policies need, and would let signed-in users resolve names in `private` (EXECUTE would still be denied on everything but `is_editor()`).

**Fallback.** If a particular Supabase environment ever reports `permission denied for schema private` during editor queries (not observed in testing; hosted Supabase was not tested), this is a safe remedy because every other private function stays non-executable:

    grant usage on schema private to authenticated;

Then update the two assertions tagged `design:` in `tests/sql/rls_test.sql` block 5 that expect USAGE to be absent.
