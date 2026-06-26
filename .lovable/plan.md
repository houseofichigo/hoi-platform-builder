## Root cause

The GitHub Action `Build schema guard / supabase-reset` runs `supabase db reset`, which replays every migration in `supabase/migrations/` against a fresh local Postgres. Two recent migrations reference a function that is **never created** by any migration:

```
20260626225900_…sql:22  REVOKE EXECUTE ON FUNCTION public.set_use_case_approval_workspace() FROM anon;
20260626225900_…sql:46  REVOKE EXECUTE ON FUNCTION public.set_use_case_approval_workspace() FROM authenticated;
20260626225922_…sql:19  REVOKE EXECUTE ON FUNCTION public.set_use_case_approval_workspace() FROM PUBLIC;
```

The function exists in the live cloud database (it's a trigger function that backfills `use_case_approvals.workspace_id`), but it was created out-of-band — no migration file defines it. On a fresh reset the REVOKE fails with "function … does not exist", which aborts the migration and fails the CI job. The other two jobs (`conflict-markers`, `build`) pass.

The preview "This page didn't load" error is separate; the local dev server returns HTTP 200 with the full SSR shell. Likely a transient SSR/HMR hiccup — once the CI fix lands and Cloud redeploys, a hard refresh should clear it. If it persists after, we debug it as a follow-up.

## Fix

1. **New migration** `supabase/migrations/20260627130000_restore_use_case_approval_workspace_fn.sql` that recreates the missing function and its trigger exactly as they exist in cloud, so fresh resets converge to the same state:
   - `CREATE OR REPLACE FUNCTION public.set_use_case_approval_workspace()` (security definer, sets `workspace_id` from parent `use_cases` row).
   - `DROP TRIGGER IF EXISTS … ; CREATE TRIGGER …` on `public.use_case_approvals` before insert.
   - Re-apply the same REVOKE/GRANT pattern the linter migrations expected (revoke from PUBLIC/anon/authenticated; service_role keeps execute).

2. **Patch the two failing migration files** so they no longer hard-fail on a fresh reset even if the function isn't there yet — wrap the three offending `REVOKE` lines in a `DO` block guarded by `pg_proc` lookup. This keeps already-applied cloud state untouched while making the files self-healing for `db reset`:

   ```sql
   do $$ begin
     if exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                where n.nspname='public' and p.proname='set_use_case_approval_workspace') then
       execute 'revoke execute on function public.set_use_case_approval_workspace() from anon';
     end if;
   end $$;
   ```

3. **Verify** by re-reading the migrations end to end (no other referenced functions are missing — I already checked the full list).

After merging, the GitHub workflow should go green on the next push. No app code changes are needed; the preview should recover with a hard refresh.