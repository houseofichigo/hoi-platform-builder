-- =====================================================================
-- PFS process-mapping schema (idempotent, defensive for pre-existing tables)
-- =====================================================================

do $$ begin
  create type public.process_status as enum
    ('draft','submitted','under_review','changes_requested','approved','merged','archived');
exception when duplicate_object then null; end $$;

alter table public.workspace_members
  add column if not exists department_id uuid,
  add column if not exists manager_id  uuid references public.workspace_members(id) on delete set null;

alter table public.workspace_invitations
  add column if not exists role          text,
  add column if not exists department_id uuid,
  add column if not exists manager_id    uuid references public.workspace_members(id) on delete set null,
  add column if not exists first_name    text,
  add column if not exists last_name     text,
  add column if not exists "position"    text,
  add column if not exists send_state    text not null default 'draft'
    check (send_state in ('draft','queued','sent','failed')),
  add column if not exists queued_at     timestamptz,
  add column if not exists sent_at       timestamptz,
  add column if not exists last_error    text;

-- ---------- TENANT TABLES ----------

create table if not exists public.department (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null, description text,
  parent_id uuid references public.department(id) on delete set null,
  lead_membership_id uuid references public.workspace_members(id) on delete set null,
  lead_user_id uuid references auth.users(id) on delete set null,
  headcount integer,
  holds_sensitive_data boolean not null default false,
  distinct_audience boolean not null default false,
  audience_id uuid,
  knowledge_owner_user_id uuid references auth.users(id) on delete set null,
  responsibilities jsonb not null default '[]'::jsonb,
  goals jsonb not null default '[]'::jsonb,
  pain_points jsonb not null default '[]'::jsonb,
  products_supported jsonb not null default '[]'::jsonb,
  core_tools jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

do $$ begin
  alter table public.workspace_members
    add constraint workspace_members_department_fk
    foreign key (department_id) references public.department(id) on delete set null;
exception when duplicate_object then null; end $$;

create table if not exists public.member_profile (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  membership_id uuid references public.workspace_members(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  display_name text, job_title text,
  responsibilities jsonb not null default '[]'::jsonb,
  daily_tool_ids jsonb not null default '[]'::jsonb,
  collaborators jsonb not null default '[]'::jsonb,
  decisions_made jsonb not null default '[]'::jsonb,
  is_demo boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.company_profile (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces(id) on delete cascade,
  industry text, sub_industry text, size text, revenue_range text,
  business_model text, customer_type text, locations jsonb not null default '[]'::jsonb,
  growth_stage text, mission text, overview text, value_proposition text,
  primary_jurisdiction text, regulatory_regimes jsonb not null default '[]'::jsonb,
  data_residency jsonb not null default '[]'::jsonb, languages jsonb not null default '[]'::jsonb,
  is_regulated boolean not null default false, sells_training boolean not null default false,
  onboarding_step integer not null default 0, onboarding_phase text not null default 'foundation',
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.readiness_assessment (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  decision_authority text, has_ai_owner boolean, literacy_coverage text,
  delivery_posture text, governance_body text, risk_register text,
  canonical_knowledge_owner_user_id uuid references auth.users(id) on delete set null,
  organization_stage text, culture_stage text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.strategic_priority (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  priorities jsonb not null default '[]'::jsonb, top_goals jsonb not null default '[]'::jsonb,
  operational_risks jsonb not null default '[]'::jsonb, priority_departments jsonb not null default '[]'::jsonb,
  primary_reason text, weights jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.product_service (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null, description text, category text, target_customer text,
  revenue_contribution numeric, delivery_complexity integer, strategic_importance integer,
  departments jsonb not null default '[]'::jsonb, tools jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(), archived_at timestamptz
);

create table if not exists public.audience (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null, description text, scope text default 'custom',
  created_at timestamptz not null default now(), archived_at timestamptz
);

create table if not exists public.client (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null, kind text, sector text, engagement_type text,
  under_nda boolean not null default false, reusable_ip boolean not null default false,
  data_residency text, internal_audience jsonb not null default '[]'::jsonb,
  notes text, status text,
  created_at timestamptz not null default now(), archived_at timestamptz
);

create table if not exists public.tool (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null, category text, departments jsonb not null default '[]'::jsonb,
  main_use_case text, data_stored text, integration_status integer, api_available boolean,
  owner_user_id uuid references auth.users(id) on delete set null,
  criticality text, pain_level integer,
  created_at timestamptz not null default now(), archived_at timestamptz
);

create table if not exists public.data_source (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null, tool_id uuid references public.tool(id) on delete set null,
  department_owner_id uuid references public.department(id) on delete set null,
  data_type text, sensitivity_level text, accessibility text, reliability text, update_frequency text,
  created_at timestamptz not null default now(), archived_at timestamptz
);

create table if not exists public.knowledge_source (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null, source_type text, location_uri text,
  owner_department_id uuid references public.department(id) on delete set null,
  owner_client_id uuid references public.client(id) on delete set null,
  sensitivity_level text, data_residency text, connector_status text, ingestion_status text,
  created_at timestamptz not null default now(), archived_at timestamptz
);

create table if not exists public.vault (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null, vault_type text, isolation text,
  source_department_id uuid references public.department(id) on delete set null,
  source_client_id uuid references public.client(id) on delete set null,
  audience_id uuid references public.audience(id) on delete set null,
  jurisdiction text, references_vault_ids jsonb not null default '[]'::jsonb,
  is_readonly boolean not null default false, status text,
  agent_constitution jsonb, audience text, core_context jsonb default '{}'::jsonb,
  knowledge_config jsonb, owner text, purpose text, residency text,
  routing_rules jsonb, sensitivity_ceiling text, tier integer, vault_key text,
  vault_references jsonb,
  created_at timestamptz not null default now(), archived_at timestamptz
);

create table if not exists public.vault_reference (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  vault_id uuid not null references public.vault(id) on delete cascade,
  entity_type text, entity_id uuid, entity_key text, title text, metadata jsonb,
  created_at timestamptz not null default now(), archived_at timestamptz
);

create table if not exists public.company_score (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  maturity_score numeric, automation_score numeric, ai_score numeric, data_score numeric,
  n_processes integer not null default 0, pct_approved numeric, confidence text,
  computed_at timestamptz not null default now()
);

create table if not exists public.department_score (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  department_id uuid references public.department(id) on delete cascade,
  maturity_score numeric, automation_score numeric, ai_score numeric, data_score numeric,
  n_processes integer not null default 0, pct_approved numeric, confidence text,
  computed_at timestamptz not null default now()
);

create table if not exists public.process (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  department_id uuid references public.department(id) on delete set null,
  owner_user_id uuid references auth.users(id) on delete set null,
  created_by uuid not null default auth.uid() references auth.users(id) on delete set null,
  status public.process_status not null default 'draft',
  trigger text, output text, frequency text,
  capture jsonb not null default '{}'::jsonb, diagram jsonb not null default '{}'::jsonb,
  scores jsonb not null default '{}'::jsonb, governance_flags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  submitted_at timestamptz, approved_at timestamptz, archived_at timestamptz
);

create table if not exists public.process_step (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  process_id uuid not null references public.process(id) on delete cascade,
  node_id text, label text, kind text, actor text,
  tool_id uuid references public.tool(id) on delete set null,
  automation_level integer, hitl text, is_checkpoint boolean not null default false,
  assessment jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.process_status_audit (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  process_id uuid not null references public.process(id) on delete cascade,
  from_status public.process_status, to_status public.process_status,
  note text, changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now()
);

create table if not exists public.process_export (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  process_id uuid not null references public.process(id) on delete cascade,
  version integer not null default 1, export_json jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), archived_at timestamptz
);

create table if not exists public.process_template (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null, category text, department_hint text, description text,
  template_json jsonb not null default '{}'::jsonb, tags jsonb not null default '[]'::jsonb,
  recommended_tools jsonb not null default '[]'::jsonb, complexity text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(), archived_at timestamptz
);

create table if not exists public.process_template_alias (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  alias text not null, template_id uuid references public.process_template(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.campaign (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  participating_departments jsonb not null default '[]'::jsonb,
  participating_users jsonb not null default '[]'::jsonb,
  workflows_per_employee integer, deadline date, reviewers jsonb not null default '[]'::jsonb,
  require_lead_review boolean not null default false, merge_duplicates_mode text, status text,
  created_at timestamptz not null default now(), archived_at timestamptz
);

create table if not exists public.opportunity (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  process_id uuid references public.process(id) on delete set null,
  step_node_id text, type text, department_id uuid references public.department(id) on delete set null,
  problem text, recommended_solution text, roi jsonb, effort text,
  strategic_alignment numeric, status text,
  created_at timestamptz not null default now(), archived_at timestamptz
);

create table if not exists public.roadmap_item (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  opportunity_id uuid references public.opportunity(id) on delete set null,
  name text, category text, owner_user_id uuid references auth.users(id) on delete set null,
  priority text, timeline text, effort numeric, impact numeric, status text,
  dependencies jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(), archived_at timestamptz
);

-- ---------- Defensive: ensure workspace_id exists on every tenant table ----------
do $$
declare t text;
begin
  foreach t in array array[
    'member_profile','department','department_score','company_profile','company_score',
    'readiness_assessment','strategic_priority','product_service','audience','client','data_source',
    'knowledge_source','vault','vault_reference','tool','process','process_step','process_status_audit',
    'process_export','process_template','process_template_alias','campaign','opportunity','roadmap_item']
  loop
    execute format(
      'alter table public.%I add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade', t);
  end loop;
end $$;

-- ---------- GLOBAL / REFERENCE TABLES ----------
create table if not exists public.tool_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null, slug text unique, category text, icon_key text,
  trigger_capable boolean not null default false, source text,
  is_active boolean not null default true, created_at timestamptz not null default now()
);

create table if not exists public.tool_action_catalog (
  id uuid primary key default gen_random_uuid(),
  tool_id uuid, tool_name text, tool_slug text, tool_category text, tool_source text,
  tool_description text, integration_source text, integration_found text, capability_type text,
  business_action text, business_object text, action_family text, raw_source_label text,
  operation_group text, trigger_event text, business_use_case text, process_mapping_category text,
  input_data_needed text, output_data_created text, data_sensitivity text, automation_readiness text,
  confidence_level text, evidence_url text, evidence_notes text,
  needs_manual_review boolean not null default false, is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.tool_action_catalog_import_stage (
  id uuid primary key default gen_random_uuid(),
  import_batch_id uuid, source_row_number integer,
  tool_id uuid, tool_name text, tool_slug text, tool_category text, tool_source text,
  tool_description text, integration_source text, integration_found text, capability_type text,
  business_action text, business_object text, action_family text, raw_source_label text,
  operation_group text, trigger_event text, business_use_case text, process_mapping_category text,
  input_data_needed text, output_data_created text, data_sensitivity text, automation_readiness text,
  confidence_level text, evidence_url text, evidence_notes text,
  needs_manual_review boolean not null default false, is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.tool_action_catalog_import_rejection (
  id uuid primary key default gen_random_uuid(),
  import_batch_id uuid, source_row_number integer, rejection_reason text,
  raw_payload jsonb, created_at timestamptz not null default now()
);

-- ---------- GRANTS ----------
do $$
declare t text;
begin
  foreach t in array array[
    'department','member_profile','company_profile','readiness_assessment','strategic_priority',
    'product_service','audience','client','tool','data_source','knowledge_source','vault','vault_reference',
    'company_score','department_score','process','process_step','process_status_audit','process_export',
    'process_template','process_template_alias','campaign','opportunity','roadmap_item']
  loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;

  foreach t in array array['tool_catalog','tool_action_catalog',
    'tool_action_catalog_import_stage','tool_action_catalog_import_rejection']
  loop
    execute format('grant select on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;

-- ---------- INDEXES ----------
do $$
declare t text;
begin
  foreach t in array array[
    'member_profile','department','department_score','company_profile','company_score',
    'readiness_assessment','strategic_priority','product_service','audience','client','data_source',
    'knowledge_source','vault','vault_reference','tool','process','process_step','process_status_audit',
    'process_export','process_template','process_template_alias','campaign','opportunity','roadmap_item']
  loop
    execute format('create index if not exists %1$s_workspace_idx on public.%1$s(workspace_id)', t);
  end loop;
end $$;

create index if not exists process_step_process_idx on public.process_step(process_id);
create index if not exists process_dept_idx on public.process(department_id);
create index if not exists department_parent_idx on public.department(parent_id);

-- ---------- RLS ----------
do $$
declare t text;
begin
  foreach t in array array[
    'member_profile','department','department_score','company_profile','company_score',
    'readiness_assessment','strategic_priority','product_service','audience','client','data_source',
    'knowledge_source','vault','vault_reference','tool','process','process_step','process_status_audit',
    'process_export','process_template','process_template_alias','campaign','opportunity','roadmap_item']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %1$s_select on public.%1$s', t);
    execute format($f$create policy %1$s_select on public.%1$s for select to authenticated
      using (public.is_workspace_member(workspace_id, auth.uid()))$f$, t);
    execute format('drop policy if exists %1$s_admin_write on public.%1$s', t);
    execute format($f$create policy %1$s_admin_write on public.%1$s for all to authenticated
      using (public.has_workspace_role(workspace_id, auth.uid(), array['admin','owner']::text[]))
      with check (public.has_workspace_role(workspace_id, auth.uid(), array['admin','owner']::text[]))$f$, t);
  end loop;
end $$;

drop policy if exists process_member_insert on public.process;
create policy process_member_insert on public.process for insert to authenticated
  with check (public.has_workspace_role(workspace_id, auth.uid(), array['member','admin','owner']::text[])
              and created_by = auth.uid());

drop policy if exists process_member_update on public.process;
create policy process_member_update on public.process for update to authenticated
  using (created_by = auth.uid() and status in ('draft','changes_requested'))
  with check (created_by = auth.uid());

drop policy if exists process_step_admin_write on public.process_step;
drop policy if exists process_step_write on public.process_step;
create policy process_step_write on public.process_step for all to authenticated
  using (
    public.has_workspace_role(workspace_id, auth.uid(), array['admin','owner']::text[])
    or exists (select 1 from public.process p
               where p.id = process_id and p.created_by = auth.uid()
                 and p.status in ('draft','changes_requested')))
  with check (
    public.has_workspace_role(workspace_id, auth.uid(), array['admin','owner']::text[])
    or exists (select 1 from public.process p
               where p.id = process_id and p.created_by = auth.uid()
                 and p.status in ('draft','changes_requested')));

do $$
declare t text;
begin
  foreach t in array array['tool_catalog','tool_action_catalog',
    'tool_action_catalog_import_stage','tool_action_catalog_import_rejection']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %1$s_read on public.%1$s', t);
    execute format($f$create policy %1$s_read on public.%1$s for select to authenticated using (true)$f$, t);
  end loop;
end $$;
