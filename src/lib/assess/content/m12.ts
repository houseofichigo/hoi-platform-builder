import type {
  CapabilityGap,
  ExecutiveScorecardMetric,
  InvoiceOcrProfileContext,
  RoadmapHorizon,
  StrategyScaffold,
} from "./types";

export const M12_COURSE_CONTENT = {
  placeholder: false,

  storyHeader:
    "AI Strategy & Roadmap. A working pilot is not a strategy. M12 turns the scored portfolio into a 12-month plan an executive sponsor can sign.",

  step1: {
    title: "Portfolio -> roadmap sequencing",
    why:
      "A scored portfolio without a sequence is a wish list. The roadmap sequences candidates across three horizons so capacity, dependencies, and governance can be planned.",
    example:
      "Now: scale the top M09 candidate. Next: pilot the next two constrained candidates. Later: prepare deferred candidates by closing data, governance, or partner gaps.",
    whatToNotice: [
      "Each horizon answers a different question: deliver, prove, prepare",
      "Dependencies drive sequence, not enthusiasm",
      "Sequencing rationale names the capacity constraint",
    ],
    produces: "Now/Next/Later roadmap with sequencing rationale",
    nextLabel: "Step 2 - capability gaps",
  },

  step2: {
    title: "Capability gap analysis",
    why:
      "Roadmaps fail at the boundary between ambition and organisational capacity. Name gaps in people, tools, partnerships, and governance before they slip the plan.",
    example:
      "People: no backup owner. Tools: monitoring dashboard not live. Partnerships: deployment partner not contracted. Governance: system-card owner not named.",
    whatToNotice: [
      "Every gap has an owner and next action",
      "Partnerships and governance are first-class",
      "A gap with no owner is a roadmap risk",
    ],
    produces: "Capability gap matrix covering people, tools, partnerships, governance",
    nextLabel: "Step 3 - executive scorecard",
  },

  step3: {
    title: "Executive scorecard",
    why:
      "The sponsor needs one page to track program health across investment, risk, governance, and impact.",
    example:
      "Live systems, pilots running, readiness review status, spend vs. cost model, HITL load, open incidents, governance docs current, realised impact.",
    whatToNotice: [
      "Every metric has a target",
      "Metrics span investment, risk, governance, and outcome",
      "The scorecard is short enough to read in a meeting",
    ],
    produces: "Scorecard with at least 6 metrics and explicit targets",
    nextLabel: "Step 4 - executive summary",
  },

  step4: {
    title: "Executive summary and next pilot cycle",
    why:
      "The summary is what the sponsor signs. It states the portfolio bet, roadmap, gaps, investment ask, and go/no-go criteria for the next pilot.",
    example:
      "We will scale the top M09 candidate, launch two constrained pilots, and prepare deferred cases. Stop conditions: quality regression, governance docs not closed, partner unsigned, cost overrun.",
    whatToNotice: [
      "The summary names the bet, price, and stop conditions",
      "Next-pilot criteria are explicit",
      "Rollback and review cadence are stated, not implied",
    ],
    produces: "Sponsor-ready executive summary with go/no-go criteria",
    nextLabel: "Complete M12 - Handoff Pack done",
  },

  horizons: [
    {
      id: "now",
      label: "Now",
      timeframe: "0-3 months",
      purpose: "Deliver what is funded: ship or scale the top candidate that is ready now.",
    },
    {
      id: "next",
      label: "Next",
      timeframe: "3-9 months",
      purpose: "Prove the next bets: pilot candidates that survived M09 with constraints.",
    },
    {
      id: "later",
      label: "Later",
      timeframe: "9-12 months",
      purpose: "Prepare conditions: close governance, data, or partnership gaps for deferred candidates.",
    },
  ] as const satisfies readonly RoadmapHorizon[],

  capabilityGaps: [
    {
      id: "people",
      label: "People",
      question: "Who is missing to deliver the now and next horizon?",
      exampleGap: "Named system owner, backup operator, quality reviewer, or sponsor cadence missing.",
    },
    {
      id: "tools",
      label: "Tools",
      question: "Which platforms, models, monitoring, or infrastructure decisions are still open?",
      exampleGap: "Monitoring dashboard not live; vendor opt-out not confirmed; deployment runtime still undecided.",
    },
    {
      id: "partnerships",
      label: "Partnerships",
      question: "Which external partners, vendors, or internal platform teams must be committed?",
      exampleGap: "Implementation partner not contracted; legal/security review not scheduled; vendor support tier not agreed.",
    },
    {
      id: "governance",
      label: "Governance",
      question: "Which routines, approvals, or documentation must be in place?",
      exampleGap: "System-card owner not named; quarterly re-scoring cadence missing; incident review routine not live.",
    },
  ] as const satisfies readonly CapabilityGap[],

  scorecardMetrics: [
    {
      id: "live_systems",
      label: "Live AI systems in production",
      whyItMatters: "Live count proves the program delivers, not just studies.",
      suggestedTarget: "At least 1 by end of Now horizon; at least 2 by end of Next.",
    },
    {
      id: "pilots_running",
      label: "Pilots currently running",
      whyItMatters: "Pilots are the pipeline of next-quarter production systems.",
      suggestedTarget: "2 active pilots, each with a named readiness review decision date.",
    },
    {
      id: "gate_status",
      label: "Portfolio readiness review status",
      whyItMatters: "Readiness review status shows whether the portfolio is moving or stuck.",
      suggestedTarget: "No candidate stuck more than 1 quarter at the same readiness review.",
    },
    {
      id: "spend_vs_model",
      label: "Spend vs. M08 cost model",
      whyItMatters: "Cost drift means the roadmap is being repriced silently.",
      suggestedTarget: "Within +/-15% of the M08 model per quarter.",
    },
    {
      id: "hitl_load",
      label: "HITL review load per live system",
      whyItMatters: "Rising HITL load means automation is becoming rework.",
      suggestedTarget: "Stable or declining quarter-over-quarter.",
    },
    {
      id: "incidents_open",
      label: "Open AI incidents",
      whyItMatters: "Open incidents are the sponsor's leading risk indicator.",
      suggestedTarget: "0 critical incidents open; all warnings owned with date.",
    },
    {
      id: "governance_docs",
      label: "Governance docs current",
      whyItMatters: "Current docs mean an audit can be answered this week.",
      suggestedTarget: "100% of live systems have current system card and playbook.",
    },
    {
      id: "business_impact",
      label: "Realised business impact",
      whyItMatters: "Impact translates capability into sponsor language.",
      suggestedTarget: "Quantified per live system and reported quarterly.",
    },
    {
      id: "capability_gap_closed",
      label: "Capability gaps closed vs. opened",
      whyItMatters: "If new gaps outpace closed gaps, the roadmap will slip.",
      suggestedTarget: "Net gaps closed at least equal net gaps opened per quarter.",
    },
  ] as const satisfies readonly ExecutiveScorecardMetric[],

  nextPilotCriteria: [
    {
      id: "named_owner",
      label: "Named owner ready",
      detail: "The next pilot has a named owner with explicit time allocation.",
    },
    {
      id: "m09_score",
      label: "Passes M09 scoring",
      detail: "Candidate has a current eight-pillar score with no critical reason-code blockers.",
    },
    {
      id: "data_ready",
      label: "Data layer ready",
      detail: "Internal, contextual, and task-specific data sources are inventoried.",
    },
    {
      id: "gov_ready",
      label: "Governance pre-cleared",
      detail: "Risk, residency, privacy, and governance posture are pre-cleared by the owner.",
    },
    {
      id: "rollback",
      label: "Rollback path defined",
      detail: "Stop conditions and rollback steps are written before the pilot starts.",
    },
    {
      id: "budget_locked",
      label: "Budget locked vs. M08 model",
      detail: "Pilot budget approved within the M08 cost model envelope.",
    },
    {
      id: "sponsor_review",
      label: "Sponsor review cadence",
      detail: "Sponsor review cadence is set before kickoff.",
    },
  ] as const satisfies readonly { id: string; label: string; detail: string }[],

  methodNote:
    "The roadmap is the time-based projection of the M09 portfolio. If portfolio scores or constraints change, the roadmap is re-issued, not patched in a footnote.",
};

