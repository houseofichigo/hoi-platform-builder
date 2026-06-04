import type {
  DocumentationLayer,
  DocumentationScaffold,
  HandoffStage,
  InvoiceOcrProfileContext,
  PlaybookRoutine,
  SystemCardSection,
} from "./types";

export const M10_COURSE_CONTENT = {
  placeholder: false,

  storyHeader:
    "Documentation & Adoption. A useful AI system must survive the original builder. M10 turns implicit knowledge into an operating pack another team can run.",

  step1: {
    title: "Documentation outline",
    why:
      "Three layers - architecture, decisions, governance - give the next operator a map. Skipping a layer turns the system into one person's secret.",
    example:
      "Architecture: what runs where. Decisions: the ADR from M07 and deployment plan from M08. Governance: who can override, who is notified, who owns the kill switch.",
    whatToNotice: [
      "Architecture documents the system, not just the code",
      "Decisions link to the ADRs already written in M07",
      "Governance names humans, not vague roles",
    ],
    produces: "A three-layer documentation outline another operator can navigate",
    nextLabel: "Step 2 - system card + playbook",
  },

  step2: {
    title: "System card + operating playbook",
    why:
      "The system card is the governance documentation surface: purpose, users, data, risks, oversight. The playbook is what operators open on Monday morning.",
    example:
      "System card: intended purpose, users, data, behavior, oversight, risks, monitoring, change management. Playbook: queue check, quality review, cost review, incident response.",
    whatToNotice: [
      "The system card answers reviewers; the playbook answers operators",
      "Tacit moves to explicit: every implicit step becomes a routine",
      "Each routine has an escalation rule",
    ],
    produces: "A system card and a 2-3 page operator playbook",
    nextLabel: "Step 3 - five-stage handoff",
  },

  step3: {
    title: "Five-stage handoff plan",
    why:
      "Ownership transferred in one meeting fails. Review -> Shadow -> Joint -> Backup -> Ownership gives the operator real practice before holding the keys.",
    example:
      "Review: operator reads everything. Shadow: operator watches. Joint: they run it together. Backup: operator runs it with builder on call. Ownership: operator owns it.",
    whatToNotice: [
      "Each stage has an exit criterion, not just a date",
      "Backup is the longest stage; do not collapse it",
      "Ownership requires a named operator and a named backup",
    ],
    produces: "A handoff plan with five stages, named operator, named backup, and exit criteria",
    nextLabel: "Complete M10 - M11",
  },

  documentationLayers: [
    {
      id: "architecture",
      title: "Architecture layer",
      purpose:
        "Describe what runs where, how data moves, and which system boundaries must be honoured.",
      mustInclude: [
        "Component diagram: interface, assistant/prompt layer, agent/workflow runtime, system of record, audit",
        "Data flow with residency, retention, and deletion rule",
        "Integration map and credentials/service-account inventory",
      ],
    },
    {
      id: "decisions",
      title: "Decisions layer",
      purpose:
        "Capture the decision trail so future operators understand why the system looks the way it does.",
      mustInclude: [
        "Tool Selection ADR from M07",
        "Deployment plan summary from M08",
        "Portfolio decision and constraints from M09",
      ],
    },
    {
      id: "governance",
      title: "Governance layer",
      purpose:
        "Name the humans and controls: override rights, notification paths, review cadence, and kill switch.",
      mustInclude: [
        "Named owner, named backup, escalation chain",
        "HITL checkpoints and override log policy",
        "Change-management and review cadence",
      ],
    },
  ] as const satisfies readonly DocumentationLayer[],

  systemCardSections: [
    {
      id: "intended_purpose",
      title: "Intended purpose",
      prompt:
        "What the system is for, what it is not for, and which population of inputs it handles.",
    },
    {
      id: "users",
      title: "Users and affected parties",
      prompt:
        "Who operates the system, who is affected by outputs, and what recourse exists.",
    },
    {
      id: "data_sources",
      title: "Data sources",
      prompt:
        "Inputs and reference data, including provenance, residency, retention, and sensitivity.",
    },
    {
      id: "model_behaviour",
      title: "Model / assistant / agent behaviour",
      prompt:
        "Which models, prompts, and tools are used; what is assisted vs. autonomous.",
    },
    {
      id: "human_oversight",
      title: "Human oversight",
      prompt:
        "HITL checkpoints, override mechanism, named owner, and stop conditions.",
    },
    {
      id: "risks",
      title: "Risks and mitigations",
      prompt:
        "Top failure modes such as hallucination, data leakage, schema drift, prompt injection, and how each is mitigated.",
    },
    {
      id: "monitoring",
      title: "Monitoring",
      prompt:
        "Metrics, alert thresholds, drift detection, audit integrity, and incident triage.",
    },
    {
      id: "change_management",
      title: "Change management",
      prompt:
        "How prompts, models, tools, and knowledge are versioned, reviewed, rolled back, and re-validated.",
    },
  ] as const satisfies readonly SystemCardSection[],

  playbookRoutines: [
    {
      id: "daily_queue",
      cadence: "Daily",
      title: "Review queue check",
      operatorAction:
        "Clear the review queue. Approve, correct, reject, or escalate each item; tag the reason on every exception.",
      escalationRule:
        "If queue exceeds SLA or rejection rate doubles baseline, notify the named owner.",
    },
    {
      id: "daily_audit",
      cadence: "Daily",
      title: "Audit log integrity check",
      operatorAction:
        "Confirm yesterday's audit job is green and event count matches workflow count.",
      escalationRule:
        "On mismatch, pause new automated actions and escalate to security/platform owner.",
    },
    {
      id: "weekly_accuracy",
      cadence: "Weekly",
      title: "Quality review",
      operatorAction:
        "Sample processed cases against the answer key or expected outcome. Log quality and correction rate.",
      escalationRule:
        "If quality drops below threshold for two samples, trigger M11 stop/critical alert.",
    },
    {
      id: "weekly_exceptions",
      cadence: "Weekly",
      title: "Exception review",
      operatorAction:
        "Review the top exception reasons with the process owner. Decide which become rules, examples, or backlog items.",
      escalationRule:
        "If a new failure mode appears, open an incident and add it to the risk register.",
    },
    {
      id: "monthly_cost",
      cadence: "Monthly",
      title: "Cost + vendor review",
      operatorAction:
        "Reconcile actual spend against the M08 cost model. Confirm vendor terms, no-training posture, and support status.",
      escalationRule:
        "If spend exceeds forecast or vendor terms change, notify sponsor and finance/operations owner.",
    },
    {
      id: "incident_response",
      cadence: "Incident",
      title: "Incident response",
      operatorAction:
        "Pause automation, protect evidence, notify the owner, open an incident ticket, and route work to manual operation.",
      escalationRule:
        "All incidents reviewed within 5 business days; rollback drill within 30 days if root cause is integration-related.",
    },
  ] as const satisfies readonly PlaybookRoutine[],

  handoffStages: [
    {
      id: "review",
      title: "1. Review",
      operatorDoes:
        "Read the documentation pack end-to-end. List unclear sections and questions.",
      builderDoes:
        "Walk the operator through architecture, decisions, and governance. Answer questions in writing.",
      exitCriteria:
        "Operator can explain the system in their own words; all questions are logged and answered.",
    },
    {
      id: "shadow",
      title: "2. Shadow",
      operatorDoes:
        "Watch the builder run daily, weekly, and incident routines for one full cycle.",
      builderDoes:
        "Run routines exactly as documented and narrate what is happening.",
      exitCriteria:
        "Operator has shadowed at least one daily routine, one weekly routine, and one incident drill.",
    },
    {
      id: "joint",
      title: "3. Joint",
      operatorDoes:
        "Run routines with the builder present. Make the call; builder confirms.",
      builderDoes:
        "Stay quiet unless asked. Document every correction.",
      exitCriteria:
        "Two consecutive weeks with no correction-required interventions.",
    },
    {
      id: "backup",
      title: "4. Backup",
      operatorDoes:
        "Run all routines alone. Builder is on call but not present.",
      builderDoes:
        "Available within SLA. Track which incidents required builder support.",
      exitCriteria:
        "Four consecutive weeks where no incident required builder support beyond informational questions.",
    },
    {
      id: "ownership",
      title: "5. Ownership",
      operatorDoes:
        "Own the system. Decide changes, escalations, re-scoring triggers, and review cadence.",
      builderDoes:
        "Consulted on architectural changes only. Hands off the kill switch credential.",
      exitCriteria:
        "Named owner and backup recorded in governance log; ownership review scheduled at 90 days.",
    },
  ] as const satisfies readonly HandoffStage[],

  methodNote:
    "Governance documentation lets an accountable reviewer reconstruct the system: purpose, data, controls, validation, oversight, monitoring, and change history. The playbook is the operator-facing version of the same truth.",
};

