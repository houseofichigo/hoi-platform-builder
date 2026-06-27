-- =====================================================================
-- Back-fill PFS columns on pre-existing tenant tables. Safe / idempotent.
-- =====================================================================

-- company_profile -----------------------------------------------------
alter table public.company_profile
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists industry text,
  add column if not exists sub_industry text,
  add column if not exists size text,
  add column if not exists revenue_range text,
  add column if not exists business_model text,
  add column if not exists customer_type text,
  add column if not exists locations jsonb not null default '[]'::jsonb,
  add column if not exists growth_stage text,
  add column if not exists mission text,
  add column if not exists overview text,
  add column if not exists value_proposition text,
  add column if not exists primary_jurisdiction text,
  add column if not exists regulatory_regimes jsonb not null default '[]'::jsonb,
  add column if not exists data_residency jsonb not null default '[]'::jsonb,
  add column if not exists languages jsonb not null default '[]'::jsonb,
  add column if not exists is_regulated boolean not null default false,
  add column if not exists sells_training boolean not null default false,
  add column if not exists onboarding_step integer not null default 0,
  add column if not exists onboarding_phase text not null default 'foundation',
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists archived_at timestamptz;

-- ensure id is unique/PK-eligible
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.company_profile'::regclass
      and contype in ('p','u')
      and pg_get_constraintdef(oid) ilike '%(id)%'
  ) then
    update public.company_profile set id = gen_random_uuid() where id is null;
    alter table public.company_profile alter column id set not null;
    alter table public.company_profile add constraint company_profile_id_key unique (id);
  end if;
end $$;

-- department ----------------------------------------------------------
alter table public.department
  add column if not exists description text,
  add column if not exists parent_id uuid references public.department(id) on delete set null,
  add column if not exists lead_membership_id uuid references public.workspace_members(id) on delete set null,
  add column if not exists lead_user_id uuid references auth.users(id) on delete set null,
  add column if not exists headcount integer,
  add column if not exists holds_sensitive_data boolean not null default false,
  add column if not exists distinct_audience boolean not null default false,
  add column if not exists audience_id uuid,
  add column if not exists knowledge_owner_user_id uuid references auth.users(id) on delete set null,
  add column if not exists responsibilities jsonb not null default '[]'::jsonb,
  add column if not exists goals jsonb not null default '[]'::jsonb,
  add column if not exists pain_points jsonb not null default '[]'::jsonb,
  add column if not exists products_supported jsonb not null default '[]'::jsonb,
  add column if not exists core_tools jsonb not null default '[]'::jsonb,
  add column if not exists archived_at timestamptz;

-- member_profile ------------------------------------------------------
alter table public.member_profile
  add column if not exists membership_id uuid references public.workspace_members(id) on delete cascade,
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists display_name text,
  add column if not exists job_title text,
  add column if not exists responsibilities jsonb not null default '[]'::jsonb,
  add column if not exists daily_tool_ids jsonb not null default '[]'::jsonb,
  add column if not exists collaborators jsonb not null default '[]'::jsonb,
  add column if not exists decisions_made jsonb not null default '[]'::jsonb,
  add column if not exists is_demo boolean not null default false,
  add column if not exists completed_at timestamptz,
  add column if not exists archived_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

-- readiness_assessment ------------------------------------------------
alter table public.readiness_assessment
  add column if not exists decision_authority text,
  add column if not exists has_ai_owner boolean,
  add column if not exists literacy_coverage text,
  add column if not exists delivery_posture text,
  add column if not exists governance_body text,
  add column if not exists risk_register text,
  add column if not exists canonical_knowledge_owner_user_id uuid references auth.users(id) on delete set null,
  add column if not exists organization_stage text,
  add column if not exists culture_stage text,
  add column if not exists updated_at timestamptz not null default now();

