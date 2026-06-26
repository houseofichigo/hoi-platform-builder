import { useQuery } from "@tanstack/react-query";

import { asRecord, db, tryGetActiveOrg } from "@/lib/db/pfs/shared";

export type ProcessTemplateRow = {
  id: string;
  workspace_id: string | null;
  name: string;
  slug: string | null;
  category: string;
  process_family: string | null;
  department_hint: string | null;
  internal_external: string | null;
  description: string | null;
  objective: string | null;
  template_json: unknown;
  tags: unknown;
  recommended_tools: unknown;
  kpis: unknown;
  risks: unknown;
  compliance_tags: unknown;
  automation_opportunities: unknown;
  ai_agent_opportunities: unknown;
  variations: unknown;
  source_links: unknown;
  apqc_ref: string | null;
  complexity: string;
  confidence_score: number | null;
  template_version: number | null;
  is_active: boolean;
  created_at: string | null;
  archived_at: string | null;
};

export type ProcessTemplate = {
  id: string;
  slug: string;
  name: string;
  category: string;
  processFamily: string;
  departmentHint: string;
  internalExternal: string;
  description: string;
  objective: string;
  templateJson: Record<string, unknown>;
  tags: string[];
  recommendedTools: string[];
  kpis: string[];
  risks: string[];
  complianceTags: string[];
  automationOpportunities: string[];
  aiAgentOpportunities: string[];
  variations: string[];
  sourceLinks: string[];
  apqcRef: string;
  complexity: string;
  confidenceScore: number;
  templateVersion: number;
  scope: "global" | "company";
};

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function mapTemplate(row: ProcessTemplateRow): ProcessTemplate {
  return {
    id: row.id,
    slug: row.slug ?? row.id,
    name: row.name,
    category: row.category,
    processFamily: row.process_family ?? "",
    departmentHint: row.department_hint ?? "",
    internalExternal: row.internal_external ?? "",
    description: row.description ?? "",
    objective: row.objective ?? "",
    templateJson: asRecord(row.template_json),
    tags: stringArray(row.tags),
    recommendedTools: stringArray(row.recommended_tools),
    kpis: stringArray(row.kpis),
    risks: stringArray(row.risks),
    complianceTags: stringArray(row.compliance_tags),
    automationOpportunities: stringArray(row.automation_opportunities),
    aiAgentOpportunities: stringArray(row.ai_agent_opportunities),
    variations: stringArray(row.variations),
    sourceLinks: stringArray(row.source_links),
    apqcRef: row.apqc_ref ?? "",
    complexity: row.complexity,
    confidenceScore: row.confidence_score ?? 3,
    templateVersion: row.template_version ?? 1,
    scope: row.workspace_id ? "company" : "global",
  };
}

export async function getProcessTemplates() {
  const gate = await tryGetActiveOrg();
  if (!gate) return [];
  const { data, error } = await db
    .from("process_template")
    .select("*")
    .or(`workspace_id.is.null,workspace_id.eq.${gate.workspaceId}`)
    .eq("is_active", true)
    .is("archived_at", null)
    .order("category")
    .order("name");

  if (error) throw error;
  return ((data ?? []) as ProcessTemplateRow[]).map(mapTemplate);
}

export function useProcessTemplates() {
  return useQuery({
    queryKey: ["process-templates"],
    queryFn: getProcessTemplates,
    staleTime: 1000 * 60 * 15,
  });
}

export async function getProcessTemplateBySlug(slug: string): Promise<ProcessTemplate | null> {
  const gate = await tryGetActiveOrg();
  if (!gate) return null;
  const orgFilter = `workspace_id.is.null,workspace_id.eq.${gate.workspaceId}`;

  // 1) Direct slug match
  const direct = await db
    .from("process_template")
    .select("*")
    .or(orgFilter)
    .eq("is_active", true)
    .is("archived_at", null)
    .eq("slug", slug)
    .limit(1)
    .maybeSingle();

  if (direct.error) throw direct.error;
  if (direct.data) return mapTemplate(direct.data as ProcessTemplateRow);

  // 2) Alias lookup. Prefer org-scoped alias over global if both exist.
  const aliasRes = await db
    .from("process_template_alias")
    .select("template_id, workspace_id")
    .or(orgFilter)
    .eq("alias", slug);

  if (aliasRes.error) throw aliasRes.error;
  const aliases = (aliasRes.data ?? []) as Array<{ template_id: string; workspace_id: string | null }>;
  if (aliases.length === 0) return null;

  const preferred =
    aliases.find((a) => a.workspace_id === gate.workspaceId) ?? aliases[0];

  const tpl = await db
    .from("process_template")
    .select("*")
    .eq("id", preferred.template_id)
    .eq("is_active", true)
    .is("archived_at", null)
    .maybeSingle();

  if (tpl.error) throw tpl.error;
  return tpl.data ? mapTemplate(tpl.data as ProcessTemplateRow) : null;
}

export function useProcessTemplateBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["process-template", slug ?? null],
    queryFn: () => getProcessTemplateBySlug(slug as string),
    enabled: typeof slug === "string" && slug.length > 0,
    staleTime: 1000 * 60 * 15,
  });
}
