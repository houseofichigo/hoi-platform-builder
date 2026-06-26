import { asRecord, numberFrom } from "@/lib/db/pfs/shared";

export type RiskTier = "low" | "standard" | "elevated" | "critical" | "unclassified";

export type RiskTierResult = {
  tier: RiskTier;
  label: string;
  reason: string;
  overlay: "full" | "standard" | "minimal" | "none";
  overlayLevel: "full" | "standard" | "minimal" | "none";
  auditCadence: string;
  auditCadenceDays: number;
  requiredApprovals: string[];
  requiredApprovalsCount: number;
};

export type GovernanceThresholds = {
  criticalClassificationMin: "personal" | "sensitive";
  irreversibleErrorEscalates: boolean;
  auditCadenceDaysByTier: Partial<Record<RiskTier, number>>;
  requiredApprovalsByTier: Partial<Record<RiskTier, number>>;
};

export const RISK_TIER_LABEL: Record<RiskTier, string> = {
  critical: "Critical",
  elevated: "Elevated",
  standard: "Standard",
  low: "Low",
  unclassified: "Not yet classified",
};

const sensitiveData = new Set(["highly_restricted", "special_category", "sensitive"]);
const restrictedData = new Set(["restricted", "personal"]);
const highImpact = new Set(["critical", "highest", "severe"]);
const hardToReverse = new Set(["hard_to_reverse", "irreversible"]);
const regulatedTags = ["hiring", "credit", "health", "safety"];

function list(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function riskTierMeta(tier: RiskTier | null | undefined, reason = ""): RiskTierResult {
  const resolved = tier ?? "unclassified";
  if (resolved === "critical") {
    return {
      tier: resolved,
      label: RISK_TIER_LABEL[resolved],
      reason: reason || "Critical - high impact or regulated process",
      overlay: "full",
      overlayLevel: "full",
      auditCadence: "Semi-annual audit cadence",
      auditCadenceDays: 180,
      requiredApprovals: ["department_lead", "reviewer"],
      requiredApprovalsCount: 2,
    };
  }

  if (resolved === "elevated") {
    return {
      tier: resolved,
      label: RISK_TIER_LABEL[resolved],
      reason: reason || "Elevated - customer, personal-data, or moderate automation exposure",
      overlay: "standard",
      overlayLevel: "standard",
      auditCadence: "Annual audit cadence",
      auditCadenceDays: 365,
      requiredApprovals: ["department_lead"],
      requiredApprovalsCount: 1,
    };
  }

  if (resolved === "standard") {
    return {
      tier: resolved,
      label: RISK_TIER_LABEL[resolved],
      reason: reason || "Standard - internal, non-sensitive, low-risk process",
      overlay: "minimal",
      overlayLevel: "minimal",
      auditCadence: "Biennial audit cadence",
      auditCadenceDays: 730,
      requiredApprovals: [],
      requiredApprovalsCount: 0,
    };
  }

  if (resolved === "low") {
    return {
      tier: resolved,
      label: RISK_TIER_LABEL[resolved],
      reason: reason || "Low - public, non-sensitive, minimal-risk process",
      overlay: "minimal",
      overlayLevel: "minimal",
      auditCadence: "Triennial audit cadence",
      auditCadenceDays: 1095,
      requiredApprovals: [],
      requiredApprovalsCount: 0,
    };
  }

  return {
    tier: resolved,
    label: RISK_TIER_LABEL[resolved],
    reason: reason || "Required capture is missing",
    overlay: "none",
    overlayLevel: "none",
    auditCadence: "No audit cadence until classified",
    auditCadenceDays: 0,
    requiredApprovals: [],
    requiredApprovalsCount: 0,
  };
}

export function classifyRiskTier(input: {
  frame?: Record<string, unknown> | null;
  globalPass?: Record<string, unknown> | null;
  derivedFromDiagram?: Record<string, unknown> | null;
  derivedData?: Record<string, unknown> | null;
}): RiskTierResult {
  const frame = asRecord(input.frame);
  const globalPass = asRecord(input.globalPass);
  const derivedFromDiagram = asRecord(input.derivedFromDiagram);
  const derivedData = asRecord(input.derivedData);
  const outputCriticality = list(globalPass.outputCriticality);
  const dataClassification = text(derivedData.dataClassification || globalPass.dataClassification);
  const automationCeiling = numberFrom(derivedFromDiagram.automationCeiling, Number.NaN);
  const impactIfFailure = text(globalPass.impactIfFailure);
  const errorReversibility = text(globalPass.errorReversibility);
  const processText = [frame.name, frame.family, frame.objective, frame.output, frame.successMetric]
    .map((value) => text(value).toLowerCase())
    .join(" ");
  const taggedRegulated = regulatedTags.find((tag) => processText.includes(tag));

  if (!outputCriticality.length || !dataClassification || !Number.isFinite(automationCeiling) || !impactIfFailure || !errorReversibility) {
    return riskTierMeta("unclassified", "Required capture is missing");
  }

  /*
   * Deterministic first-match rule, highest tier wins:
   * Tier 1 for financial/legal/special-category/regulatory process exposure,
   * or L3+ automation on customer/financial outcomes, or severe impact that is
   * hard to reverse. Tier 2 for customer-facing, personal-data, or L2+ exposure.
   * Everything complete and below those thresholds is Tier 3.
   */
  if (outputCriticality.includes("financial_impact")) {
    return riskTierMeta("critical", "Critical - touches financial impact");
  }
  if (outputCriticality.includes("legal_compliance")) {
    return riskTierMeta("critical", "Critical - legal or compliance outcome");
  }
  if (sensitiveData.has(dataClassification)) {
    return riskTierMeta("critical", "Critical - highly restricted or sensitive data");
  }
  if (taggedRegulated) {
    return riskTierMeta("critical", `Critical - ${taggedRegulated} process`);
  }
  if (automationCeiling >= 3 && (outputCriticality.includes("customer_facing") || outputCriticality.includes("financial_impact"))) {
    return riskTierMeta("critical", `Critical - L${automationCeiling} automation on critical output`);
  }
  if (highImpact.has(impactIfFailure) && hardToReverse.has(errorReversibility)) {
    return riskTierMeta("critical", "Critical - high impact and hard to reverse");
  }

  if (outputCriticality.includes("customer_facing")) {
    return riskTierMeta("elevated", "Elevated - customer-facing process");
  }
  if (restrictedData.has(dataClassification)) {
    return riskTierMeta("elevated", "Elevated - restricted or personal data");
  }
  if (automationCeiling >= 2) {
    return riskTierMeta("elevated", `Elevated - L${automationCeiling} automation exposure`);
  }

  return riskTierMeta("standard", "Standard - internal, non-sensitive, low automation");
}

export function classifyRiskTierFromCapture(captureValue: unknown): RiskTierResult {
  const capture = asRecord(captureValue);
  return classifyRiskTier({
    frame: asRecord(capture.frame),
    globalPass: asRecord(capture.globalPass),
    derivedFromDiagram: asRecord(capture.derivedFromDiagram),
    derivedData: asRecord(capture.derivedData),
  });
}

export function riskTierClass(tier: RiskTier | null | undefined) {
  if (tier === "critical") return "bg-[var(--danger)] text-white";
  if (tier === "elevated") return "bg-[var(--ichigo-navy)] text-white";
  if (tier === "standard") return "bg-[var(--ichigo-mist)] text-[var(--ichigo-navy)]";
  if (tier === "low") return "bg-[var(--ichigo-mist)] text-[var(--ichigo-navy)]";
  return "bg-[var(--chalk)] text-[var(--slate)]";
}
