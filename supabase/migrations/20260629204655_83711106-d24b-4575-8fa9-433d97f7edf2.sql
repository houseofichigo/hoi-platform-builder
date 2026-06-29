
-- Phase A: schema extension for tool catalog enrichment

ALTER TABLE public.tool_catalog
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS subcategory text,
  ADD COLUMN IF NOT EXISTS region_relevance text[],
  ADD COLUMN IF NOT EXISTS countries_relevant text[],
  ADD COLUMN IF NOT EXISTS common_sme_use_cases text[],
  ADD COLUMN IF NOT EXISTS default_data_structure text,
  ADD COLUMN IF NOT EXISTS default_data_sensitivity text,
  ADD COLUMN IF NOT EXISTS default_accessibility text,
  ADD COLUMN IF NOT EXISTS default_api_available boolean,
  ADD COLUMN IF NOT EXISTS business_criticality_default text,
  ADD COLUMN IF NOT EXISTS departments text[],
  ADD COLUMN IF NOT EXISTS process_categories text[],
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS homepage_url text,
  ADD COLUMN IF NOT EXISTS source_urls text[],
  ADD COLUMN IF NOT EXISTS confidence_score smallint,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS needs_review boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS review_reason text,
  ADD COLUMN IF NOT EXISTS likely_triggers text[],
  ADD COLUMN IF NOT EXISTS likely_actions text[],
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS tool_catalog_category_idx ON public.tool_catalog (category);
CREATE INDEX IF NOT EXISTS tool_catalog_needs_review_idx ON public.tool_catalog (needs_review) WHERE needs_review;
CREATE INDEX IF NOT EXISTS tool_catalog_region_gin ON public.tool_catalog USING gin (region_relevance);
CREATE INDEX IF NOT EXISTS tool_catalog_countries_gin ON public.tool_catalog USING gin (countries_relevant);
CREATE INDEX IF NOT EXISTS tool_catalog_departments_gin ON public.tool_catalog USING gin (departments);

ALTER TABLE public.tool_action_catalog
  ADD COLUMN IF NOT EXISTS needs_review boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS review_reason text;

CREATE INDEX IF NOT EXISTS tool_action_catalog_needs_review_idx
  ON public.tool_action_catalog (needs_review) WHERE needs_review;

-- Rename log
CREATE TABLE IF NOT EXISTS public.tool_catalog_rename_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_catalog_id uuid REFERENCES public.tool_catalog(id) ON DELETE SET NULL,
  original_name text NOT NULL,
  original_slug text NOT NULL,
  new_name text NOT NULL,
  new_slug text NOT NULL,
  rule_applied text,
  applied_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tool_catalog_rename_log TO authenticated;
GRANT ALL ON public.tool_catalog_rename_log TO service_role;
ALTER TABLE public.tool_catalog_rename_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rename_log_read_auth" ON public.tool_catalog_rename_log
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "rename_log_admin_write" ON public.tool_catalog_rename_log
  FOR ALL TO authenticated
  USING (public.is_hoi_admin(auth.uid(), ARRAY['owner','admin']))
  WITH CHECK (public.is_hoi_admin(auth.uid(), ARRAY['owner','admin']));

-- Merge log
CREATE TABLE IF NOT EXISTS public.tool_catalog_merge_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id text NOT NULL,
  canonical_slug text NOT NULL,
  canonical_tool_id uuid REFERENCES public.tool_catalog(id) ON DELETE SET NULL,
  merged_slug text NOT NULL,
  merged_tool_id uuid REFERENCES public.tool_catalog(id) ON DELETE SET NULL,
  decision text NOT NULL,
  reason text,
  similarity text,
  member_names text,
  member_categories text,
  merged_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tool_catalog_merge_log TO authenticated;
GRANT ALL ON public.tool_catalog_merge_log TO service_role;
ALTER TABLE public.tool_catalog_merge_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "merge_log_read_auth" ON public.tool_catalog_merge_log
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "merge_log_admin_write" ON public.tool_catalog_merge_log
  FOR ALL TO authenticated
  USING (public.is_hoi_admin(auth.uid(), ARRAY['owner','admin']))
  WITH CHECK (public.is_hoi_admin(auth.uid(), ARRAY['owner','admin']));

-- Action deletion archive
CREATE TABLE IF NOT EXISTS public.tool_action_deleted_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_id uuid,
  tool_slug text NOT NULL,
  tool_name text,
  capability_type text,
  business_action text,
  business_object text,
  business_use_case text,
  action_family text,
  operation_group text,
  source_platform text,
  source_url text,
  confidence_score smallint,
  notes text,
  kept_under_tool_slug text,
  removed_reason text,
  removed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tool_action_deleted_log TO authenticated;
GRANT ALL ON public.tool_action_deleted_log TO service_role;
ALTER TABLE public.tool_action_deleted_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "action_deleted_read_auth" ON public.tool_action_deleted_log
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "action_deleted_admin_write" ON public.tool_action_deleted_log
  FOR ALL TO authenticated
  USING (public.is_hoi_admin(auth.uid(), ARRAY['owner','admin']))
  WITH CHECK (public.is_hoi_admin(auth.uid(), ARRAY['owner','admin']));

-- Triage queue
CREATE TABLE IF NOT EXISTS public.tool_review_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity text NOT NULL CHECK (entity IN ('tool','action','merge_cluster')),
  entity_ref text NOT NULL,
  name_or_action text NOT NULL,
  reason text NOT NULL,
  suggested_phase text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','rejected')),
  payload jsonb,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  resolution_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity, entity_ref, reason)
);
GRANT SELECT ON public.tool_review_queue TO authenticated;
GRANT ALL ON public.tool_review_queue TO service_role;
ALTER TABLE public.tool_review_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "review_queue_read_auth" ON public.tool_review_queue
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "review_queue_admin_write" ON public.tool_review_queue
  FOR ALL TO authenticated
  USING (public.is_hoi_admin(auth.uid(), ARRAY['owner','admin']))
  WITH CHECK (public.is_hoi_admin(auth.uid(), ARRAY['owner','admin']));

CREATE INDEX IF NOT EXISTS tool_review_queue_status_idx ON public.tool_review_queue (status, entity);

-- updated_at triggers
DROP TRIGGER IF EXISTS tool_catalog_set_updated_at ON public.tool_catalog;
CREATE TRIGGER tool_catalog_set_updated_at BEFORE UPDATE ON public.tool_catalog
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tool_review_queue_set_updated_at ON public.tool_review_queue;
CREATE TRIGGER tool_review_queue_set_updated_at BEFORE UPDATE ON public.tool_review_queue
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
