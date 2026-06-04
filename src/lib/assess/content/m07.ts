import type {
  ADRSection,
  InvoiceOcrProfileContext,
  StackLayer,
  ToolCriterion,
  ToolDecisionScaffold,
} from "./types";

export const M07_COURSE_CONTENT = {
  placeholder: false,

  storyHeader:
    "Tools & Platforms. The pilot stack is a hypothesis. M07 turns tool choice into a governed decision: what to keep, what to replace, and what to constrain.",

  step1: {
    title: "Pilot stack inventory",
    why:
      "Before judging tools, name every layer the AI system depends on. A forgotten layer cannot be governed, costed, monitored, or supported.",
    example:
      "A support-triage stack might include a model provider, knowledge base, intake surface, workflow runtime, CRM/ticketing system, and monitoring/audit layer.",
    whatToNotice: [
      "Every layer has an owner and vendor, even if it feels invisible",
      "A gap is a layer where the production answer is still unknown",
      "The system of record is often fixed; the surrounding AI stack is where choices happen",
    ],
    produces: "Stack inventory with a named tool and gap for every layer",
    nextLabel: "Step 2 - governance comparison",
  },

  step2: {
    title: "Governance comparison matrix",
    why:
      "Production governance is multidimensional. Compare the pilot stack with one alternative across the eight criteria so trade-offs are visible.",
    example:
      "Compare the pilot stack against a stronger enterprise option. Score each criterion 1-5. Evidence notes are useful, but the first pass can be made through scores alone.",
    whatToNotice: [
      "Residency and training opt-out are contractual, not marketing",
      "Audit logs need to be exportable, not just visible",
      "Vendor stability includes roadmap, support model, and incident history",
    ],
    produces: "Two-platform comparison matrix with optional evidence notes",
    nextLabel: "Step 3 - write the ADR",
  },

  step3: {
    title: "Tool Selection ADR",
    why:
      "An ADR records why the team made a tool decision. It protects future teams from reopening the same debate without evidence.",
    example:
      "Six sections: context, options considered, decision, rationale, consequences, review plan. Short, dated, and reviewable.",
    whatToNotice: [
      "Consequences include the bad ones",
      "A decision without a review date becomes permanent by accident",
      "Options must include the option you rejected and why",
    ],
    produces: "A complete ADR ready to attach to the operating plan",
    nextLabel: "Step 4 - keep / replace / constrain",
  },

  step4: {
    title: "Pilot-to-production stack decision",
    why:
      "Three honest endings: keep the pilot stack, replace it for production, or keep it only with named constraints.",
    example:
      "Keep if the stack clears governance. Replace if a criterion fails and cannot be closed. Constrain if the stack is acceptable only for bounded use.",
    whatToNotice: [
      "Constrain is often the most honest production answer",
      "Constraints must be enforceable, not aspirational",
      "Replace decisions name the replacement and migration owner",
    ],
    produces: "A signed stack decision: keep, replace, or constrain",
  },

  stackLayers: [
    {
      id: "assistant",
      label: "Assistant or prompt layer",
      pilotExample: "The model, prompt contracts, and grounded assistant behavior designed in M03-M04.",
      productionQuestion: "Is the model or assistant provider safe for the data class, geography, and operating risk?",
    },
    {
      id: "prototype",
      label: "User-facing surfaces",
      pilotExample: "The intake, review, decision, and audit surfaces from M05.",
      productionQuestion: "Can these surfaces support real users, roles, authentication, and audit expectations?",
    },
    {
      id: "agent_orchestration",
      label: "Workflow / agent orchestration",
      pilotExample: "The bounded runtime designed in M06 that calls tools and stops for HITL.",
      productionQuestion: "Does the platform support scoped tools, retries, approvals, and full step-level logging?",
    },
    {
      id: "accounting_system",
      label: "System of record",
      pilotExample: "The CRM, HRIS, ticketing, document, finance, or workflow system the team already uses.",
      productionQuestion: "Does the system support safe draft writes, approvals, reversals, and scoped service accounts?",
    },
    {
      id: "monitoring",
      label: "Monitoring & audit",
      pilotExample: "Application logs, event history, review queue metrics, and audit trail from M06.",
      productionQuestion: "Are logs exportable, tamper-evident, retained, and usable in incident review?",
    },
  ] as const satisfies readonly StackLayer[],

  criteria: [
    {
      id: "capability",
      label: "Capability",
      question: "Does the tool do the job at the quality and scale we need?",
      productionRisk: "A good demo can still fail long-context, multi-step, multilingual, or edge production cases.",
      evidenceToCollect: "Benchmark results on representative cases plus a stress test at expected volume.",
    },
    {
      id: "cost",
      label: "Cost",
      question: "Is total cost acceptable at production volume?",
      productionRisk: "Per-call pricing that works in pilot can become structurally unaffordable at scale.",
      evidenceToCollect: "Cost model at expected and 3x expected volume, including support and review time.",
    },
    {
      id: "residency",
      label: "Data residency",
      question: "Where is data processed and stored, and is that location contractually guaranteed?",
      productionRisk: "A vendor that usually processes in-region may still fail GDPR or sector rules.",
      evidenceToCollect: "DPA clause, region-pinning configuration, and sub-processor list.",
    },
    {
      id: "training",
      label: "Training opt-out",
      question: "Is customer/company data excluded from model training by contract?",
      productionRisk: "Defaults can allow training; sensitive data leakage into a model is not recoverable.",
      evidenceToCollect: "Signed no-training clause and API setting that enforces it.",
    },
    {
      id: "mcp",
      label: "MCP / tool support",
      question: "Does the platform support scoped, schemaed tools with per-call permissions and logs?",
      productionRisk: "An agent without tool boundaries is one prompt away from unsafe action.",
      evidenceToCollect: "Tool schema example, permission boundary, and per-call log sample.",
    },
    {
      id: "audit",
      label: "Audit logs",
      question: "Are step-level logs available, exportable, and tamper-evident?",
      productionRisk: "Logs that only live in a vendor UI cannot defend an audit or incident review.",
      evidenceToCollect: "Sample exported log, retention policy, and integrity mechanism.",
    },
    {
      id: "compliance",
      label: "Compliance",
      question: "Does the vendor hold the certifications this context requires?",
      productionRisk: "Marketing pages list certifications; scoped reports and contracts are what count.",
      evidenceToCollect: "Current SOC2/ISO report, GDPR DPA, and sector addendum if required.",
    },
    {
      id: "stability",
      label: "Vendor stability",
      question: "Can we depend on this vendor for the next 12-24 months?",
      productionRisk: "Pricing changes, deprecations, acquisitions, or outages can void the decision.",
      evidenceToCollect: "Funding/ownership status, support terms, deprecation policy, and incident history.",
    },
  ] as const satisfies readonly ToolCriterion[],

  adrSections: [
    { id: "context", title: "Context", prompt: "What system and constraints are we deciding for? Include the pilot result." },
    { id: "options", title: "Options considered", prompt: "Name at least two real options with their key trade-offs." },
    { id: "decision", title: "Decision", prompt: "State the chosen option in one sentence. No hedging." },
    { id: "rationale", title: "Rationale", prompt: "Why this option won - tied to the eight governance criteria." },
    { id: "consequences", title: "Consequences", prompt: "Good and bad consequences. Name the bad ones explicitly." },
    { id: "review", title: "Review plan", prompt: "When and on what evidence will this decision be re-examined?" },
  ] as const satisfies readonly ADRSection[],

  decisionOptions: [
    {
      id: "keep" as const,
      label: "Keep",
      summary: "The pilot stack clears the governance criteria. Move it forward as-is.",
    },
    {
      id: "replace" as const,
      label: "Replace",
      summary: "A criterion fails and cannot be closed contractually. Migrate to the alternative.",
    },
    {
      id: "constrain" as const,
      label: "Constrain",
      summary: "Keep the stack only inside enforceable guardrails such as data class, region, volume, or write boundary.",
    },
  ] as const,

  methodNote:
    "Tool choice is governance made concrete. Pick on evidence, document the trade-off, and set a review date before production.",
} as const;

