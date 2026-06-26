
-- 1. Fix mutable search_path on sync_library_item_editorial_state
ALTER FUNCTION public.sync_library_item_editorial_state() SET search_path = public;

-- 2. Revoke EXECUTE from anon on all SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.create_workspace(text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.accept_workspace_invitation(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.decide_process(uuid, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.workspace_build_overview(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_invitation_by_token(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_audit_log_with_diffs(uuid, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_workspace_role(uuid, uuid, text[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_workspace_member(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_hoi_admin(uuid, text[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.can_access_use_case(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.can_modify_use_case(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_use_case_admin(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_inviter_on_acceptance() FROM anon;
REVOKE EXECUTE ON FUNCTION public.enforce_workspace_role_escalation_limits() FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_use_case_approval_workspace() FROM anon;
REVOKE EXECUTE ON FUNCTION public.add_use_case_to_roadmap_on_approval() FROM anon;
REVOKE EXECUTE ON FUNCTION public.protect_profiles_legacy_role() FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon;
REVOKE EXECUTE ON FUNCTION public.sync_library_item_editorial_state() FROM anon;
REVOKE EXECUTE ON FUNCTION public.workspace_member_manager_cycle_check() FROM anon;
REVOKE EXECUTE ON FUNCTION public.department_parent_cycle_check() FROM anon;
REVOKE EXECUTE ON FUNCTION public.build_validate_process_step_workspace() FROM anon;
REVOKE EXECUTE ON FUNCTION public.build_validate_department_workspace() FROM anon;
REVOKE EXECUTE ON FUNCTION public.build_validate_workspace_member_structure() FROM anon;
REVOKE EXECUTE ON FUNCTION public.build_validate_process_workspace() FROM anon;

-- 3. Revoke EXECUTE from authenticated on internal-only helpers
-- (Triggers run as table owner; RLS evaluates SECURITY DEFINER fns regardless of caller EXECUTE.)
REVOKE EXECUTE ON FUNCTION public.has_workspace_role(uuid, uuid, text[]) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_workspace_member(uuid, uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_hoi_admin(uuid, text[]) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.can_access_use_case(uuid, uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.can_modify_use_case(uuid, uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_use_case_admin(uuid, uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_inviter_on_acceptance() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_workspace_role_escalation_limits() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.set_use_case_approval_workspace() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.add_use_case_to_roadmap_on_approval() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_profiles_legacy_role() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.workspace_member_manager_cycle_check() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.department_parent_cycle_check() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.build_validate_process_step_workspace() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.build_validate_department_workspace() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.build_validate_workspace_member_structure() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.build_validate_process_workspace() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_library_item_editorial_state() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM authenticated;

-- 4. Tighten library-files bucket: drop broad public listing policy.
-- Files in the public bucket remain reachable by their direct CDN URL; only
-- enumeration via the storage API is removed.
DROP POLICY IF EXISTS "Public can read library-files" ON storage.objects;
