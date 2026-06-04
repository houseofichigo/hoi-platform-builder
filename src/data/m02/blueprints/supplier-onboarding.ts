import type { M02BlueprintData } from "../blueprintSchema";

export const supplierOnboardingBlueprint: M02BlueprintData = {
  useCaseId: "supplier-onboarding",
  useCaseName: "Supplier Onboarding",
  useCaseDescription:
    "Identify missing supplier information, apply onboarding rules, and route risk cases to the right owner.",

  dataMap: {
    intro:
      "Where the information for this process actually lives: five locations, three owners, four refresh cadences.",
    locations: [
      {
        information: "Supplier profiles and intake questionnaires",
        livesIn: "Procurement SharePoint",
        owner: "Procurement Ops",
        movement: "Updated at intake, refreshed annually",
      },
      {
        information: "Approved vendor list",
        livesIn: "ERP system (master data)",
        owner: "Master Data team",
        movement: "Synced nightly to Finance and Procurement",
      },
      {
        information: "Risk and exception rules",
        livesIn: "Policy library (Confluence)",
        owner: "Risk & Compliance",
        movement: "Updated quarterly; version-controlled",
      },
      {
        information: "Past onboarding cases",
        livesIn: "ServiceNow tickets",
        owner: "Procurement Ops",
        movement: "Archived 90 days after closure",
      },
      {
        information: "Contract and service templates",
        livesIn: "Legal document repository",
        owner: "Legal",
        movement: "Updated as policies change; tagged by category",
      },
    ],
    whatToNotice:
      "The data map does not tell the AI what to do. It tells the business what exists. Five locations, three owners, four refresh cadences: this is the picture you need before AI can use any of it.",
  },

  knowledgeLayers: {
    intro:
      "The same data map, now organised by what each piece is for: facts the business knows, rules and boundaries, and real examples of work.",
    layers: [
      {
        name: "Internal",
        description: "What the business knows about itself",
        sources: [
          { item: "Supplier profile and questionnaire", from: "Procurement SharePoint" },
          { item: "Approved supplier records", from: "ERP system" },
          { item: "Contract and service templates", from: "Legal repository" },
          { item: "Past onboarding cases", from: "ServiceNow archive" },
        ],
      },
      {
        name: "Contextual",
        description: "Rules and boundaries that govern the answer",
        sources: [
          { item: "Procurement approval rules (spend x category matrix)", from: "Policy library" },
          { item: "Security and data requirements", from: "Policy library" },
          { item: "Risk and exception rules", from: "Policy library" },
          { item: "Privacy and data-handling rules for France", from: "Legal policy" },
          { item: "Source precedence rule when evidence conflicts", from: "Internal AI governance doc" },
        ],
      },
      {
        name: "Task-specific",
        description: "Real examples of good, ambiguous, and risk cases",
        sources: [
          { item: "Clean onboarding examples (complete, standard category)", from: "ServiceNow archive" },
          { item: "Incomplete supplier examples (missing fields, unclear scope)", from: "ServiceNow archive" },
          { item: "Risk escalation examples (sensitive access, restricted geography)", from: "ServiceNow + Risk archive" },
        ],
      },
    ],
    whatToNotice:
      "Each layer answers a different question. Internal: what does this business know about itself? Contextual: what rules apply? Task-specific: what does the work actually look like? All three are required.",
  },

  entries: {
    intro:
      "An entry is one atomic, source-backed unit: one rule, one fact, one example that the AI can retrieve as a single piece of evidence. Not a whole document. Not a section. One thing.",
    items: [
      {
        id: "SO-INT-001",
        layer: "Internal",
        category: "Supplier records",
        title: "Required supplier profile fields",
        source: "Procurement intake template v3.2",
        sourceOwner: "Master Data team",
        content:
          "Every new supplier file must include: legal name, registered address, tax identifier, primary contact, banking details, category code, annual spend estimate, and a completed security questionnaire. Files missing any of these cannot proceed to approval review.",
        metadata: {
          version: "3.2",
          lastUpdated: "2026-03-15",
          sensitivity: "Internal",
          allowedAiUse: "Yes - for completeness checks and reviewer routing",
        },
      },
      {
        id: "SO-CTX-002",
        layer: "Contextual",
        category: "Approval rules",
        title: "Spend threshold approval matrix",
        source: "Procurement policy library, Section 4.1",
        sourceOwner: "Risk & Compliance",
        content:
          "Annual spend up to EUR 25K: Category Manager approves. EUR 25K-EUR 100K: Category Director approves. EUR 100K-EUR 500K: Procurement Director + Finance Director jointly approve. Above EUR 500K: requires Executive Committee review. Risk-banded suppliers escalate one tier regardless of spend.",
        metadata: {
          version: "v2.1 (effective 2026-01-01)",
          lastUpdated: "2025-12-18",
          sensitivity: "Internal",
          allowedAiUse: "Yes - for routing only; humans approve",
        },
      },
      {
        id: "SO-CTX-003",
        layer: "Contextual",
        category: "Security requirements",
        title: "Security questionnaire requirement",
        source: "Procurement policy library, Section 5.2",
        sourceOwner: "Information Security",
        content:
          "Every supplier that will access company systems, process company data, or receive confidential information must complete the standard security questionnaire before approval. The Risk & Compliance team reviews the completed questionnaire and issues a risk band (Low / Medium / High / Restricted) that determines downstream controls.",
        metadata: {
          version: "v1.4",
          lastUpdated: "2026-02-10",
          sensitivity: "Internal",
          allowedAiUse: "Yes - for routing and gating only",
        },
      },
      {
        id: "SO-CTX-004",
        layer: "Contextual",
        category: "Exception rules",
        title: "Restricted geography escalation",
        source: "Procurement policy library, Section 6.3",
        sourceOwner: "Legal + Risk & Compliance",
        content:
          "Suppliers headquartered in or operating from sanctioned jurisdictions must be escalated to Legal before any review proceeds. The list of sanctioned jurisdictions is maintained by Legal and reviewed monthly. AI must not approve, partially approve, or pre-route suppliers from these jurisdictions under any circumstances.",
        metadata: {
          version: "v3.0",
          lastUpdated: "2026-04-02",
          sensitivity: "Restricted - Compliance",
          allowedAiUse: "Read-only - escalate only; no automated routing",
        },
      },
      {
        id: "SO-TSK-005",
        layer: "Task-specific",
        category: "Incomplete file example",
        title: "Missing security questionnaire - expected handling",
        source: "Historical case archive, Q3 2025 review",
        sourceOwner: "Procurement Ops",
        content:
          "Supplier file received with all profile fields complete but no security questionnaire. Expected AI behaviour: do not approve, do not partially route, return to requesting team with a specific message naming the missing questionnaire and the Risk & Compliance team as next step. Do not infer the questionnaire from prior submissions, even if the same supplier submitted one previously: security re-attestation is required per submission.",
        metadata: {
          version: "Case ref 2025-Q3-447",
          lastUpdated: "2025-09-22",
          sensitivity: "Internal",
          allowedAiUse: "Yes - as worked example for handling missing fields",
        },
      },
    ],
    whatToNotice:
      "Each entry is small, specific, and traceable. A whole policy is too big. One approval threshold, with a source and owner, is the right grain.",
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
      "The discipline is not all fields filled. It is every entry has the five required fields, and optional fields are added where they add value.",
  },

  lineage: {
    intro:
      "Lineage combines two things: the trace from AI output back to source entry, and the rule for which source wins when sources conflict.",
    precedenceRules: [
      "Layer 2 (contextual / policy) overrides Layer 1 (internal / record) overrides Layer 3 (task-specific / example) when they conflict",
      "Within a layer, the most recent version overrides older versions",
      "The approved vendor list always overrides informal status notes for approval decisions",
      "Restricted geography rules override all other rules: no exceptions, no inference",
    ],
    lineageExample:
      "An AI response stating 'this supplier requires Category Director approval' must be traceable to entry SO-CTX-002 (Spend threshold matrix), which itself is sourced from Policy library Section 4.1 v2.1 owned by Risk & Compliance. If the lineage breaks at any link, the response cannot be trusted.",
    whatToNotice:
      "This is the Air Canada lesson. Conflicting sources without a precedence rule is how trust breaks. The rule does not have to be elaborate. It just has to be decided in advance.",
  },

  accessSensitivity: {
    intro:
      "Access and sensitivity define who can see each entry, who the AI can show it to, and what cannot leave the company perimeter.",
    classifications: [
      {
        level: "Public",
        description: "May be shared externally without restriction",
        appliesTo: ["Published terms", "Public-facing supplier registration pages"],
        aiBehaviour: "AI may quote freely",
      },
      {
        level: "Internal",
        description: "Visible to all employees, not to be shared externally",
        appliesTo: ["Most policy entries", "Standard onboarding rules"],
        aiBehaviour: "AI may use in internal-facing responses; must not include in customer or supplier replies",
      },
      {
        level: "Restricted - Internal teams only",
        description: "Visible only to named teams (Procurement, Risk, Legal)",
        appliesTo: ["Supplier-specific risk bands", "Past escalation cases"],
        aiBehaviour: "AI may use only when the requester is verified as a member of an authorised team",
      },
      {
        level: "Restricted - Compliance review required",
        description: "May not be used without human compliance review",
        appliesTo: ["Sanctioned geography rules", "High-risk supplier flags"],
        aiBehaviour: "AI must flag any response that touches these for human review; must not auto-send",
      },
    ],
    whatToNotice:
      "Most entries are not sensitive. The work is in identifying the few that are and putting clear rules around them.",
  },

  retrievalTests: {
    intro:
      "Retrieval tests prove the AI can find the right entry, use the right source, and respect the right limitation before deployment.",
    tests: [
      {
        id: "TEST-01",
        question: "A new supplier file is missing the security questionnaire. Can it proceed to approval?",
        expectedEntry: "SO-CTX-003",
        expectedSource: "Procurement policy library, Section 5.2",
        expectedBehaviour:
          "Block approval. Return to requesting team. Name Information Security as next step. Do not infer prior submissions.",
      },
      {
        id: "TEST-02",
        question: "What is the approval owner for a supplier with annual spend of EUR 120K in the IT category?",
        expectedEntry: "SO-CTX-002",
        expectedSource: "Procurement policy library, Section 4.1",
        expectedBehaviour:
          "Cite the matrix. Identify Procurement Director + Finance Director as the approvers for the EUR 100K-EUR 500K range. Note that risk-banded suppliers escalate one tier.",
      },
      {
        id: "TEST-03",
        question:
          "A standard supplier file is complete with all required fields and a clean security review. Which rule allows it to move forward?",
        expectedEntry: "SO-INT-001 + SO-CTX-002",
        expectedSource: "Intake template v3.2 + Policy 4.1",
        expectedBehaviour:
          "Confirm completeness against SO-INT-001 fields. Apply SO-CTX-002 matrix to identify approver. Do not auto-approve: surface to identified approver.",
      },
      {
        id: "TEST-04",
        question:
          "A supplier is headquartered in a sanctioned jurisdiction but has previously been approved for low-risk work. Should they be re-onboarded for new work?",
        expectedEntry: "SO-CTX-004",
        expectedSource: "Procurement policy library, Section 6.3",
        expectedBehaviour:
          "Escalate to Legal regardless of prior approval. Do not infer from past status. Sanction lists change; previous approval does not carry forward.",
      },
      {
        id: "TEST-05",
        question:
          "The supplier category code on a file is unclear or does not match the goods/services described. What should the AI do?",
        expectedEntry: "SO-TSK-005",
        expectedSource: "Historical case archive Q3 2025",
        expectedBehaviour:
          "Return to requesting team with a specific question naming the ambiguity. Do not infer the correct category. Suggest 2-3 candidate categories based on the description.",
      },
    ],
    whatToNotice:
      "A retrieval test is more than a question. It is a question, an expected entry, an expected source, and an expected behaviour. All four together make it provable.",
  },

  retrievalInstructions: {
    scope:
      "Only answer questions about: supplier profile completeness, approval routing, risk classification, exception escalation, and standard onboarding procedure. If the question is outside this scope, do not attempt to answer. Respond: 'This question is outside the supplier onboarding scope. Please route to the appropriate team.'",
    retrievalOrder: [
      "First search Layer 2 (Contextual): does an applicable rule exist?",
      "Then search Layer 1 (Internal): what does the relevant supplier file or record show?",
      "Then search Layer 3 (Task-specific): is there a worked example that matches this situation?",
    ],
    sourcePrecedence: [
      "Layer 2 (policy) overrides Layer 1 (record) overrides Layer 3 (example)",
      "Within a layer, the most recent version wins",
      "Approved vendor list overrides informal status notes for approval decisions",
      "Restricted geography rules override everything: no exceptions",
    ],
    citation:
      "For every claim in the response, cite the entry ID in square brackets. Example: 'The supplier must complete the security questionnaire before approval [SO-CTX-003].' If you cannot cite an entry, do not make the claim. Instead, say: 'This is not covered by the current knowledge base. Escalate to Procurement Ops.'",
    sensitivity:
      "Entries marked Internal must not be quoted to anyone outside the company. If the requester is external, do not retrieve these. Entries marked Restricted - Compliance require a compliance review before the response is sent. Flag the response for review; do not send automatically.",
    boundaryBehaviour:
      "When information is missing, ambiguous, or contradictory, do not fill the gap with inference. Say what is missing, who owns it, and what would be needed to answer the question fully.",
  },
};
