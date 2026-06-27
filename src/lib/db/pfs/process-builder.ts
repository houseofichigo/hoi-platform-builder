import { useMutation, useQueryClient } from "@tanstack/react-query";

import { db, requireActiveOrg } from "@/lib/db/pfs/shared";
import { classifyRiskTier } from "@/lib/risk-tier";

export type CreateProcessInput = {
  name: string;
  departmentId: string;
  frame: Record<string, unknown>;
  globalPass: Record<string, unknown>;
  diagram: Record<string, unknown>;
  derivedFromDiagram: Record<string, unknown>;
  derivedData: Record<string, unknown>;
  scores: Record<string, unknown>;
  outputCriticality?: unknown;
  errorReversibility?: unknown;
  steps: Array<{
    nodeId: string;
    label: string;
    kind: string;
    actor: string;
    owner?: string[];
    description?: string;
    toolId: string | null;
    toolRole?: string;
    toolActionId?: string | null;
    toolActionName?: string | null;
    toolActionObject?: string | null;
    toolActionFamily?: string | null;
    automationLevel: number;
    hitl: string;
    inputType: string;
    output: string;
    producesData: boolean;
    dataSourceId: string | null;
    dataProfile: Record<string, unknown> | null;
    dataQuality: string;
    isDataCritical: boolean;
  }>;
};

export async function createSubmittedProcess(input: CreateProcessInput) {
  const gate = await requireActiveOrg();
  const capture = {
    frame: input.frame,
    globalPass: input.globalPass,
    derivedFromDiagram: input.derivedFromDiagram,
    derivedData: input.derivedData,
    dataReadiness: input.derivedData.dataReadiness,
    dataAccessibility: input.derivedData.dataAccessibility,
    dataStructureType: input.derivedData.dataStructureType,
    dataClassification: input.derivedData.dataClassification,
    dataQuality: input.derivedData.dataQuality,
  };
  const riskTier = classifyRiskTier({
    frame: input.frame,
    globalPass: input.globalPass,
    derivedFromDiagram: input.derivedFromDiagram,
    derivedData: input.derivedData,
  });
  const captureWithRisk = {
    ...capture,
    riskTier,
  };

  const { data: process, error: processError } = await db
    .from("process")
    .insert({
      workspace_id: gate.workspaceId,
      department_id: input.departmentId,
      created_by: gate.userId,
      owner_user_id: gate.userId,
      name: input.name,
      status: "draft",
      trigger: String(input.frame.trigger ?? ""),
      output: String(input.frame.output ?? ""),
      frequency: String(input.globalPass.frequency ?? ""),
      diagram: input.diagram,
      capture: captureWithRisk,
      scores: input.scores,
      risk_tier: riskTier.tier,
      governance_flags: {
        provisional: !["low", "standard"].includes(riskTier.tier),
        data_validated: false,
        derived_classification: input.derivedData.dataClassification,
        risk_tier: riskTier.tier,
        risk_reason: riskTier.reason,
        governance_overlay: riskTier.overlay,
        ethics_review_required: riskTier.tier === "critical",
        required_approvals: riskTier.requiredApprovals,
        audit_cadence: riskTier.auditCadence,
      },
    })
    .select("id")
    .single();

  if (processError) throw processError;

  const rows = input.steps.map((step) => ({
    workspace_id: gate.workspaceId,
    process_id: process.id,
    step_order: input.steps.indexOf(step),
    title: step.label,
    description: step.description ?? null,
    node_id: step.nodeId,
    label: step.label,
    kind: step.kind,
    actor: step.actor,
    actor_type: step.actor,
    tool_id: step.toolId,
    tool_name: null,
    input_data: step.inputType,
    output_data: step.output,
    automation_level: step.automationLevel,
    hitl: step.hitl,
    is_checkpoint: ["approval", "decision"].includes(step.kind),
    data_source_id: step.dataSourceId,
    data_profile: step.dataProfile,
    data_quality: step.dataQuality,
    is_data_critical: step.isDataCritical,
    assessment: {
      owner: step.owner ?? [],
      description: step.description ?? "",
      toolRole: step.toolRole ?? "",
      toolActionId: step.toolActionId ?? null,
      toolActionName: step.toolActionName ?? null,
      toolActionObject: step.toolActionObject ?? null,
      toolActionFamily: step.toolActionFamily ?? null,
      inputType: step.inputType,
      output: step.output,
      producesData: step.producesData,
    },
  }));

  if (rows.length > 0) {
    const { error: stepsError } = await db.from("process_step").insert(rows);
    if (stepsError) throw stepsError;
  }

  const { error: submitError } = await db
    .from("process")
    .update({ status: "submitted", submitted_at: new Date().toISOString() })
    .eq("id", process.id)
    .eq("workspace_id", gate.workspaceId);
  if (submitError) throw submitError;

  const exportJson = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    process: {
      id: process.id,
      name: input.name,
      departmentId: input.departmentId,
      status: "submitted",
      trigger: String(input.frame.trigger ?? ""),
      output: String(input.frame.output ?? ""),
      frequency: String(input.globalPass.frequency ?? ""),
    },
    diagram: input.diagram,
    capture: captureWithRisk,
    scores: input.scores,
    riskTier,
    steps: input.steps,
  };

  const { error: exportError } = await db.from("process_export").insert({
    workspace_id: gate.workspaceId,
    process_id: process.id,
    version: 1,
    export_json: exportJson,
    created_by: gate.userId,
  });
  if (exportError && exportError.code !== "42501") throw exportError;

  const { data: processLibraryVault, error: vaultError } = await db
    .from("vault")
    .select("id")
    .eq("workspace_id", gate.workspaceId)
    .eq("vault_key", "process_library")
    .is("archived_at", null)
    .limit(1)
    .maybeSingle();
  if (vaultError) throw vaultError;

  if (processLibraryVault?.id) {
    const { data: existingReference, error: existingReferenceError } = await db
      .from("vault_reference")
      .select("id")
      .eq("workspace_id", gate.workspaceId)
      .eq("vault_id", processLibraryVault.id)
      .eq("entity_type", "process")
      .eq("entity_id", process.id)
      .is("archived_at", null)
      .maybeSingle();
    if (existingReferenceError) throw existingReferenceError;

    const referencePayload = {
      workspace_id: gate.workspaceId,
      vault_id: processLibraryVault.id,
      entity_type: "process",
      entity_id: process.id,
      title: input.name,
      metadata: {
        processExportVersion: 1,
        departmentId: input.departmentId,
        riskTier: riskTier.tier,
        scoreSummary: input.scores,
        referencePolicy: "reference_never_duplicate",
      },
    };
    if (!existingReference) {
      const { error: referenceError } = await db.from("vault_reference").insert(referencePayload);
      if (referenceError && referenceError.code !== "42501") throw referenceError;
    }
  }

  return process.id as string;
}

export function useCreateSubmittedProcess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSubmittedProcess,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["processes"] }),
        queryClient.invalidateQueries({ queryKey: ["processes", "review-queue"] }),
      ]);
    },
  });
}