-- strategic_priority --------------------------------------------------
alter table public.strategic_priority
  add column if not exists priorities jsonb not null default '[]'::jsonb,
  add column if not exists top_goals jsonb not null default '[]'::jsonb,
  add column if not exists operational_risks jsonb not null default '[]'::jsonb,
  add column if not exists priority_departments jsonb not null default '[]'::jsonb,
  add column if not exists primary_reason text,
  add column if not exists weights jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists archived_at timestamptz;

-- product_service -----------------------------------------------------
alter table public.product_service
  add column if not exists description text,
  add column if not exists category text,
  add column if not exists target_customer text,
  add column if not exists revenue_contribution numeric,
  add column if not exists delivery_complexity integer,
  add column if not exists strategic_importance integer,
  add column if not exists departments jsonb not null default '[]'::jsonb,
  add column if not exists tools jsonb not null default '[]'::jsonb,
  add column if not exists archived_at timestamptz;

-- audience ------------------------------------------------------------
alter table public.audience
  add column if not exists description text,
  add column if not exists scope text default 'custom',
  add column if not exists archived_at timestamptz;

-- client --------------------------------------------------------------
alter table public.client
  add column if not exists kind text,
  add column if not exists sector text,
  add column if not exists engagement_type text,
  add column if not exists under_nda boolean not null default false,
  add column if not exists reusable_ip boolean not null default false,
  add column if not exists data_residency text,
  add column if not exists internal_audience jsonb not null default '[]'::jsonb,
  add column if not exists notes text,
  add column if not exists status text,
  add column if not exists archived_at timestamptz;

-- tool ----------------------------------------------------------------
alter table public.tool
  add column if not exists category text,
  add column if not exists departments jsonb not null default '[]'::jsonb,
  add column if not exists main_use_case text,
  add column if not exists data_stored text,
  add column if not exists integration_status integer,
  add column if not exists api_available boolean,
  add column if not exists owner_user_id uuid references auth.users(id) on delete set null,
  add column if not exists criticality text,
  add column if not exists pain_level integer,
  add column if not exists archived_at timestamptz;

-- data_source ---------------------------------------------------------
alter table public.data_source
  add column if not exists tool_id uuid references public.tool(id) on delete set null,
  add column if not exists department_owner_id uuid references public.department(id) on delete set null,
  add column if not exists data_type text,
  add column if not exists sensitivity_level text,
  add column if not exists accessibility text,
  add column if not exists reliability text,
  add column if not exists update_frequency text,
  add column if not exists archived_at timestamptz;

-- knowledge_source ----------------------------------------------------
alter table public.knowledge_source
  add column if not exists source_type text,
  add column if not exists location_uri text,
  add column if not exists owner_department_id uuid references public.department(id) on delete set null,
  add column if not exists owner_client_id uuid references public.client(id) on delete set null,
  add column if not exists sensitivity_level text,
  add column if not exists data_residency text,
  add column if not exists connector_status text,
  add column if not exists ingestion_status text,
  add column if not exists archived_at timestamptz;

-- vault ---------------------------------------------------------------
alter table public.vault
  add column if not exists vault_type text,
  add column if not exists isolation text,
  add column if not exists source_department_id uuid references public.department(id) on delete set null,
  add column if not exists source_client_id uuid references public.client(id) on delete set null,
  add column if not exists audience_id uuid references public.audience(id) on delete set null,
  add column if not exists jurisdiction text,
  add column if not exists references_vault_ids jsonb not null default '[]'::jsonb,
  add column if not exists is_readonly boolean not null default false,
  add column if not exists status text,
  add column if not exists agent_constitution jsonb,
  add column if not exists audience text,
  add column if not exists core_context jsonb default '{}'::jsonb,
  add column if not exists knowledge_config jsonb,
  add column if not exists owner text,
  add column if not exists purpose text,
  add column if not exists residency text,
  add column if not exists routing_rules jsonb,
  add column if not exists sensitivity_ceiling text,
  add column if not exists tier integer,
  add column if not exists vault_key text,
  add column if not exists vault_references jsonb,
  add column if not exists archived_at timestamptz;

