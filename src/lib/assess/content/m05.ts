import type {
  AgentRequirementCard,
  InvoiceOcrProfileContext,
  PrototypeBriefScaffold,
  PrototypeSurface,
  PrototypeWalkthroughPrompt,
} from "./types";

export const M05_COURSE_CONTENT = {
  placeholder: false,

  storyHeader:
    "A prototype is a rehearsal. It makes the workflow visible before an agent can touch systems, customer data, or operational decisions.",

  step1: {
    title: "Prototype scope - four surfaces",
    why:
      "Before writing a brief, name the four surfaces the prototype must show. Intake, review, decision, and audit are the minimum loop for an AI-supported workflow.",
    example:
      "For a support-triage prototype: intake captures a request, review shows classification and evidence, decision captures human approval or routing, and audit shows the timeline.",
    whatToNotice: [
      "Each surface answers one question - collapsing two surfaces hides the failure mode",
      "Confidence and evidence belong on the review surface, not buried in audit",
      "The decision surface is where HITL becomes real, not theoretical",
      "Audit is for the reviewer who arrives later, not for the builder",
    ],
    produces: "Four acknowledged surfaces - the blueprint for the no-code brief",
    nextLabel: "Step 2 - no-code build brief",
  },

  step2: {
    title: "No-code build brief",
    why:
      "A no-code brief is a contract with the builder. It states what the prototype must show, what it must fake, and what it must never do.",
    example:
      "The brief seeds Dashboard, Intake, Review, Decision, and Audit screens; pins a MOCK DATA badge to every view; forbids real auth, real AI calls, real CRM writes, and production integrations.",
    whatToNotice: [
      "Mock data only - no real customer, employee, supplier, or contract data",
      "Sandbox rules go in the brief, not in code comments",
      "Frontend only - no production data or system writes",
      "MOCK DATA badge is always visible so no one mistakes it for the agent",
    ],
    produces: "A Lovable-ready no-code prototype brief",
    nextLabel: "Step 3 - walkthrough -> agent requirements",
  },

  step3: {
    title: "Walkthrough findings -> agent requirements",
    why:
      "The prototype only earns its keep if the walkthrough turns friction into requirements. Five prompts force the team to name what the prototype faked and what the M06 agent must actually do.",
    example:
      "Three requirement cards come out: input extraction the prototype faked, system sync the prototype faked, and HITL queue/audit persistence the prototype faked.",
    whatToNotice: [
      "Walkthrough answers are evidence - agent requirements are commitments",
      "Every fake in the prototype is a job the agent will inherit",
      "Three cards is enough - more dilutes the M06 scope",
    ],
    produces: "Three agent requirement cards ready to feed M06",
  },

  surfaces: [
    {
      id: "upload",
      order: 1,
      title: "Intake",
      purpose: "Capture the request or record and start the mock AI run.",
      mustShow: [
        "Form, upload, or message capture area",
        "Visible MOCK DATA badge",
        "Mock AI progress with a stubbed result, not a real API",
        "Source title, owner, and capture timestamp",
      ],
      sandboxRule: "No real record is uploaded or submitted - the prototype simulates progress locally.",
    },
    {
      id: "review",
      order: 2,
      title: "Review",
      purpose: "Show structured AI output with confidence, evidence, and validation warnings.",
      mustShow: [
        "Structured fields with confidence or status",
        "Evidence excerpt or source reference per field",
        "Validation warnings and missing information",
        "Visible MOCK DATA badge",
      ],
      sandboxRule: "Confidence and evidence are seeded from examples, not from a real model.",
    },
    {
      id: "approve",
      order: 3,
      title: "Decision",
      purpose: "Make the human-in-the-loop decision states explicit.",
      mustShow: [
        "Approve, reject, route, or flag actions",
        "Required note when rejecting or flagging",
        "Reviewer name and role on the decision",
        "Reminder that no real system write is performed",
      ],
      sandboxRule: "Decision only updates local state - no posting, email, CRM, or production write.",
    },
    {
      id: "audit",
      order: 4,
      title: "Audit",
      purpose: "Make the decision trail defensible for a reviewer who arrives later.",
      mustShow: [
        "Timeline of events: intake, AI draft, edits, decision",
        "Source references for each AI output",
        "Edits with before/after values and editor",
        "Final decision with reviewer and timestamp",
      ],
      sandboxRule: "Audit data lives only in the prototype - there is no real audit log persistence.",
    },
  ] as const satisfies readonly PrototypeSurface[],

  walkthroughPrompts: [
    {
      id: "reviewer_understands",
      question: "Can the reviewer understand what the AI produced?",
      captures: "Field labels, evidence, and status are legible to a non-technical reviewer.",
    },
    {
      id: "evidence_visible",
      question: "Can a reviewer see evidence and confidence quickly?",
      captures: "Evidence and confidence appear on the review surface, not hidden in audit.",
    },
    {
      id: "decision_obvious",
      question: "Is the human decision point obvious?",
      captures: "The HITL moment is unmistakable - no implicit approval-by-default.",
    },
    {
      id: "audit_defensible",
      question: "Is the audit trail defensible?",
      captures: "A reviewer can reconstruct who decided what and why.",
    },
    {
      id: "fakes_to_automate",
      question: "What did the prototype fake that the real agent must automate?",
      captures: "Named fakes become the M06 agent requirements.",
    },
  ] as const satisfies readonly PrototypeWalkthroughPrompt[],

  defaultRequirementCards: [
    {
      id: "ocr_extraction",
      title: "Input extraction and validation",
      prototypeFake: "Prototype fakes AI extraction by seeding structured fields from mock examples.",
      realAgentMust:
        "Real agent must read the input, extract required fields, validate them against the schema, and emit confidence + evidence per field.",
      riskIfIgnored:
        "Without real extraction and validation, the agent ships untrusted fields into the decision workflow.",
    },
    {
      id: "system_sync",
      title: "System sync",
      prototypeFake: "Prototype fakes system sync - decisions only flip local state.",
      realAgentMust:
        "Real agent must write or export approved records safely, with retries, idempotency, and a rollback path.",
      riskIfIgnored:
        "Without governed sync, decisions silently fail to record or record twice.",
    },
    {
      id: "hitl_queue",
      title: "HITL queue and audit persistence",
      prototypeFake: "Prototype fakes the HITL queue and audit log - both live only in browser state.",
      realAgentMust:
        "Real agent must persist queue state and audit events durably, with reviewer identity, decision, evidence, and timestamps.",
      riskIfIgnored:
        "Without persistent queue and audit, decisions disappear on refresh and the workflow is undefensible.",
    },
  ] as const satisfies readonly AgentRequirementCard[],

  methodNote:
    "The prototype is not pretending to be production. It is exposing where production will need tools, permissions, memory, and human control.",
} as const;

