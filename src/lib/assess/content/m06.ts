import type {
  AgentCapability,
  Gate2Criterion,
  HitlCheckpoint,
  IntegrationPlanItem,
  InvoiceOcrProfileContext,
  M06AgentScaffold,
  PilotMetric,
} from "./types";

export const M06_COURSE_CONTENT = {
  placeholder: false,

  storyHeader:
    "AI Agents & Pilot. An agent is where the system starts doing work. The question is not whether it can act. The question is where it must stop.",

  step1: {
    title: "Agent design - goal, tools, memory, action boundary",
    why:
      "An assistant answers. An agent acts. Before wiring tools, write the agent's goal, workflow, tool policy, memory policy, and pilot scope.",
    example:
      "For a lead-routing agent: the goal is to move a lead from intake to a routed, reviewable state - not to close a deal or modify customer records without approval.",
    whatToNotice: [
      "Goal is bounded",
      "Workflow is short enough to fit on one page",
      "Tool policy names forbidden actions, not just allowed ones",
      "Memory has a lifespan and deletion trigger",
    ],
    produces: "Agent design blueprint - five scaffold fields filled in",
    nextLabel: "Step 2 - integration plan",
  },

  step2: {
    title: "Tool/MCP integration plan",
    why:
      "MCP-style integration means the agent reaches external systems through named tools with scoped permissions, schemas, and logs.",
    example:
      "Record system, CRM/ticketing system, notification channel, audit log. Each integration is mocked, read_only, write_with_approval, or deferred.",
    whatToNotice: [
      "A planned status is a decision",
      "write_with_approval is the only safe path to a real write in the pilot",
      "Read-only access still needs a log",
      "Deferred integrations belong on the post-pilot list",
    ],
    produces: "Integration map - posture chosen for all four systems",
    nextLabel: "Step 3 - HITL checkpoints",
  },

  step3: {
    title: "HITL checkpoints and escalation policy",
    why:
      "Human-in-the-loop is the non-negotiable safety primitive. Five triggers must each get a severity: required, recommended, or not applicable.",
    example:
      "Low confidence -> recommended. Missing required field -> required. Policy conflict -> required. Write/sync -> required. Exception or injection -> required.",
    whatToNotice: [
      "Required means the agent stops and waits",
      "Write/sync and exception/injection are required by design",
      "Every checkpoint names what the human decides",
    ],
    produces: "HITL policy - severity chosen for all five checkpoints",
    nextLabel: "Step 4 - controlled pilot plan",
  },

  step4: {
    title: "Controlled pilot plan",
    why:
      "A pilot is not a soft launch. It has a named population, fixed time window, rollback owner, and metric targets.",
    example:
      "Population: one sales or support team using sandbox records. Window: two weeks. Rollback owner: named operations lead. Metrics: accuracy, cycle time, HITL rate, exception rate, audit completeness.",
    whatToNotice: [
      "Population is people and data - both bounded",
      "Time window has an end date",
      "Rollback owner is one named person",
      "Every metric has a measurement method",
    ],
    produces: "Pilot plan - population, window, rollback owner, and five metric targets",
    nextLabel: "Step 5 - pilot-readiness review dossier",
  },

  step5: {
    title: "pilot-readiness review dossier",
    why:
      "pilot-readiness asks whether the agent is ready to expand from the controlled pilot. The dossier synthesizes design, integrations, HITL, and pilot plan.",
    example:
      "The dossier names goal clarity, tool permissions, HITL coverage, pilot scope, rollback, auditability, metric targets, and residual risk.",
    whatToNotice: [
      "Residual risk is named, not assumed to be zero",
      "Auditability is a readiness review criterion",
      "Metric targets without measurement are unverifiable",
    ],
    produces: "pilot-readiness review dossier - ready for the readiness review route",
  },

  capabilities: [
    {
      id: "extract",
      title: "Extract",
      goal: "Read an input record and extract required fields.",
      actionBoundary:
        "May call an extraction tool. May not invent missing fields - must mark them as missing.",
      evidenceRequired: "Per-field confidence and source evidence.",
    },
    {
      id: "validate",
      title: "Validate",
      goal: "Check fields against schema, policy, and routing rules.",
      actionBoundary:
        "May apply approved rules. May not finalize legal, financial, HR, or customer commitments.",
      evidenceRequired: "Validation result per field with the rule id that fired.",
    },
    {
      id: "sync",
      title: "Sync",
      goal: "Write or export approved records to the target system.",
      actionBoundary:
        "May only write after explicit approval. Must be idempotent and reversible.",
      evidenceRequired: "External record id, write timestamp, and reversal handle.",
    },
    {
      id: "notify",
      title: "Notify",
      goal: "Notify the right human at the right checkpoint.",
      actionBoundary:
        "May notify named reviewers. May not email external parties or broadcast sensitive data.",
      evidenceRequired: "Recipient, channel, message id, and checkpoint trigger.",
    },
    {
      id: "audit",
      title: "Audit",
      goal: "Persist a defensible trail of events, edits, decisions, and reasons.",
      actionBoundary:
        "Must append events. May not edit or delete past audit entries.",
      evidenceRequired: "Event id, actor, timestamp, before/after snapshot, reason.",
    },
  ] as const satisfies readonly AgentCapability[],

  integrations: [
    {
      id: "document_storage",
      system: "Record source",
      toolPurpose: "Read the input record and write extraction artifacts.",
      allowedActions: ["read record by id", "write analysis artifact for record id"],
      forbiddenActions: ["bulk export", "delete original record", "share outside workspace"],
      loggingRequired: "Every read and write logged with user, record id, tool, timestamp.",
    },
    {
      id: "accounting_system",
      system: "Operating system",
      toolPurpose: "Write or export approved workflow records.",
      allowedActions: ["create draft record", "attach artifact", "post after approval"],
      forbiddenActions: ["post without approval", "modify historical records", "trigger irreversible action"],
      loggingRequired: "Every call logged with approver, payload hash, response id, reversal handle.",
    },
    {
      id: "notification",
      system: "Notification channel",
      toolPurpose: "Notify named reviewers when a checkpoint requires a decision.",
      allowedActions: ["DM a named reviewer", "post in a closed reviewer channel"],
      forbiddenActions: ["email external addresses", "broadcast to wider org"],
      loggingRequired: "Every notification logged with recipient, checkpoint, message id.",
    },
    {
      id: "audit_log",
      system: "Audit log",
      toolPurpose: "Persist immutable events for every agent step and human decision.",
      allowedActions: ["append event", "read event history for a record id"],
      forbiddenActions: ["edit past events", "delete events", "redact retroactively"],
      loggingRequired: "Log itself is the audit - integrity check runs daily.",
    },
  ] as const satisfies readonly IntegrationPlanItem[],

  hitlCheckpoints: [
    {
      id: "low_confidence",
      trigger: "Any extracted or classified field below the confidence threshold.",
      agentMustDo: "Pause sync. Surface the field, confidence, and evidence.",
      humanMustDecide: "Accept, edit, or send back for re-processing.",
    },
    {
      id: "missing_required",
      trigger: "A required field or rule is missing.",
      agentMustDo: "Stop. Show the schema rule and what is missing.",
      humanMustDecide: "Provide the value, reject the record, or flag the owner.",
    },
    {
      id: "policy_conflict",
      trigger: "Validation hits a policy, privacy, legal, security, or escalation rule.",
      agentMustDo: "Stop. Cite the rule and conflicting field.",
      humanMustDecide: "Apply the rule, override with reason, or escalate.",
    },
    {
      id: "payment_or_sync",
      trigger: "About to write to the operating system or trigger an irreversible action.",
      agentMustDo: "Stop. Show the full diff and reversal path.",
      humanMustDecide: "Approve the write, modify the payload, or cancel.",
    },
    {
      id: "exception",
      trigger: "Exception, unexpected tool error, or suspected prompt injection.",
      agentMustDo:
        "Stop immediately. Quarantine the record. Log the trigger and inputs that caused it.",
      humanMustDecide: "Investigate, release back into the loop, or block the source.",
    },
  ] as const satisfies readonly HitlCheckpoint[],

  pilotMetrics: [
    {
      id: "accuracy",
      label: "Classification/extraction accuracy",
      target: "At least 90% on required fields against the answer key",
      measurement: "Per-field or per-label comparison vs expected outputs over the pilot set.",
    },
    {
      id: "cycle_time",
      label: "Cycle time",
      target: "Median intake -> decision-ready under the agreed workflow threshold",
      measurement: "Timestamp delta from intake event to first decision-ready state.",
    },
    {
      id: "hitl_rate",
      label: "HITL rate",
      target: "Required-HITL stops stay within planned reviewer capacity, with zero skipped writes/syncs",
      measurement: "Required checkpoints fired divided by records processed.",
    },
    {
      id: "exception_rate",
      label: "Exception rate",
      target: "No unresolved critical exceptions at pilot close",
      measurement: "Exception checkpoint events divided by records processed.",
    },
    {
      id: "audit_completeness",
      label: "Audit completeness",
      target: "100% of pilot records have full event trail",
      measurement: "Spot-check sample plus daily integrity job on the audit log.",
    },
  ] as const satisfies readonly PilotMetric[],

  gate2Criteria: [
    { id: "goal_clarity", label: "Goal clarity", question: "Is the agent's goal bounded and stated in one sentence?" },
    { id: "tool_permissions", label: "Tool permissions", question: "Are allowed and forbidden actions named for every integration?" },
    { id: "hitl_coverage", label: "HITL coverage", question: "Are write/sync and exception/injection both required checkpoints?" },
    { id: "pilot_scope", label: "Pilot scope", question: "Are population, time window, and data set explicitly bounded?" },
    { id: "rollback", label: "Rollback", question: "Is there a named rollback owner and a working reversal path?" },
    { id: "auditability", label: "Auditability", question: "Does every action produce an immutable audit event with evidence?" },
    { id: "metric_targets", label: "Metric targets", question: "Does every pilot metric have a target and measurement method?" },
    { id: "residual_risk", label: "Residual risk", question: "Is residual risk named, owned, and acceptable for the pilot scope?" },
  ] as const satisfies readonly Gate2Criterion[],

  methodNote:
    "Agents need brakes before they need speed. A pilot is successful when the stop conditions are as clear as the success metrics.",
} as const;