-- vault_reference -----------------------------------------------------
alter table public.vault_reference
  add column if not exists entity_type text,
  add column if not exists entity_id uuid,
  add column if not exists entity_key text,
  add column if not exists title text,
  add column if not exists metadata jsonb,
  add column if not exists archived_at timestamptz;

-- campaign ------------------------------------------------------------
alter table public.campaign
  add column if not exists participating_departments jsonb not null default '[]'::jsonb,
  add column if not exists participating_users jsonb not null default '[]'::jsonb,
  add column if not exists workflows_per_employee integer,
  add column if not exists deadline date,
  add column if not exists reviewers jsonb not null default '[]'::jsonb,
  add column if not exists require_lead_review boolean not null default false,
  add column if not exists merge_duplicates_mode text,
  add column if not exists status text,
  add column if not exists archived_at timestamptz;

-- opportunity ---------------------------------------------------------
alter table public.opportunity
  add column if not exists process_id uuid references public.process(id) on delete set null,
  add column if not exists step_node_id text,
  add column if not exists type text,
  add column if not exists department_id uuid references public.department(id) on delete set null,
  add column if not exists problem text,
  add column if not exists recommended_solution text,
  add column if not exists roi jsonb,
  add column if not exists effort text,
  add column if not exists strategic_alignment numeric,
  add column if not exists status text,
  add column if not exists archived_at timestamptz;

-- roadmap_item --------------------------------------------------------
alter table public.roadmap_item
  add column if not exists opportunity_id uuid references public.opportunity(id) on delete set null,
  add column if not exists name text,
  add column if not exists category text,
  add column if not exists owner_user_id uuid references auth.users(id) on delete set null,
  add column if not exists priority text,
  add column if not exists timeline text,
  add column if not exists effort numeric,
  add column if not exists impact numeric,
  add column if not exists status text,
  add column if not exists dependencies jsonb not null default '[]'::jsonb,
  add column if not exists archived_at timestamptz;

-- company_score / department_score -----------------------------------
alter table public.company_score
  add column if not exists maturity_score numeric,
  add column if not exists automation_score numeric,
  add column if not exists ai_score numeric,
  add column if not exists data_score numeric,
  add column if not exists n_processes integer not null default 0,
  add column if not exists pct_approved numeric,
  add column if not exists confidence text,
  add column if not exists computed_at timestamptz not null default now();

alter table public.department_score
  add column if not exists department_id uuid references public.department(id) on delete cascade,
  add column if not exists maturity_score numeric,
  add column if not exists automation_score numeric,
  add column if not exists ai_score numeric,
  add column if not exists data_score numeric,
  add column if not exists n_processes integer not null default 0,
  add column if not exists pct_approved numeric,
  add column if not exists confidence text,
  add column if not exists computed_at timestamptz not null default now();

-- process_template / alias -------------------------------------------
alter table public.process_template
  add column if not exists category text,
  add column if not exists department_hint text,
  add column if not exists description text,
  add column if not exists template_json jsonb not null default '{}'::jsonb,
  add column if not exists tags jsonb not null default '[]'::jsonb,
  add column if not exists recommended_tools jsonb not null default '[]'::jsonb,
  add column if not exists complexity text,
  add column if not exists is_active boolean not null default true,
  add column if not exists archived_at timestamptz;

alter table public.process_template_alias
  add column if not exists alias text,
  add column if not exists template_id uuid references public.process_template(id) on delete cascade;

-- read-only views adapters expect ------------------------------------
do $$ begin
  if not exists (select 1 from pg_class where relname = 'membership' and relnamespace = 'public'::regnamespace) then
    create view public.membership as
      select id, workspace_id, workspace_id as organization_id, user_id, role, created_at,
             manager_member_id, department_id
        from public.workspace_members;
    grant select on public.membership to authenticated;
  end if;
exception when others then null; end $$;

do $$ begin
  if not exists (select 1 from pg_class where relname = 'organization' and relnamespace = 'public'::regnamespace) then
    create view public.organization as
      select id, id as organization_id, name, slug, created_at
        from public.workspaces;
    grant select on public.organization to authenticated;
  end if;
exception when others then null; end $$;
