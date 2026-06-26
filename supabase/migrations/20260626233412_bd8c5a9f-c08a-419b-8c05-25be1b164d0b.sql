-- =====================================================================
-- BATCH 1 — Process Flow Studio Build foundation (additive)
-- =====================================================================

-- =====================================================================
-- 1. GLOBAL REFERENCE TABLES (workspace-agnostic)
-- =====================================================================

-- tool_catalog: master registry of available tools (Slack, Notion, n8n, etc.)
CREATE TABLE IF NOT EXISTS public.tool_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  category text NOT NULL,
  icon_key text,
  trigger_capable boolean NOT NULL DEFAULT false,
  source text NOT NULL DEFAULT 'manual',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tool_catalog_category ON public.tool_catalog(category) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_tool_catalog_active_name ON public.tool_catalog(name) WHERE is_active;
GRANT SELECT ON public.tool_catalog TO anon, authenticated;
GRANT ALL ON public.tool_catalog TO service_role;
ALTER TABLE public.tool_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY tool_catalog_select ON public.tool_catalog FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY tool_catalog_admin_write ON public.tool_catalog FOR ALL TO authenticated
  USING (public.is_hoi_admin(auth.uid(), ARRAY['owner','admin']))
  WITH CHECK (public.is_hoi_admin(auth.uid(), ARRAY['owner','admin']));

-- tool_action_catalog: capability rows per tool (triggers, actions, searches)
CREATE TABLE IF NOT EXISTS public.tool_action_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid REFERENCES public.tool_catalog(id) ON DELETE CASCADE,
  tool_name text NOT NULL,
  tool_slug text NOT NULL,
  tool_category text,
  tool_source text,
  tool_description text,
  integration_source text NOT NULL DEFAULT 'manual',
  integration_found text NOT NULL DEFAULT 'unknown',
  capability_type text NOT NULL CHECK (capability_type IN ('trigger','action','search','operation_group','default_action')),
  business_action text NOT NULL,
  business_object text NOT NULL,
  action_family text NOT NULL,
  raw_source_label text,
  operation_group text,
  trigger_event text,
  business_use_case text,
  process_mapping_category text,
  input_data_needed text,
  output_data_created text,
  data_sensitivity text,
  automation_readiness text,
  confidence_level text,
  evidence_url text,
  evidence_notes text,
  needs_manual_review boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tool_action_catalog_tool ON public.tool_action_catalog(tool_id) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_tool_action_catalog_slug ON public.tool_action_catalog(tool_slug) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_tool_action_catalog_category ON public.tool_action_catalog(process_mapping_category) WHERE is_active;
GRANT SELECT ON public.tool_action_catalog TO anon, authenticated;
GRANT ALL ON public.tool_action_catalog TO service_role;
ALTER TABLE public.tool_action_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY tool_action_catalog_select ON public.tool_action_catalog FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY tool_action_catalog_admin_write ON public.tool_action_catalog FOR ALL TO authenticated
  USING (public.is_hoi_admin(auth.uid(), ARRAY['owner','admin']))
  WITH CHECK (public.is_hoi_admin(auth.uid(), ARRAY['owner','admin']));

