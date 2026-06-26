## Problem

The error `permission denied for function is_workspace_member` is coming from RLS policies across the app — `workspaces`, `workspace_members`, `process`, `use_cases`, evidence tables, etc. all call `public.is_workspace_member(workspace_id, auth.uid())` in their `USING` clauses.

The recent linter-hardening pass (`20260626225900_*.sql` and `20260626225922_*.sql`) ran:

```sql
REVOKE EXECUTE ON FUNCTION public.is_workspace_member(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_workspace_member(uuid, uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_workspace_member(uuid, uuid) FROM PUBLIC;
```

Confirmed against the live DB — only `sandbox_exec` retains EXECUTE. Even though the function is `SECURITY DEFINER`, the calling role still needs EXECUTE to invoke it. With `authenticated` stripped, every policy that references it returns "permission denied" — which is exactly what Sabri is seeing on admin pages that touch workspace-scoped tables.

The same hardening migration likely over-revoked siblings used inside RLS policies: `has_workspace_role`, `can_access_use_case`, `can_modify_use_case`, `is_use_case_admin`, `is_hoi_admin`, `is_super_admin`. I'll restore EXECUTE for the ones referenced by policies.

## Fix (single migration)

Re-grant EXECUTE to `authenticated` (and `service_role` for completeness) on the auth/visibility helpers that RLS policies depend on. Keep them off `anon` and `PUBLIC` — that part of the hardening was correct.

```sql
GRANT EXECUTE ON FUNCTION public.is_workspace_member(uuid, uuid)            TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_workspace_role(uuid, uuid, text[])     TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_access_use_case(uuid, uuid)            TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_modify_use_case(uuid, uuid)            TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_use_case_admin(uuid, uuid)              TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_hoi_admin(uuid, text[])                 TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid)                       TO authenticated, service_role;
```

These are all `SECURITY DEFINER` with a pinned `search_path = public`, so granting EXECUTE to `authenticated` is the intended pattern and does not weaken security — it only lets signed-in users have their own membership/role checked by RLS, which is the whole point.

## What this does not change

- No table grants change.
- No RLS policies change.
- `anon` and `PUBLIC` stay revoked, preserving the linter intent.
- Sabri's `super_admin` profile and `hoi_admin_users` entry are unaffected; this just lets the policies actually evaluate.

After this migration the admin pages should load instead of throwing the permission error.