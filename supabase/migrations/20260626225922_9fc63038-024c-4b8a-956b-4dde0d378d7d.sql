
-- Revoke EXECUTE from PUBLIC (this is what the linter actually checks)
REVOKE EXECUTE ON FUNCTION public.create_workspace(text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.accept_workspace_invitation(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.decide_process(uuid, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.workspace_build_overview(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_invitation_by_token(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_audit_log_with_diffs(uuid, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_workspace_role(uuid, uuid, text[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_workspace_member(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_hoi_admin(uuid, text[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_access_use_case(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_modify_use_case(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_use_case_admin(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_inviter_on_acceptance() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_workspace_role_escalation_limits() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_use_case_approval_workspace() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.add_use_case_to_roadmap_on_approval() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.protect_profiles_legacy_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_library_item_editorial_state() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.workspace_member_manager_cycle_check() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.department_parent_cycle_check() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.build_validate_process_step_workspace() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.build_validate_department_workspace() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.build_validate_workspace_member_structure() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.build_validate_process_workspace() FROM PUBLIC;

-- Re-grant EXECUTE only to authenticated on the six app-facing RPCs
GRANT EXECUTE ON FUNCTION public.create_workspace(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_workspace_invitation(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decide_process(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.workspace_build_overview(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_audit_log_with_diffs(uuid, integer) TO authenticated;

-- service_role keeps EXECUTE on everything (it bypasses RLS and runs maintenance)
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
