// @ts-nocheck — Ported PFS module.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { db, requireActiveOrg, type Row } from "@/lib/db/pfs/shared";
import type { DataAccessibility, DataProfile, DataSensitivity, DataStructure } from "@/lib/process-data";

export type ToolCatalogRow = Row<"tool_catalog"> & {
  default_data_sensitivity?: string | null;
  default_data_structure?: string | null;
  default_data_accessibility?: string | null;
  default_api_available?: boolean | null;
  logo_mirror_key?: string | null;
  description?: string | null;
  website?: string | null;
  domain?: string | null;
  logo_url?: string | null;
  homepage_url?: string | null;
  subcategory?: string | null;
  region_relevance?: string[] | null;
  countries_relevant?: string[] | null;
  departments?: string[] | null;
  common_sme_use_cases?: string[] | null;
  process_categories?: string[] | null;
  likely_triggers?: string[] | null;
  likely_actions?: string[] | null;
  business_criticality_default?: string | null;
  needs_review?: boolean | null;
};
export type ToolRow = Row<"tool">;

export type ToolCatalogFilters = {
  search?: string;
  category?: string;
  triggerOnly?: boolean;
  region?: string;
  department?: string;
};

export const businessToolCategories = [
  "AI",
  "Productivity",
  "Marketing",
  "Communication",
  "Sales & CRM",
  "Content & Files",
  "Analytics & BI",
  "Commerce",
  "Forms & Surveys",
  "Customer Support",
  "Accounting",
  "Payments",
  "Human Resources",
] as const;
export const hiddenDefaultToolCategories = ["Developer Tools", "Other"] as const;

function matchesSearch(row: ToolCatalogRow, search?: string) {
  const query = search?.trim().toLowerCase();
  if (!query) return true;
  return [row.name, row.category, row.slug].some((value) => value.toLowerCase().includes(query));
}

export async function getToolCatalog(filters: ToolCatalogFilters = {}) {
  let query = db
    .from("tool_catalog")
    .select("*")
    .eq("is_active", true)
    .order("category")
    .order("name");

  if (filters.category) query = query.eq("category", filters.category);
  if (filters.triggerOnly) query = query.eq("trigger_capable", true);
  if (filters.region) query = query.contains("region_relevance", [filters.region]);
  if (filters.department) query = query.contains("departments", [filters.department]);

  const { data, error } = await query;
  if (error) throw error;

  return ((data ?? []) as ToolCatalogRow[]).filter((row) => matchesSearch(row, filters.search));
}

export function groupToolCatalog(rows: ToolCatalogRow[]) {
  return rows.reduce<Record<string, ToolCatalogRow[]>>((groups, row) => {
    const category = row.category || "Miscellaneous";
    groups[category] = groups[category] ?? [];
    groups[category].push(row);
    return groups;
  }, {});
}

export function sortToolCatalogCategories(categories: string[]) {
  const preferred = [...businessToolCategories, ...hiddenDefaultToolCategories];
  return [...categories].sort((a, b) => {
    const aIndex = preferred.indexOf(a as any);
    const bIndex = preferred.indexOf(b as any);
    if (aIndex !== -1 || bIndex !== -1) return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    return a.localeCompare(b);
  });
}

export function toolCatalogLogoUrl(
  row?: Pick<ToolCatalogRow, "logo_mirror_key" | "domain" | "website" | "logo_url" | "homepage_url"> | null,
) {
  if (row?.logo_url) return row.logo_url;
  const key = row?.logo_mirror_key?.replace(/^tool-logos\//, "");
  if (key) return supabase.storage.from("tool-logos").getPublicUrl(key).data.publicUrl;

  const token = import.meta.env.VITE_LOVABLE_CONNECTOR_LOGO_DEV_API_KEY as string | undefined;
  if (!token) return "";

  let domain = row?.domain?.trim() || "";
  const homepage = row?.homepage_url || row?.website;
  if (!domain && homepage) {
    try {
      const url = homepage.startsWith("http") ? homepage : `https://${homepage}`;
      domain = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      domain = "";
    }
  }
  if (!domain) return "";
  return `https://img.logo.dev/${encodeURIComponent(domain)}?token=${token}&size=80&format=png&retina=true`;
}

export function catalogProfileDefaults(row?: Partial<ToolCatalogRow> | null): Omit<DataProfile, "source"> | null {
  if (!row) return null;
  const structure = row.default_data_structure;
  const sensitivity = row.default_data_sensitivity;
  const accessibility = row.default_accessibility;
  if (
    (structure === "structured" || structure === "semi_structured" || structure === "unstructured") &&
    (sensitivity === "public" || sensitivity === "internal" || sensitivity === "personal" || sensitivity === "sensitive") &&
    (accessibility === "api_accessible" || accessibility === "export_only" || accessibility === "manual")
  ) {
    return {
      structure: structure as DataStructure,
      sensitivity: sensitivity as DataSensitivity,
      accessibility: accessibility as DataAccessibility,
      ownership: "System owner",
    };
  }
  return null;
}

export function useToolCatalog(filters: ToolCatalogFilters = {}) {
  return useQuery({
    queryKey: [
      "tool-catalog",
      filters.category ?? "all",
      filters.triggerOnly ?? false,
      filters.search ?? "",
      filters.region ?? "any",
      filters.department ?? "any",
    ],
    queryFn: () => getToolCatalog(filters),
    staleTime: 1000 * 60 * 30,
  });
}

export async function ensureOrgToolFromCatalog(catalogId: string) {
  const gate = await requireActiveOrg();

  const { data: existing, error: existingError } = await db
    .from("tool")
    .select("*")
    .eq("workspace_id", gate.workspaceId)
    .eq("catalog_id", catalogId)
    .is("archived_at", null)
    .limit(1)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) return existing as ToolRow;

  const { data: catalog, error: catalogError } = await db
    .from("tool_catalog")
    .select("*")
    .eq("id", catalogId)
    .eq("is_active", true)
    .maybeSingle();
  if (catalogError) throw catalogError;
  if (!catalog) throw new Error("Catalog tool not found.");

  const { data, error } = await db
    .from("tool")
    .insert({
      workspace_id: gate.workspaceId,
      catalog_id: catalog.id,
      name: catalog.name,
      category: catalog.category,
      main_use_case: "",
      data_stored: "",
      integration_status: 3,
      api_available: catalog.default_api_available ?? true,
      criticality: "medium",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as ToolRow;
}

export function useEnsureOrgToolFromCatalog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ensureOrgToolFromCatalog,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tools"] });
    },
  });
}
