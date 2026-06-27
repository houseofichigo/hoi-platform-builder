// @ts-nocheck — Ported PFS module.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { db, requireActiveOrg } from "@/lib/db/pfs/shared";

export type ProcessDecision = "approve" | "request_changes" | "reject" | "start_review";

export type AdminOverview = {
  workspace_id?: string;
  processes?: {
    total?: number;
    draft?: number;
    submitted?: number;
    under_review?: number;
    changes_requested?: number;
    approved?: number;
    awaiting_decision?: number;
  };
  people?: {
    active_members?: number;
    pending_invites?: number;
  };
  departments?: Array<{
    id: string;
    name: string;
    parent_id: string | null;
    headcount_declared: number;
    named: number;
    processes: number;
  }>;
};

export async function getAdminOverview(): Promise<AdminOverview> {
  const gate = await requireActiveOrg();
  const { data, error } = await db.rpc("admin_overview", { p_org_id: gate.workspaceId });
  if (error) throw error;
  return (data ?? {}) as AdminOverview;
}

export async function decideProcess(input: { processId: string; decision: ProcessDecision; note?: string | null }) {
  const { data, error } = await db.rpc("decide_process", {
    p_process_id: input.processId,
    p_decision: input.decision,
    p_note: input.note ?? null,
  });
  if (error) throw error;
  return data;
}

export function useAdminOverview() {
  return useQuery({ queryKey: ["admin-overview"], queryFn: getAdminOverview });
}

export function useDecideProcess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: decideProcess,
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["processes"] }),
        queryClient.invalidateQueries({ queryKey: ["processes", "review-queue"] }),
        queryClient.invalidateQueries({ queryKey: ["process", variables.processId] }),
        queryClient.invalidateQueries({ queryKey: ["department-scores"] }),
        queryClient.invalidateQueries({ queryKey: ["company-score"] }),
        queryClient.invalidateQueries({ queryKey: ["opportunities"] }),
        queryClient.invalidateQueries({ queryKey: ["roadmap"] }),
      ]);
    },
  });
}
