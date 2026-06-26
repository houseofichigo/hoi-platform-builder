CREATE OR REPLACE FUNCTION public.admin_overview(p_org_id uuid DEFAULT NULL::uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_ws uuid := p_org_id;
  result jsonb;
begin
  if v_ws is null then
    raise exception 'workspace id required' using errcode = '22023';
  end if;

  if not public.is_workspace_member(auth.uid(), v_ws) then
    raise exception 'not a member of workspace' using errcode = '42501';
  end if;

  if not (public.has_workspace_role(auth.uid(), v_ws, 'admin'::workspace_role)
       or public.has_workspace_role(auth.uid(), v_ws, 'owner'::workspace_role)) then
    raise exception 'admin role required' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'workspace_id', v_ws,
    'processes', jsonb_build_object(
      'total', (select count(*) from public.process where workspace_id = v_ws and archived_at is null),
      'draft', (select count(*) from public.process where workspace_id = v_ws and archived_at is null and status = 'draft'),
      'submitted', (select count(*) from public.process where workspace_id = v_ws and archived_at is null and status = 'submitted'),
      'under_review', (select count(*) from public.process where workspace_id = v_ws and archived_at is null and status = 'under_review'),
      'changes_requested', (select count(*) from public.process where workspace_id = v_ws and archived_at is null and status = 'changes_requested'),
      'approved', (select count(*) from public.process where workspace_id = v_ws and archived_at is null and status in ('approved','merged')),
      'awaiting_decision', (select count(*) from public.process where workspace_id = v_ws and archived_at is null and status in ('submitted','under_review','changes_requested'))
    ),
    'people', jsonb_build_object(
      'active_members', (select count(*) from public.workspace_members where workspace_id = v_ws),
      'pending_invites', (select count(*) from public.workspace_invitations where workspace_id = v_ws and accepted_at is null and (expires_at is null or expires_at > now()))
    ),
    'departments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', d.id,
        'name', d.name,
        'parent_id', d.parent_id,
        'headcount_declared', coalesce(d.headcount, d.head_count, 0),
        'named', (select count(*) from public.workspace_members m where m.workspace_id = v_ws and m.department_id = d.id),
        'processes', (select count(*) from public.process p where p.workspace_id = v_ws and p.department_id = d.id and p.archived_at is null)
      ) order by d.name)
      from public.department d
      where d.workspace_id = v_ws and d.archived_at is null
    ), '[]'::jsonb),
    'computed_at', to_jsonb(now())
  ) into result;

  return result;
end;
$function$;

REVOKE ALL ON FUNCTION public.admin_overview(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_overview(uuid) TO authenticated;
NOTIFY pgrst, 'reload schema';