export function getM12StrategyScaffold(
  ctx: InvoiceOcrProfileContext,
): StrategyScaffold {
  const company = ctx.companyName ?? "your company";
  const country = ctx.country ?? "your region";

  return {
    roadmapNarrative:
      `12-month roadmap for ${company} (${country}):\n` +
      `- Now (0-3m): scale the top M09 candidate into a controlled production or wider pilot stage; close monitoring on the live workflow.\n` +
      `- Next (3-9m): launch the second and third portfolio candidates as constrained pilots; bring one candidate to the pilot-readiness review.\n` +
      `- Later (9-12m): prepare deferred candidates by closing governance, data, and partnership gaps.\n` +
      `Sequencing rationale: capacity, data readiness, governance posture, and sponsor priority.`,
    capabilityGaps:
      `Capability gaps for ${company}:\n` +
      `- People: named system owner, backup operator, quality reviewer, and sponsor cadence.\n` +
      `- Tools: monitoring dashboard, deployment runtime, vendor opt-out confirmation, and support tier.\n` +
      `- Partnerships: implementation partner, security/legal review, and vendor support agreement.\n` +
      `- Governance: system-card owner, quarterly re-scoring cadence, incident review routine.`,
    executiveScorecard:
      `Executive scorecard for ${company} AI program:\n` +
      `- Live systems: target >= 1 by Q1, >= 2 by Q3.\n` +
      `- Pilots running: 2 with named readiness review dates.\n` +
      `- Spend vs. M08 model: within +/-15% per quarter.\n` +
      `- HITL load: stable or declining quarter-over-quarter.\n` +
      `- Open incidents: 0 critical; all warnings owned.\n` +
      `- Governance docs current: 100% of live systems.\n` +
      `- Realised impact: hours/euros/risk reduction reported quarterly.`,
    nextPilotCycle:
      `Next pilot cycle gates for ${company}:\n` +
      `1. Named owner with explicit time allocation.\n` +
      `2. Current M09 score; no critical reason-code blockers.\n` +
      `3. Data layer inventoried to course standard.\n` +
      `4. Governance pre-cleared in ${country}.\n` +
      `5. Rollback path written before kickoff.\n` +
      `6. Budget locked within M08 envelope.\n` +
      `7. Sponsor review cadence set.`,
    executiveSummary:
      `Executive summary - ${company} AI program, 12 months.\n\n` +
      `Bet. The M09 portfolio identifies one top candidate to scale and a short list of constrained pilots. The roadmap sequences these across Now (0-3m), Next (3-9m), and Later (9-12m).\n\n` +
      `Roadmap. Now: scale the top M09 candidate and close monitoring on the live workflow. Next: launch two constrained pilots and bring one candidate to the pilot-readiness review. Later: prepare deferred candidates by closing governance, data, and partnership gaps.\n\n` +
      `Gaps being closed. A named system owner and backup; a monitoring dashboard; implementation/security/legal partners; vendor terms; current system cards and operating playbooks; quarterly portfolio re-scoring.\n\n` +
      `Stop conditions. Quality stop condition breached; governance documentation not closed by the agreed quarter; partner not under contract by checkpoint; cost overrun > 30% vs. M08; critical incident with AI-system root cause.\n\n` +
      `Review cadence. Monthly sponsor scorecard, quarterly M09 re-score, annual roadmap re-issue. The roadmap changes when the portfolio changes.`,
  };
}
