import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { asRecord, db, requireActiveOrg } from "@/lib/db/pfs/shared";
import type { GovernanceThresholds, RiskTier } from "@/lib/risk-tier";

const QUERY_KEY = ["governance-thresholds"] as const;

function thresholdsFrom(weights: unknown): GovernanceThresholds {
  const w = asRecord(weights);
  const gov = asRecord(w.governance);
  return {
    criticalClassificationMin: (gov.criticalClassificationMin as GovernanceThresholds["criticalClassificationMin"]) ?? "sensitive",
    irreversibleErrorEscalates: gov.irreversibleErrorEscalates !== false,
    auditCadenceDaysByTier: asRecord(gov.auditCadenceDaysByTier) as Partial<Record<RiskTier, number>>,
    requiredApprovalsByTier: asRecord(gov.requiredApprovalsByTier) as Partial<Record<RiskTier, number>>,
  };
}

export function useGovernanceThresholds() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const gate = await requireActiveOrg();
      const { data, error } = await db
        .from("strategic_priority")
        .select("id, metadata")
        .eq("workspace_id", gate.workspaceId)
        .is("archived_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return {
        id: data?.id ?? null,
        thresholds: thresholdsFrom((data as { metadata?: unknown } | null)?.metadata),
      };
    },
  });
}

export function useSaveGovernanceThresholds() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (next: GovernanceThresholds) => {
      const gate = await requireActiveOrg();
      const { data: existing } = await db
        .from("strategic_priority")
        .select("id, metadata")
        .eq("workspace_id", gate.workspaceId)
        .is("archived_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const metadata = {
        ...asRecord((existing as { metadata?: unknown } | null)?.metadata),
        governance: next,
      };
      if (existing?.id) {
        const { error } = await db.from("strategic_priority").update({ metadata }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await db
          .from("strategic_priority")
          .insert({ workspace_id: gate.workspaceId, name: "Governance settings", metadata });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}