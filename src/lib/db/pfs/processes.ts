import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { Priority, ProcessRecord, ProcessStatus, RiskTier } from "@/lib/process-data";
import { asRecord, db, numberFrom, requireActiveOrg, stringFrom, type Row } from "@/lib/db/pfs/shared";
import { classifyRiskTier, classifyRiskTierFromCapture } from "@/lib/risk-tier";
import { rankProcessOpportunity, scoreProcess, type ProcessScoreResult } from "@/lib/scoring/process-score";

type ProcessRow = Row<"process"> & {
  department?: { name?: string | null } | null;
  process_step?: Array<{ id: string }> | null;
};

export type ProcessListItem = {
  row: ProcessRow;
  record: ProcessRecord;
  stepCount: number;
  createdAt: string;
  riskTier: RiskTier | null;
};

const statusLabel: Record<string, ProcessStatus> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under review",
  changes_requested: "Under review",
  approved: "Approved",
  merged: "Approved",
  archived: "Draft",
};

function priorityFrom(score: number): Priority {
  if (score >= 75) return "High";
  if (score >= 50) return "Medium";
  return "Low";
}

function priorityToDb(priority: Priority) {
  return priority.toLowerCase() as "high" | "medium" | "low";
}

export function processToRecord(row: ProcessRow): ProcessRecord {
  const scores = asRecord(row.scores);
  const capture = asRecord(row.capture);
  const roi = asRecord(capture.roi);
  const derivedData = asRecord(capture.derivedData);
  const objective = asRecord(capture.objective);
  const risk = asRecord(capture.riskTier);
  const computedRisk = classifyRiskTierFromCapture(capture);

  const maturity = numberFrom(scores.maturity ?? scores.maturityScore ?? scores.overall, 0);
  const automationValue = numberFrom(scores.automation ?? scores.automationValue ?? scores.automation_score, 0);
  const aiReadiness = numberFrom(scores.ai ?? scores.aiReadiness ?? scores.ai_score, 0);
  const dataReadiness = numberFrom(
    derivedData.dataReadiness ?? scores.data ?? scores.dataReadiness ?? scores.data_score,
    0,
  );
  const impact = numberFrom(scores.impact ?? roi.impact, Math.max(automationValue, maturity));
  const readiness = numberFrom(scores.readiness ?? roi.readiness, Math.round((maturity + dataReadiness) / 2));

  return {
    id: row.id,
    name: row.name,
    department: row.department?.name ?? "Unassigned department",
    owner: (row as any).owner_user_id ?? (row as any).owner_member_id ?? row.created_by,
    status: statusLabel[row.status] ?? "Draft",
    maturity,
    automationValue,
    aiReadiness,
    dataReadiness,
    effortSavings: numberFrom(roi.effortSavings ?? scores.effortSavings, 0),
    ebitdaImpact: numberFrom(roi.ebitdaImpact ?? scores.ebitdaImpact, 0),
    errorReduction: numberFrom(roi.errorReduction ?? scores.errorReduction, 0),
    dataValue: numberFrom(scores.dataValue ?? dataReadiness, dataReadiness),
    priority: (scores.priorityBand as Priority | undefined) ?? priorityFrom(numberFrom(scores.priorityScore ?? impact, impact)),
    frequencyWeight: numberFrom(capture.frequencyWeight ?? objective.frequencyWeight, 1),
    strategicAlignment: numberFrom(capture.strategicAlignment ?? scores.strategicAlignment, 50),
    impact,
    readiness,
    riskTier: (row.risk_tier ?? (risk.tier as RiskTier | undefined) ?? computedRisk.tier) as RiskTier,
    riskReason: stringFrom(risk.reason, computedRisk.reason),
    dataValidated: Boolean(asRecord((row as any).governance_flags).data_validated),
  };
}

function frequencyWeight(frequency: unknown) {
  switch (String(frequency ?? "").toLowerCase()) {
    case "daily":
      return 5;
    case "weekly":
      return 1;
    case "monthly":
      return 0.25;
    case "quarterly":
      return 0.08;
    default:
      return 1;
  }
}

