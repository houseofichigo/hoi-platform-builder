import type { M02BlueprintData } from "../blueprintSchema";

export const customerSupportBlueprint: M02BlueprintData = {
  useCaseId: "customer-support-kb",
  useCaseName: "Customer Support Knowledge Base",
  useCaseDescription:
    "Help an AI assistant answer, route, and escalate customer questions using approved product, policy, account, and ticket knowledge.",

  dataMap: {
    intro:
      "Where support knowledge actually lives: product sources, policy sources, account context, and real ticket history.",
    locations: [
      {
        information: "Product brochure, catalog, and feature list",
        livesIn: "Product workspace and public website",
        owner: "Product Marketing",
        movement: "Updated at launch and major release milestones",
      },
      {
        information: "FAQ and help-center articles",
        livesIn: "Customer support knowledge base",
        owner: "Support Operations",
        movement: "Reviewed monthly; urgent fixes published as needed",
      },
      {
        information: "Customer account context",
        livesIn: "CRM and subscription system",
        owner: "Customer Operations",
        movement: "Updated from billing, plan, entitlement, and region changes",
      },
      {
        information: "Refund, privacy, SLA, and escalation rules",
        livesIn: "Policy library",
        owner: "Legal + Support Leadership",
        movement: "Version-controlled; reviewed quarterly",
      },
      {
        information: "Resolved, reopened, and unresolved tickets",
        livesIn: "Ticketing platform",
        owner: "Support Operations",
        movement: "Created daily; quality-labelled during review cycles",
      },
    ],
    whatToNotice:
      "Support knowledge is not one FAQ. It is product truth, customer context, policy boundaries, and examples of real cases working together.",
  },

  knowledgeLayers: {
    intro:
      "The support map is organised by job: internal facts about the product and customer, contextual rules, and real examples of support work.",
    layers: [
      {
        name: "Internal",
        description: "What the business knows about the product and the customer",
        sources: [
          { item: "Product catalog and feature list", from: "Product workspace" },
          { item: "FAQ and help-center articles", from: "Support knowledge base" },
          { item: "Release notes and known issues", from: "Product documentation" },
          { item: "Customer plan, region, and entitlement", from: "CRM and subscription system" },
        ],
      },
      {
        name: "Contextual",
        description: "Rules and boundaries that control what support may say or do",
        sources: [
          { item: "Refund and service policy", from: "Policy library" },
          { item: "Privacy and data-handling rules", from: "Legal policy" },
          { item: "Escalation matrix", from: "Support operations playbook" },
          { item: "SLA and priority rules", from: "Support leadership policy" },
          { item: "Tone and commitment boundaries", from: "Customer experience guide" },
        ],
      },
      {
        name: "Task-specific",
        description: "Examples of routine, ambiguous, escalated, and unsafe support cases",
        sources: [
          { item: "Clean resolved tickets", from: "Ticketing platform" },
          { item: "Ambiguous or incomplete tickets", from: "Quality review archive" },
          { item: "Escalated legal, security, or payment cases", from: "Ticketing platform + specialist queues" },
          { item: "Unsafe or adversarial requests", from: "Support QA test bank" },
        ],
      },
    ],
    whatToNotice:
      "Internal sources answer what is true. Contextual sources decide what support is allowed to do. Task examples teach the assistant when to ask, escalate, or refuse.",
  },

  entries: {
    intro:
      "Support entries should be small enough to retrieve and cite: one entitlement rule, one refund boundary, one escalation trigger, or one worked example.",
    items: [
      {
        id: "CS-INT-001",
        layer: "Internal",
        category: "Account context",
        title: "Required account fields before answering entitlement questions",
        source: "CRM account schema v4.0",
        sourceOwner: "Customer Operations",
        content:
          "Before answering plan, feature access, billing, or SLA questions, the AI must check customer plan, region, account status, contract tier, and entitlement flags. If any field is missing or stale, the AI must ask for clarification or route to Support Operations instead of guessing.",
        metadata: {
          version: "v4.0",
          lastUpdated: "2026-02-18",
          sensitivity: "Internal",
          allowedAiUse: "Yes - for account-context checks and routing",
        },
      },
      {
        id: "CS-INT-002",
        layer: "Internal",
        category: "Product limitations",
        title: "Current self-service export limitation",
        source: "Release notes 2026.04",
        sourceOwner: "Product Management",
        content:
          "Self-service exports are available for Pro and Enterprise plans. Starter-plan customers must request exports through support. The AI may explain the limitation and route the request, but must not promise that self-service export is available on Starter plans.",
        metadata: {
          version: "2026.04",
          lastUpdated: "2026-04-11",
          sensitivity: "Internal",
          allowedAiUse: "Yes - for product answer drafting",
        },
      },
      {
        id: "CS-CTX-003",
        layer: "Contextual",
        category: "Refund policy",
        title: "Refund window and usage boundary",
        source: "Customer policy library, Refunds Section 2.1",
        sourceOwner: "Legal + Support Leadership",
        content:
          "Full refunds are available within 14 days of purchase regardless of usage. From day 15 to day 30, only a 50 percent refund is available and only when usage is under 5 hours. After day 30, or once usage exceeds 5 hours before day 30, support must decline refund approval and may offer escalation only for documented billing error.",
        metadata: {
          version: "v2.3",
          lastUpdated: "2026-01-20",
          sensitivity: "Internal",
          allowedAiUse: "Yes - for policy explanation; humans approve exceptions",
        },
      },
      {
        id: "CS-CTX-004",
        layer: "Contextual",
        category: "Escalation",
        title: "Legal, security, and payment-risk escalation triggers",
        source: "Support escalation playbook v3.1",
        sourceOwner: "Support Operations",
        content:
          "Tickets mentioning legal action, security incident, payment fraud, data exposure, regulator contact, or account takeover must be escalated to the named specialist queue. The AI may summarize the issue internally but must not send a final customer-facing answer without human review.",
        metadata: {
          version: "v3.1",
          lastUpdated: "2026-03-05",
          sensitivity: "Restricted - Internal teams only",
          allowedAiUse: "Read-only - summarize and escalate only",
        },
      },
      {
        id: "CS-TSK-005",
        layer: "Task-specific",
        category: "Ambiguous case example",
        title: "Missing plan context - expected handling",
        source: "Support QA archive, Case SUP-2025-812",
        sourceOwner: "Support Operations",
        content:
          "Customer asks why export is unavailable but the ticket has no plan or entitlement data attached. Expected AI behaviour: do not answer from general product memory. Ask for account lookup or route to Support Operations, naming the missing fields: plan, entitlement flag, and region.",
        metadata: {
          version: "Case ref SUP-2025-812",
          lastUpdated: "2025-11-16",
          sensitivity: "Internal",
          allowedAiUse: "Yes - as worked example for missing context",
        },
      },
    ],
    whatToNotice:
      "The support assistant should retrieve the exact rule or example it needs. Broad FAQ pages are useful sources, but the operating KB needs smaller cited entries.",
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
      "Support knowledge changes quickly. Metadata is how the team knows which answer is current, who owns it, and whether it can be shown to a customer.",
  },

  lineage: {
    intro:
      "Lineage connects each support answer to the exact entry and source. Source precedence decides what wins when a ticket, FAQ, policy, and release note disagree.",
    precedenceRules: [
      "Layer 2 policy overrides Layer 1 product or account context when they conflict",
      "Current release notes override older FAQ articles for product limitations",
      "CRM entitlement data overrides customer-stated plan details",
      "Escalation triggers override all answer drafting rules",
    ],
    lineageExample:
      "An AI response saying 'you are eligible only for a 50 percent refund' must cite CS-CTX-003 and must be based on purchase date and usage data from the account record. If either field is missing, the AI cannot make the refund claim.",
    whatToNotice:
      "Support failures often happen when a helpful answer uses the wrong source. Precedence turns competing facts into an operating rule.",
  },

  accessSensitivity: {
    intro:
      "Support knowledge includes public articles, internal policies, and customer-specific data. The AI needs clear rules for what can be used and what can be shown.",
    classifications: [
      {
        level: "Public",
        description: "May be shared externally without restriction",
        appliesTo: ["Published help articles", "Public product pages"],
        aiBehaviour: "AI may quote freely when the source is current",
      },
      {
        level: "Internal",
        description: "Visible to employees, not to be quoted externally",
        appliesTo: ["Internal escalation rules", "Known issue notes", "Support QA examples"],
        aiBehaviour: "AI may use internally, but customer-facing replies must paraphrase only approved public guidance",
      },
      {
        level: "Restricted - Customer data",
        description: "Visible only when requester is authorized for that account",
        appliesTo: ["Plan", "Usage", "Billing status", "Entitlement flags"],
        aiBehaviour: "AI may use only after requester identity and account access are verified",
      },
      {
        level: "Restricted - Specialist review required",
        description: "Requires human review before customer response",
        appliesTo: ["Legal threats", "Security incidents", "Payment fraud", "Data exposure"],
        aiBehaviour: "AI must summarize internally and escalate; must not auto-send",
      },
    ],
    whatToNotice:
      "The hardest support boundary is not finding the answer. It is using the answer in the right channel for the right requester.",
  },

  retrievalTests: {
    intro:
      "Support retrieval tests prove the AI can find the right policy, apply account context, and stop when the case needs a human.",
    tests: [
      {
        id: "TEST-01",
        question: "A customer used the product for 19 days and asks for a full refund. What should support do?",
        expectedEntry: "CS-CTX-003",
        expectedSource: "Customer policy library, Refunds Section 2.1",
        expectedBehaviour:
          "Cite the refund rule. Do not approve a full refund. Check usage hours before suggesting a 50 percent refund path.",
      },
      {
        id: "TEST-02",
        question: "A Starter-plan customer asks why self-service export is unavailable.",
        expectedEntry: "CS-INT-002",
        expectedSource: "Release notes 2026.04",
        expectedBehaviour:
          "Explain that self-service export is not available for Starter. Route export request through support. Do not promise feature access.",
      },
      {
        id: "TEST-03",
        question: "A ticket mentions a possible data exposure and asks for confirmation to the customer.",
        expectedEntry: "CS-CTX-004",
        expectedSource: "Support escalation playbook v3.1",
        expectedBehaviour:
          "Escalate to the specialist queue. Summarize internally only. Do not send a final customer-facing answer.",
      },
      {
        id: "TEST-04",
        question: "A customer asks an entitlement question but the ticket has no plan or region attached.",
        expectedEntry: "CS-INT-001 + CS-TSK-005",
        expectedSource: "CRM account schema v4.0 + Support QA archive",
        expectedBehaviour:
          "Name the missing fields and ask for account lookup. Do not answer from general product memory.",
      },
      {
        id: "TEST-05",
        question: "The FAQ says a feature is available, but the current release note says it is limited.",
        expectedEntry: "CS-INT-002",
        expectedSource: "Release notes 2026.04",
        expectedBehaviour:
          "Use the current release note as the winning source. Flag the FAQ for review if it conflicts.",
      },
    ],
    whatToNotice:
      "A support test is not just a question. It proves source selection, account-context handling, and escalation behaviour.",
  },

  retrievalInstructions: {
    scope:
      "Only answer questions about product features, account entitlement, support routing, refund policy, SLA priority, and escalation triggers. If the question is outside support scope, route to Support Operations.",
    retrievalOrder: [
      "First search Layer 2 (Contextual) for policy, privacy, SLA, or escalation rules",
      "Then search Layer 1 (Internal) for product, account, release, or entitlement facts",
      "Then search Layer 3 (Task-specific) for similar ticket examples",
    ],
    sourcePrecedence: [
      "Policy overrides product notes when the question is about approval, refund, privacy, or escalation",
      "Current release notes override older FAQ articles",
      "CRM account data overrides customer-stated account details",
      "Escalation triggers override all drafting behaviour",
    ],
    citation:
      "For every factual claim, cite the entry ID in square brackets. If no entry supports the claim, say the knowledge base does not cover it and route to Support Operations.",
    sensitivity:
      "Customer-specific account data may only be used for authorized requesters. Internal escalation rules and QA examples must not be quoted externally.",
    boundaryBehaviour:
      "When plan, region, entitlement, usage, or identity is missing, do not infer. Name the missing field and route or ask for clarification.",
  },
};
