-- Run after `supabase db reset` against a local database.
-- Verifies workspace members cannot read/write another workspace's Build rows.

begin;

set local role postgres;

do $$
declare
  ws_a uuid := gen_random_uuid();
  ws_b uuid := gen_random_uuid();
  user_a uuid := gen_random_uuid();
  user_b uuid := gen_random_uuid();
  member_a uuid;
  member_b uuid;
  dept_b uuid;
  proc_b uuid;
  visible_count integer;
begin
  insert into auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
  values
    (user_a, 'isolation-a@example.test', 'x', now(), now(), now()),
    (user_b, 'isolation-b@example.test', 'x', now(), now(), now());

  insert into public.workspaces (id, name, slug)
  values
    (ws_a, 'Isolation A', 'isolation-a-' || substr(ws_a::text, 1, 8)),
    (ws_b, 'Isolation B', 'isolation-b-' || substr(ws_b::text, 1, 8));

  insert into public.workspace_members (workspace_id, user_id, role)
  values
    (ws_a, user_a, 'member'),
    (ws_b, user_b, 'member');

  select id into member_a from public.workspace_members where workspace_id = ws_a;
  select id into member_b from public.workspace_members where workspace_id = ws_b;

  insert into public.department (workspace_id, name, lead_member_id)
  values (ws_b, 'Workspace B Department', member_b)
  returning id into dept_b;

  insert into public.process (workspace_id, name, department_id, owner_member_id, created_by)
  values (ws_b, 'Workspace B Process', dept_b, member_b, user_b)
  returning id into proc_b;

  insert into public.process_step (workspace_id, process_id, title, step_order)
  values (ws_b, proc_b, 'Workspace B Step', 1);

  perform set_config('request.jwt.claims', jsonb_build_object('sub', user_a::text, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select count(*) into visible_count from public.department where workspace_id = ws_b;
  if visible_count <> 0 then
    raise exception 'tenant isolation failed: workspace A member can read workspace B departments';
  end if;

  select count(*) into visible_count from public.process where workspace_id = ws_b;
  if visible_count <> 0 then
    raise exception 'tenant isolation failed: workspace A member can read workspace B processes';
  end if;

  select count(*) into visible_count from public.process_step where workspace_id = ws_b;
  if visible_count <> 0 then
    raise exception 'tenant isolation failed: workspace A member can read workspace B process steps';
  end if;

  begin
    insert into public.process (workspace_id, name, department_id, owner_member_id, created_by)
    values (ws_b, 'Cross Workspace Write', dept_b, member_b, user_a);
    raise exception 'tenant isolation failed: workspace A member inserted process into workspace B';
  exception when insufficient_privilege or check_violation or with_check_option_violation then
    null;
  end;

  reset role;
end $$;

rollback;
