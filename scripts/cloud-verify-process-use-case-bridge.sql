-- Cloud verification for Path A bridge. Run through Supabase SQL after applying
-- 20260627103000_bridge_process_to_legacy_use_cases.sql.

do $$
declare
  ws_a uuid := gen_random_uuid();
  ws_b uuid := gen_random_uuid();
  user_a uuid := gen_random_uuid();
  user_b uuid := gen_random_uuid();
  member_b uuid;
  proc_b uuid;
  uc_b uuid;
  visible_count integer;
begin
  insert into auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
  values
    (user_a, 'bridge-a@example.test', 'x', now(), now(), now()),
    (user_b, 'bridge-b@example.test', 'x', now(), now(), now());

  insert into public.workspaces (id, name, slug)
  values
    (ws_a, 'Bridge A', 'bridge-a-' || substr(ws_a::text, 1, 8)),
    (ws_b, 'Bridge B', 'bridge-b-' || substr(ws_b::text, 1, 8));

  insert into public.workspace_members (workspace_id, user_id, role)
  values
    (ws_a, user_a, 'member'),
    (ws_b, user_b, 'owner')
  returning id into member_b;

  select id into member_b from public.workspace_members where workspace_id = ws_b and user_id = user_b;

  insert into public.process (
    workspace_id,
    name,
    description,
    owner_member_id,
    created_by,
    status,
    capture,
    scores,
    risk_tier,
    approved_at
  )
  values (
    ws_b,
    'Bridge Verification Process',
    'Should mirror into legacy use_cases.',
    member_b,
    user_b,
    'approved',
    jsonb_build_object('function', 'other'),
    jsonb_build_object('priorityScore', 72, 'readiness', 66, 'classification', 'AI Workflow'),
    'standard',
    now()
  )
  returning id into proc_b;

  select id into uc_b from public.use_cases where process_id = proc_b;
  if uc_b is null then
    raise exception 'bridge verification failed: no use_cases row mirrored';
  end if;

  if not exists (select 1 from public.use_case_scores where use_case_id = uc_b) then
    raise exception 'bridge verification failed: no use_case_scores row mirrored';
  end if;

  perform set_config('request.jwt.claims', jsonb_build_object('sub', user_a::text, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  select count(*) into visible_count from public.process where id = proc_b;
  if visible_count <> 0 then
    raise exception 'bridge verification failed: workspace A can read workspace B process';
  end if;

  select count(*) into visible_count from public.use_cases where id = uc_b;
  if visible_count <> 0 then
    raise exception 'bridge verification failed: workspace A can read workspace B mirrored use_case';
  end if;

  begin
    update public.use_cases set name = 'Cross-tenant write' where id = uc_b;
    if found then
      raise exception 'bridge verification failed: workspace A updated workspace B mirrored use_case';
    end if;
  exception when insufficient_privilege or check_violation or with_check_option_violation then
    null;
  end;

  execute 'reset role';

  delete from public.workspaces where id in (ws_a, ws_b);
  delete from auth.users where id in (user_a, user_b);
end $$;
