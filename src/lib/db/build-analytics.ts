import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";

export interface BuildOverview {
  workspace_id: string;
  total: number;
  draft: number;
  submitted: number;
  under_review: number;
  changes_requested: number;
  approved: number;
  awaiting_decision: number;
  departments: number;
}

const emptyOverview = (workspaceId: string): BuildOverview => ({
  workspace_id: workspaceId,
  total: 0,
  draft: 0,
  submitted: 0,
  under_review: 0,
  changes_requested: 0,
  approved: 0,
  awaiting_decision: 0,
  departments: 0,
});

function asOverview(value: unknown, workspaceId: string): BuildOverview {
  const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    ...emptyOverview(workspaceId),
    workspace_id: String(row.workspace_id ?? workspaceId),
    total: Number(row.total ?? 0),
    draft: Number(row.draft ?? 0),
    submitted: Number(row.submitted ?? 0),
    under_review: Number(row.under_review ?? 0),
    changes_requested: Number(row.changes_requested ?? 0),
    approved: Number(row.approved ?? 0),
    awaiting_decision: Number(row.awaiting_decision ?? 0),
    departments: Number(row.departments ?? 0),
  };
}

export async function getBuildOverview(workspaceId: string): Promise<BuildOverview> {
  const { data, error } = await supabase.rpc("workspace_build_overview", {
    p_workspace_id: workspaceId,
  } as never);
  if (error) throw error;
  return asOverview(data, workspaceId);
}

export async function decideProcess(processId: string, decision: "approve" | "request_changes" | "reject" | "start_review", note?: string) {
  const { data, error } = await supabase.rpc("decide_process", {
    p_process_id: processId,
    p_decision: decision,
    p_note: note ?? null,
  } as never);
  if (error) throw error;
  return data;
}

export function useBuildOverview() {
  const { workspace } = useWorkspace();
  return useQuery({
    enabled: !!workspace,
    queryKey: ["build-overview", workspace?.id],
    queryFn: () => getBuildOverview(workspace!.id),
  });
}

export function useDecideProcess() {
  const { workspace } = useWorkspace();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { processId: string; decision: "approve" | "request_changes" | "reject" | "start_review"; note?: string }) =>
      decideProcess(input.processId, input.decision, input.note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["build-overview", workspace?.id] });
      queryClient.invalidateQueries({ queryKey: ["processes", workspace?.id] });
    },
  });
}