function scoreFromProcess(row: Pick<ProcessRow, "capture" | "scores">): ProcessScoreResult {
  const capture = asRecord(row.capture);
  const scores = asRecord(row.scores);
  const fallback = scoreProcess({
    derivedFromDiagram: asRecord(capture.derivedFromDiagram),
    derivedData: asRecord(capture.derivedData),
    globalPass: asRecord(capture.globalPass),
    strategicAlignment: numberFrom(scores.strategicAlignment ?? capture.strategicAlignment, 50),
  });

  return {
    ...fallback,
    ...scores,
    maturity: numberFrom(scores.maturity, fallback.maturity),
    automationValue: numberFrom(scores.automationValue, fallback.automationValue),
    aiReadiness: numberFrom(scores.aiReadiness, fallback.aiReadiness),
    dataReadiness: numberFrom(scores.dataReadiness, fallback.dataReadiness),
    dataValue: numberFrom(scores.dataValue, fallback.dataValue),
    impact: numberFrom(scores.impact, fallback.impact),
    readiness: numberFrom(scores.readiness, fallback.readiness),
    effortSavings: numberFrom(scores.effortSavings, fallback.effortSavings),
    ebitdaImpact: numberFrom(scores.ebitdaImpact, fallback.ebitdaImpact),
    errorReduction: numberFrom(scores.errorReduction, fallback.errorReduction),
    priorityScore: numberFrom(scores.priorityScore, fallback.priorityScore),
    priorityBand: (scores.priorityBand as Priority | undefined) ?? fallback.priorityBand,
    confidence: (scores.confidence as ProcessScoreResult["confidence"] | undefined) ?? fallback.confidence,
    strategicAlignment: numberFrom(scores.strategicAlignment, fallback.strategicAlignment),
  };
}

function confidenceFrom(count: number, pctApproved: number) {
  if (count >= 8 && pctApproved >= 70) return "High confidence";
  if (count >= 4 && pctApproved >= 45) return "Provisional";
  return "Low coverage";
}

function weightedAverage<T extends keyof Pick<ProcessScoreResult, "maturity" | "automationValue" | "aiReadiness" | "dataReadiness">>(
  rows: Array<{ score: ProcessScoreResult; weight: number }>,
  key: T,
) {
  const total = rows.reduce((sum, row) => sum + row.weight, 0);
  if (total <= 0) return 0;
  return Math.round(rows.reduce((sum, row) => sum + Number(row.score[key]) * row.weight, 0) / total);
}

function weightForProcess(row: ProcessRow, score: ProcessScoreResult) {
  const capture = asRecord(row.capture);
  const globalPass = asRecord(capture.globalPass);
  return Math.max(1, frequencyWeight(globalPass.frequency) * Math.max(1, numberFrom(globalPass.volume, 1)) * Math.max(0.5, score.strategicAlignment / 100));
}

async function createOrUpdateOpportunityAndRoadmap(process: ProcessRow) {
  const score = scoreFromProcess(process);
  const rank = rankProcessOpportunity({
    impact: score.impact,
    readiness: score.readiness,
    strategicAlignment: score.strategicAlignment,
    value: Math.min(100, score.effortSavings * 3 + score.ebitdaImpact / 5000 + score.dataValue * 0.25),
    riskPenalty: process.risk_tier === "critical" ? 8 : process.risk_tier === "elevated" ? 3 : 0,
  });
  const roi = {
    effortSavings: score.effortSavings,
    ebitdaImpact: score.ebitdaImpact,
    errorReduction: score.errorReduction,
    dataValue: score.dataValue,
    priorityScore: rank.priorityScore,
    confidence: score.confidence,
    rationale: rank.rationale,
  };
  const problem = `${process.name} has measurable automation and data-readiness improvement potential.`;
  const recommendedSolution = `Prioritize "${process.name}" as a ${rank.priorityBand.toLowerCase()}-priority improvement candidate.`;

  const { data: existingOpportunity, error: opportunityFetchError } = await db
    .from("opportunity")
    .select("id")
    .eq("workspace_id", process.workspace_id)
    .eq("process_id", process.id)
    .is("archived_at", null)
    .maybeSingle();
  if (opportunityFetchError) throw opportunityFetchError;

  const opportunityPayload = {
    workspace_id: process.workspace_id,
    process_id: process.id,
    department_id: process.department_id,
    type: "automation",
    problem,
    recommended_solution: recommendedSolution,
    roi,
    effort: score.readiness >= 70 ? "low" : score.readiness >= 45 ? "medium" : "high",
    strategic_alignment: score.strategicAlignment,
    status: "accepted",
  };

  const opportunityResult = existingOpportunity?.id
    ? await db.from("opportunity").update(opportunityPayload).eq("id", existingOpportunity.id).select("id").single()
    : await db.from("opportunity").insert(opportunityPayload).select("id").single();
  if (opportunityResult.error) throw opportunityResult.error;

  const opportunityId = opportunityResult.data.id;
  const { data: existingRoadmap, error: roadmapFetchError } = await db
    .from("roadmap_item")
    .select("id")
    .eq("workspace_id", process.workspace_id)
    .eq("opportunity_id", opportunityId)
    .is("archived_at", null)
    .maybeSingle();
  if (roadmapFetchError) throw roadmapFetchError;

  const roadmapPayload = {
    workspace_id: process.workspace_id,
    opportunity_id: opportunityId,
    name: process.risk_tier === "critical" ? `${process.name} + governance track` : process.name,
    category: process.risk_tier === "critical" ? "governance" : score.readiness >= 70 ? "quick_win" : "automation",
    owner_user_id: process.owner_user_id ?? process.created_by,
    priority: priorityToDb(rank.priorityBand),
    timeline: rank.priorityBand === "High" ? "Now" : rank.priorityBand === "Medium" ? "Next" : "Later",
    effort: Math.max(1, 100 - score.readiness),
    impact: rank.priorityScore,
    status: "planned",
    dependencies: process.risk_tier === "critical" ? ["Governance approval required"] : [],
  };

  const roadmapResult = existingRoadmap?.id
    ? await db.from("roadmap_item").update(roadmapPayload).eq("id", existingRoadmap.id)
    : await db.from("roadmap_item").insert(roadmapPayload);
  if (roadmapResult.error) throw roadmapResult.error;
}

