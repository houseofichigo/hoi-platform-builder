import type {
  AutomationStepTemplate,
  CandidateTemplate,
  DecisionOption,
  InvoiceOcrProfileContext,
  PortfolioScaffold,
  ReasonCode,
  ScoringPillar,
} from "./types";

export const M09_COURSE_CONTENT = {
  placeholder: false,

  storyHeader:
    "Portfolio Scoring & Use Case Prioritisation. Gate 3 is where enthusiasm becomes capital allocation: which use cases deserve the next investment cycle?",

  step1: {
    title: "Capture the portfolio",
    why:
      "Scoring without a portfolio is theatre. Capture four comparable candidates with a named owner before any number is assigned.",
    example:
      "Candidates: customer email classification, quote generation, HR ticket triage, and RFP response drafting. Each gets a one-sentence description and a single named owner.",
    whatToNotice: [
      "Owners are people, not teams",
      "Descriptions answer what + for whom in one sentence",
      "A candidate without an owner cannot be funded",
    ],
    produces: "Four named candidates with owner and description",
    nextLabel: "Step 2 - eight-pillar scoring",
  },

  step2: {
    title: "Eight-pillar scoring",
    why:
      "The scoring engine creates a common language across functions. Reason codes prevent a high score from hiding a blocker.",
    example:
      "Score each pillar 1-5: business impact, feasibility, process maturity, risk, AI suitability, agent suitability, delivery readiness, priority.",
    whatToNotice: [
      "High impact with low feasibility is a constraint, not a win",
      "Reason codes name blockers in vocabulary the gate accepts",
      "A score with no reason code is a guess; a reason code with no score is an opinion",
    ],
    produces: "Scores across eight pillars plus reason codes per candidate",
    nextLabel: "Step 3 - automation maps",
  },

  step3: {
    title: "Step-level automation map",
    why:
      "Scores compare candidates. Automation maps show where the human stays in control and which steps must never be automated.",
    example:
      "Mark each step as manual, assisted, automated, or forbidden. Name the human control for assisted and automated steps.",
    whatToNotice: [
      "Forbidden is a valid level",
      "Every automated step needs a named human control",
      "The map makes HITL concrete instead of aspirational",
    ],
    produces: "Automation map for each candidate",
    nextLabel: "Step 4 - portfolio ranking",
  },

  step4: {
    title: "Portfolio ranking and constraints",
    why:
      "Ranking forces trade-offs. Constraints make the rank defensible: yes, but only if these conditions hold.",
    example:
      "Rank 1-4. Top rank is the next investment. Each candidate can carry constraints around residency, HITL, monitoring, ownership, or rollback.",
    whatToNotice: [
      "Average score informs rank but does not decide it",
      "Constraints turn a yes into a yes-if",
      "A tied rank is not a rank",
    ],
    produces: "Ranked portfolio with constraints",
    nextLabel: "Step 5 - Gate 3 dossier",
  },

  step5: {
    title: "Gate 3 investment dossier",
    why:
      "Gate 3 asks which use cases earn the next investment cycle. The dossier synthesizes value, data readiness, governance, automation posture, ownership, risk, and rollback.",
    example:
      "The dossier names the top candidate, its score profile, reason codes, automation posture, constraints, and recommendation.",
    whatToNotice: [
      "Investment fit is judgement plus evidence",
      "Risk acceptance must be named",
      "A dossier that cannot fit on two pages is not yet a dossier",
    ],
    produces: "Gate 3 dossier ready for the gate route",
  },

  pillars: [
    {
      id: "impact",
      label: "Business Impact",
      question: "How much value does this create, and for whom?",
      highScoreSignal: "Quantified money, hours, revenue, quality, or risk reduction with a named beneficiary.",
      lowScoreSignal: "Generic efficiency claim with no number or beneficiary.",
    },
    {
      id: "feasibility",
      label: "Feasibility",
      question: "Can we build and operate this with current tools, data, and skills?",
      highScoreSignal: "Stack proven on similar work; team has done it before.",
      lowScoreSignal: "Requires capabilities we do not have and cannot acquire in the window.",
    },
    {
      id: "process",
      label: "Process Maturity",
      question: "Is the underlying process documented, stable, and measured?",
      highScoreSignal: "Written SOP, clear inputs/outputs, KPI history.",
      lowScoreSignal: "Tribal knowledge, frequent exceptions, no metrics.",
    },
    {
      id: "risk",
      label: "Risk",
      question: "What is the worst credible outcome and how is it contained?",
      highScoreSignal: "Reversible errors, bounded blast radius, named controls.",
      lowScoreSignal: "Irreversible errors, regulated data, no monitoring.",
    },
    {
      id: "ai",
      label: "AI Suitability",
      question: "Is this a problem AI is genuinely good at?",
      highScoreSignal: "Pattern-heavy, language/vision-driven, tolerant of probabilistic output with review.",
      lowScoreSignal: "Requires deterministic correctness or unaudited reasoning.",
    },
    {
      id: "agent",
      label: "Agent Suitability",
      question: "Does this need multi-step action with tools?",
      highScoreSignal: "Multi-step workflow with bounded tools and explicit HITL.",
      lowScoreSignal: "One-shot answer that does not need orchestration.",
    },
    {
      id: "readiness",
      label: "Delivery Readiness",
      question: "Do we have an owner, budget, deployment partner, and rollback path?",
      highScoreSignal: "Named owner, allocated budget, ready partner, working rollback.",
      lowScoreSignal: "No single owner, no budget, no partner identified.",
    },
    {
      id: "priority",
      label: "Priority",
      question: "Why this candidate, this cycle, ahead of the others?",
      highScoreSignal: "Strategic alignment, time-bound trigger, dependency unblocked.",
      lowScoreSignal: "Nice to have, no urgency, no dependency relief.",
    },
  ] as const satisfies readonly ScoringPillar[],

  reasonCodes: [
    {
      id: "HITL_MANDATORY",
      label: "HITL mandatory",
      meaning: "A required checkpoint must remain manual for legal, safety, policy, or quality reasons.",
    },
    {
      id: "IRREVERSIBLE_ERRORS",
      label: "Irreversible errors",
      meaning: "A wrong action cannot be undone, such as payment release, deletion, or external commitment.",
    },
    {
      id: "NO_MONITORING_PATH",
      label: "No monitoring path",
      meaning: "We cannot currently observe or alert on the system's behavior in production.",
    },
    {
      id: "DATA_RESIDENCY_RISK",
      label: "Data residency risk",
      meaning: "Required data would cross a jurisdiction or vendor boundary the contract does not cover.",
    },
    {
      id: "LOW_PROCESS_MATURITY",
      label: "Low process maturity",
      meaning: "The process is not stable enough to automate before cleanup.",
    },
    {
      id: "UNCLEAR_OWNER",
      label: "Unclear owner",
      meaning: "No single named person is accountable for outcomes and trade-offs.",
    },
    {
      id: "WEAK_BUSINESS_CASE",
      label: "Weak business case",
      meaning: "Value is not quantified or the beneficiary is not named.",
    },
    {
      id: "VENDOR_LOCK_IN",
      label: "Vendor lock-in",
      meaning: "The choice would tie the team to a vendor it cannot exit within the planning horizon.",
    },
    {
      id: "SECURITY_REVIEW_REQUIRED",
      label: "Security review required",
      meaning: "A formal security review must precede further investment.",
    },
    {
      id: "PROMPT_INJECTION_RISK",
      label: "Prompt injection risk",
      meaning: "Inputs include untrusted text or documents that can manipulate the agent.",
    },
    {
      id: "REGULATORY_REVIEW_REQUIRED",
      label: "Regulatory review required",
      meaning: "A regulated workflow needs sign-off from compliance before funding.",
    },
    {
      id: "DEPENDENCY_NOT_READY",
      label: "Dependency not ready",
      meaning: "A required upstream system, dataset, team, or integration is not available this cycle.",
    },
  ] as const satisfies readonly ReasonCode[],

  candidateTemplates: [
    {
      id: "customer_email_classification",
      name: "Customer email classification",
      description: "Classify inbound customer emails by topic, urgency, risk, and routing queue.",
      defaultReasonCodes: ["PROMPT_INJECTION_RISK"],
    },
    {
      id: "quote_generation",
      name: "Quote generation",
      description: "Draft customer quotes from product rules, pricing inputs, and sales context for human approval.",
      defaultReasonCodes: ["HITL_MANDATORY", "IRREVERSIBLE_ERRORS"],
    },
    {
      id: "hr_ticket_triage",
      name: "HR ticket triage & routing",
      description: "Classify employee requests and route them to the right HR owner with privacy-aware summaries.",
      defaultReasonCodes: ["DATA_RESIDENCY_RISK", "REGULATORY_REVIEW_REQUIRED"],
    },
    {
      id: "rfp_response_drafting",
      name: "RFP response drafting",
      description: "Draft first-pass RFP answers from approved product, security, legal, and case-study sources.",
      defaultReasonCodes: ["SECURITY_REVIEW_REQUIRED", "VENDOR_LOCK_IN"],
    },
  ] as const satisfies readonly CandidateTemplate[],

  automationStepTemplates: [
    {
      id: "capture",
      label: "Capture / intake",
      recommendedLevel: "automate",
      humanControl: "Owner can pause intake from the queue.",
    },
    {
      id: "extract",
      label: "Extract / classify",
      recommendedLevel: "automate",
      humanControl: "Confidence threshold sends uncertain outputs to review.",
    },
    {
      id: "validate",
      label: "Validate against rules",
      recommendedLevel: "assist",
      humanControl: "Reviewer sees the rule that fired and can override with a reason.",
    },
    {
      id: "decide",
      label: "Decision / approval",
      recommendedLevel: "manual",
      humanControl: "Named approver makes the decision; AI prepares the evidence.",
    },
    {
      id: "act",
      label: "Act on external system",
      recommendedLevel: "assist",
      humanControl: "Write only after approval; reversal or cancellation path stored.",
    },
    {
      id: "audit",
      label: "Audit / record",
      recommendedLevel: "automate",
      humanControl: "Append-only events; integrity check runs on the trail.",
    },
  ] as const satisfies readonly AutomationStepTemplate[],

  decisionOptions: [
    {
      id: "fund" as const,
      label: "Fund",
      summary: "All Gate 3 criteria pass. Allocate the next investment cycle.",
    },
    {
      id: "fund_with_constraints" as const,
      label: "Fund with constraints",
      summary: "Mostly pass; named constraints are enforceable.",
    },
    {
      id: "defer" as const,
      label: "Defer",
      summary: "Re-score next cycle after a specific dependency or evidence gap is resolved.",
    },
    {
      id: "stop" as const,
      label: "Stop",
      summary: "Value, risk, or readiness fails. Free the slot for a stronger candidate.",
    },
  ] as const satisfies readonly DecisionOption[],

  gate3Criteria: [
    { id: "portfolio_value", label: "Portfolio value", question: "Does the top candidate quantify value with a named beneficiary?" },
    { id: "data_readiness", label: "Data readiness", question: "Is the required data available, in-scope, and contractually safe to use?" },
    { id: "governance_readiness", label: "Governance readiness", question: "Are residency, training opt-out, audit, and compliance answered through M07/M08?" },
    { id: "monitoring_path", label: "Monitoring path", question: "Is there a working monitoring and alerting path for production behavior?" },
    { id: "ownership", label: "Ownership", question: "Is there a single named owner accountable for outcomes and trade-offs?" },
    { id: "investment_fit", label: "Investment fit", question: "Does this fit the cycle's strategic priorities and capital envelope?" },
    { id: "risk_acceptance", label: "Risk acceptance", question: "Are residual risks named, owned, and accepted at the right level?" },
    { id: "rollback_stop", label: "Rollback / stop conditions", question: "Are rollback and stop conditions defined and rehearsable?" },
  ] as const,

  methodNote:
    "Gate 3 is not 'we like this'. It is 'we will invest in this, under these conditions, and revisit on this date'.",
} as const;

export function getM09PortfolioScaffold(
  ctx: InvoiceOcrProfileContext,
): PortfolioScaffold {
  const company = ctx.companyName ?? "your company";
  const country = ctx.country ?? "your region";

  return {
    workedExampleName: `Generic AI portfolio for ${company}`,
    candidatePrompts:
      `Start with four transferable candidates for ${company}: customer email classification, quote generation, HR ticket triage, and RFP response drafting. Replace any candidate only if your team has a clearer real use case with a named owner.`,
    scoringGuidance:
      `Score 1-5 on each pillar. Attach a reason code whenever a high score hides a blocker: HITL_MANDATORY for approval steps, DATA_RESIDENCY_RISK for cross-border data, NO_MONITORING_PATH if production telemetry is absent, and SECURITY_REVIEW_REQUIRED when tools touch sensitive systems.`,
    gate3Dossier:
      `Top candidate for ${company}: summarize value, readiness, governance constraints in ${country}, automation posture, ownership, rollback, monitoring path, and investment recommendation. Use the M07 ADR and M08 deployment plan as evidence.`,
  };
}
