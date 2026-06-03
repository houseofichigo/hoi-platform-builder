import type { ModuleId } from "@/lib/curriculum";

export interface CoreAssignmentCase {
  id: string;
  title: string;
  function: string;
  description: string;
}

export interface CoreAssignmentStep {
  moduleId: ModuleId;
  recommendedCaseId: string;
  title: string;
  summary: string;
  structuredOutputs: string[];
  optionalAdvancedEdit?: string;
}

export const CORE_ASSIGNMENT_CASES: CoreAssignmentCase[] = [
  {
    id: "customer-support-policy",
    title: "Customer support policy answer",
    function: "Customer Operations",
    description: "Answer a customer policy question using only approved support guidance.",
  },
  {
    id: "support-ticket-triage",
    title: "Support ticket triage",
    function: "Customer Operations",
    description: "Classify incoming tickets by topic, urgency, owner, and next action.",
  },
  {
    id: "supplier-onboarding",
    title: "Supplier onboarding",
    function: "Procurement",
    description: "Collect supplier information, validate required fields, and flag missing evidence.",
  },
  {
    id: "contract-clause-extraction",
    title: "Contract clause extraction",
    function: "Legal",
    description: "Extract key terms, risks, and review flags from supplier contracts.",
  },
  {
    id: "inbound-email-triage",
    title: "Inbound email triage",
    function: "Customer Operations",
    description: "Classify customer emails by intent, urgency, and routing destination.",
  },
  {
    id: "customer-reply-guardrail",
    title: "Customer reply guardrail",
    function: "Customer Operations",
    description: "Prevent unsafe commitments, discounts, delivery promises, or data disclosure in customer replies.",
  },
  {
    id: "internal-policy-assistant",
    title: "Internal policy assistant",
    function: "Operations",
    description: "Answer employee or operator questions from a small policy, FAQ, and procedure reference set.",
  },
  {
    id: "intake-review-dashboard",
    title: "Intake form + review dashboard",
    function: "Operations",
    description: "Capture requests in a form, review structured fields in a dashboard, and record status changes.",
  },
  {
    id: "lead-routing-agent",
    title: "Lead qualification and routing",
    function: "Sales",
    description: "Classify a lead, score fit, route to sales/nurture/human review, and log the decision.",
  },
  {
    id: "generic-portfolio",
    title: "Four-use-case portfolio",
    function: "Executive / AI Office",
    description: "Compare customer email classification, quote generation, HR triage, and RFP response drafting.",
  },
];