export function getM06AgentScaffold(ctx: InvoiceOcrProfileContext): M06AgentScaffold {
  const company = ctx.companyName ?? "your company";
  const country = ctx.country ?? "your region";

  return {
    agentGoal:
      `Move a candidate record at ${company} from intake to a reviewed, decision-ready state in ${country}. The agent does not make irreversible decisions or external commitments without explicit human approval.`,
    workflow:
      "1. Capture: receive the record and open an audit trail.\n2. Extract/classify: return structured fields with confidence and evidence.\n3. Validate: apply schema and contextual rules; flag conflicts and missing fields.\n4. HITL: if a required checkpoint fires, stop and notify the reviewer.\n5. Sync: after approval, write or export a draft record with reversal handle.\n6. Audit: append every agent and human step as immutable events.",
    toolPolicy:
      "Allowed tools: record source, operating system, notification channel, audit log.\nForbidden: irreversible action without approval, external email, bulk export, historical record edits, retroactive audit edits. Every tool call is logged with actor, payload hash, and response id.",
    memoryPolicy:
      "Working memory: only the current record, extracted fields, validation results, and reviewer actions, kept until decision is recorded.\nPersistent memory: audit events only, retained per policy.\nNo cross-record learning inside the pilot.",
    pilotScope:
      `Population: one team at ${company} using mock or sandbox workflow records in ${country}.\nTime window: two weeks with fixed review date.\nRollback owner: one named operations lead with documented reversal path.\nOut of scope: irreversible decisions, external commitments, unapproved production writes, and cases outside the pilot rules.`,
  };
}
