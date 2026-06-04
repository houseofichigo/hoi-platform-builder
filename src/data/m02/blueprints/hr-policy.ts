import type { M02BlueprintData } from "../blueprintSchema";

export const hrPolicyBlueprint: M02BlueprintData = {
  useCaseId: "hr-policy-support",
  useCaseName: "HR Policy Support",
  useCaseDescription:
    "Help employees find accurate HR guidance while protecting privacy, regional policy boundaries, and human review requirements.",

  dataMap: {
    intro:
      "Where HR guidance lives: policy documents, employee context, case history, regional variants, and escalation rules.",
    locations: [
      {
        information: "Employee handbook and benefits guide",
        livesIn: "HR policy portal",
        owner: "People Operations",
        movement: "Reviewed quarterly and after policy changes",
      },
      {
        information: "Employee profile context",
        livesIn: "HRIS",
        owner: "People Systems",
        movement: "Updated from employment, location, contract, and manager changes",
      },
      {
        information: "Regional policy variants",
        livesIn: "Country policy library",
        owner: "Regional HR",
        movement: "Updated as local employment rules change",
      },
      {
        information: "HR case history",
        livesIn: "HR service desk",
        owner: "People Operations",
        movement: "Created daily; sensitive cases access-restricted",
      },
      {
        information: "Approval and escalation workflow",
        livesIn: "Manager and HR playbook",
        owner: "HR Business Partners",
        movement: "Reviewed biannually and after governance changes",
      },
    ],
    whatToNotice:
      "HR AI is only useful when policy and employee context are separated from sensitive case handling. The data map shows where that boundary starts.",
  },

  knowledgeLayers: {
    intro:
      "HR knowledge is organised into employee and policy facts, rules that govern safe answers, and examples of routine or sensitive cases.",
    layers: [
      {
        name: "Internal",
        description: "What the business knows about employees, policies, and available programs",
        sources: [
          { item: "Employee handbook", from: "HR policy portal" },
          { item: "Benefits guide", from: "HR policy portal" },
          { item: "Employee profile context", from: "HRIS" },
          { item: "HR case categories and resolution notes", from: "HR service desk" },
        ],
      },
      {
        name: "Contextual",
        description: "Rules that limit, localize, or escalate HR guidance",
        sources: [
          { item: "Privacy and confidentiality rules", from: "HR privacy policy" },
          { item: "Regional policy variants", from: "Country policy library" },
          { item: "Manager approval boundaries", from: "Manager playbook" },
          { item: "Sensitive-case escalation rules", from: "HRBP playbook" },
        ],
      },
      {
        name: "Task-specific",
        description: "Examples of routine questions, missing context, policy conflicts, and sensitive cases",
        sources: [
          { item: "Routine employee questions", from: "HR service desk archive" },
          { item: "Sensitive HR cases", from: "Restricted HR case archive" },
          { item: "Policy conflict examples", from: "Regional HR review notes" },
        ],
      },
    ],
    whatToNotice:
      "The same employee question can have a different answer depending on country, contract, manager approval, or sensitivity. The layers make those conditions visible.",
  },

  entries: {
    intro:
      "HR entries should keep policy answers small, source-backed, and bounded. The AI needs enough context to help, but not enough freedom to decide sensitive cases alone.",
    items: [
      {
        id: "HR-INT-001",
        layer: "Internal",
        category: "Employee context",
        title: "Required profile fields before giving policy guidance",
        source: "HRIS profile schema v5.2",
        sourceOwner: "People Systems",
        content:
          "Before giving guidance that varies by employee status, the AI must check country, contract type, employment status, manager, entity, and working location. If any field is unavailable, it must ask for HR verification or route to People Operations.",
        metadata: {
          version: "v5.2",
          lastUpdated: "2026-02-04",
          sensitivity: "Restricted - HR",
          allowedAiUse: "Yes - for internal HR routing and policy-context checks",
        },
      },
      {
        id: "HR-CTX-002",
        layer: "Contextual",
        category: "Regional policy",
        title: "Country-specific leave policy wins over global summary",
        source: "Regional HR policy library, Leave Section 1.3",
        sourceOwner: "Regional HR",
        content:
          "When global handbook guidance conflicts with a country-specific leave policy, the country-specific policy is the controlling source. The AI must identify the employee country before answering and must cite the regional policy when it applies.",
        metadata: {
          version: "v2.0",
          lastUpdated: "2026-01-12",
          sensitivity: "Internal",
          allowedAiUse: "Yes - for policy explanation",
        },
      },
      {
        id: "HR-CTX-003",
        layer: "Contextual",
        category: "Sensitive escalation",
        title: "Medical, complaint, and disciplinary cases require HR review",
        source: "HRBP escalation playbook v3.4",
        sourceOwner: "HR Business Partners",
        content:
          "Questions involving medical information, harassment, discrimination, disciplinary action, termination risk, compensation dispute, or formal complaint must be routed to HR Business Partners. The AI may provide neutral next-step guidance but must not interpret facts, judge validity, or recommend an outcome.",
        metadata: {
          version: "v3.4",
          lastUpdated: "2026-03-19",
          sensitivity: "Restricted - HR",
          allowedAiUse: "Read-only - route and summarize only",
        },
      },
      {
        id: "HR-CTX-004",
        layer: "Contextual",
        category: "Approval boundary",
        title: "Manager approval required for schedule exceptions",
        source: "Manager playbook, Flexible Work Section 2.2",
        sourceOwner: "People Operations",
        content:
          "Schedule exceptions longer than two consecutive weeks require manager approval and HR visibility. The AI may explain the process and required information, but must not imply approval or create an exception record without manager confirmation.",
        metadata: {
          version: "v1.8",
          lastUpdated: "2026-02-25",
          sensitivity: "Internal",
          allowedAiUse: "Yes - for process explanation; humans approve",
        },
      },
      {
        id: "HR-TSK-005",
        layer: "Task-specific",
        category: "Missing context example",
        title: "Leave question without country - expected handling",
        source: "HR service desk QA archive, Case HR-2025-332",
        sourceOwner: "People Operations",
        content:
          "Employee asks how many days of leave they can carry over, but the request does not include country or contract type. Expected AI behaviour: do not answer from the global handbook. Ask for country and contract type or route to People Operations for profile lookup.",
        metadata: {
          version: "Case ref HR-2025-332",
          lastUpdated: "2025-10-03",
          sensitivity: "Internal",
          allowedAiUse: "Yes - as worked example for missing HR context",
        },
      },
    ],
    whatToNotice:
      "HR entries are useful when they make the boundary explicit: what can be answered, what context is required, and when a human must take over.",
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
      "For HR, metadata is not admin work. It is how the team prevents generic guidance from overriding local policy or sensitive-case handling.",
  },

  lineage: {
    intro:
      "Lineage traces HR guidance back to the policy entry and employee context that support it. Precedence decides which source wins when global, regional, and manager guidance conflict.",
    precedenceRules: [
      "Layer 2 regional policy overrides Layer 1 global handbook when they conflict",
      "Current HRIS profile context overrides employee-stated context for eligibility decisions",
      "Sensitive-case escalation rules override routine policy guidance",
      "Human HRBP review overrides all AI-generated guidance for restricted cases",
    ],
    lineageExample:
      "An AI response saying 'country-specific leave carryover applies' must cite HR-CTX-002 and must be based on country context from HR-INT-001. If country is missing, the response cannot be trusted.",
    whatToNotice:
      "HR trust depends on knowing which context changed the answer. Lineage shows why the answer applies to this employee, not just to employees in general.",
  },

  accessSensitivity: {
    intro:
      "HR knowledge includes employee data and sensitive cases. The AI must know who can see each entry and what it may not decide.",
    classifications: [
      {
        level: "Public",
        description: "May be shared externally without restriction",
        appliesTo: ["Published careers policies", "Public benefits summaries"],
        aiBehaviour: "AI may quote freely when content is approved for public use",
      },
      {
        level: "Internal",
        description: "Visible to employees, not external parties",
        appliesTo: ["Employee handbook", "Benefits guide", "Manager process summaries"],
        aiBehaviour: "AI may answer employees with policy citations",
      },
      {
        level: "Restricted - HR",
        description: "Visible only to HR or authorized managers",
        appliesTo: ["Employee profile fields", "Case history", "Compensation or complaint records"],
        aiBehaviour: "AI may use only for authorized HR workflows and must not expose details broadly",
      },
      {
        level: "Restricted - Human review required",
        description: "Requires HRBP review before action or advice",
        appliesTo: ["Medical cases", "Complaints", "Disciplinary matters", "Termination risk"],
        aiBehaviour: "AI must route and summarize; must not recommend an outcome",
      },
    ],
    whatToNotice:
      "Most HR answers need context. Some HR cases need human care. The sensitivity layer separates those two problems.",
  },

  retrievalTests: {
    intro:
      "HR retrieval tests prove the AI can ask for missing context, select the right regional policy, and escalate sensitive cases.",
    tests: [
      {
        id: "TEST-01",
        question: "An employee asks how many leave days they can carry over, but no country is attached.",
        expectedEntry: "HR-INT-001 + HR-TSK-005",
        expectedSource: "HRIS profile schema v5.2 + HR service desk QA archive",
        expectedBehaviour:
          "Ask for country and contract type or route to People Operations. Do not answer from the global handbook.",
      },
      {
        id: "TEST-02",
        question: "Global handbook and France policy disagree on leave carryover.",
        expectedEntry: "HR-CTX-002",
        expectedSource: "Regional HR policy library, Leave Section 1.3",
        expectedBehaviour:
          "Use the country-specific policy as the controlling source and cite it.",
      },
      {
        id: "TEST-03",
        question: "An employee mentions a harassment complaint and asks whether HR will support them.",
        expectedEntry: "HR-CTX-003",
        expectedSource: "HRBP escalation playbook v3.4",
        expectedBehaviour:
          "Provide neutral next-step guidance and route to HRBP. Do not judge facts or recommend an outcome.",
      },
      {
        id: "TEST-04",
        question: "An employee asks whether a three-week schedule exception is approved.",
        expectedEntry: "HR-CTX-004",
        expectedSource: "Manager playbook, Flexible Work Section 2.2",
        expectedBehaviour:
          "Explain manager approval and HR visibility are required. Do not imply approval.",
      },
      {
        id: "TEST-05",
        question: "A manager asks for an employee's case history to prepare a team update.",
        expectedEntry: "HR-INT-001 + HR-CTX-003",
        expectedSource: "HRIS profile schema + HRBP escalation playbook",
        expectedBehaviour:
          "Refuse broad disclosure. Route to HR if there is a legitimate need and authorization.",
      },
    ],
    whatToNotice:
      "Good HR tests prove more than retrieval. They prove restraint, privacy, and escalation.",
  },

  retrievalInstructions: {
    scope:
      "Only answer employee policy, benefits, leave, schedule, manager-process, and HR routing questions that are covered by approved HR entries. Sensitive cases must be routed to HR.",
    retrievalOrder: [
      "First search Layer 2 (Contextual) for regional policy, privacy, approval, or escalation rules",
      "Then search Layer 1 (Internal) for handbook, benefits, or employee-context facts",
      "Then search Layer 3 (Task-specific) for similar HR service examples",
    ],
    sourcePrecedence: [
      "Regional policy overrides global handbook when they conflict",
      "Current HRIS context overrides user-stated context for eligibility",
      "Sensitive escalation rules override routine policy guidance",
      "Human HRBP review overrides AI guidance for restricted cases",
    ],
    citation:
      "Cite every policy or context claim with an entry ID. If an answer depends on missing employee context, do not make the claim.",
    sensitivity:
      "Employee-specific data and sensitive HR cases are restricted. Do not disclose case details outside authorized HR workflows.",
    boundaryBehaviour:
      "When country, contract type, employment status, manager approval, or sensitivity is unclear, ask for context or route to People Operations. Do not infer.",
  },
};
