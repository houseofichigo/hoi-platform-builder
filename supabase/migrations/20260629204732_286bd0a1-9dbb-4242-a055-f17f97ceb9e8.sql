
CREATE TABLE IF NOT EXISTS public.stg_tool_catalog_cleaned (
  name text, clean_slug text, category text, subcategory text,
  region_relevance text, countries_relevant text, description text,
  common_sme_use_cases text, trigger_capable text, likely_triggers text,
  likely_actions text, default_data_structure text, default_data_sensitivity text,
  default_accessibility text, default_api_available text,
  business_criticality_default text, departments text, process_categories text,
  logo_url text, homepage_url text, source_urls text, confidence_score text,
  notes text
);
CREATE TABLE IF NOT EXISTS public.stg_tool_action_catalog_cleaned (
  tool_name text, tool_slug text, capability_type text, business_action text,
  business_object text, business_use_case text, action_family text,
  operation_group text, is_trigger text, source_platform text, source_url text,
  confidence_score text, notes text
);
CREATE TABLE IF NOT EXISTS public.stg_deleted_duplicate_actions (
  tool_name text, tool_slug text, capability_type text, business_action text,
  business_object text, business_use_case text, action_family text,
  operation_group text, is_trigger text, source_platform text, source_url text,
  confidence_score text, notes text, kept_under_tool_slug text,
  kept_confidence_score text, removed_reason text
);
CREATE TABLE IF NOT EXISTS public.stg_name_normalization (
  id uuid, original_name text, original_slug text, new_name text, new_slug text, rule_applied text
);
CREATE TABLE IF NOT EXISTS public.stg_proposed_merges (
  cluster_id text, canonical_name text, member_names text, member_slugs text,
  member_categories text, similarity text, decision text, reason text
);
CREATE TABLE IF NOT EXISTS public.stg_manual_review_queue (
  entity text, name_or_action text, reason text, suggested_phase text
);
CREATE TABLE IF NOT EXISTS public.stg_category_mapping (
  source_category text, brief_category text, tool_count text, status text
);

GRANT ALL ON 
  public.stg_tool_catalog_cleaned,
  public.stg_tool_action_catalog_cleaned,
  public.stg_deleted_duplicate_actions,
  public.stg_name_normalization,
  public.stg_proposed_merges,
  public.stg_manual_review_queue,
  public.stg_category_mapping
TO service_role;
ALTER TABLE public.stg_tool_catalog_cleaned ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stg_tool_action_catalog_cleaned ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stg_deleted_duplicate_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stg_name_normalization ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stg_proposed_merges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stg_manual_review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stg_category_mapping ENABLE ROW LEVEL SECURITY;