export async function recomputeOrgScores(workspaceId: string) {
  const { data: allProcesses, error: allError } = await db
    .from("process")
    .select("id, workspace_id, department_id, status, capture, scores, risk_tier")
    .eq("workspace_id", workspaceId)
    .is("archived_at", null);
  if (allError) throw allError;

  const approved = ((allProcesses ?? []) as ProcessRow[]).filter((process) => ["approved", "merged"].includes(process.status));
  const pctApproved = allProcesses?.length ? Math.round((approved.length / allProcesses.length) * 100) : 0;
  const scoredRows = approved.map((process) => {
    const score = scoreFromProcess(process);
    return { process, score, weight: weightForProcess(process, score) };
  });

  const byDepartment = new Map<string, typeof scoredRows>();
  scoredRows.forEach((row) => {
    if (!row.process.department_id) return;
    const current = byDepartment.get(row.process.department_id) ?? [];
    current.push(row);
    byDepartment.set(row.process.department_id, current);
  });

  const departmentWrites = await Promise.all(
    [...byDepartment.entries()].map(([departmentId, rows]) =>
      db.from("department_score").insert({
        workspace_id: workspaceId,
        department_id: departmentId,
        maturity_score: weightedAverage(rows, "maturity"),
        automation_score: weightedAverage(rows, "automationValue"),
        ai_score: weightedAverage(rows, "aiReadiness"),
        data_score: weightedAverage(rows, "dataReadiness"),
        n_processes: rows.length,
        pct_approved: pctApproved,
        confidence: confidenceFrom(rows.length, pctApproved),
      }),
    ),
  );
  const departmentError = departmentWrites.find((result) => result.error)?.error;
  if (departmentError) throw departmentError;

  if (scoredRows.length > 0) {
    const { error } = await db.from("company_score").insert({
      workspace_id: workspaceId,
      maturity_score: weightedAverage(scoredRows, "maturity"),
      automation_score: weightedAverage(scoredRows, "automationValue"),
      ai_score: weightedAverage(scoredRows, "aiReadiness"),
      data_score: weightedAverage(scoredRows, "dataReadiness"),
      n_processes: scoredRows.length,
      pct_approved: pctApproved,
      confidence: confidenceFrom(scoredRows.length, pctApproved),
    });
    if (error) throw error;
  }
}

async function fetchProcesses(statuses?: string[]): Promise<ProcessListItem[]> {
  const gate = await requireActiveOrg();
  let query = db
    .from("process")
    .select("*, department:department_id(name), process_step(id)")
    .eq("workspace_id", gate.workspaceId)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (statuses?.length) query = query.in("status", statuses);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row: ProcessRow) => ({
    row,
    record: processToRecord(row),
    stepCount: row.process_step?.length ?? 0,
    createdAt: stringFrom(row.created_at),
    riskTier: ((row as ProcessRow & { risk_tier?: RiskTier | null }).risk_tier ?? null) as RiskTier | null,
  }));
}

