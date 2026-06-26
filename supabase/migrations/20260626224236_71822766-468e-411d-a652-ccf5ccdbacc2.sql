do $$
declare
  ws_a uuid := gen_random_uuid();
  ws_b uuid := gen_random_uuid();
  user_a uuid := gen_random_uuid();
  user_b uuid := gen_random_uuid();
  member_a uuid; member_b uuid; dept_b uuid; proc_b uuid; visible_count integer;
begin
  insert into auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
  values
    (user_a, 'iso-a-' || user_a || '@example.test', 'x', now(), now(), now()),
    (user_b, 'iso-b-' || user_b || '@example.test', 'x', now(), now(), now());

  insert into public.workspaces (id, name, slug) values
    (ws_a, 'Isolation A '||substr(ws_a::text,1,8), 'iso-a-' || substr(ws_a::text, 1, 8)),
    (ws_b, 'Isolation B '||substr(ws_b::text,1,8), 'iso-b-' || substr(ws_b::text, 1, 8));

  insert into public.workspace_members (workspace_id, user_id, role)
  values (ws_a, user_a, 'member'), (ws_b, user_b, 'member');

  select id into member_a from public.workspace_members where workspace_id = ws_a and user_id = user_a;
  select id into member_b from public.workspace_members where workspace_id = ws_b and user_id = user_b;

  insert into public.department (workspace_id, name, lead_member_id)
  values (ws_b, 'Workspace B Department', member_b) returning id into dept_b;

  insert into public.process (workspace_id, name, department_id, owner_member_id, created_by)
  values (ws_b, 'Workspace B Process', dept_b, member_b, user_b) returning id into proc_b;

  insert into public.process_step (workspace_id, process_id, title, step_order)
  values (ws_b, proc_b, 'Workspace B Step', 1);

  perform set_config('request.jwt.claims', jsonb_build_object('sub', user_a::text, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select count(*) into visible_count from public.department where workspace_id = ws_b;
  if visible_count <> 0 then raise exception 'FAIL: A reads B departments (%)', visible_count; end if;

  select count(*) into visible_count from public.process where workspace_id = ws_b;
  if visible_count <> 0 then raise exception 'FAIL: A reads B processes (%)', visible_count; end if;

  select count(*) into visible_count from public.process_step where workspace_id = ws_b;
  if visible_count <> 0 then raise exception 'FAIL: A reads B steps (%)', visible_count; end if;

  select count(*) into visible_count from public.workspace_members where workspace_id = ws_b;
  if visible_count <> 0 then raise exception 'FAIL: A reads B workspace_members (%)', visible_count; end if;

  begin
    insert into public.process (workspace_id, name, department_id, owner_member_id, created_by)
    values (ws_b, 'Cross Workspace Write', dept_b, member_b, user_a);
    raise exception 'FAIL: A inserted process into B';
  exception when insufficient_privilege or check_violation or with_check_option_violation then null;
  end;

  reset role;

  delete from public.process_step where workspace_id in (ws_a, ws_b);
  delete from public.process where workspace_id in (ws_a, ws_b);
  delete from public.department where workspace_id in (ws_a, ws_b);
  delete from public.workspace_members where workspace_id in (ws_a, ws_b);
  delete from public.workspaces where id in (ws_a, ws_b);
  delete from auth.users where id in (user_a, user_b);

  raise notice 'BUILD_ISOLATION_TEST_PASSED';
end $$;