export function getM10DocumentationScaffold(
  ctx: InvoiceOcrProfileContext,
): DocumentationScaffold {
  const company = ctx.companyName ?? "your company";
  const country = ctx.country ?? "your region";

  return {
    outline:
      `Documentation Pack - selected AI system (${company})\n\n` +
      `Layer 1 - Architecture\n` +
      `  - Component diagram: user surface, assistant/prompt layer, workflow/agent runtime, system of record, audit log\n` +
      `  - Data flow: intake -> process -> validate -> review/action -> audit -> retain/delete\n` +
      `  - Residency and retention: pinned to ${country} policy\n\n` +
      `Layer 2 - Decisions\n` +
      `  - M07 Tool Selection ADR\n` +
      `  - M08 Deployment plan\n` +
      `  - M09 portfolio decision and constraints\n\n` +
      `Layer 3 - Governance\n` +
      `  - Named owner and backup\n` +
      `  - HITL checkpoints and override log policy\n` +
      `  - Change management, review cadence, rollback path`,
    systemCard:
      `Intended purpose: Support the selected ${company} AI workflow by helping operators classify, draft, route, summarize, validate, or prepare actions for human review. Not for irreversible decisions without approval.\n\n` +
      `Users and affected parties: Operators use the system; customers, employees, suppliers, or partners may be affected by outputs depending on the workflow.\n\n` +
      `Data sources: approved workflow inputs, reference documents, knowledge-base artifacts, and audit events in ${country}. Sensitive fields follow allowlist and retention rules.\n\n` +
      `Model / assistant / agent behavior: assistant answers with grounded sources; workflow/agent steps process cases, validate outputs, and stop for HITL before high-risk actions.\n\n` +
      `Human oversight: HITL on low confidence, policy conflicts, external writes, irreversible actions, and suspected injection. Named owner holds the kill switch.\n\n` +
      `Risks and mitigations: hallucination -> source citation and tests; data leakage -> field allowlist and redaction; schema drift -> contract tests; prompt injection -> unsafe-input handling; audit gaps -> append-only event trail.\n\n` +
      `Monitoring: quality sample, correction rate, queue depth, latency, cost, drift alerts, and audit integrity checks.\n\n` +
      `Change management: prompts, models, tools, and knowledge are versioned; review cadence is monthly; re-validation runs on any material change.`,
    operatingPlaybook:
      `Operating Playbook - selected ${company} AI workflow\n\n` +
      `Daily - Review queue: clear the queue, approve/correct/reject/escalate each item, and tag exception reasons.\n` +
      `Daily - Audit integrity: confirm the previous day's audit job is green and workflow count matches event count.\n\n` +
      `Weekly - Quality review: sample processed cases, compare against expected output, and log correction rate.\n` +
      `Weekly - Exception review: convert recurring failures into rules, examples, backlog items, or risk-register entries.\n\n` +
      `Monthly - Cost + vendor: reconcile spend against the M08 model and confirm vendor terms still hold.\n\n` +
      `Incident - Kill switch: pause automation, protect evidence, notify owner, open incident ticket, and route work manually.`,
    handoffPlan:
      `Handoff plan - selected ${company} AI workflow\n\n` +
      `Review - operator reads the pack; builder answers questions in writing.\n` +
      `Shadow - operator watches one full cycle of daily, weekly, and incident routines.\n` +
      `Joint - operator runs routines; builder confirms.\n` +
      `Backup - operator runs alone; builder on call.\n` +
      `Ownership - operator owns changes, escalations, and re-scoring triggers. Review at 90 days.`,
  };
}
