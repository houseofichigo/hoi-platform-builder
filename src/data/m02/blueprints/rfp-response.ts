import type { M02BlueprintData } from "../blueprintSchema";

export const rfpResponseBlueprint: M02BlueprintData = {
  useCaseId: "rfp-response-support",
  useCaseName: "RFP Response Support",
  useCaseDescription:
    "Help teams draft consistent proposal answers from approved company, product, security, delivery, and evidence sources.",

  dataMap: {
    intro:
      "Where RFP response knowledge lives: approved answer blocks, product facts, evidence, confidentiality rules, and review workflows.",
    locations: [
      {
        information: "Approved answer library",
        livesIn: "Proposal knowledge base",
        owner: "Proposal Operations",
        movement: "Reviewed quarterly and after major submissions",
      },
      {
        information: "Product and delivery documentation",
        livesIn: "Product and delivery workspace",
        owner: "Product + Delivery",
        movement: "Updated at release and methodology changes",
      },
      {
        information: "Security and compliance responses",
        livesIn: "Trust center and security questionnaire library",
        owner: "Security + Compliance",
        movement: "Reviewed after audit, certification, and policy changes",
      },
      {
        information: "Claims, metrics, and proof assets",
        livesIn: "Evidence register",
        owner: "Marketing + Customer Success",
        movement: "Updated as metrics, case studies, and permissions change",
      },
      {
        information: "Review owners and submission workflow",
        livesIn: "RFP operating playbook",
        owner: "Proposal Operations",
        movement: "Reviewed after each bid cycle",
      },
    ],
    whatToNotice:
      "RFP AI fails when it has words but no proof. The map separates reusable answer language from evidence, permissions, and review ownership.",
  },

  knowledgeLayers: {
    intro:
      "RFP knowledge is organised into approved facts, rules for what can be claimed or shared, and examples of good and risky responses.",
    layers: [
      {
        name: "Internal",
        description: "What the business can say about itself, its product, delivery, and proof",
        sources: [
          { item: "Approved answer blocks", from: "Proposal knowledge base" },
          { item: "Product and delivery documentation", from: "Product and delivery workspace" },
          { item: "Security questionnaire answers", from: "Trust center library" },
          { item: "Evidence register", from: "Marketing + Customer Success" },
        ],
      },
      {
        name: "Contextual",
        description: "Rules that govern claims, confidentiality, review, and external sharing",
        sources: [
          { item: "Claims and evidence boundary", from: "Proposal governance policy" },
          { item: "Confidentiality and sharing rules", from: "Legal policy" },
          { item: "Security review workflow", from: "Security operating procedure" },
          { item: "Final submission approval", from: "RFP operating playbook" },
        ],
      },
      {
        name: "Task-specific",
        description: "Examples of standard answers, high-risk claims, and ambiguous requirements",
        sources: [
          { item: "Standard RFP questions", from: "Proposal archive" },
          { item: "Corrected high-risk answers", from: "Red-team review notes" },
          { item: "Ambiguous requirement examples", from: "Clarification log" },
        ],
      },
    ],
    whatToNotice:
      "An RFP assistant needs both answer reuse and claim control. The layers stop polished proposal language from becoming unsupported promises.",
  },

  entries: {
    intro:
      "RFP entries should be reusable, cited, and bounded: one approved answer block, one claim rule, one sharing boundary, or one worked ambiguity example.",
    items: [
      {
        id: "RFP-INT-001",
        layer: "Internal",
        category: "Approved answer",
        title: "Implementation methodology answer block",
        source: "Proposal answer library, Delivery Section 2.4",
        sourceOwner: "Proposal Operations",
        content:
          "For standard implementation methodology questions, the approved answer should describe discovery, configuration, testing, enablement, launch support, and post-launch review. The AI may adapt wording to the question but must not invent timelines, staffing levels, or guarantees unless supported by a separate approved entry.",
        metadata: {
          version: "v4.2",
          lastUpdated: "2026-03-14",
          sensitivity: "Internal",
          allowedAiUse: "Yes - for draft proposal answers",
        },
      },
      {
        id: "RFP-INT-002",
        layer: "Internal",
        category: "Evidence",
        title: "Customer reference permission requirement",
        source: "Evidence register 2026-Q2",
        sourceOwner: "Marketing + Customer Success",
        content:
          "Customer names, logos, quantified outcomes, and case-study quotes may be used only when the evidence register marks the asset as approved for external proposal use. Internal success notes and private QBR metrics may not be included in an RFP response without written permission.",
        metadata: {
          version: "2026-Q2",
          lastUpdated: "2026-04-05",
          sensitivity: "Restricted - Customer evidence",
          allowedAiUse: "Yes - for permission checks; do not expose restricted evidence",
        },
      },
      {
        id: "RFP-CTX-003",
        layer: "Contextual",
        category: "Claims boundary",
        title: "Metrics and guarantees require evidence",
        source: "Proposal governance policy, Claims Section 1.2",
        sourceOwner: "Legal + Proposal Operations",
        content:
          "Any claim involving percentages, uptime, implementation duration, savings, ROI, security posture, certification, or customer outcome must cite an approved evidence entry. If no approved evidence exists, the AI must either remove the claim or mark it for human review.",
        metadata: {
          version: "v2.2",
          lastUpdated: "2026-02-09",
          sensitivity: "Internal",
          allowedAiUse: "Yes - for claim checking and review routing",
        },
      },
      {
        id: "RFP-CTX-004",
        layer: "Contextual",
        category: "Security review",
        title: "Security and compliance answers require specialist review",
        source: "Security RFP operating procedure v3.0",
        sourceOwner: "Security + Compliance",
        content:
          "Answers about certifications, data residency, penetration testing, encryption, incident response, subprocessors, or audit rights must be reviewed by Security + Compliance before submission. The AI may draft from approved entries but must flag the section for review.",
        metadata: {
          version: "v3.0",
          lastUpdated: "2026-01-31",
          sensitivity: "Restricted - Security",
          allowedAiUse: "Draft only - specialist review required",
        },
      },
      {
        id: "RFP-TSK-005",
        layer: "Task-specific",
        category: "Ambiguous requirement example",
        title: "Undefined integration requirement - expected handling",
        source: "Clarification log, Case RFP-2025-221",
        sourceOwner: "Proposal Operations",
        content:
          "Prospect asked whether the platform supports 'full integration with all internal tools' without naming systems, data flows, or required actions. Expected AI behaviour: do not claim broad support. Draft a clarification question asking for systems, data objects, authentication method, expected triggers, and success criteria.",
        metadata: {
          version: "Case ref RFP-2025-221",
          lastUpdated: "2025-09-18",
          sensitivity: "Internal",
          allowedAiUse: "Yes - as worked example for ambiguous requirements",
        },
      },
    ],
    whatToNotice:
      "RFP entries should make promises auditable. If a claim cannot be tied to approved evidence, it should not appear as a confident answer.",
  },

  metadata: {
    intro: "Required metadata is small: five fields. Optional metadata is added as the KB matures.",
    required: [
      { field: "Title", description: "Short, specific name of the entry" },
      { field: "Layer or category", description: "Which of the three layers this belongs to" },
      { field: "Source", description: "Where the rule, fact, or example comes from" },
      { field: "Owner", description: "Named person or team responsible for keeping it current" },
      { field: "Rule, fact, or example", description: "The atomic content the AI may use" },
    ],
    optional: [
      { field: "Source location", description: "Exact URL or document path" },
      { field: "Version or review date", description: "What version is current, when last reviewed" },
      { field: "Sensitivity", description: "Classification: Public / Internal / Restricted" },
      { field: "Allowed AI use", description: "What the AI is permitted to do with this entry" },
      { field: "Tags", description: "Searchable categorisation labels" },
      { field: "Review status", description: "Approved / Pending / Under revision" },
      { field: "Refresh frequency", description: "How often this entry is re-reviewed" },
    ],
    whatToNotice:
      "Proposal metadata is how the team knows whether an answer block is approved, current, externally shareable, and evidence-backed.",
  },

  lineage: {
    intro:
      "Lineage traces every proposal answer to approved answer blocks, evidence, and review rules. Precedence prevents old proposal language from overriding current truth.",
    precedenceRules: [
      "Current approved answer library overrides old submitted proposals",
      "Evidence register overrides internal notes for customer references and metrics",
      "Security operating procedure overrides proposal examples for security answers",
      "Legal and confidentiality rules override all language reuse when external sharing is unclear",
    ],
    lineageExample:
      "An AI answer claiming a customer outcome must cite RFP-INT-002 and RFP-CTX-003. If the evidence register does not approve that metric for external use, the claim must be removed or routed for review.",
    whatToNotice:
      "RFP reuse is dangerous when the assistant copies language without knowing whether the proof is approved. Lineage turns reuse into governed reuse.",
  },

  accessSensitivity: {
    intro:
      "RFP knowledge includes public claims, internal proposal strategy, customer evidence, and security material. The AI needs sharing rules.",
    classifications: [
      {
        level: "Public",
        description: "May be shared externally without restriction",
        appliesTo: ["Published product descriptions", "Public trust center material"],
        aiBehaviour: "AI may quote approved public language",
      },
      {
        level: "Internal",
        description: "Visible to employees, not automatically customer-facing",
        appliesTo: ["Draft answer blocks", "Delivery playbooks", "Review workflow notes"],
        aiBehaviour: "AI may use for drafts but must respect final review",
      },
      {
        level: "Restricted - Customer evidence",
        description: "May be shared only when permission is approved",
        appliesTo: ["Customer names", "Case-study metrics", "QBR outcomes", "Private quotes"],
        aiBehaviour: "AI must check approval before including evidence",
      },
      {
        level: "Restricted - Specialist review required",
        description: "Requires Security, Legal, or executive review before submission",
        appliesTo: ["Security posture", "Compliance claims", "Legal commitments", "Guarantees"],
        aiBehaviour: "AI may draft from approved entries but must flag for review",
      },
    ],
    whatToNotice:
      "RFP assistants need guardrails because the best-sounding answer is often the riskiest if the claim is not approved.",
  },

  retrievalTests: {
    intro:
      "RFP tests prove the AI can reuse approved language, cite evidence, avoid unsupported claims, and ask clarifying questions.",
    tests: [
      {
        id: "TEST-01",
        question: "The RFP asks for implementation methodology.",
        expectedEntry: "RFP-INT-001",
        expectedSource: "Proposal answer library, Delivery Section 2.4",
        expectedBehaviour:
          "Draft from the approved answer block. Do not invent timelines, guarantees, or staffing levels.",
      },
      {
        id: "TEST-02",
        question: "The answer includes a 35 percent savings claim from an internal note.",
        expectedEntry: "RFP-INT-002 + RFP-CTX-003",
        expectedSource: "Evidence register + Proposal governance policy",
        expectedBehaviour:
          "Check approved evidence. Remove or flag the claim if it is not approved for external proposal use.",
      },
      {
        id: "TEST-03",
        question: "The RFP asks about encryption, subprocessors, and incident response.",
        expectedEntry: "RFP-CTX-004",
        expectedSource: "Security RFP operating procedure v3.0",
        expectedBehaviour:
          "Draft only from approved security entries and flag for Security + Compliance review.",
      },
      {
        id: "TEST-04",
        question: "The customer asks whether the product integrates with all internal tools.",
        expectedEntry: "RFP-TSK-005",
        expectedSource: "Clarification log, Case RFP-2025-221",
        expectedBehaviour:
          "Do not claim broad support. Ask for systems, data objects, authentication, triggers, and success criteria.",
      },
      {
        id: "TEST-05",
        question: "An old winning proposal has stronger language than the current approved answer library.",
        expectedEntry: "RFP-INT-001",
        expectedSource: "Current proposal answer library",
        expectedBehaviour:
          "Use current approved answer library. Do not copy old language unless it is still approved.",
      },
    ],
    whatToNotice:
      "The RFP test suite makes proposal quality measurable: approved source, allowed evidence, specialist review, and no unsupported claims.",
  },

  retrievalInstructions: {
    scope:
      "Only answer questions about approved company, product, delivery, security, customer-evidence, and proposal workflow knowledge represented in the KB.",
    retrievalOrder: [
      "First search Layer 2 (Contextual) for claims, confidentiality, review, and sharing rules",
      "Then search Layer 1 (Internal) for approved answer blocks, product facts, security answers, and evidence",
      "Then search Layer 3 (Task-specific) for similar proposal examples or ambiguity patterns",
    ],
    sourcePrecedence: [
      "Current approved answer library overrides old proposals",
      "Evidence register overrides internal notes for customer proof and metrics",
      "Security operating procedure overrides proposal examples for security topics",
      "Confidentiality and legal rules override all answer reuse",
    ],
    citation:
      "Cite every claim with an entry ID. Claims involving metrics, guarantees, customer evidence, security, or compliance must cite an approved evidence or rule entry.",
    sensitivity:
      "Customer evidence and security material are restricted. Do not include restricted proof in external responses unless approval is explicit.",
    boundaryBehaviour:
      "When evidence, permission, technical scope, or review owner is missing, do not infer. Ask a clarification question or route to the accountable reviewer.",
  },
};
