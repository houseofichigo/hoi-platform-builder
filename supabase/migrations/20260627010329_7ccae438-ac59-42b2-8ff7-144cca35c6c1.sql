
-- 1. Invitation tokens: restrict member SELECT to owners/admins only
DROP POLICY IF EXISTS "Members can view workspace invitations" ON public.workspace_invitations;
CREATE POLICY "Workspace admins can view workspace invitations"
  ON public.workspace_invitations FOR SELECT TO authenticated
  USING (has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin']));

-- 2. Profiles: replace broad authenticated read
DROP POLICY IF EXISTS "Authenticated users can view any profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view co-member profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.workspace_members me
      JOIN public.workspace_members other
        ON other.workspace_id = me.workspace_id
      WHERE me.user_id = auth.uid()
        AND other.user_id = profiles.user_id
    )
  );

CREATE POLICY "HOI admins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (is_hoi_admin(auth.uid()));

-- 3. Tool action catalog import rejection: admin only
DROP POLICY IF EXISTS "tool_action_catalog_import_rejection_read" ON public.tool_action_catalog_import_rejection;
CREATE POLICY "HOI admins can read import rejections"
  ON public.tool_action_catalog_import_rejection FOR SELECT TO authenticated
  USING (is_hoi_admin(auth.uid()));

-- 4. Tool action catalog import stage: admin only
DROP POLICY IF EXISTS "tool_action_catalog_import_stage_read" ON public.tool_action_catalog_import_stage;
CREATE POLICY "HOI admins can read import stage"
  ON public.tool_action_catalog_import_stage FOR SELECT TO authenticated
  USING (is_hoi_admin(auth.uid()));

-- 5. Workspace subscriptions: allow workspace owners/admins to read their own
CREATE POLICY "Workspace admins can read their subscription"
  ON public.workspace_subscriptions FOR SELECT TO authenticated
  USING (has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin']));

-- 6. Anon-executable SECURITY DEFINER: revoke EXECUTE from anon
REVOKE EXECUTE ON FUNCTION public.admin_overview(uuid) FROM anon;
