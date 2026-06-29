import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";

const db = supabase as any;

export type ProcessStatus = "draft" | "submitted" | "under_review" | "changes_requested" | "approved" | "merged" | "archived";

export interface ProcessStep {
  id: string;
  workspaceId: string;
  processId: string;
  stepOrder: number;
  title: string;
  description: string | null;
  actorType: string | null;
  actorMemberId: string | null;
  departmentId: string | null;
  toolName: string | null;
  inputData: string | null;
  outputData: string | null;
  riskNotes: string | null;
  metadata: Record<string, unknown>;
}

export interface ProcessListItem {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  departmentId: string | null;
  departmentName: string | null;
  status: ProcessStatus;
  ownerMemberId: string | null;
  createdBy: string;
  submittedAt: string | null;
  approvedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  capture: Record<string, unknown>;
  scores: Record<string, unknown>;
  riskTier: string | null;
  stepCount: number;
  steps: ProcessStep[];
}

export interface ProcessWriteInput {
  id?: string;
  name: string;
  description?: string | null;
  departmentId?: string | null;
  ownerMemberId?: string | null;
  status?: ProcessStatus;
  capture?: Record<string, unknown>;
}

export interface ProcessStepInput {
  id?: string;
  stepOrder: number;
  title: string;
  description?: string | null;
  actorType?: string | null;
  actorMemberId?: string | null;
  departmentId?: string | null;
  toolName?: string | null;
  inputData?: string | null;
  outputData?: string | null;
  riskNotes?: string | null;
  metadata?: Record<string, unknown>;
}

function mapStep(row: any): ProcessStep {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    processId: row.process_id,
    stepOrder: row.step_order ?? 0,
    title: row.title,
    description: row.description ?? null,
    actorType: row.actor_type ?? null,
    actorMemberId: row.actor_member_id ?? null,
    departmentId: row.department_id ?? null,
    toolName: row.tool_name ?? null,
    inputData: row.input_data ?? null,
    outputData: row.output_data ?? null,
    riskNotes: row.risk_notes ?? null,
    metadata: row.metadata ?? {},
  };
}

function mapProcess(row: any): ProcessListItem {
  const steps = (row.process_step ?? []).map(mapStep).sort((a: ProcessStep, b: ProcessStep) => a.stepOrder - b.stepOrder);
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    description: row.description ?? null,
    departmentId: row.department_id ?? null,
    departmentName: row.department?.name ?? null,
    status: row.status,
    ownerMemberId: row.owner_member_id ?? null,
    createdBy: row.created_by,
    submittedAt: row.submitted_at ?? null,
    approvedAt: row.approved_at ?? null,
    archivedAt: row.archived_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    capture: row.capture ?? {},
    scores: row.scores ?? {},
    riskTier: row.risk_tier ?? null,
    stepCount: steps.length,
    steps,
  };
}

export async function fetchProcesses(workspaceId: string): Promise<ProcessListItem[]> {
  const { data, error } = await db
    .from("process")
    .select("*, department(name), process_step(*)")
    .eq("workspace_id", workspaceId)
    .is("archived_at", null)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapProcess);
}

export async function fetchProcess(workspaceId: string, processId: string): Promise<ProcessListItem | null> {
  const { data, error } = await db
    .from("process")
    .select("*, department(name), process_step(*)")
    .eq("workspace_id", workspaceId)
    .eq("id", processId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProcess(data) : null;
}

async function currentMemberId(workspaceId: string, userId: string) {
  const { data, error } = await db
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

export async function saveProcess(workspaceId: string, userId: string, input: ProcessWriteInput) {
  const ownerMemberId = input.ownerMemberId ?? (await currentMemberId(workspaceId, userId));
  const payload = {
    workspace_id: workspaceId,
    name: input.name.trim(),
    description: input.description?.trim() || null,
    department_id: input.departmentId ?? null,
    owner_member_id: ownerMemberId,
    created_by: userId,
    status: input.status ?? "draft",
    capture: input.capture ?? {},
  };

  const result = input.id
    ? await db
        .from("process")
        .update({
          name: payload.name,
          description: payload.description,
          department_id: payload.department_id,
          owner_member_id: payload.owner_member_id,
          status: payload.status,
          capture: payload.capture,
          submitted_at: payload.status === "submitted" ? new Date().toISOString() : undefined,
        })
        .eq("workspace_id", workspaceId)
        .eq("id", input.id)
        .select("*")
        .single()
    : await db.from("process").insert(payload).select("*").single();

  if (result.error) throw result.error;
  return result.data;
}

export async function saveProcessSteps(workspaceId: string, processId: string, steps: ProcessStepInput[]) {
  const { error: deleteError } = await db.from("process_step").delete().eq("workspace_id", workspaceId).eq("process_id", processId);
  if (deleteError) throw deleteError;
  if (!steps.length) return [];

  const payload = steps.map((step) => ({
    workspace_id: workspaceId,
    process_id: processId,
    step_order: step.stepOrder,
    title: step.title.trim(),
    description: step.description?.trim() || null,
    actor_type: step.actorType?.trim() || null,
    actor_member_id: step.actorMemberId ?? null,
    department_id: step.departmentId ?? null,
    tool_name: step.toolName?.trim() || null,
    input_data: step.inputData?.trim() || null,
    output_data: step.outputData?.trim() || null,
    risk_notes: step.riskNotes?.trim() || null,
    metadata: step.metadata ?? {},
  }));

  const { data, error } = await db.from("process_step").insert(payload).select("*");
  if (error) throw error;
  return data ?? [];
}

export async function submitProcess(workspaceId: string, processId: string) {
  const { data, error } = await db
    .from("process")
    .update({ status: "submitted", submitted_at: new Date().toISOString() })
    .eq("workspace_id", workspaceId)
    .eq("id", processId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function archiveProcess(workspaceId: string, processId: string) {
  const { error } = await db
    .from("process")
    .update({ status: "archived", archived_at: new Date().toISOString() })
    .eq("workspace_id", workspaceId)
    .eq("id", processId);
  if (error) throw error;
}

export function useProcesses() {
  const { workspace } = useWorkspace();
  return useQuery({
    enabled: !!workspace,
    queryKey: ["processes", workspace?.id],
    queryFn: () => fetchProcesses(workspace!.id),
  });
}

export function useSaveProcess() {
  const { workspace } = useWorkspace();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProcessWriteInput & { steps?: ProcessStepInput[] }) =>
      saveProcess(workspace!.id, user!.id, input).then(async (process) => {
        if (input.steps) await saveProcessSteps(workspace!.id, process.id, input.steps);
        return process;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processes", workspace?.id] });
      queryClient.invalidateQueries({ queryKey: ["build-overview", workspace?.id] });
    },
  });
}

export function useSubmitProcess() {
  const { workspace } = useWorkspace();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (processId: string) => submitProcess(workspace!.id, processId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processes", workspace?.id] });
      queryClient.invalidateQueries({ queryKey: ["build-overview", workspace?.id] });
    },
  });
}

export function useArchiveProcess() {
  const { workspace } = useWorkspace();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (processId: string) => archiveProcess(workspace!.id, processId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processes", workspace?.id] });
      queryClient.invalidateQueries({ queryKey: ["build-overview", workspace?.id] });
    },
  });
}