export function useProcesses() {
  return useQuery({
    queryKey: ["processes"],
    queryFn: () => fetchProcesses(),
  });
}

export function useReviewQueue() {
  return useQuery({
    queryKey: ["processes", "review-queue"],
    queryFn: () => fetchProcesses(["submitted", "under_review", "changes_requested"]),
  });
}

export function useProcess(id: string) {
  return useQuery({
    queryKey: ["process", id],
    queryFn: async () => {
      const gate = await requireActiveOrg();
      const { data, error } = await db
        .from("process")
        .select("*, department:department_id(name), process_step(*)")
        .eq("workspace_id", gate.workspaceId)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Process not found.");
      return {
        row: data as ProcessRow,
        record: processToRecord(data as ProcessRow),
        steps: (data.process_step ?? []) as Array<Row<"process_step">>,
      };
    },
  });
}

type StepValidationUpdate = {
  id: string;
  dataProfile: Record<string, unknown>;
  dataQuality: string;
  isDataCritical: boolean;
  dataSourceId: string | null;
  label: string;
};

const accessibilityRank = { api_accessible: 3, export_only: 2, manual: 1 } as Record<string, number>;
const structureRank = { structured: 3, semi_structured: 2, unstructured: 1 } as Record<string, number>;
const sensitivityRank = { public: 1, internal: 2, personal: 3, sensitive: 4 } as Record<string, number>;
const qualityRank = { trusted: 3, needs_checking: 2, unreliable: 1, not_assessed: 0 } as Record<string, number>;

function weakest(values: string[], rank: Record<string, number>) {
  return values.reduce((current, value) => (rank[value] < rank[current] ? value : current), values[0]);
}

function strongest(values: string[], rank: Record<string, number>) {
  return values.reduce((current, value) => (rank[value] > rank[current] ? value : current), values[0]);
}

function derivedDataFromValidatedSteps(steps: StepValidationUpdate[]) {
  const evidence = steps.map((step) => {
    const profile = asRecord(step.dataProfile);
    return {
      nodeId: step.id,
      label: step.label,
      dataSourceId: step.dataSourceId ?? undefined,
      accessibility: String(profile.accessibility ?? "manual"),
      structure: String(profile.structure ?? "unstructured"),
      sensitivity: String(profile.sensitivity ?? "internal"),
      dataQuality: step.isDataCritical ? step.dataQuality : "not_assessed",
      isDataCritical: step.isDataCritical,
    };
  });
  const scopedEvidence = evidence.length ? evidence : [{
    nodeId: "none",
    label: "No steps",
    accessibility: "manual",
    structure: "unstructured",
    sensitivity: "internal",
    dataQuality: "needs_checking",
    isDataCritical: true,
  }];
  const dataAccessibility = weakest(scopedEvidence.map((item) => item.accessibility), accessibilityRank);
  const dataStructureType = weakest(scopedEvidence.map((item) => item.structure), structureRank);
  const dataClassification = strongest(scopedEvidence.map((item) => item.sensitivity), sensitivityRank);
  const criticalQualities = scopedEvidence
    .filter((item) => item.isDataCritical)
    .map((item) => (item.dataQuality === "not_assessed" ? "needs_checking" : item.dataQuality));
  const dataQuality = weakest(criticalQualities.length ? criticalQualities : ["needs_checking"], qualityRank);
  const dataReadiness = Math.min(
    { api_accessible: 95, export_only: 65, manual: 35 }[dataAccessibility] ?? 35,
    { structured: 95, semi_structured: 70, unstructured: 40 }[dataStructureType] ?? 40,
    { trusted: 95, needs_checking: 65, unreliable: 25 }[dataQuality] ?? 65,
  );

  return {
    source: "steps",
    dataReadiness,
    dataAccessibility,
    dataStructureType,
    dataClassification,
    dataQuality,
    evidence: scopedEvidence,
    validatedAt: new Date().toISOString(),
  };
}

