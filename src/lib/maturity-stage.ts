import type { ProcessRecord } from "@/lib/process-data";

export type MaturityStage = "initial" | "developing" | "advanced" | "leading" | "not_assessed";

export type DimensionStage = {
  score: number | null;
  stage: MaturityStage;
  descriptor: string;
  measured: boolean;
  provenance?: "evidence" | "self_reported";
};

export type MaturityStageResult = {
  stage: MaturityStage;
  label: string;
  descriptor: string;
  dimensions: Record<string, DimensionStage>;
  nextStage: MaturityStage | null;
  gaps: Array<{ dimension: string; target: MaturityStage; descriptor: string }>;
};

const stageOrder: MaturityStage[] = ["initial", "developing", "advanced", "leading"];

export const stageDescriptors = {
  processes: {
    initial: "Work is ad hoc and undocumented; few processes mapped.",
    developing: "Core processes mapped and standardized; first automations live.",
    advanced: "Most processes mapped, scored, and partially automated end-to-end.",
    leading: "Processes continuously optimized; automated discovery and improvement.",
  },
  technology: {
    initial: "Disconnected tools; heavy manual transfer between systems.",
    developing: "Key systems integrated; manual hand-offs reduced.",
    advanced: "Most of the stack integrated; automation runs across systems.",
    leading: "Unified, fully integrated stack; real-time, low-friction operations.",
  },
  data_governance: {
    initial: "Data scattered, quality unknown; no governance.",
    developing: "Key data sources catalogued; basic quality and classification in place.",
    advanced: "Governed data with validated classification; audit-ready controls.",
    leading: "Trusted, governed data foundation; continuous monitoring.",
  },
  value: {
    initial: "Value not yet measured; few opportunities identified.",
    developing: "First opportunities prioritized; initial ROI tracked.",
    advanced: "Rigorous ROI measurement; meaningful documented impact.",
    leading: "AI/automation a measurable driver of business outcomes.",
  },
  organization: {
    initial: "AI decisions are informal; ownership and operating model are unclear.",
    developing: "A named owner and basic decision path exist for first AI initiatives.",
    advanced: "Decision rights are clear across business and central teams.",
    leading: "AI accountability is federated, repeatable, and embedded in operating rhythms.",
  },
  culture: {
    initial: "AI literacy is limited and delivery depends heavily on outside support.",
    developing: "Leaders understand the basics and teams can participate in guided delivery.",
    advanced: "Broad literacy supports balanced internal and external delivery.",
    leading: "AI skills and improvement habits are embedded across daily work.",
  },
} as const;

const notAssessed = "Not measured by the process-mapping tool.";
export const READINESS_GATES_OVERALL = true;

export function stageLabel(stage: MaturityStage) {
  if (stage === "not_assessed") return "Not assessed";
  return stage.charAt(0).toUpperCase() + stage.slice(1);
}

function scoreToStage(score: number | null): MaturityStage {
  if (score == null || !Number.isFinite(score)) return "not_assessed";
  /*
   * Deterministic default bands: <40 Initial, 40-59 Developing,
   * 60-79 Advanced, 80+ Leading. Overall stage is the weakest measured
   * dimension because operating maturity is gated by its weakest pillar.
   */
  if (score < 40) return "initial";
  if (score < 60) return "developing";
  if (score < 80) return "advanced";
  return "leading";
}

function descriptorFor(dimension: keyof typeof stageDescriptors, stage: MaturityStage) {
  if (stage === "not_assessed") return notAssessed;
  return stageDescriptors[dimension][stage];
}

function dimension(
  dimensionName: keyof typeof stageDescriptors,
  score: number | null,
  provenance: DimensionStage["provenance"] = "evidence",
): DimensionStage {
  const stage = scoreToStage(score);
  return {
    score,
    stage,
    descriptor: descriptorFor(dimensionName, stage),
    measured: stage !== "not_assessed",
    provenance: stage !== "not_assessed" ? provenance : undefined,
  };
}

function readinessDimension(
  dimensionName: "organization" | "culture",
  score: number | null | undefined,
  stage: MaturityStage | null | undefined,
): DimensionStage {
  if (score == null || !stage || stage === "not_assessed") {
    return { score: null, stage: "not_assessed", descriptor: notAssessed, measured: false };
  }
  return {
    score,
    stage,
    descriptor: descriptorFor(dimensionName, stage),
    measured: true,
    provenance: "self_reported",
  };
}

export function deriveMaturityStage(input: {
  maturity: number;
  automation: number;
  data: number;
  approvedPct: number;
  processCount: number;
  ebitda: number;
  tools?: Array<{ integration_status?: number | null; api_available?: boolean | null }>;
  processes: ProcessRecord[];
  readiness?: {
    organizationStage?: MaturityStage | null;
    organizationScore?: number | null;
    cultureStage?: MaturityStage | null;
    cultureScore?: number | null;
  } | null;
}): MaturityStageResult {
  const toolScores = (input.tools ?? []).map((tool) => {
    const integration = Math.max(0, Math.min(5, Number(tool.integration_status ?? 0))) * 16;
    return integration + (tool.api_available ? 20 : 0);
  });
  const technologyScore = toolScores.length
    ? Math.round((toolScores.reduce((sum, value) => sum + value, 0) / toolScores.length + input.automation) / 2)
    : input.automation;
  const dataValidatedPct = input.processes.length
    ? Math.round((input.processes.filter((process) => process.dataValidated).length / input.processes.length) * 100)
    : 0;
  const dataGovernanceScore = Math.round(input.data * 0.7 + dataValidatedPct * 0.3);
  const valueScore = Math.min(
    100,
    Math.round(input.approvedPct * 0.35 + Math.min(input.processCount * 8, 40) + Math.min(input.ebitda / 25000, 25)),
  );

  const dimensions = {
    processes: dimension("processes", input.processCount > 0 ? input.maturity : null),
    technology: dimension("technology", input.processCount > 0 ? technologyScore : null),
    data_governance: dimension("data_governance", input.processCount > 0 ? dataGovernanceScore : null),
    value: dimension("value", input.processCount > 0 ? valueScore : null),
    organization: readinessDimension("organization", input.readiness?.organizationScore, input.readiness?.organizationStage),
    culture: readinessDimension("culture", input.readiness?.cultureScore, input.readiness?.cultureStage),
  };
  const measured = Object.values(dimensions).filter((item) => item.measured && (READINESS_GATES_OVERALL || item.provenance !== "self_reported"));
  const weakest = measured.reduce<MaturityStage>(
    (current, item) =>
      stageOrder.indexOf(item.stage) < stageOrder.indexOf(current) ? item.stage : current,
    measured[0]?.stage ?? "not_assessed",
  );
  const nextStage = weakest !== "not_assessed" && weakest !== "leading" ? stageOrder[stageOrder.indexOf(weakest) + 1] : null;
  const gaps = nextStage
    ? (Object.entries(dimensions) as Array<[keyof typeof dimensions, DimensionStage]>)
        .filter(([, item]) => item.measured && stageOrder.indexOf(item.stage) < stageOrder.indexOf(nextStage))
        .map(([name]) => ({
          dimension: String(name).replace("_", " "),
          target: nextStage,
          descriptor: descriptorFor(name as keyof typeof stageDescriptors, nextStage),
        }))
    : [];

  return {
    stage: weakest,
    label: stageLabel(weakest),
    descriptor:
      weakest === "not_assessed"
        ? "Not enough process evidence has been captured yet."
        : `Overall stage is gated by the weakest measured dimension: ${stageLabel(weakest)}.`,
    dimensions,
    nextStage,
    gaps,
  };
}
