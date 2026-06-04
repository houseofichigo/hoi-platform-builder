import type {
  ArchitectureChoice,
  CostCategory,
  DeploymentPlanScaffold,
  InvoiceOcrProfileContext,
  PlanSection,
  SecurityRisk,
} from "./types";

export const M08_COURSE_CONTENT = {
  placeholder: false,

  storyHeader:
    "Integration & Deployment Planning. A pilot becomes accountable when architecture, data flow, security, cost, rollback, and partner handoff are explicit.",

  step1: {
    title: "Architecture choices",
    why:
      "Before writing the plan, lock four architecture choices. Each one has consequences that are hard to reverse once partners build against them.",
    example:
      "Hosting, model/provider, orchestration, and storage/audit. Managed choices can move faster; self-managed choices may give more control but require more operating capability.",
    whatToNotice: [
      "Defaults are decisions",
      "Self-hosting can reduce residency risk but raises operational burden",
      "Managed orchestration shortens delivery; custom orchestration widens control and support work",
    ],
    produces: "Four architecture choices with optional rationale",
    nextLabel: "Step 2 - security risks",
  },

  step2: {
    title: "Security & data-flow risks",
    why:
      "A deployment plan that does not name its top risks is not a plan. Pick the three risks most likely to matter first and attach controls partners can implement.",
    example:
      "Webhook spoofing, PII leakage through prompts/logs, schema drift, secret exposure, audit gaps, or over-permissioned tool access.",
    whatToNotice: [
      "A mitigation is a control someone can verify",
      "Each risk needs evidence the mitigation works",
      "Three is the limit on purpose - pick the risks you would defend first",
    ],
    produces: "Top three security risks with generated mitigations and evidence",
    nextLabel: "Step 3 - cost model",
  },

  step3: {
    title: "Cost model",
    why:
      "If you cannot estimate monthly spend, you cannot defend the plan. Cost lives across tokens, specialist APIs, infrastructure, licensing, support, and human review.",
    example:
      "Estimate volume, unit cost, and assumption notes. Include retries, monitoring, storage, and review time.",
    whatToNotice: [
      "Unit cost times volume is the floor",
      "Human review is real cost, not a free externality",
      "Cost grows with exception rate, HITL rate, and re-runs",
    ],
    produces: "Monthly cost estimate by category",
    nextLabel: "Step 4 - integration plan",
  },

  step4: {
    title: "Integration plan & rollback",
    why:
      "A partner-ready plan is short, accountable, and reversible. If it cannot fit on two pages, it is probably not yet a plan.",
    example:
      "Each section is explicit about ownership. Rollback names a single owner, a kill switch, and the path back to manual operation.",
    whatToNotice: [
      "A rollback without an owner is not a rollback",
      "Partner handoff lists deliverables and acceptance criteria",
      "Every section answers who is accountable when this breaks",
    ],
    produces: "A 1-2 page Integration & Deployment Plan",
  },

  architectureChoices: [
    {
      id: "hosting",
      label: "Hosting",
      options: ["Managed cloud (region-pinned)", "Self-hosted in our cloud account", "On-premise / private datacenter"],
      recommendedDefault: "Managed cloud (region-pinned)",
      decisionQuestion: "Where do application data, artifacts, and audit events live at rest?",
    },
    {
      id: "model",
      label: "Model / provider",
      options: ["Managed model API with no-training clause", "Open-weights model on our infrastructure", "Hybrid: managed for language, internal for sensitive validation"],
      recommendedDefault: "Managed model API with no-training clause",
      decisionQuestion: "What model or provider serves the workflow, and under what data-use terms?",
    },
    {
      id: "orchestration",
      label: "Orchestration",
      options: ["Managed agent runtime", "Custom orchestration inside our app", "Workflow tool such as n8n, Power Automate, or Zapier"],
      recommendedDefault: "Managed agent runtime",
      decisionQuestion: "What runtime executes the workflow and enforces tool boundaries?",
    },
    {
      id: "storage",
      label: "Storage & audit",
      options: ["Managed DB + object store + log service", "Self-managed Postgres + object store", "Mixed: managed audit, self-hosted documents"],
      recommendedDefault: "Managed DB + object store + log service",
      decisionQuestion: "Where do inputs, structured outputs, and audit events live, and who can read them?",
    },
  ] as const satisfies readonly ArchitectureChoice[],

  securityRisks: [
    {
      id: "webhook_spoofing",
      title: "Webhook spoofing",
      threat: "An attacker forges callbacks from an integration and triggers a write, notification, or HITL bypass.",
      mitigation: "HMAC-signed webhooks with rotated secrets, timestamp window, and replay protection.",
      evidence: "Signed test vector plus rejected unsigned request in logs.",
    },
    {
      id: "pii_leakage",
      title: "PII leakage",
      threat: "Customer, employee, supplier, or commercial data leaks through prompts, logs, analytics, or vendor systems.",
      mitigation: "Field allowlist, prompt/log redaction, DPA coverage, and no-training clause.",
      evidence: "Sample redacted log, DPA clause reference, and redaction test.",
    },
    {
      id: "schema_drift",
      title: "Schema drift",
      threat: "A target system changes its API or schema and the workflow silently writes malformed data.",
      mitigation: "Contract tests, schema version pinning, and alerting on validation failure spikes.",
      evidence: "Contract test report, schema version record, and alert rule.",
    },
    {
      id: "secret_exposure",
      title: "Secret exposure",
      threat: "API keys or service credentials leak through repo history, environment dumps, screenshots, or logs.",
      mitigation: "Central secret store, scoped service accounts, short-lived tokens, and secret scanning.",
      evidence: "Secret inventory, scanner config, and rotation log.",
    },
    {
      id: "audit_gaps",
      title: "Audit gaps",
      threat: "A failed tool call, skipped review, or manual override leaves no record.",
      mitigation: "Append events for success, failure, override, and cancellation paths; run daily integrity checks.",
      evidence: "Failure-path event sample, integrity job report, and retention policy.",
    },
    {
      id: "over_permissioned_tools",
      title: "Over-permissioned tools",
      threat: "The workflow can read or write more than the use case requires.",
      mitigation: "Least-privilege tool schemas, per-tool scopes, and approval required for writes.",
      evidence: "Tool schema, permission matrix, and audit event for a blocked action.",
    },
  ] as const satisfies readonly SecurityRisk[],

  costCategories: [
    {
      id: "tokens",
      label: "LLM tokens",
      driver: "Prompt + completion tokens per run x monthly runs x retries.",
      estimationMethod: "Measure a representative batch; multiply by expected volume and retry buffer.",
    },
    {
      id: "ocr_api",
      label: "Specialist API / processing",
      driver: "Documents, messages, records, or pages x per-unit provider price.",
      estimationMethod: "Average units per workflow x monthly workflow volume x vendor price.",
    },
    {
      id: "infrastructure",
      label: "Infrastructure",
      driver: "Compute, storage, queueing, egress, backups, and monitoring.",
      estimationMethod: "Baseline platform spend plus per-run marginal cost.",
    },
    {
      id: "licensing",
      label: "Licensing & tools",
      driver: "Agent platform, monitoring, admin seats, vendor support, and implementation tooling.",
      estimationMethod: "Per-seat x users plus platform fees and support tier.",
    },
    {
      id: "human_review",
      label: "Human review",
      driver: "Review minutes per case x HITL rate x fully-loaded reviewer cost.",
      estimationMethod: "Reviewer minutes/case x expected cases x hourly cost.",
    },
  ] as const satisfies readonly CostCategory[],

  planSections: [
    { id: "architecture", title: "Architecture", prompt: "Hosting, model/provider, orchestration, storage - chosen options and rationale." },
    { id: "dataFlow", title: "Data flow", prompt: "Where data enters, transits, is stored, leaves, and is deleted. Name each system." },
    { id: "securityRisks", title: "Security risks", prompt: "Top three risks, mitigations, and how they will be verified." },
    { id: "costModel", title: "Cost model", prompt: "Monthly estimate by category with stated assumptions." },
    { id: "rollback", title: "Rollback", prompt: "Reversal path, kill switch, and the single owner who can execute it." },
    { id: "partnerHandoff", title: "Partner handoff", prompt: "Deliverables, acceptance criteria, owners, and review cadence." },
  ] as const satisfies readonly PlanSection[],

  methodNote:
    "A deployment plan is an operating contract. Keep it short, dated, owned, and reversible.",
} as const;

