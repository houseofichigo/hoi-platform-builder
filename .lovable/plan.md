# Supabase Linter Cleanup — 36 Warnings

All findings are SECURITY-category warnings on the cloud DB. Breakdown:

| # | Warning | Action |
|---|---------|--------|
| 1 | Function `search_path` mutable (1 fn) | Set `search_path = public` on the offender |
| 1 | Public bucket `library-files` allows listing | Tighten `storage.objects` SELECT policy |
| 16 | `anon` can EXECUTE `SECURITY DEFINER` fns | Revoke EXECUTE from `anon` on all 16 |
| 18 | `authenticated` can EXECUTE `SECURITY DEFINER` fns | Keep app-facing RPCs; revoke on internal helpers |

---

## 1. Function search_path

One function is missing `SET search_path`. Identify via `pg_proc` and add `SET search_path = public`. All other functions already have it set (visible in the DB function dump).

## 2. Public bucket `library-files`

Currently anyone can list every file. Replace the broad SELECT policy on `storage.objects` with one of:
- **Recommended**: keep the bucket public for reads-by-known-path (downloads still work via signed-ish public URLs), but drop the broad `select` policy so clients can't enumerate.
- Alternative: scope SELECT to workspace members via a join through `library_items.storage_path`.

Default pick: drop the listing policy, keep object reads working by URL. Confirm with you before applying if it would break existing UI.

## 3. Revoke EXECUTE from `anon` (16 functions)

Every `SECURITY DEFINER` function in this project starts with `if auth.uid() is null then raise exception 'not authenticated'`, so `anon` callers already fail — but they shouldn't even be able to call them. Blanket revoke:

```sql
REVOKE EXECUTE ON FUNCTION public.<fn>(...) FROM anon;
```

Applies to: `create_workspace`, `accept_workspace_invitation`, `decide_process`, `workspace_build_overview`, `get_invitation_by_token`, `get_audit_log_with_diffs`, `has_workspace_role`, `is_workspace_member`, `is_hoi_admin`, `is_super_admin`, `can_access_use_case`, `can_modify_use_case`, `is_use_case_admin`, `handle_new_user`, `notify_inviter_on_acceptance`, `enforce_workspace_role_escalation_limits`.

Zero behavior change for the app.

## 4. Revoke EXECUTE from `authenticated` on internal-only helpers (selective)

Of the 18 `authenticated`-executable SECURITY DEFINER fns, split into two groups:

**Keep EXECUTE for authenticated** (called as RPCs from client/server fns):
- `create_workspace`
- `accept_workspace_invitation`
- `decide_process`
- `workspace_build_overview`
- `get_invitation_by_token`
- `get_audit_log_with_diffs`

**Revoke EXECUTE from authenticated** (used only inside RLS policies / triggers, never called directly):
- `has_workspace_role`
- `is_workspace_member`
- `is_hoi_admin`
- `is_super_admin`
- `can_access_use_case`
- `can_modify_use_case`
- `is_use_case_admin`
- `handle_new_user` (trigger only)
- `notify_inviter_on_acceptance` (trigger only)
- `enforce_workspace_role_escalation_limits` (trigger only)
- `set_use_case_approval_workspace` (trigger only)
- `add_use_case_to_roadmap_on_approval` (trigger only)

RLS policies still resolve them (Postgres evaluates SECURITY DEFINER fns in policies regardless of caller EXECUTE), and triggers run as the table owner — so revoking is safe.

## 5. Single migration

One migration file with all REVOKEs + the `search_path` fix + the storage policy tightening, in this order:

```sql
-- 5a. search_path fix
ALTER FUNCTION public.<offender>() SET search_path = public;

-- 5b. revoke anon EXECUTE on all 16
REVOKE EXECUTE ON FUNCTION public.create_workspace(text, text) FROM anon;
-- ...etc

-- 5c. revoke authenticated EXECUTE on the 12 internal-only fns
REVOKE EXECUTE ON FUNCTION public.has_workspace_role(uuid, uuid, text[]) FROM authenticated;
-- ...etc

-- 5d. tighten library-files SELECT
DROP POLICY IF EXISTS "<broad listing policy>" ON storage.objects;
-- (add scoped policy if needed)
```

## 6. Verify

After apply: re-run `supabase--linter`. Target: 0 warnings, or only items we consciously kept (e.g. the 6 app-facing RPCs that legitimately need `authenticated` EXECUTE — those will still show because the linter can't tell intent; we'll document them as expected).

Smoke test in preview: sign in, open Build dashboard, approve a process, accept an invitation. If any RPC 403s we missed an EXECUTE grant and add it back targeted.

---

## Questions before I run

1. **Storage bucket**: OK to drop the broad listing policy on `library-files`? Files stay reachable by direct URL but clients can no longer enumerate. (Alternative: scope to workspace members — more work.)
2. **App-facing RPC EXECUTE**: The 6 RPCs above will still show as linter warnings after this pass since they're legitimately callable by authenticated users. Leave as accepted findings, or you want me to wrap each in an extra authorization check and document the suppression?