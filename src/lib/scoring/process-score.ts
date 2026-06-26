import type { Priority } from "@/lib/process-data";

export type ScoreConfidence = "low" | "medium" | "high";

export type ProcessScoreInput = {
  derivedFromDiagram?: Record<string, unknown> | null;
  derivedData?: Record<string, unknown> | null;
  globalPass?: Record<string, unknown> | null;
  strategicAlignment?: number | null;
};

export type ProcessScoreResult = {
  maturity: number;
  automationValue: number;
  aiReadiness: number;
  dataReadiness: number;
  dataValue: number;
  impact: number;
  readiness: number;
  effortSavings: number;
  ebitdaImpact: number;
  errorReduction: number;
  priorityScore: number;
  priorityBand: Priority;
  confidence: ScoreConfidence;
  strategicAlignment: number;
};

export type ProcessRankResult = {
  priorityScore: number;
  priorityBand: Priority;
  roadmapRank: number;
  rationale: string;
};

const DEFAULT_LOADED_COST_EUR_PER_HOUR = 65;

function asRecord(value: unknown): Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function numberFrom(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function priorityBand(score: number): Priority {
  if (score >= 75) return "High";
  if (score >= 50) return "Medium";
  return "Low";
}

function frequencyMultiplier(frequency: unknown) {
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

function standardizationMultiplier(value: unknown) {
  switch (String(value ?? "").toLowerCase()) {
    case "high":
      return 1.2;
    case "low":
      return 0.75;
    default:
      return 1;
  }
}

function confidenceFor(input: {
  stepCount: number;
  dataReadiness: number;
  outputCriticality: unknown[];
  volume: number;
  impactIfFailure: unknown;
}) {
  let points = 0;
  if (input.stepCount > 0) points += 1;
  if (input.dataReadiness > 0) points += 1;
  if (input.outputCriticality.length > 0) points += 1;
  if (input.volume > 0) points += 1;
  if (String(input.impactIfFailure ?? "")) points += 1;
  if (points >= 5) return "high";
  if (points >= 3) return "medium";
  return "low";
}

export function rankProcessOpportunity(input: {
  impact: number;
  readiness: number;
  strategicAlignment?: number | null;
  value?: number | null;
  riskPenalty?: number | null;
}): ProcessRankResult {
  const strategicAlignment = clamp(numberFrom(input.strategicAlignment, 50));
  const value = clamp(numberFrom(input.value, 0));
  const riskPenalty = clamp(numberFrom(input.riskPenalty, 0), 0, 20);
  const priorityScore = Math.round(
    clamp(input.impact) * 0.35 +
      clamp(input.readiness) * 0.25 +
      strategicAlignment * 0.2 +
      value * 0.2 -
      riskPenalty,
  );
  const band = priorityBand(priorityScore);

  return {
    priorityScore,
    priorityBand: band,
    roadmapRank: Math.max(1, 101 - priorityScore),
    rationale: `${band} priority: impact ${Math.round(clamp(input.impact))}, readiness ${Math.round(
      clamp(input.readiness),
    )}, strategic alignment ${Math.round(strategicAlignment)}, value ${Math.round(value)}.`,
  };
}

export function scoreProcess(input: ProcessScoreInput): ProcessScoreResult {
  const derived = asRecord(input.derivedFromDiagram);
  const data = asRecord(input.derivedData);
  const globalPass = asRecord(input.globalPass);

  const stepCount = numberFrom(derived.stepCount, 0);
  const automationCeiling = numberFrom(derived.automationCeiling, 0);
  const tools = numberFrom(derived.tools, 0);
  const dataReadiness = clamp(numberFrom(data.dataReadiness, 0));
  const volume = Math.max(0, numberFrom(globalPass.volume, 0));
  const frequency = frequencyMultiplier(globalPass.frequency);
  const standardization = standardizationMultiplier(globalPass.standardization);
  const strategicAlignment = clamp(numberFrom(input.strategicAlignment, 50));
  const outputCriticality = Array.isArray(globalPass.outputCriticality) ? globalPass.outputCriticality : [];

  const automation = clamp(35 + automationCeiling * 14 + tools * 3, 0, 95);
  const maturity = Math.round(
    (dataReadiness + automation + (globalPass.standardization === "high" ? 90 : globalPass.standardization === "medium" ? 70 : 45)) / 3,
  );
  const aiReadiness = Math.round((automation + dataReadiness) / 2);
  const readiness = Math.round((maturity + dataReadiness) / 2);
  const impact = clamp(40 + volume);

  /*
   * Transparent ROI model:
   * weekly effort saved = volume x frequency x process complexity x automatable share.
   * Annual EBITDA impact = weekly hours saved x loaded cost x 52, softened by score confidence.
   */
  const automatableShare = automation / 100;
  const complexity = Math.max(1, stepCount) / 2;
  const effortSavings = Math.round(volume * frequency * standardization * complexity * automatableShare);
  const confidence = confidenceFor({ stepCount, dataReadiness, outputCriticality, volume, impactIfFailure: globalPass.impactIfFailure });
  const confidenceFactor = confidence === "high" ? 1 : confidence === "medium" ? 0.75 : 0.5;
  const ebitdaImpact = Math.round(effortSavings * DEFAULT_LOADED_COST_EUR_PER_HOUR * 52 * confidenceFactor);
  const errorReduction = Math.round(clamp(automation * 0.55 + dataReadiness * 0.25 + (globalPass.standardization === "high" ? 15 : 5)));
  const dataValue = dataReadiness;
  const valueScore = clamp(Math.min(100, effortSavings * 3 + ebitdaImpact / 5000 + dataValue * 0.25));
  const ranked = rankProcessOpportunity({
    impact,
    readiness,
    strategicAlignment,
    value: valueScore,
  });

  return {
    maturity,
    automationValue: Math.round(automation),
    aiReadiness,
    dataReadiness,
    dataValue,
    impact: Math.round(impact),
    readiness,
    effortSavings,
    ebitdaImpact,
    errorReduction,
    priorityScore: ranked.priorityScore,
    priorityBand: ranked.priorityBand,
    confidence,
    strategicAlignment,
  };
}