export function getM07ToolDecisionScaffold(
  ctx: InvoiceOcrProfileContext,
): ToolDecisionScaffold {
  const company = ctx.companyName ?? "your company";
  const country = ctx.country ?? "your region";

  return {
    context:
      `At ${company}, we have a pilot AI workflow that combines prompts/assistant behavior, a user-facing workflow surface, an orchestration layer, a system of record, and monitoring. We now need to decide whether the current stack is acceptable for production governance in ${country}.`,
    options:
      `Option A - Keep the pilot stack as the production stack.\n` +
      `Option B - Replace one or more layers with an enterprise-ready alternative.\n` +
      `Option C - Keep the stack but constrain it with enforceable limits on data class, geography, volume, autonomy, or integrations.`,
    decision:
      `We will [keep / replace / constrain] the pilot stack for the selected AI workflow at ${company}.`,
    rationale:
      `The decision is based on capability, cost, residency, training opt-out, MCP/tool support, audit logs, compliance, and vendor stability. The chosen option best fits ${company}'s operating obligations in ${country}.`,
    consequences:
      `Good: the team has a defensible tool decision with named governance evidence. Bad: some constraints may slow rollout, one vendor may remain a dependency, and production support will require a named owner and review cadence.`,
    reviewPlan:
      `Re-examine in 6 months or sooner if the workflow expands to a new team, the vendor changes terms or pricing, a residency/compliance change affects ${country}, or production volume exceeds the pilot assumptions.`,
  };
}