export async function validateProcessData(input: {
  processId: string;
  steps: StepValidationUpdate[];
}) {
  const gate = await requireActiveOrg();
  const derivedData = derivedDataFromValidatedSteps(input.steps);

  await Promise.all(
    input.steps.map((step) =>
      db
        .from("process_step")
        .update({
          data_profile: step.dataProfile,
          data_quality: step.dataQuality,
          is_data_critical: step.isDataCritical,
          data_source_id: step.dataSourceId,
        })
        .eq("id", step.id)
        .eq("workspace_id", gate.workspaceId),
    ),
  );

  const { data: process, error: fetchError } = await db
    .from("process")
    .select("capture, governance_flags, scores")
    .eq("id", input.processId)
    .eq("workspace_id", gate.workspaceId)
    .maybeSingle();
  if (fetchError) throw fetchError;

  const prevCapture = asRecord(process?.capture);
  const capture: Record<string, unknown> = {
    ...prevCapture,
    derivedData,
    dataReadiness: derivedData.dataReadiness,
    dataAccessibility: derivedData.dataAccessibility,
    dataStructureType: derivedData.dataStructureType,
    dataClassification: derivedData.dataClassification,
    dataQuality: derivedData.dataQuality,
  };
  const riskTier = classifyRiskTier({
    frame: asRecord(prevCapture.frame),
    globalPass: asRecord(prevCapture.globalPass),
    derivedFromDiagram: asRecord(prevCapture.derivedFromDiagram),
    derivedData,
  });
  const scores = scoreProcess({
    derivedFromDiagram: asRecord(prevCapture.derivedFromDiagram),
    derivedData,
    globalPass: asRecord(prevCapture.globalPass),
    strategicAlignment: numberFrom(asRecord(process?.scores).strategicAlignment, 50),
  });
  const governanceFlags = {
    ...asRecord(process?.governance_flags),
    provisional: !["low", "standard"].includes(riskTier.tier),
    data_validated: true,
    derived_classification: derivedData.dataClassification,
    risk_tier: riskTier.tier,
    risk_reason: riskTier.reason,
    governance_overlay: riskTier.overlay,
    ethics_review_required: riskTier.tier === "critical",
    required_approvals: riskTier.requiredApprovals,
    audit_cadence: riskTier.auditCadence,
  };

  const { error } = await db
    .from("process")
    .update({
      capture: { ...capture, riskTier },
      governance_flags: governanceFlags,
      risk_tier: riskTier.tier,
      scores,
    })
    .eq("id", input.processId)
    .eq("workspace_id", gate.workspaceId);
  if (error) throw error;
}

export function useValidateProcessData(processId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (steps: StepValidationUpdate[]) => validateProcessData({ processId, steps }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["process", processId] }),
        queryClient.invalidateQueries({ queryKey: ["processes"] }),
        queryClient.invalidateQueries({ queryKey: ["processes", "review-queue"] }),
      ]);
    },
  });
}

export async function approveProcess(processId: string) {
  const gate = await requireActiveOrg();
  const now = new Date().toISOString();

  const { data: existing, error: fetchError } = await db
    .from("process")
    .select("governance_flags")
    .eq("id", processId)
    .eq("workspace_id", gate.workspaceId)
    .maybeSingle();
  if (fetchError) throw fetchError;

  const { data: decided, error: decisionError } = await db.rpc("decide_process", {
    p_process_id: processId,
    p_decision: "approve",
    p_note: "Approved for prioritization.",
  });
  if (decisionError) throw decisionError;

  const { data: process, error: updateError } = await db
    .from("process")
    .update({
      governance_flags: {
        ...asRecord(existing?.governance_flags),
        approved_for_prioritization: true,
        approved_at: now,
      },
    })
    .eq("id", decided.id)
    .eq("workspace_id", gate.workspaceId)
    .select("*")
    .single();
  if (updateError) throw updateError;

  await createOrUpdateOpportunityAndRoadmap(process as ProcessRow);
  await recomputeOrgScores(gate.workspaceId);
}

export function useApproveProcess(processId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => approveProcess(processId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["process", processId] }),
        queryClient.invalidateQueries({ queryKey: ["processes"] }),
        queryClient.invalidateQueries({ queryKey: ["processes", "review-queue"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["department-scores"] }),
        queryClient.invalidateQueries({ queryKey: ["company-score"] }),
        queryClient.invalidateQueries({ queryKey: ["opportunities"] }),
        queryClient.invalidateQueries({ queryKey: ["roadmap"] }),
      ]);
    },
  });
}