-- process_template: blueprints. workspace_id NULL = global/shared template.
CREATE TABLE IF NOT EXISTS public.process_template (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text,
  category text,
  description text,
  risk_tier text,
  diagram_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  capture_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_process_template_workspace ON public.process_template(workspace_id) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_process_template_global ON public.process_template(is_active) WHERE workspace_id IS NULL AND archived_at IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.process_template TO authenticated;
GRANT ALL ON public.process_template TO service_role;
ALTER TABLE public.process_template ENABLE ROW LEVEL SECURITY;
CREATE POLICY process_template_select ON public.process_template FOR SELECT TO authenticated
  USING (workspace_id IS NULL OR public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY process_template_ws_write ON public.process_template FOR ALL TO authenticated
  USING (workspace_id IS NOT NULL AND public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin']))
  WITH CHECK (workspace_id IS NOT NULL AND public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin']));
CREATE POLICY process_template_global_admin ON public.process_template FOR ALL TO authenticated
  USING (workspace_id IS NULL AND public.is_hoi_admin(auth.uid(), ARRAY['owner','admin']))
  WITH CHECK (workspace_id IS NULL AND public.is_hoi_admin(auth.uid(), ARRAY['owner','admin']));
CREATE TRIGGER trg_process_template_updated_at BEFORE UPDATE ON public.process_template
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.process_template_alias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.process_template(id) ON DELETE CASCADE,
  alias text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_id, alias)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.process_template_alias TO authenticated;
GRANT ALL ON public.process_template_alias TO service_role;
ALTER TABLE public.process_template_alias ENABLE ROW LEVEL SECURITY;
CREATE POLICY process_template_alias_select ON public.process_template_alias FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.process_template t WHERE t.id = template_id
                 AND (t.workspace_id IS NULL OR public.is_workspace_member(t.workspace_id, auth.uid()))));
CREATE POLICY process_template_alias_write ON public.process_template_alias FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.process_template t WHERE t.id = template_id
                 AND ((t.workspace_id IS NOT NULL AND public.has_workspace_role(t.workspace_id, auth.uid(), ARRAY['owner','admin']))
                      OR (t.workspace_id IS NULL AND public.is_hoi_admin(auth.uid(), ARRAY['owner','admin'])))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.process_template t WHERE t.id = template_id
                 AND ((t.workspace_id IS NOT NULL AND public.has_workspace_role(t.workspace_id, auth.uid(), ARRAY['owner','admin']))
                      OR (t.workspace_id IS NULL AND public.is_hoi_admin(auth.uid(), ARRAY['owner','admin'])))));