export function getM05PrototypeBriefScaffold(
  ctx: InvoiceOcrProfileContext,
): PrototypeBriefScaffold {
  const company = ctx.companyName ?? "your company";
  const country = ctx.country ?? "your region";

  return {
    audience:
      `Builder brief for a no-code prototype.\nAudience: ${company} operations reviewers in ${country}.\nDomain: generic AI-supported intake, review, decision, and audit workflow.`,
    appPurpose:
      "Build a frontend-only prototype that rehearses the AI-supported review loop. It demonstrates intake -> review -> decision -> audit using mock data so reviewers can experience the workflow before the M06 agent is designed.",
    screens:
      "Four screens in order:\n1. Dashboard - list of mock records with status.\n2. Intake - form/upload/message capture with mock AI progress.\n3. Review - structured fields with confidence, evidence, and validation warnings.\n4. Audit - timeline of intake, AI output, edits, decision, and source references.\nA visible MOCK DATA badge appears on every screen.",
    mockDataRules:
      "MOCK DATA ONLY.\n- All customer, employee, supplier, contract, and financial details are synthetic.\n- Seed 6-10 mock records covering clean, missing data, ambiguous routing, conflicting policy, and injection attempts.\n- No production data, no real accounts, no real documents.",
    interactionRules:
      "Interaction rules:\n- Approve/reject/route/flag are explicit buttons.\n- Rejecting or flagging requires a note.\n- Edits are recorded with before/after/editor/timestamp.\n- Audit timeline is read-only and reconstructable from local state.\n- Use the HOI design system.",
    nonGoals:
      "NON-GOALS:\n- No real authentication, no Supabase, no user accounts.\n- No real extraction/API/AI calls.\n- No write to CRM, ticketing, HRIS, accounting, or production systems.\n- No production integration, webhook, or external email.\n- No persistence beyond browser state.\nIf a feature needs any of the above, document it as an M06 agent requirement instead of building it.",
  };
}