export const CORE_ASSIGNMENTS: Record<ModuleId, CoreAssignmentStep> = {
  m01: {
    moduleId: "m01",
    recommendedCaseId: "customer-support-policy",
    title: "Compare model behavior on a support-policy prompt",
    summary:
      "Run the same prompt across two models or modes, compare quality and risk, log one hallucination, and complete the six-pillar readiness checklist.",
    structuredOutputs: [
      "model comparison notes",
      "hallucination or confidently wrong output log",
      "token/cost awareness observation",
      "six-pillar readiness checklist",
    ],
  },
  m02: {
    moduleId: "m02",
    recommendedCaseId: "support-ticket-triage",
    title: "Build a three-layer knowledge base blueprint",
    summary:
      "Map internal, contextual, and task-specific knowledge; define source-backed entries with metadata; write retrieval tests; and record Gate 1 readiness gaps.",
    structuredOutputs: [
      "three-layer source map",
      "five knowledge-entry categories",
      "retrieval test questions",
      "Gate 1 readiness checks and gaps",
    ],
  },
  m03: {
    moduleId: "m03",
    recommendedCaseId: "contract-clause-extraction",
    title: "Build three Prompt Contracts",
    summary:
      "Document one extraction contract, one classification contract, and one guardrail contract with tests and automation-layer decisions.",
    structuredOutputs: [
      "contract clause extraction Prompt Contract",
      "inbound email classification Prompt Contract",
      "customer reply guardrail Prompt Contract",
      "quality bar confirmation",
    ],
  },
  m04: {
    moduleId: "m04",
    recommendedCaseId: "internal-policy-assistant",
    title: "Configure a grounded assistant",
    summary:
      "Design a small policy/FAQ assistant, define its sources and constraints, run the five-query test set, and prepare Gate 1 evidence.",
    structuredOutputs: [
      "assistant blueprint",
      "source checklist",
      "five-query test outputs",
      "RAG governance notes",
      "Gate 1 readiness summary",
    ],
  },
  m05: {
    moduleId: "m05",
    recommendedCaseId: "intake-review-dashboard",
    title: "Prototype a two-screen workflow",
    summary:
      "Specify or build an intake form and review dashboard, document permissions/integrations/simulations, and produce three agent requirement cards.",
    structuredOutputs: [
      "prototype surface map",
      "sandbox build brief",
      "walkthrough findings",
      "three agent requirement cards",
    ],
  },
  m06: {
    moduleId: "m06",
    recommendedCaseId: "lead-routing-agent",
    title: "Design a low-risk pilot agent",
    summary:
      "Define a lead-routing agent goal, trigger, tools, autonomy level, HITL checkpoints, audit rules, 10 test inputs, and Gate 2 evidence.",
    structuredOutputs: [
      "agent design blueprint",
      "tool/integration plan",
      "HITL policy",
      "pilot metric plan",
      "Gate 2 readiness summary",
    ],
  },
  m07: {
    moduleId: "m07",
    recommendedCaseId: "lead-routing-agent",
    title: "Choose a production-ready stack",
    summary:
      "Compare two platform options against governance criteria and generate a tool-selection ADR for the pilot stack.",
    structuredOutputs: [
      "stack inventory",
      "platform comparison matrix",
      "generated ADR",
      "stack decision",
    ],
  },
  m08: {
    moduleId: "m08",
    recommendedCaseId: "lead-routing-agent",
    title: "Write the integration plan",
    summary:
      "Plan architecture, top risks, cost estimate, rollback path, partner handoff, and production boundary for the candidate system.",
    structuredOutputs: [
      "architecture choice",
      "top three risks",
      "cost model",
      "integration and rollback plan",
    ],
  },
  m09: {
    moduleId: "m09",
    recommendedCaseId: "generic-portfolio",
    title: "Score the candidate portfolio",
    summary:
      "Score customer email classification, quote generation, HR ticket triage, and RFP response drafting through the formal portfolio lens.",
    structuredOutputs: [
      "four candidate records",
      "pillar scores and reason codes",
      "step automation maps",
      "Gate 3 investment recommendation",
    ],
  },
  m10: {
    moduleId: "m10",
    recommendedCaseId: "generic-portfolio",
    title: "Create the documentation pack",
    summary:
      "Generate the documentation outline, system card, operating playbook, and handoff plan for the selected M09 candidate.",
    structuredOutputs: [
      "documentation outline",
      "system card and playbook",
      "handoff stages",
    ],
  },
  m11: {
    moduleId: "m11",
    recommendedCaseId: "generic-portfolio",
    title: "Define monitoring and drift triggers",
    summary:
      "Select metrics, thresholds, alert owners, drift conditions, and re-scoring criteria for the selected candidate system.",
    structuredOutputs: [
      "monitoring metrics",
      "alert rules",
      "drift response plan",
      "re-scoring criteria",
    ],
  },
  m12: {
    moduleId: "m12",
    recommendedCaseId: "generic-portfolio",
    title: "Build the 12-month AI roadmap",
    summary:
      "Sequence the scored portfolio, identify capability gaps, define investment estimates, and generate an executive summary.",
    structuredOutputs: [
      "12-month roadmap",
      "capability gap analysis",
      "executive scorecard",
      "executive summary",
    ],
  },
};

export function getCoreAssignment(moduleId: ModuleId): CoreAssignmentStep {
  return CORE_ASSIGNMENTS[moduleId];
}

export function getCoreAssignmentCase(caseId: string): CoreAssignmentCase | null {
  return CORE_ASSIGNMENT_CASES.find((assignmentCase) => assignmentCase.id === caseId) ?? null;
}
