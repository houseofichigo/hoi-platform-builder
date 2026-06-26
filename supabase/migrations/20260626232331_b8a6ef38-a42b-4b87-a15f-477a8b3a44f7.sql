GRANT EXECUTE ON FUNCTION public.is_workspace_member(uuid, uuid)            TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_workspace_role(uuid, uuid, text[])     TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_access_use_case(uuid, uuid)            TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_modify_use_case(uuid, uuid)            TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_use_case_admin(uuid, uuid)              TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_hoi_admin(uuid, text[])                 TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid)                       TO authenticated, service_role;