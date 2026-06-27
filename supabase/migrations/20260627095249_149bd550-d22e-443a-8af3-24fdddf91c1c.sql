DROP VIEW IF EXISTS public.invitation;
DROP VIEW IF EXISTS public.membership;

CREATE VIEW public.invitation
WITH (security_invoker = true) AS
SELECT
  id,
  workspace_id,
  workspace_id AS organization_id,
  email,
  role,
  invited_by,
  token,
  status,
  send_state,
  first_name,
  last_name,
  "position",
  department_id,
  manager_member_id AS manager_id,
  expires_at,
  accepted_at,
  accepted_by,
  archived_at,
  created_at
FROM public.workspace_invitations;

CREATE VIEW public.membership
WITH (security_invoker = true) AS
SELECT
  id,
  workspace_id,
  workspace_id AS organization_id,
  user_id,
  role,
  department_id,
  manager_member_id AS manager_id,
  archived_at,
  joined_at AS created_at
FROM public.workspace_members;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.invitation TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.membership TO authenticated;
GRANT ALL ON public.invitation TO service_role;
GRANT ALL ON public.membership TO service_role;