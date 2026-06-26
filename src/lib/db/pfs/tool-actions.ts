import { useQuery } from "@tanstack/react-query";

import { db } from "@/lib/db/pfs/shared";
import type { ToolRole } from "@/lib/process-data";

// Keep an explicit row shape here so tool-action consumers stay decoupled from
// generated Supabase type churn while the catalog import evolves.
export type ToolActionCatalogRow = {
  id: string;
  tool_id: string | null;
  tool_name: string;
  tool_slug: string;
  tool_category: string | null;
  tool_source: string | null;
  tool_description: string | null;
  integration_source: string;
  integration_found: string;
  capability_type: "trigger" | "action" | "search" | "operation_group" | "default_action";
  business_action: string;
  business_object: string;
  action_family: string;
  raw_source_label: string | null;
  operation_group: string | null;
  trigger_event: string | null;
  business_use_case: string | null;
  process_mapping_category: string | null;
  input_data_needed: string | null;
  output_data_created: string | null;
  data_sensitivity: string | null;
  automation_readiness: string | null;
  confidence_level: string | null;
  evidence_url: string | null;
  evidence_notes: string | null;
  needs_manual_review: boolean;
  is_active: boolean;
  created_at: string | null;
};

export type ToolActionFilters = {
  toolSlug?: string | null;
  capabilityType?: "trigger" | "action";
  search?: string;
};

function normalizeSearch(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}

export async function getToolActions(filters: ToolActionFilters = {}) {
  const toolSlug = filters.toolSlug?.trim();
  if (!toolSlug) return [];

  let query = db
    .from("tool_action_catalog")
    .select("*")
    .eq("is_active", true)
    .eq("tool_slug", toolSlug)
    .order("capability_type")
    .order("business_action");

  if (filters.capabilityType) query = query.eq("capability_type", filters.capabilityType);

  const { data, error } = await query;
  if (error) throw error;

  const search = normalizeSearch(filters.search);
  const rows = (data ?? []) as ToolActionCatalogRow[];
  if (!search) return rows;

  return rows.filter((row) =>
    [
      row.business_action,
      row.business_object,
      row.action_family,
      row.operation_group,
      row.business_use_case,
      row.raw_source_label,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(search),
  );
}

export function useToolActions(filters: ToolActionFilters = {}) {
  return useQuery({
    queryKey: ["tool-actions", filters.toolSlug ?? "none", filters.capabilityType ?? "all", filters.search ?? ""],
    queryFn: () => getToolActions(filters),
    enabled: Boolean(filters.toolSlug),
    staleTime: 1000 * 60 * 30,
  });
}

export function groupToolActions(actions: ToolActionCatalogRow[]) {
  return actions.reduce<Record<string, ToolActionCatalogRow[]>>((groups, action) => {
    const key = action.operation_group || action.action_family || "Other actions";
    groups[key] = groups[key] ?? [];
    groups[key].push(action);
    return groups;
  }, {});
}

export function roleFromToolAction(action?: Pick<ToolActionCatalogRow, "action_family" | "business_action"> | null): ToolRole {
  const family = action?.action_family?.toLowerCase() ?? "";
  const label = action?.business_action?.toLowerCase() ?? "";
  if (family === "create" || family === "generate" || /create|generate|draft/.test(label)) return "creates";
  if (family === "store" || /store|archive|save/.test(label)) return "stores";
  if (family === "update" || family === "delete / archive" || /update|mark|move|archive|cancel|close/.test(label)) return "updates";
  if (family === "send" || /send|reply|forward|share|request/.test(label)) return "sends";
  if (family === "receive" || /receive|new .*received|webhook/.test(label)) return "receives";
  if (family === "approve" || /approve|review|sign off/.test(label)) return "approves";
  if (family === "read / retrieve" || family === "search" || /retrieve|search|list|read/.test(label)) return "reads";
  if (family === "export" || /export/.test(label)) return "exports";
  if (family === "notify" || /notify/.test(label)) return "notifies";
  return "custom";
}

export function outputFromToolAction(action: Pick<ToolActionCatalogRow, "business_object" | "output_data_created" | "business_action">) {
  const output = action.output_data_created?.split(",")[0]?.trim();
  if (output) return output;
  if (action.business_object) return `${action.business_object} ${pastTense(action.business_action)}`.trim();
  return "Step completed";
}

function pastTense(label: string) {
  const verb = label.split(" ")[0]?.toLowerCase();
  if (!verb) return "completed";
  if (verb === "send") return "sent";
  if (verb === "receive") return "received";
  if (verb === "create") return "created";
  if (verb === "update") return "updated";
  if (verb === "store") return "stored";
  if (verb === "approve") return "approved";
  if (verb === "notify") return "notified";
  if (verb === "retrieve") return "retrieved";
  if (verb === "search") return "found";
  if (verb === "export") return "exported";
  if (verb === "archive") return "archived";
  return "completed";
}
