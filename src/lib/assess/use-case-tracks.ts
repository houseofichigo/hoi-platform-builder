import type { ModuleId } from "@/lib/curriculum";

export type UseCaseTrackStatus = "active" | "preview" | "coming_soon";

export interface UseCaseTrackStep {
  moduleId: ModuleId;
  title: string;
  summary: string;
  conceptApplied: string;
  exampleArtifact: string;
  sourceOutputs: string[];
  recommendedAction: string;
  unlockRule?: string;
}

export interface UseCaseTrack {
  id: string;
  slug: string;
  title: string;
  function: string;
  workflow: string;
  agentPattern: string;
  why: string;
  status: UseCaseTrackStatus;
  modules: ModuleId[];
  certificationEligible: boolean;
  recommendedAfterModule: ModuleId;
  stepsByModule: Record<ModuleId, UseCaseTrackStep>;
}

const COURSE_MODULES: ModuleId[] = [
  "m01",
  "m02",
  "m03",
  "m04",
  "m05",
  "m06",
  "m07",
  "m08",
  "m09",
  "m10",
  "m11",
  "m12",
];

export const USE_CASE_TRACKS: UseCaseTrack[] = [
  {
    id: "invoice-ocr",
    slug: "invoice-ocr",
    title: "Invoice OCR for Accounts Payable",
    function: "Finance",
    workflow: "Capture supplier invoices, extract fields, map to accounting plan, route for HITL approval.",
    agentPattern: "Multi-step agent with duplicate detection, vendor matching, audit logging.",
    why: "High-volume governance case that tests every layer.",
    status: "active",
    modules: COURSE_MODULES,
    certificationEligible: true,
    recommendedAfterModule: "m12",
    stepsByModule: {
      m01: {
        moduleId: "m01",
        title: "LLM fundamentals for invoice extraction",
        summary:
          "Compare how models handle invoice-like text, context length, missing fields, and confidently wrong values.",
        conceptApplied: "Prediction, temperature, tokens, context windows, hallucination risk.",
        exampleArtifact: "Model comparison notes for invoice extraction and one hallucination risk log.",
        sourceOutputs: [
          "same invoice prompt across two models or modes",
          "token and context-window observation",
          "missing-field hallucination risk",
        ],
        recommendedAction: "Use this as a reference after the M01 model-comparison assignment.",
      },
      m02: {
        moduleId: "m02",
        title: "OCR knowledge base blueprint",
        summary:
          "Map the AP policies, supplier records, accounting schema, invoice samples, VAT rules, and edge cases, then turn them into governed knowledge entries and retrieval tests.",
        conceptApplied: "Internal, contextual, and task-specific knowledge with metadata, ownership, access, sensitivity, refresh rules, and retrieval quality.",
        exampleArtifact: "Invoice OCR knowledge base blueprint and Gate 1 readiness gaps.",
        sourceOutputs: [
          "AP policy and approval rules",
          "supplier master and accounting schema",
          "clean, messy, and edge-case invoice examples",
        ],
        recommendedAction: "Compare this to your M02 generic knowledge base blueprint to see how the three layers transfer.",
      },
      m03: {
        moduleId: "m03",
        title: "OCR Prompt Contracts",
        summary:
          "Turn invoice work into reusable prompt contracts for field extraction, risk classification, and safety guardrails.",
        conceptApplied: "Prompt Contract: goal, context, rules, output contract, quality bar, examples, and test suite.",
        exampleArtifact: "Three OCR prompt library entries.",
        sourceOutputs: [
          "invoice field extraction contract",
          "invoice risk classification contract",
          "guardrail preventing payment approval or prompt injection",
        ],
        recommendedAction: "Use after M03 to see how task-type prompt contracts behave on one finance workflow.",
      },
      m04: {
        moduleId: "m04",
        title: "AP assistant and RAG evidence",
        summary:
          "Ground an AP assistant in policy, supplier, schema, and invoice evidence, then test standard, missing, boundary, conflict, and unsafe questions.",
        conceptApplied: "Assistant anatomy, source checklist, retrieval tests, RAG governance, Gate 1 evidence.",
        exampleArtifact: "OCR assistant blueprint and Gate 1 evidence pack.",
        sourceOutputs: [
          "assistant purpose and constraints",
          "approved AP knowledge sources",
          "five-query retrieval test results",
        ],
        recommendedAction: "Use this as the OCR reference for Gate 1 readiness.",
      },
      m05: {
        moduleId: "m05",
        title: "Invoice review prototype",
        summary:
          "Translate OCR into the app surface: upload, extracted-field review, approve/reject, history, and audit trail.",
        conceptApplied: "Prototype surfaces, simulated vs real behavior, sandbox governance, agent requirement discovery.",
        exampleArtifact: "Invoice-processing prototype brief and three agent requirement cards.",
        sourceOutputs: [
          "upload surface",
          "review and approval surface",
          "history and audit surface",
        ],
        recommendedAction: "Use this after M05 to compare a specific OCR prototype against the generic two-screen workflow.",
      },
      m06: {
        moduleId: "m06",
        title: "Invoice routing agent and pilot",
        summary:
          "Design a bounded invoice agent that detects duplicates, matches vendors, escalates exceptions, logs decisions, and runs a 10-invoice pilot.",
        conceptApplied: "Agent goal, tools, HITL, audit, pilot metrics, and Gate 2 readiness.",
        exampleArtifact: "OCR agent blueprint, HITL map, pilot metrics, and Gate 2 evidence.",
        sourceOutputs: [
          "duplicate detection",
          "vendor matching",
          "manual review escalation",
          "10-invoice pilot set",
        ],
        recommendedAction: "Use this as the OCR reference for Gate 2 deployment readiness.",
      },
      m07: {
        moduleId: "m07",
        title: "OCR stack decision",
        summary:
          "Compare tools for extraction quality, accounting integration, data residency, audit logs, cost, and supportability.",
        conceptApplied: "Governance criteria, platform comparison, and tool-selection ADR.",
        exampleArtifact: "OCR tool comparison matrix and ADR.",
        sourceOutputs: [
          "OCR extraction tool option",
          "accounting integration option",
          "audit and residency evidence",
        ],
        recommendedAction: "Use after M07 to see how the platform ADR changes for a regulated finance workflow.",
      },
      m08: {
        moduleId: "m08",
        title: "OCR integration plan",
        summary:
          "Plan the path from invoice source to extraction, review queue, accounting system, audit log, rollback, and partner handoff.",
        conceptApplied: "Architecture, top risks, cost estimate, rollback path, production boundary.",
        exampleArtifact: "Invoice OCR integration plan.",
        sourceOutputs: [
          "source-to-review architecture",
          "accounting write boundary",
          "rollback and audit controls",
        ],
        recommendedAction: "Use this as the finance-specific version of your M08 integration plan.",
      },
      m09: {
        moduleId: "m09",
        title: "OCR in the scored portfolio",
        summary:
          "Score Invoice OCR beside the generic portfolio candidates and decide whether it earns the next investment cycle.",
        conceptApplied: "Eight-pillar scoring, step automation maps, reason codes, Gate 3 investment decision.",
        exampleArtifact: "OCR scoring entry and Gate 3 decision.",
        sourceOutputs: [
          "OCR pillar scores",
          "OCR automation map",
          "OCR reason codes and tier",
        ],
        recommendedAction: "Use after M09 to compare OCR against the four generic portfolio candidates.",
      },
      m10: {
        moduleId: "m10",
        title: "OCR documentation pack",
        summary:
          "Document the OCR system so finance operators can understand the scope, playbook, failure modes, and handoff path.",
        conceptApplied: "Documentation outline, system card, operating playbook, and handoff plan.",
        exampleArtifact: "OCR system card, AP operating playbook, and finance handoff plan.",
        sourceOutputs: [
          "system card",
          "operator playbook",
          "handoff stages",
        ],
        recommendedAction: "Use after M10 to see how regulated workflows need extra operating evidence.",
      },
      m11: {
        moduleId: "m11",
        title: "OCR monitoring and quality",
        summary:
          "Track extraction accuracy, manual review rate, vendor-match failures, duplicate misses, audit completeness, and drift triggers.",
        conceptApplied: "Metrics, alert thresholds, drift response, re-scoring criteria.",
        exampleArtifact: "OCR monitoring plan and drift trigger spec.",
        sourceOutputs: [
          "accuracy and manual-review metrics",
          "vendor-match and duplicate-detection alerts",
          "audit completeness checks",
        ],
        recommendedAction: "Use after M11 to compare OCR quality controls with your generic monitoring plan.",
      },
      m12: {
        moduleId: "m12",
        title: "OCR roadmap placement",
        summary:
          "Place Invoice OCR into the 12-month roadmap as pilot, production, scale, or defer based on evidence from the portfolio.",
        conceptApplied: "Roadmap sequencing, capability gaps, executive summary, and next investment decision.",
        exampleArtifact: "OCR roadmap recommendation and executive summary insert.",
        sourceOutputs: [
          "roadmap horizon",
          "capability gaps",
          "investment recommendation",
        ],
        recommendedAction: "Use after M12 when deciding whether OCR should become a Tier 02 capstone submission.",
      },
    },
  },
  {
    id: "quote-generation",
    slug: "quote-generation",
    title: "Quote Generation",
    function: "Sales",
    workflow: "Draft a customer quote from request details, product catalogue, pricing rules, and approval constraints.",
    agentPattern: "RAG drafter with pricing-rule checks and manager approval.",
    why: "High-frequency commercial workflow with clear value and manageable review boundaries.",
    status: "preview",
    modules: COURSE_MODULES,
    certificationEligible: false,
    recommendedAfterModule: "m12",
    stepsByModule: {} as Record<ModuleId, UseCaseTrackStep>,
  },
  {
    id: "hr-ticket-triage",
    slug: "hr-ticket-triage",
    title: "HR Ticket Triage & Routing",
    function: "HR",
    workflow: "Classify employee requests, route them to the right HR queue, and flag sensitive issues for human review.",
    agentPattern: "Classification workflow with privacy guardrails and escalation paths.",
    why: "Tests sensitivity, routing accuracy, and human review in an employee-facing process.",
    status: "preview",
    modules: COURSE_MODULES,
    certificationEligible: false,
    recommendedAfterModule: "m12",
    stepsByModule: {} as Record<ModuleId, UseCaseTrackStep>,
  },
  {
    id: "customer-email-classification",
    slug: "customer-email-classification",
    title: "Customer Email Classification",
    function: "Customer Operations",
    workflow: "Classify inbound customer messages by topic, urgency, sentiment, and next action.",
    agentPattern: "Classifier with routing, confidence thresholds, and escalation for complaints.",
    why: "Broadly understandable entry case for AI routing, quality control, and monitoring.",
    status: "preview",
    modules: COURSE_MODULES,
    certificationEligible: false,
    recommendedAfterModule: "m12",
    stepsByModule: {} as Record<ModuleId, UseCaseTrackStep>,
  },
  {
    id: "rfp-response-drafting",
    slug: "rfp-response-drafting",
    title: "RFP Response Drafting",
    function: "Sales",
    workflow: "Extract requirements, match capability library, draft responses, and flag gaps.",
    agentPattern: "Requirements-extraction agent plus RAG drafter and compliance checker.",
    why: "High-value, low-frequency workflow with strong audit-trail demands.",
    status: "preview",
    modules: COURSE_MODULES,
    certificationEligible: false,
    recommendedAfterModule: "m12",
    stepsByModule: {} as Record<ModuleId, UseCaseTrackStep>,
  },
  {
    id: "supplier-contract-review",
    slug: "supplier-contract-review",
    title: "Supplier Contract Review",
    function: "Finance / Legal",
    workflow: "Extract terms, flag risk clauses, summarize for legal review, and track redline cycles.",
    agentPattern: "Term-extraction agent with clause-library RAG and risk scorer.",
    why: "Stress-tests precision under regulatory and commercial pressure.",
    status: "preview",
    modules: COURSE_MODULES,
    certificationEligible: false,
    recommendedAfterModule: "m12",
    stepsByModule: {} as Record<ModuleId, UseCaseTrackStep>,
  },
];

export function getUseCaseTrack(slugOrId: string | null | undefined): UseCaseTrack | null {
  if (!slugOrId) return null;
  return USE_CASE_TRACKS.find((track) => track.slug === slugOrId || track.id === slugOrId) ?? null;
}

export function getUseCaseTrackStep(trackSlugOrId: string, moduleId: ModuleId): UseCaseTrackStep | null {
  return getUseCaseTrack(trackSlugOrId)?.stepsByModule[moduleId] ?? null;
}

export function getActiveUseCaseTrack(): UseCaseTrack {
  return USE_CASE_TRACKS.find((track) => track.status === "active") ?? USE_CASE_TRACKS[0];
}
