// @ts-nocheck
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { db, requireActiveOrg, type Row } from "@/lib/db/pfs/shared";
import type { DataAccessibility, DataProfile, DataSensitivity, DataStructure } from "@/lib/process-data";

export type ToolCatalogRow = Row<"tool_catalog">;
export type ToolRow = Row<"tool">;

export type ToolCatalogFilters = {
  search?: string;
  category?: string;
  triggerOnly?: boolean;
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

export function toolCatalogLogoUrl(row?: Pick<ToolCatalogRow, "logo_mirror_key"> | null) {
  const key = row?.logo_mirror_key?.replace(/^tool-logos\//, "");
  if (!key) return "";
  return supabase.storage.from("tool-logos").getPublicUrl(key).data.publicUrl;
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
    queryKey: ["tool-catalog", filters.category ?? "all", filters.triggerOnly ?? false, filters.search ?? ""],
    queryFn: () => getToolCatalog(filters),
    staleTime: 1000 * 60 * 30,
  });
}

export async function ensureOrgToolFromCatalog(catalogId: string) {
  const gate = await requireActiveOrg();

  const { data: existing, error: existingError } = await db
    .from("tool")
    .select("*")
    .eq("organization_id", gate.organizationId)
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
      organization_id: gate.organizationId,
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