-- =====================================================================
-- 2. PER-WORKSPACE TOOL ADOPTION
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.tool (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  catalog_id uuid REFERENCES public.tool_catalog(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text,
  category text,
  status text NOT NULL DEFAULT 'in_use' CHECK (status IN ('in_use','evaluating','retired','blocked')),
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  UNIQUE (workspace_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_tool_workspace ON public.tool(workspace_id) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tool_catalog ON public.tool(catalog_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tool TO authenticated;
GRANT ALL ON public.tool TO service_role;
ALTER TABLE public.tool ENABLE ROW LEVEL SECURITY;
CREATE POLICY tool_select ON public.tool FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY tool_write ON public.tool FOR ALL TO authenticated
  USING (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin','member']))
  WITH CHECK (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin','member']));
CREATE TRIGGER trg_tool_updated_at BEFORE UPDATE ON public.tool
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.tool_action (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  tool_id uuid NOT NULL REFERENCES public.tool(id) ON DELETE CASCADE,
  catalog_action_id uuid REFERENCES public.tool_action_catalog(id) ON DELETE SET NULL,
  capability_type text NOT NULL CHECK (capability_type IN ('trigger','action','search','operation_group','default_action')),
  business_action text NOT NULL,
  business_object text NOT NULL,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_tool_action_workspace ON public.tool_action(workspace_id) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tool_action_tool ON public.tool_action(tool_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tool_action TO authenticated;
GRANT ALL ON public.tool_action TO service_role;
ALTER TABLE public.tool_action ENABLE ROW LEVEL SECURITY;
CREATE POLICY tool_action_select ON public.tool_action FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY tool_action_write ON public.tool_action FOR ALL TO authenticated
  USING (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin','member']))
  WITH CHECK (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin','member']));

-- =====================================================================
-- 3. GOVERNED VAULT SKELETON
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.vault (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  vault_key text,
  vault_type text NOT NULL DEFAULT 'company' CHECK (vault_type IN (
    'company','company_core','department','client','training','process_library',
    'operating_model','data_dictionary','tool_stack','compliance','risk_control',
    'templates_playbooks','market_intelligence','performance_analytics','external_contracts'
  )),
  tier int CHECK (tier IS NULL OR tier IN (1,2,3)),
  status text NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed','confirmed','active','dormant')),
  isolation text NOT NULL DEFAULT 'internal' CHECK (isolation IN ('shared','confidential','scoped','read_only','internal')),
  purpose text,
  audience text,
  residency text,
  owner text,
  sensitivity_ceiling text,
  core_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  agent_constitution jsonb NOT NULL DEFAULT '{}'::jsonb,
  knowledge_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  routing_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  vault_references jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_vault_workspace_key_active
  ON public.vault(workspace_id, vault_key) WHERE archived_at IS NULL AND vault_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vault_workspace ON public.vault(workspace_id) WHERE archived_at IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vault TO authenticated;
GRANT ALL ON public.vault TO service_role;
ALTER TABLE public.vault ENABLE ROW LEVEL SECURITY;
CREATE POLICY vault_select ON public.vault FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY vault_admin_write ON public.vault FOR ALL TO authenticated
  USING (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin']))
  WITH CHECK (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin']));
CREATE TRIGGER trg_vault_updated_at BEFORE UPDATE ON public.vault
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.vault_reference (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  vault_id uuid NOT NULL REFERENCES public.vault(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('process','process_export','tool','process_template','readiness','score','risk')),
  entity_id uuid,
  entity_key text,
  title text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_vault_reference_workspace ON public.vault_reference(workspace_id) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_vault_reference_vault ON public.vault_reference(vault_id) WHERE archived_at IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vault_reference TO authenticated;
GRANT ALL ON public.vault_reference TO service_role;
ALTER TABLE public.vault_reference ENABLE ROW LEVEL SECURITY;
CREATE POLICY vault_reference_select ON public.vault_reference FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY vault_reference_write ON public.vault_reference FOR ALL TO authenticated
  USING (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin']))
  WITH CHECK (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin']));

-- =====================================================================
-- 4. READINESS + GOVERNANCE
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.readiness_assessment (
  workspace_id uuid PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
  decision_authority text CHECK (decision_authority IN ('none','bu_led','central','federated')),
  has_ai_owner boolean NOT NULL DEFAULT false,
  literacy_coverage text CHECK (literacy_coverage IN ('none','some_leaders','broad','embedded')),
  delivery_posture text CHECK (delivery_posture IN ('fully_external','mostly_external','balanced','mostly_internal')),
  governance_body text CHECK (governance_body IN ('none','ad_hoc','standing','audit_ready')),
  risk_register text CHECK (risk_register IN ('no','partial','maintained')),
  canonical_knowledge_owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_stage text CHECK (organization_stage IN ('initial','developing','advanced','leading')),
  organization_score int CHECK (organization_score BETWEEN 0 AND 100),
  culture_stage text CHECK (culture_stage IN ('initial','developing','advanced','leading')),
  culture_score int CHECK (culture_score BETWEEN 0 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.readiness_assessment TO authenticated;
GRANT ALL ON public.readiness_assessment TO service_role;
ALTER TABLE public.readiness_assessment ENABLE ROW LEVEL SECURITY;
CREATE POLICY readiness_assessment_select ON public.readiness_assessment FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY readiness_assessment_admin_write ON public.readiness_assessment FOR ALL TO authenticated
  USING (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin']))
  WITH CHECK (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin']));
CREATE TRIGGER trg_readiness_updated_at BEFORE UPDATE ON public.readiness_assessment
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.governance_threshold (
  workspace_id uuid PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
  auto_approve_score int CHECK (auto_approve_score BETWEEN 0 AND 100),
  required_reviewers int NOT NULL DEFAULT 1 CHECK (required_reviewers BETWEEN 0 AND 10),
  risk_tier_gates jsonb NOT NULL DEFAULT '{}'::jsonb,
  ebitda_floor numeric,
  effort_floor numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.governance_threshold TO authenticated;
GRANT ALL ON public.governance_threshold TO service_role;
ALTER TABLE public.governance_threshold ENABLE ROW LEVEL SECURITY;
CREATE POLICY governance_threshold_select ON public.governance_threshold FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY governance_threshold_admin_write ON public.governance_threshold FOR ALL TO authenticated
  USING (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin']))
  WITH CHECK (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin']));
CREATE TRIGGER trg_governance_threshold_updated_at BEFORE UPDATE ON public.governance_threshold
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================================
-- 5. COMPANY SETUP WIZARD DATA
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.company_profile (
  workspace_id uuid PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
  legal_name text,
  industry text,
  size_band text,
  hq_country text,
  hq_city text,
  fiscal_year_end text,
  primary_language text,
  mission text,
  vision text,
  values jsonb NOT NULL DEFAULT '[]'::jsonb,
  brand jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_profile TO authenticated;
GRANT ALL ON public.company_profile TO service_role;
ALTER TABLE public.company_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY company_profile_select ON public.company_profile FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY company_profile_admin_write ON public.company_profile FOR ALL TO authenticated
  USING (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin']))
  WITH CHECK (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin']));
CREATE TRIGGER trg_company_profile_updated_at BEFORE UPDATE ON public.company_profile
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.company_score (
  workspace_id uuid PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
  overall_score numeric,
  ebitda_total numeric,
  effort_total numeric,
  error_total numeric,
  data_total numeric,
  stage text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  computed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_score TO authenticated;
GRANT ALL ON public.company_score TO service_role;
ALTER TABLE public.company_score ENABLE ROW LEVEL SECURITY;
CREATE POLICY company_score_select ON public.company_score FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY company_score_admin_write ON public.company_score FOR ALL TO authenticated
  USING (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin']))
  WITH CHECK (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin']));

CREATE TABLE IF NOT EXISTS public.department_score (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  department_id uuid NOT NULL REFERENCES public.department(id) ON DELETE CASCADE,
  overall_score numeric,
  ebitda_total numeric,
  effort_total numeric,
  error_total numeric,
  data_total numeric,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  computed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, department_id)
);
CREATE INDEX IF NOT EXISTS idx_department_score_workspace ON public.department_score(workspace_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.department_score TO authenticated;
GRANT ALL ON public.department_score TO service_role;
ALTER TABLE public.department_score ENABLE ROW LEVEL SECURITY;
CREATE POLICY department_score_select ON public.department_score FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY department_score_admin_write ON public.department_score FOR ALL TO authenticated
  USING (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin']))
  WITH CHECK (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin']));

-- =====================================================================
-- 6. LIGHTWEIGHT COMPANY SETUP RECORDS
-- =====================================================================

-- Helper macro pattern: each table below follows the same shape.
CREATE TABLE IF NOT EXISTS public.audience (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL, description text, segment text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_audience_workspace ON public.audience(workspace_id) WHERE archived_at IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audience TO authenticated;
GRANT ALL ON public.audience TO service_role;
ALTER TABLE public.audience ENABLE ROW LEVEL SECURITY;
CREATE POLICY audience_select ON public.audience FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY audience_write ON public.audience FOR ALL TO authenticated
  USING (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin','member']))
  WITH CHECK (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin','member']));
CREATE TRIGGER trg_audience_updated_at BEFORE UPDATE ON public.audience FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.client (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL, segment text, tier text, country text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_client_workspace ON public.client(workspace_id) WHERE archived_at IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client TO authenticated;
GRANT ALL ON public.client TO service_role;
ALTER TABLE public.client ENABLE ROW LEVEL SECURITY;
CREATE POLICY client_select ON public.client FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY client_write ON public.client FOR ALL TO authenticated
  USING (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin','member']))
  WITH CHECK (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin','member']));
CREATE TRIGGER trg_client_updated_at BEFORE UPDATE ON public.client FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.knowledge_source (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL, source_type text, url text, owner text, status text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_knowledge_source_workspace ON public.knowledge_source(workspace_id) WHERE archived_at IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.knowledge_source TO authenticated;
GRANT ALL ON public.knowledge_source TO service_role;
ALTER TABLE public.knowledge_source ENABLE ROW LEVEL SECURITY;
CREATE POLICY knowledge_source_select ON public.knowledge_source FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY knowledge_source_write ON public.knowledge_source FOR ALL TO authenticated
  USING (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin','member']))
  WITH CHECK (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin','member']));
CREATE TRIGGER trg_knowledge_source_updated_at BEFORE UPDATE ON public.knowledge_source FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.opportunity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL, summary text, status text NOT NULL DEFAULT 'identified',
  ebitda_impact numeric, effort_savings numeric, error_reduction numeric, data_value numeric,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_opportunity_workspace ON public.opportunity(workspace_id) WHERE archived_at IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunity TO authenticated;
GRANT ALL ON public.opportunity TO service_role;
ALTER TABLE public.opportunity ENABLE ROW LEVEL SECURITY;
CREATE POLICY opportunity_select ON public.opportunity FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY opportunity_write ON public.opportunity FOR ALL TO authenticated
  USING (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin','member']))
  WITH CHECK (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin','member']));
CREATE TRIGGER trg_opportunity_updated_at BEFORE UPDATE ON public.opportunity FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.product_service (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL, category text, description text, lifecycle text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_product_service_workspace ON public.product_service(workspace_id) WHERE archived_at IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_service TO authenticated;
GRANT ALL ON public.product_service TO service_role;
ALTER TABLE public.product_service ENABLE ROW LEVEL SECURITY;
CREATE POLICY product_service_select ON public.product_service FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY product_service_write ON public.product_service FOR ALL TO authenticated
  USING (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin','member']))
  WITH CHECK (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin','member']));
CREATE TRIGGER trg_product_service_updated_at BEFORE UPDATE ON public.product_service FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.strategic_priority (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL, description text, horizon text, status text,
  position int NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_strategic_priority_workspace ON public.strategic_priority(workspace_id) WHERE archived_at IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.strategic_priority TO authenticated;
GRANT ALL ON public.strategic_priority TO service_role;
ALTER TABLE public.strategic_priority ENABLE ROW LEVEL SECURITY;
CREATE POLICY strategic_priority_select ON public.strategic_priority FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY strategic_priority_write ON public.strategic_priority FOR ALL TO authenticated
  USING (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin']))
  WITH CHECK (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin']));
CREATE TRIGGER trg_strategic_priority_updated_at BEFORE UPDATE ON public.strategic_priority FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.data_source (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL, source_type text, system text, owner text, status text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_data_source_workspace ON public.data_source(workspace_id) WHERE archived_at IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.data_source TO authenticated;
GRANT ALL ON public.data_source TO service_role;
ALTER TABLE public.data_source ENABLE ROW LEVEL SECURITY;
CREATE POLICY data_source_select ON public.data_source FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY data_source_write ON public.data_source FOR ALL TO authenticated
  USING (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin','member']))
  WITH CHECK (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin','member']));
CREATE TRIGGER trg_data_source_updated_at BEFORE UPDATE ON public.data_source FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.campaign (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL, summary text, status text NOT NULL DEFAULT 'planned',
  start_date date, end_date date,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_campaign_workspace ON public.campaign(workspace_id) WHERE archived_at IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign TO authenticated;
GRANT ALL ON public.campaign TO service_role;
ALTER TABLE public.campaign ENABLE ROW LEVEL SECURITY;
CREATE POLICY campaign_select ON public.campaign FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY campaign_write ON public.campaign FOR ALL TO authenticated
  USING (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin']))
  WITH CHECK (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin']));
CREATE TRIGGER trg_campaign_updated_at BEFORE UPDATE ON public.campaign FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================================
-- 7. MEMBER PROFILE (extends workspace_members)
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.member_profile (
  workspace_member_id uuid PRIMARY KEY REFERENCES public.workspace_members(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  job_title text,
  languages text[] NOT NULL DEFAULT ARRAY[]::text[],
  timezone text,
  bio text,
  expertise text[] NOT NULL DEFAULT ARRAY[]::text[],
  ai_literacy text CHECK (ai_literacy IN ('none','aware','practitioner','advanced','leader')),
  role_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_member_profile_workspace ON public.member_profile(workspace_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.member_profile TO authenticated;
GRANT ALL ON public.member_profile TO service_role;
ALTER TABLE public.member_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY member_profile_select ON public.member_profile FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY member_profile_self_write ON public.member_profile FOR ALL TO authenticated
  USING (
    public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin'])
    OR EXISTS (SELECT 1 FROM public.workspace_members wm
               WHERE wm.id = workspace_member_id AND wm.user_id = auth.uid())
  )
  WITH CHECK (
    public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin'])
    OR EXISTS (SELECT 1 FROM public.workspace_members wm
               WHERE wm.id = workspace_member_id AND wm.user_id = auth.uid())
  );
CREATE TRIGGER trg_member_profile_updated_at BEFORE UPDATE ON public.member_profile
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================================
-- 8. PROCESS EXPORTS (snapshot exports)
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.process_export (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  process_id uuid NOT NULL REFERENCES public.process(id) ON DELETE CASCADE,
  export_type text NOT NULL CHECK (export_type IN ('diagram','sop','blueprint','full')),
  format text NOT NULL DEFAULT 'json',
  storage_path text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_process_export_workspace ON public.process_export(workspace_id);
CREATE INDEX IF NOT EXISTS idx_process_export_process ON public.process_export(process_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.process_export TO authenticated;
GRANT ALL ON public.process_export TO service_role;
ALTER TABLE public.process_export ENABLE ROW LEVEL SECURITY;
CREATE POLICY process_export_select ON public.process_export FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY process_export_write ON public.process_export FOR ALL TO authenticated
  USING (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin','member']))
  WITH CHECK (public.has_workspace_role(workspace_id, auth.uid(), ARRAY['owner','admin','member']));

-- =====================================================================
-- 9. ADDITIVE COLUMNS ON EXISTING TABLES
-- =====================================================================

-- process: add PFS metrics + JSON payloads
ALTER TABLE public.process
  ADD COLUMN IF NOT EXISTS risk_tier text CHECK (risk_tier IS NULL OR risk_tier IN ('low','medium','high','critical')),
  ADD COLUMN IF NOT EXISTS ebitda_impact numeric,
  ADD COLUMN IF NOT EXISTS effort_savings numeric,
  ADD COLUMN IF NOT EXISTS error_reduction numeric,
  ADD COLUMN IF NOT EXISTS data_value numeric,
  ADD COLUMN IF NOT EXISTS diagram_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS capture_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS score_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.process_template(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS maturity_stage text;

CREATE INDEX IF NOT EXISTS idx_process_template_id ON public.process(template_id);
CREATE INDEX IF NOT EXISTS idx_process_risk_tier ON public.process(workspace_id, risk_tier);

-- process_step: add capture + tool/action linkage + canvas coords
ALTER TABLE public.process_step
  ADD COLUMN IF NOT EXISTS capture_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS tool_id uuid REFERENCES public.tool(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tool_action_id uuid REFERENCES public.tool_action(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS canvas_x numeric,
  ADD COLUMN IF NOT EXISTS canvas_y numeric,
  ADD COLUMN IF NOT EXISTS node_type text;

CREATE INDEX IF NOT EXISTS idx_process_step_tool ON public.process_step(tool_id);
CREATE INDEX IF NOT EXISTS idx_process_step_tool_action ON public.process_step(tool_action_id);

-- department: color + head_count (parent_id already exists)
ALTER TABLE public.department
  ADD COLUMN IF NOT EXISTS color text,
  ADD COLUMN IF NOT EXISTS head_count int;

-- workspace_members: minor extensions consumed by PFS UI
ALTER TABLE public.workspace_members
  ADD COLUMN IF NOT EXISTS languages text[] NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS role_context jsonb NOT NULL DEFAULT '{}'::jsonb;