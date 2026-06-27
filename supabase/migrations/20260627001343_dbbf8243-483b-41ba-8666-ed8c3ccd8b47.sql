
-- =============================================================
-- PART 1 — organization_id alias on every PFS-scoped table
-- =============================================================

create or replace function public.sync_workspace_organization_id()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.workspace_id is null and new.organization_id is not null then
      new.workspace_id := new.organization_id;
    elsif new.organization_id is null and new.workspace_id is not null then
      new.organization_id := new.workspace_id;
    elsif new.workspace_id is distinct from new.organization_id then
      raise exception 'workspace_id (%) and organization_id (%) must match', new.workspace_id, new.organization_id;
    end if;
  elsif tg_op = 'UPDATE' then
    if new.workspace_id is distinct from old.workspace_id and new.organization_id is not distinct from old.organization_id then
      new.organization_id := new.workspace_id;
    elsif new.organization_id is distinct from old.organization_id and new.workspace_id is not distinct from old.workspace_id then
      new.workspace_id := new.organization_id;
    elsif new.workspace_id is distinct from new.organization_id then
      raise exception 'workspace_id (%) and organization_id (%) must match', new.workspace_id, new.organization_id;
    end if;
  end if;
  return new;
end;
$$;

do $$
declare
  t text;
  tbls text[] := array[
    'audience','campaign','client','company_profile','company_score','data_source',
    'department','department_score','knowledge_source','member_profile','opportunity',
    'process','process_export','process_status_audit','process_step','process_template',
    'product_service','readiness_assessment','strategic_priority','tool','tool_action',
    'vault','vault_reference','workspace_invitations','workspace_members','roadmap_entries'
  ];
begin
  foreach t in array tbls loop
    execute format('alter table public.%I add column if not exists organization_id uuid', t);
    execute format('update public.%I set organization_id = workspace_id where organization_id is null', t);
    execute format('alter table public.%I alter column organization_id set not null', t);
    execute format('create index if not exists %I on public.%I (organization_id)', t || '_organization_id_idx', t);
    execute format('drop trigger if exists sync_org_id on public.%I', t);
    execute format('create trigger sync_org_id before insert or update on public.%I for each row execute function public.sync_workspace_organization_id()', t);
  end loop;
end $$;

-- =============================================================
-- PART 2 — missing columns expected by PFS adapters
-- =============================================================

-- enum used by PFS membership/invitation rows
do $$
begin
  if not exists (select 1 from pg_type where typname = 'membership_role') then
    create type public.membership_role as enum ('owner','admin','manager','member','viewer');
  end if;
end $$;

alter table public.workspaces
  add column if not exists owner_membership_id uuid;

alter table public.workspace_members
  add column if not exists archived_at timestamptz;

alter table public.workspace_invitations
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists position text,
  add column if not exists send_state text not null default 'draft',
  add column if not exists archived_at timestamptz;

alter table public.member_profile
  add column if not exists display_name text,
  add column if not exists membership_id uuid;

-- keep membership_id in sync with workspace_member_id
create or replace function public.sync_member_profile_membership_id()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.membership_id is null and new.workspace_member_id is not null then
    new.membership_id := new.workspace_member_id;
  elsif new.workspace_member_id is null and new.membership_id is not null then
    new.workspace_member_id := new.membership_id;
  elsif new.workspace_member_id is distinct from new.membership_id then
    raise exception 'workspace_member_id (%) and membership_id (%) must match', new.workspace_member_id, new.membership_id;
  end if;
  return new;
end $$;

drop trigger if exists sync_membership_id on public.member_profile;
create trigger sync_membership_id
  before insert or update on public.member_profile
  for each row execute function public.sync_member_profile_membership_id();

update public.member_profile set membership_id = workspace_member_id where membership_id is null;

-- department: PFS expects lead_membership_id (HOI has lead_member_id)
alter table public.department
  add column if not exists lead_membership_id uuid;

create or replace function public.sync_department_lead()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.lead_membership_id is null and new.lead_member_id is not null then
    new.lead_membership_id := new.lead_member_id;
  elsif new.lead_member_id is null and new.lead_membership_id is not null then
    new.lead_member_id := new.lead_membership_id;
  end if;
  return new;
end $$;

drop trigger if exists sync_department_lead_trg on public.department;
create trigger sync_department_lead_trg
  before insert or update on public.department
  for each row execute function public.sync_department_lead();

update public.department set lead_membership_id = lead_member_id where lead_membership_id is null;

-- =============================================================
-- PART 3 — PFS-named updatable views
-- =============================================================

drop view if exists public.organization cascade;
create view public.organization
with (security_invoker = on) as
select
  id,
  name,
  slug,
  plan,
  owner_membership_id,
  created_at,
  updated_at
from public.workspaces;

drop view if exists public.membership cascade;
create view public.membership
with (security_invoker = on) as
select
  id,
  workspace_id as organization_id,
  user_id,
  role,
  department_id,
  manager_member_id as manager_id,
  archived_at,
  joined_at as created_at
from public.workspace_members;

drop view if exists public.invitation cascade;
create view public.invitation
with (security_invoker = on) as
select
  id,
  workspace_id as organization_id,
  email,
  role,
  invited_by,
  token,
  status,
  send_state,
  first_name,
  last_name,
  position,
  department_id,
  manager_member_id as manager_id,
  expires_at,
  accepted_at,
  accepted_by,
  archived_at,
  created_at
from public.workspace_invitations;

grant select, insert, update, delete on public.organization to authenticated;
grant select, insert, update, delete on public.membership   to authenticated;
grant select, insert, update, delete on public.invitation   to authenticated;
grant all on public.organization, public.membership, public.invitation to service_role;

-- =============================================================
-- PART 4 — new roadmap_item table (PFS scale roadmap)
-- =============================================================

create table if not exists public.roadmap_item (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  organization_id uuid not null,
  opportunity_id uuid references public.opportunity(id) on delete set null,
  name text not null,
  category text,
  owner_user_id uuid,
  priority text,
  timeline text,
  effort numeric,
  impact numeric,
  status text not null default 'planned',
  dependencies jsonb not null default '[]'::jsonb,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.roadmap_item to authenticated;
grant all on public.roadmap_item to service_role;

alter table public.roadmap_item enable row level security;

drop policy if exists "roadmap_item members read" on public.roadmap_item;
create policy "roadmap_item members read" on public.roadmap_item
  for select to authenticated
  using (public.is_workspace_member(workspace_id, auth.uid()));

drop policy if exists "roadmap_item members write" on public.roadmap_item
  ;
create policy "roadmap_item members write" on public.roadmap_item
  for all to authenticated
  using (public.is_workspace_member(workspace_id, auth.uid()))
  with check (public.is_workspace_member(workspace_id, auth.uid()));

drop trigger if exists sync_org_id on public.roadmap_item;
create trigger sync_org_id
  before insert or update on public.roadmap_item
  for each row execute function public.sync_workspace_organization_id();

create index if not exists roadmap_item_workspace_idx on public.roadmap_item (workspace_id);
create index if not exists roadmap_item_opportunity_idx on public.roadmap_item (opportunity_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists roadmap_item_set_updated_at on public.roadmap_item;
create trigger roadmap_item_set_updated_at
  before update on public.roadmap_item
  for each row execute function public.set_updated_at();
