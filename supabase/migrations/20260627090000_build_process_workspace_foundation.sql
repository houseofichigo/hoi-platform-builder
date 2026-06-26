-- Workspace-scoped Process Flow Studio foundation for the Build phase.
-- Authored cleanly for the platform tenancy model. Do not import PFS baseline migrations.

do $$
begin
  create type public.process_status as enum (
    'draft',
    'submitted',
    'under_review',
    'changes_requested',
    'approved',
    'merged',
    'archived'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.department (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  parent_id uuid references public.department(id) on delete set null,
  lead_member_id uuid references public.workspace_members(id) on delete set null,
  headcount integer default 0 check (headcount is null or headcount >= 0),
  description text,
  holds_sensitive_data boolean not null default false,
  distinct_audience boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists department_workspace_idx on public.department(workspace_id) where archived_at is null;
create index if not exists department_parent_idx on public.department(parent_id) where parent_id is not null;
create index if not exists department_lead_member_idx on public.department(lead_member_id) where lead_member_id is not null;

alter table public.workspace_members
  add column if not exists department_id uuid references public.department(id) on delete set null,
  add column if not exists manager_member_id uuid references public.workspace_members(id) on delete set null;

alter table public.workspace_invitations
  add column if not exists department_id uuid references public.department(id) on delete set null,
  add column if not exists manager_member_id uuid references public.workspace_members(id) on delete set null;

create index if not exists workspace_members_department_idx
  on public.workspace_members(department_id)
  where department_id is not null;

create index if not exists workspace_members_manager_idx
  on public.workspace_members(manager_member_id)
  where manager_member_id is not null;

create index if not exists workspace_invitations_department_idx
  on public.workspace_invitations(department_id)
  where department_id is not null;

create index if not exists workspace_invitations_manager_idx
  on public.workspace_invitations(manager_member_id)
  where manager_member_id is not null;

create table if not exists public.process (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  description text,
  department_id uuid references public.department(id) on delete set null,
  status public.process_status not null default 'draft',
  owner_member_id uuid references public.workspace_members(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  capture jsonb not null default '{}'::jsonb,
  scores jsonb not null default '{}'::jsonb,
  risk_tier text,
  submitted_at timestamptz,
  approved_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists process_workspace_idx on public.process(workspace_id) where archived_at is null;
create index if not exists process_department_idx on public.process(department_id) where department_id is not null;
create index if not exists process_status_idx on public.process(workspace_id, status) where archived_at is null;
create index if not exists process_owner_member_idx on public.process(owner_member_id) where owner_member_id is not null;
create index if not exists process_created_by_idx on public.process(created_by);

create table if not exists public.process_step (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  process_id uuid not null references public.process(id) on delete cascade,
  step_order integer not null default 0,
  title text not null,
  description text,
  actor_type text,
  actor_member_id uuid references public.workspace_members(id) on delete set null,
  department_id uuid references public.department(id) on delete set null,
  tool_name text,
  input_data text,
  output_data text,
  risk_notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists process_step_workspace_idx on public.process_step(workspace_id);
create index if not exists process_step_process_idx on public.process_step(process_id, step_order);
create index if not exists process_step_actor_member_idx on public.process_step(actor_member_id) where actor_member_id is not null;

create table if not exists public.process_status_audit (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  process_id uuid not null references public.process(id) on delete cascade,
  from_status public.process_status,
  to_status public.process_status not null,
  changed_by uuid references auth.users(id) on delete set null,
  note text,
  changed_at timestamptz not null default now()
);

create index if not exists process_status_audit_workspace_idx on public.process_status_audit(workspace_id, changed_at desc);
create index if not exists process_status_audit_process_idx on public.process_status_audit(process_id, changed_at desc);

create or replace function public.department_parent_cycle_check()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_parent uuid;
  v_depth integer := 0;
begin
  if new.parent_id is null then
    return new;
  end if;

  if new.parent_id = new.id then
    raise exception 'department.parent_id cannot reference itself' using errcode = '23514';
  end if;

  select parent_id into v_parent
  from public.department
  where id = new.parent_id
    and workspace_id = new.workspace_id;

  while v_parent is not null loop
    v_depth := v_depth + 1;
    if v_depth > 100 then
      raise exception 'department parent chain exceeds maximum depth' using errcode = '23514';
    end if;

    if v_parent = new.id then
      raise exception 'department.parent_id would create a cycle' using errcode = '23514';
    end if;

    select parent_id into v_parent
    from public.department
    where id = v_parent
      and workspace_id = new.workspace_id;
  end loop;

  return new;
end;
$$;

drop trigger if exists department_parent_cycle_guard on public.department;
create trigger department_parent_cycle_guard
before insert or update of parent_id on public.department
for each row execute function public.department_parent_cycle_check();

create or replace function public.workspace_member_manager_cycle_check()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_manager uuid;
  v_depth integer := 0;
begin
  if new.manager_member_id is null then
    return new;
  end if;

  if new.manager_member_id = new.id then
    raise exception 'workspace_members.manager_member_id cannot reference itself' using errcode = '23514';
  end if;

  select manager_member_id into v_manager
  from public.workspace_members
  where id = new.manager_member_id
    and workspace_id = new.workspace_id;

  while v_manager is not null loop
    v_depth := v_depth + 1;
    if v_depth > 100 then
      raise exception 'workspace member manager chain exceeds maximum depth' using errcode = '23514';
    end if;

    if v_manager = new.id then
      raise exception 'workspace_members.manager_member_id would create a cycle' using errcode = '23514';
    end if;

    select manager_member_id into v_manager
    from public.workspace_members
    where id = v_manager
      and workspace_id = new.workspace_id;
  end loop;

  return new;
end;
$$;

drop trigger if exists workspace_member_manager_cycle_guard on public.workspace_members;
create trigger workspace_member_manager_cycle_guard
before insert or update of manager_member_id on public.workspace_members
for each row execute function public.workspace_member_manager_cycle_check();

create or replace function public.build_validate_department_workspace()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_workspace_id uuid;
begin
  if new.parent_id is not null then
    select workspace_id into v_workspace_id from public.department where id = new.parent_id;
    if v_workspace_id is distinct from new.workspace_id then
      raise exception 'department parent must belong to the same workspace' using errcode = '23514';
    end if;
  end if;

  if new.lead_member_id is not null then
    select workspace_id into v_workspace_id from public.workspace_members where id = new.lead_member_id;
    if v_workspace_id is distinct from new.workspace_id then
      raise exception 'department lead must belong to the same workspace' using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists department_workspace_guard on public.department;
create trigger department_workspace_guard
before insert or update of parent_id, lead_member_id, workspace_id on public.department
for each row execute function public.build_validate_department_workspace();

create or replace function public.build_validate_workspace_member_structure()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_workspace_id uuid;
begin
  if new.department_id is not null then
    select workspace_id into v_workspace_id from public.department where id = new.department_id;
    if v_workspace_id is distinct from new.workspace_id then
      raise exception 'member department must belong to the same workspace' using errcode = '23514';
    end if;
  end if;

  if new.manager_member_id is not null then
    select workspace_id into v_workspace_id from public.workspace_members where id = new.manager_member_id;
    if v_workspace_id is distinct from new.workspace_id then
      raise exception 'manager must belong to the same workspace' using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists workspace_member_structure_guard on public.workspace_members;
create trigger workspace_member_structure_guard
before insert or update of department_id, manager_member_id, workspace_id on public.workspace_members
for each row execute function public.build_validate_workspace_member_structure();

create or replace function public.build_validate_process_workspace()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_workspace_id uuid;
begin
  if new.department_id is not null then
    select workspace_id into v_workspace_id from public.department where id = new.department_id;
    if v_workspace_id is distinct from new.workspace_id then
      raise exception 'process department must belong to the same workspace' using errcode = '23514';
    end if;
  end if;

  if new.owner_member_id is not null then
    select workspace_id into v_workspace_id from public.workspace_members where id = new.owner_member_id;
    if v_workspace_id is distinct from new.workspace_id then
      raise exception 'process owner must belong to the same workspace' using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists process_workspace_guard on public.process;
create trigger process_workspace_guard
before insert or update of workspace_id, department_id, owner_member_id on public.process
for each row execute function public.build_validate_process_workspace();

create or replace function public.build_validate_process_step_workspace()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_process_workspace_id uuid;
  v_workspace_id uuid;
begin
  select workspace_id into v_process_workspace_id from public.process where id = new.process_id;
  if v_process_workspace_id is null then
    raise exception 'process step must reference an existing process' using errcode = '23503';
  end if;

  if new.workspace_id is null then
    new.workspace_id := v_process_workspace_id;
  end if;

  if new.workspace_id is distinct from v_process_workspace_id then
    raise exception 'process step workspace must match process workspace' using errcode = '23514';
  end if;

  if new.actor_member_id is not null then
    select workspace_id into v_workspace_id from public.workspace_members where id = new.actor_member_id;
    if v_workspace_id is distinct from new.workspace_id then
      raise exception 'step actor must belong to the same workspace' using errcode = '23514';
    end if;
  end if;

  if new.department_id is not null then
    select workspace_id into v_workspace_id from public.department where id = new.department_id;
    if v_workspace_id is distinct from new.workspace_id then
      raise exception 'step department must belong to the same workspace' using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists process_step_workspace_guard on public.process_step;
create trigger process_step_workspace_guard
before insert or update of workspace_id, process_id, actor_member_id, department_id on public.process_step
for each row execute function public.build_validate_process_step_workspace();

do $$
begin
  if to_regclass('public.department') is not null then
    drop trigger if exists department_set_updated_at on public.department;
    create trigger department_set_updated_at
    before update on public.department
    for each row execute function public.set_updated_at();
  end if;

  if to_regclass('public.process') is not null then
    drop trigger if exists process_set_updated_at on public.process;
    create trigger process_set_updated_at
    before update on public.process
    for each row execute function public.set_updated_at();
  end if;

  if to_regclass('public.process_step') is not null then
    drop trigger if exists process_step_set_updated_at on public.process_step;
    create trigger process_step_set_updated_at
    before update on public.process_step
    for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.department enable row level security;
alter table public.process enable row level security;
alter table public.process_step enable row level security;
alter table public.process_status_audit enable row level security;

drop policy if exists department_select_workspace_members on public.department;
create policy department_select_workspace_members
on public.department for select to authenticated
using (public.is_workspace_member(workspace_id, auth.uid()));

drop policy if exists department_admin_write on public.department;
create policy department_admin_write
on public.department for all to authenticated
using (public.has_workspace_role(workspace_id, auth.uid(), array['admin','owner']))
with check (public.has_workspace_role(workspace_id, auth.uid(), array['admin','owner']));

drop policy if exists process_select_workspace_members on public.process;
create policy process_select_workspace_members
on public.process for select to authenticated
using (public.is_workspace_member(workspace_id, auth.uid()));

drop policy if exists process_insert_member_plus on public.process;
create policy process_insert_member_plus
on public.process for insert to authenticated
with check (
  public.has_workspace_role(workspace_id, auth.uid(), array['member','admin','owner'])
  and created_by = auth.uid()
);

drop policy if exists process_update_allowed_actors on public.process;
create policy process_update_allowed_actors
on public.process for update to authenticated
using (
  public.has_workspace_role(workspace_id, auth.uid(), array['admin','owner'])
  or (
    created_by = auth.uid()
    and status in ('draft','changes_requested')
  )
  or exists (
    select 1
    from public.department d
    join public.workspace_members wm on wm.id = d.lead_member_id
    where d.id = process.department_id
      and d.workspace_id = process.workspace_id
      and wm.user_id = auth.uid()
  )
)
with check (
  public.has_workspace_role(workspace_id, auth.uid(), array['admin','owner'])
  or (
    created_by = auth.uid()
    and status in ('draft','changes_requested','submitted')
  )
  or exists (
    select 1
    from public.department d
    join public.workspace_members wm on wm.id = d.lead_member_id
    where d.id = process.department_id
      and d.workspace_id = process.workspace_id
      and wm.user_id = auth.uid()
  )
);

drop policy if exists process_step_select_workspace_members on public.process_step;
create policy process_step_select_workspace_members
on public.process_step for select to authenticated
using (public.is_workspace_member(workspace_id, auth.uid()));

drop policy if exists process_step_write_allowed_actors on public.process_step;
create policy process_step_write_allowed_actors
on public.process_step for all to authenticated
using (
  public.has_workspace_role(workspace_id, auth.uid(), array['admin','owner'])
  or exists (
    select 1
    from public.process p
    where p.id = process_step.process_id
      and p.workspace_id = process_step.workspace_id
      and p.created_by = auth.uid()
      and p.status in ('draft','changes_requested')
  )
)
with check (
  public.has_workspace_role(workspace_id, auth.uid(), array['admin','owner'])
  or exists (
    select 1
    from public.process p
    where p.id = process_step.process_id
      and p.workspace_id = process_step.workspace_id
      and p.created_by = auth.uid()
      and p.status in ('draft','changes_requested')
  )
);

drop policy if exists process_status_audit_select_workspace_members on public.process_status_audit;
create policy process_status_audit_select_workspace_members
on public.process_status_audit for select to authenticated
using (public.is_workspace_member(workspace_id, auth.uid()));

drop policy if exists process_status_audit_admin_insert on public.process_status_audit;
create policy process_status_audit_admin_insert
on public.process_status_audit for insert to authenticated
with check (public.has_workspace_role(workspace_id, auth.uid(), array['admin','owner']));

create or replace function public.decide_process(
  p_process_id uuid,
  p_decision text,
  p_note text default null
)
returns public.process
language plpgsql
security definer
set search_path = public
as $$
declare
  v_process public.process;
  v_from public.process_status;
  v_to public.process_status;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select * into v_process
  from public.process
  where id = p_process_id
  for update;

  if not found then
    raise exception 'process not found' using errcode = 'P0002';
  end if;

  if not public.has_workspace_role(v_process.workspace_id, auth.uid(), array['admin','owner']) then
    raise exception 'not authorized to decide process' using errcode = '42501';
  end if;

  v_from := v_process.status;
  v_to := case p_decision
    when 'approve' then 'approved'::public.process_status
    when 'request_changes' then 'changes_requested'::public.process_status
    when 'reject' then 'changes_requested'::public.process_status
    when 'start_review' then 'under_review'::public.process_status
    else null
  end;

  if v_to is null then
    raise exception 'invalid process decision: %', p_decision using errcode = '22023';
  end if;

  update public.process
  set
    status = v_to,
    approved_at = case when v_to in ('approved','merged') then now() else approved_at end,
    submitted_at = case when v_to = 'under_review' and submitted_at is null then now() else submitted_at end,
    updated_at = now()
  where id = p_process_id
  returning * into v_process;

  insert into public.process_status_audit (
    workspace_id,
    process_id,
    from_status,
    to_status,
    changed_by,
    note
  )
  values (
    v_process.workspace_id,
    v_process.id,
    v_from,
    v_to,
    auth.uid(),
    p_note
  );

  return v_process;
end;
$$;

revoke all on function public.decide_process(uuid, text, text) from public;
grant execute on function public.decide_process(uuid, text, text) to authenticated;

create or replace function public.workspace_build_overview(p_workspace_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_counts jsonb;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if not public.is_workspace_member(p_workspace_id, auth.uid()) then
    raise exception 'not a workspace member' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'workspace_id', p_workspace_id,
    'total', count(*) filter (where archived_at is null),
    'draft', count(*) filter (where archived_at is null and status = 'draft'),
    'submitted', count(*) filter (where archived_at is null and status = 'submitted'),
    'under_review', count(*) filter (where archived_at is null and status = 'under_review'),
    'changes_requested', count(*) filter (where archived_at is null and status = 'changes_requested'),
    'approved', count(*) filter (where archived_at is null and status in ('approved','merged')),
    'awaiting_decision', count(*) filter (where archived_at is null and status in ('submitted','under_review')),
    'departments', (
      select count(*)
      from public.department d
      where d.workspace_id = p_workspace_id
        and d.archived_at is null
    )
  )
  into v_counts
  from public.process p
  where p.workspace_id = p_workspace_id;

  return coalesce(v_counts, jsonb_build_object(
    'workspace_id', p_workspace_id,
    'total', 0,
    'draft', 0,
    'submitted', 0,
    'under_review', 0,
    'changes_requested', 0,
    'approved', 0,
    'awaiting_decision', 0,
    'departments', 0
  ));
end;
$$;

revoke all on function public.workspace_build_overview(uuid) from public;
grant execute on function public.workspace_build_overview(uuid) to authenticated;
