import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { db, requireActiveOrg } from "@/lib/db/pfs/shared";
import type { ProposedVault } from "@/lib/vault-derivation";

export type VaultRow = {
  id: string;
  workspace_id: string;
  name: string;
  vault_type: string;
  tier?: number | null;
  vault_key?: string | null;
  isolation: string;
  source_department_id: string | null;
  source_client_id: string | null;
  audience_id: string | null;
  audience?: string | null;
  jurisdiction: string | null;
  residency?: string | null;
  owner?: string | null;
  purpose?: string | null;
  sensitivity_ceiling?: string | null;
  references_vault_ids: unknown;
  vault_references?: unknown;
  agent_constitution?: unknown;
  knowledge_config?: unknown;
  routing_rules?: unknown;
  core_context?: unknown;
  is_readonly: boolean;
  status: string;
  created_at: string | null;
  archived_at: string | null;
};

const proposedVaultSchema = z.object({
  key: z.string(),
  name: z.string().trim().min(1),
  vaultType: z.enum([
    "company",
    "company_core",
    "department",
    "client",
    "training",
    "process_library",
    "operating_model",
    "data_dictionary",
    "tool_stack",
    "compliance",
    "risk_control",
    "templates_playbooks",
    "market_intelligence",
    "performance_analytics",
    "external_contracts",
  ]),
  tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  vaultKey: z.string(),
  isolation: z.enum(["shared", "confidential", "scoped", "read_only", "internal"]),
  sourceDepartmentId: z.string().optional(),
  sourceClientId: z.string().optional(),
  audienceId: z.string().optional(),
  audience: z.string().optional(),
  jurisdiction: z.string().optional(),
  residency: z.string().optional(),
  owner: z.string().optional(),
  purpose: z.string(),
  sensitivityCeiling: z.enum(["public", "internal", "confidential", "personal", "sensitive"]),
  referenceKeys: z.array(z.string()).default([]),
  references: z.array(z.record(z.string(), z.unknown())).default([]),
  isReadonly: z.boolean().default(false),
  persistenceStatus: z.enum(["confirmed", "active", "dormant"]).default("confirmed"),
  agentConstitution: z.record(z.string(), z.unknown()).default({}),
  knowledgeConfig: z.record(z.string(), z.unknown()).default({}),
  routingRules: z.record(z.string(), z.unknown()).default({}),
  required: z.boolean().default(false),
  enabled: z.boolean().default(true),
});

export async function listVaults() {
  const gate = await requireActiveOrg();
  const { data, error } = await db
    .from("vault")
    .select("*")
    .eq("workspace_id", gate.workspaceId)
    .is("archived_at", null)
    .order("vault_type")
    .order("name");
  if (error) throw error;
  return (data ?? []) as VaultRow[];
}

export async function persistVaults(proposed: ProposedVault[]) {
  const gate = await requireActiveOrg();
  const enabled = proposed
    .map((vault) => proposedVaultSchema.parse(vault))
    .filter((vault) => vault.enabled);

  const { error: archiveError } = await db
    .from("vault")
    .update({ archived_at: new Date().toISOString() })
    .eq("workspace_id", gate.workspaceId)
    .is("archived_at", null);
  if (archiveError) throw archiveError;

  const insertedByKey = new Map<string, string>();
  for (const vault of enabled) {
    const { data, error } = await db
      .from("vault")
      .insert({
        workspace_id: gate.workspaceId,
        name: vault.name,
        vault_type: vault.vaultType,
        tier: vault.tier,
        vault_key: vault.vaultKey,
        isolation: vault.isolation,
        source_department_id: vault.sourceDepartmentId ?? null,
        source_client_id: vault.sourceClientId ?? null,
        audience_id: vault.audienceId ?? null,
        audience: vault.audience ?? null,
        jurisdiction: vault.jurisdiction ?? null,
        residency: vault.residency ?? null,
        owner: vault.owner ?? null,
        purpose: vault.purpose,
        sensitivity_ceiling: vault.sensitivityCeiling,
        references_vault_ids: [],
        vault_references: vault.references,
        agent_constitution: vault.agentConstitution,
        knowledge_config: vault.knowledgeConfig,
        routing_rules: vault.routingRules,
        is_readonly: vault.isReadonly,
        status: vault.persistenceStatus,
      })
      .select("id")
      .single();
    if (error) throw error;
    insertedByKey.set(vault.key, data.id);
  }

  for (const vault of enabled) {
    const id = insertedByKey.get(vault.key);
    if (!id) continue;
    const referenceIds = vault.referenceKeys.map((key) => insertedByKey.get(key)).filter(Boolean);
    if (!referenceIds.length) continue;
    const { error } = await db.from("vault").update({ references_vault_ids: referenceIds }).eq("id", id);
    if (error) throw error;
  }

  let seededCoreContext: Record<string, unknown> | null = null;
  const companyCoreId = insertedByKey.get("company_core");
  if (companyCoreId) {
    const [{ data: profile }, { data: readiness }] = await Promise.all([
      db
        .from("company_profile")
        .select("overview, mission, value_proposition, primary_jurisdiction, regulatory_regimes, is_regulated, sells_training")
        .eq("workspace_id", gate.workspaceId)
        .is("archived_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      db
        .from("readiness_assessment")
        .select("*")
        .eq("workspace_id", gate.workspaceId)
        .maybeSingle(),
    ]);
    const coreContext = {
      companyCoreSeededAt: new Date().toISOString(),
      companyFacts: {
        overview: profile?.overview ?? null,
        mission: profile?.mission ?? null,
        valueProposition: profile?.value_proposition ?? null,
        primaryJurisdiction: profile?.primary_jurisdiction ?? null,
        regulatoryRegimes: profile?.regulatory_regimes ?? [],
        isRegulated: profile?.is_regulated ?? false,
        sellsTraining: profile?.sells_training ?? false,
      },
      readiness: readiness
        ? {
            operatingModel: readiness.decision_authority,
            hasAiOwner: readiness.has_ai_owner,
            literacyPosture: readiness.literacy_coverage,
            deliveryPosture: readiness.delivery_posture,
            governanceBody: readiness.governance_body,
            riskRegister: readiness.risk_register,
            canonicalKnowledgeOwnerUserId: readiness.canonical_knowledge_owner_user_id,
            organizationStage: readiness.organization_stage,
            organizationScore: readiness.organization_score,
            cultureStage: readiness.culture_stage,
            cultureScore: readiness.culture_score,
            provenance: "self_reported",
          }
        : null,
    };
    seededCoreContext = coreContext;
    const { error } = await db.from("vault").update({ core_context: coreContext }).eq("id", companyCoreId);
    if (error) throw error;
  }

  const companyId = insertedByKey.get("company");
  if (companyId && companyId !== companyCoreId && seededCoreContext) {
    const { error } = await db.from("vault").update({ core_context: seededCoreContext }).eq("id", companyId);
    if (error) throw error;
  }
}

export function useVaults() {
  return useQuery({ queryKey: ["vaults"], queryFn: listVaults });
}

export function usePersistVaults() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: persistVaults,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["vaults"] }),
        queryClient.invalidateQueries({ queryKey: ["company-onboarding"] }),
      ]);
    },
  });
}