export function getM08DeploymentPlanScaffold(
  ctx: InvoiceOcrProfileContext,
): DeploymentPlanScaffold {
  const company = ctx.companyName ?? "your company";
  const country = ctx.country ?? "your region";

  return {
    architecture:
      `Hosting: managed cloud, region-pinned for ${country}. ` +
      `Model/provider: managed API with a signed no-training clause for ${company} data. ` +
      `Orchestration: managed workflow or agent runtime with scoped tools and per-call logging. ` +
      `Storage: managed database, object store, and append-only audit log under the ${company} tenant.`,
    dataFlow:
      `1. Intake: a user or system submits the workflow input.\n` +
      `2. Process: the orchestration runtime calls approved model/tool steps with only allowlisted fields.\n` +
      `3. Validate: rules, confidence thresholds, and HITL checkpoints run before any write.\n` +
      `4. Act: approved outputs are drafted or synced to the system of record with a reversal handle.\n` +
      `5. Audit: every step is appended to the audit log.\n` +
      `6. Retain/delete: source data and generated artifacts follow the retention rule for ${country}.`,
    securityRisks:
      `Top risks for ${company}:\n` +
      `1. Integration spoofing - signed callbacks and replay protection.\n` +
      `2. Sensitive data leakage - field allowlist, prompt/log redaction, and no-training clause.\n` +
      `3. Audit gaps - events on success, failure, override, and cancellation paths.`,
    costModel:
      `Monthly estimate for ${company}: LLM tokens plus specialist API/processing units, infrastructure, licensing/support, and human review. Review monthly against actual usage and reforecast if volume, HITL rate, or exception rate changes.`,
    rollback:
      `Single named owner holds the kill switch. Rollback path: pause orchestration, revoke service-account credentials, route new cases to manual operation, and reverse any draft writes through the system of record. Notify operations and IT within the agreed incident window.`,
    partnerHandoff:
      `Partner deliverables: deployed environment, integration contract, monitoring dashboard, runbook, signed M07 ADR, and rollback drill. Acceptance criteria: signed callbacks verified, sensitive-data controls tested, audit integrity green for two consecutive weeks, cost dashboard live, and rollback exercised end-to-end.`,
  };
}
