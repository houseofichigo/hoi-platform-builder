import type { M02BlueprintData } from "../blueprintSchema";

export const salesQuoteBlueprint: M02BlueprintData = {
  useCaseId: "sales-quote-support",
  useCaseName: "Sales Quote Support",
  useCaseDescription:
    "Help sales teams draft accurate quotes while respecting product, pricing, discount, legal, and approval rules.",

  dataMap: {
    intro:
      "Where quote knowledge lives: catalog, price book, CRM context, approval rules, legal boundaries, and past quote corrections.",
    locations: [
      {
        information: "Product and package catalog",
        livesIn: "Sales enablement library",
        owner: "Product Marketing",
        movement: "Updated at launch, packaging changes, and pricing updates",
      },
      {
        information: "Current price book and discount policy",
        livesIn: "Revenue operations system",
        owner: "Revenue Operations",
        movement: "Updated quarterly and after pricing committee decisions",
      },
      {
        information: "Account and opportunity context",
        livesIn: "CRM",
        owner: "Sales Operations",
        movement: "Updated by account owners and pipeline automation",
      },
      {
        information: "Approval thresholds and deal desk rules",
        livesIn: "Deal desk playbook",
        owner: "Finance + Revenue Operations",
        movement: "Reviewed monthly; exceptions logged per deal",
      },
      {
        information: "Legal terms and commercial boundaries",
        livesIn: "Legal clause library",
        owner: "Legal",
        movement: "Updated as standard terms and risk policy change",
      },
    ],
    whatToNotice:
      "Quote knowledge is not just price. It includes what can be sold, to whom, at what price, with which approvals and terms.",
  },

  knowledgeLayers: {
    intro:
      "Sales quote knowledge is organised into business facts, commercial rules, and examples of clean or risky quotes.",
    layers: [
      {
        name: "Internal",
        description: "What the business knows about products, prices, accounts, and opportunities",
        sources: [
          { item: "Product and package catalog", from: "Sales enablement library" },
          { item: "Current price book", from: "Revenue operations system" },
          { item: "Account and opportunity context", from: "CRM" },
          { item: "Past quote records", from: "CRM quote archive" },
        ],
      },
      {
        name: "Contextual",
        description: "Rules that govern discounting, approval, legal terms, and source precedence",
        sources: [
          { item: "Discount thresholds", from: "Deal desk playbook" },
          { item: "Approval matrix", from: "Finance policy" },
          { item: "Legal and commercial boundaries", from: "Legal clause library" },
          { item: "Current price book precedence", from: "Revenue operations policy" },
        ],
      },
      {
        name: "Task-specific",
        description: "Examples of standard quotes, exception quotes, and corrected mistakes",
        sources: [
          { item: "Clean quote examples", from: "CRM quote archive" },
          { item: "Exception and approval examples", from: "Deal desk archive" },
          { item: "Rejected or corrected quotes", from: "Quote QA review notes" },
        ],
      },
    ],
    whatToNotice:
      "A quoting assistant must distinguish price facts, approval rules, and example patterns. A prior exception is not a new standard price.",
  },

  entries: {
    intro:
      "Quote entries turn broad sales material into source-backed units the AI can retrieve: one package rule, one discount boundary, one approval trigger, or one corrected example.",
    items: [
      {
        id: "SQ-INT-001",
        layer: "Internal",
        category: "Product catalog",
        title: "Package eligibility for AI Automation add-on",
        source: "Product and package catalog v6.1",
        sourceOwner: "Product Marketing",
        content:
          "The AI Automation add-on may be quoted only with Pro and Enterprise packages. It may not be quoted as a standalone product or bundled with Starter. If a customer asks for the add-on on Starter, the quote must include an upgrade path or route to Sales Operations.",
        metadata: {
          version: "v6.1",
          lastUpdated: "2026-03-07",
          sensitivity: "Internal",
          allowedAiUse: "Yes - for quote draft validation",
        },
      },
      {
        id: "SQ-INT-002",
        layer: "Internal",
        category: "Price source",
        title: "Current price book is controlling source",
        source: "Revenue operations price book 2026-Q2",
        sourceOwner: "Revenue Operations",
        content:
          "All new quotes must use the 2026-Q2 price book unless a signed exception record is attached to the opportunity. Prior customer discounts, old quote PDFs, or account notes do not override the current price book without deal desk approval.",
        metadata: {
          version: "2026-Q2",
          lastUpdated: "2026-04-01",
          sensitivity: "Restricted - Sales",
          allowedAiUse: "Yes - for quote validation; do not expose raw price book externally",
        },
      },
      {
        id: "SQ-CTX-003",
        layer: "Contextual",
        category: "Discount approval",
        title: "Discount threshold approval matrix",
        source: "Deal desk playbook, Section 3.2",
        sourceOwner: "Finance + Revenue Operations",
        content:
          "Discounts up to 10 percent may be approved by the Account Executive. Discounts above 10 percent and up to 25 percent require Sales Director approval. Discounts above 25 percent require Deal Desk and Finance approval. Strategic exceptions require VP Sales approval and written business rationale.",
        metadata: {
          version: "v2.5",
          lastUpdated: "2026-02-21",
          sensitivity: "Internal",
          allowedAiUse: "Yes - for routing and draft warnings only",
        },
      },
      {
        id: "SQ-CTX-004",
        layer: "Contextual",
        category: "Legal boundary",
        title: "Non-standard indemnity terms require Legal review",
        source: "Legal clause library, Commercial Terms Section 5",
        sourceOwner: "Legal",
        content:
          "Any quote or proposal requesting uncapped liability, custom indemnity, audit rights, data-processing variation, or customer paper must be routed to Legal. The AI may flag the requested term but must not draft or accept alternative legal language.",
        metadata: {
          version: "v3.0",
          lastUpdated: "2026-01-29",
          sensitivity: "Restricted - Legal",
          allowedAiUse: "Read-only - escalate only",
        },
      },
      {
        id: "SQ-TSK-005",
        layer: "Task-specific",
        category: "Corrected quote example",
        title: "Old discount copied from renewal - expected handling",
        source: "Quote QA archive, Case SQ-2025-619",
        sourceOwner: "Sales Operations",
        content:
          "A draft quote copied a 30 percent discount from a prior renewal note without an attached exception record. Expected AI behaviour: flag the discount as above threshold, cite the current approval matrix, and route to Deal Desk and Finance. Do not normalize the old discount as standard pricing.",
        metadata: {
          version: "Case ref SQ-2025-619",
          lastUpdated: "2025-12-08",
          sensitivity: "Internal",
          allowedAiUse: "Yes - as worked example for quote correction",
        },
      },
    ],
    whatToNotice:
      "The safest quoting assistant does not invent commercial judgment. It retrieves the current source, flags approval needs, and leaves approval to humans.",
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
      "Quote metadata protects revenue. If the AI cannot see version, owner, and approval boundary, it may reuse stale or unauthorized pricing.",
  },

  lineage: {
    intro:
      "Lineage ties every quote suggestion to a catalog, price book, approval rule, or legal boundary. Source precedence stops old exceptions from becoming new defaults.",
    precedenceRules: [
      "Current price book overrides old quotes, account notes, and informal discount history",
      "Approval matrix overrides Account Executive preference when thresholds are exceeded",
      "Legal clause library overrides sales examples for non-standard terms",
      "Signed exception records override standard pricing only for the named opportunity",
    ],
    lineageExample:
      "An AI warning that a 30 percent discount needs Finance approval must cite SQ-CTX-003 and should trace the current price to SQ-INT-002. If no signed exception exists, the old discount cannot be reused.",
    whatToNotice:
      "Commercial teams often have many past exceptions. Lineage prevents the assistant from treating every exception as precedent.",
  },

  accessSensitivity: {
    intro:
      "Quote knowledge includes commercially sensitive pricing, customer context, and legal boundaries. The AI needs channel and role limits.",
    classifications: [
      {
        level: "Public",
        description: "May be shared externally without restriction",
        appliesTo: ["Published package names", "Public product descriptions"],
        aiBehaviour: "AI may quote approved public language",
      },
      {
        level: "Internal",
        description: "Visible to sales and operations teams",
        appliesTo: ["Approval matrix", "Packaging notes", "Sales playbook guidance"],
        aiBehaviour: "AI may use internally for drafting and routing",
      },
      {
        level: "Restricted - Sales",
        description: "Visible only to authorized commercial roles",
        appliesTo: ["Price book", "Discount history", "CRM opportunity context"],
        aiBehaviour: "AI may use for internal quote drafts only; do not expose raw sources externally",
      },
      {
        level: "Restricted - Legal review required",
        description: "Requires Legal review before customer-facing language",
        appliesTo: ["Non-standard terms", "Customer paper", "Liability changes"],
        aiBehaviour: "AI must flag and route; must not draft acceptance language",
      },
    ],
    whatToNotice:
      "Sales AI can be helpful without being autonomous. The sensitivity layer says exactly where drafting stops and approval starts.",
  },

  retrievalTests: {
    intro:
      "Quote retrieval tests prove the AI can find current pricing, apply approval thresholds, and stop at legal boundaries.",
    tests: [
      {
        id: "TEST-01",
        question: "A customer on Starter asks for the AI Automation add-on.",
        expectedEntry: "SQ-INT-001",
        expectedSource: "Product and package catalog v6.1",
        expectedBehaviour:
          "Do not quote the add-on with Starter. Suggest upgrade path or route to Sales Operations.",
      },
      {
        id: "TEST-02",
        question: "A draft quote uses a 30 percent discount copied from a prior renewal note.",
        expectedEntry: "SQ-CTX-003 + SQ-TSK-005",
        expectedSource: "Deal desk playbook + Quote QA archive",
        expectedBehaviour:
          "Flag approval requirement. Route to Deal Desk and Finance. Do not treat prior discount as standard.",
      },
      {
        id: "TEST-03",
        question: "CRM notes conflict with the 2026-Q2 price book.",
        expectedEntry: "SQ-INT-002",
        expectedSource: "Revenue operations price book 2026-Q2",
        expectedBehaviour:
          "Use current price book unless a signed exception record is attached.",
      },
      {
        id: "TEST-04",
        question: "The customer requests uncapped liability in the quote terms.",
        expectedEntry: "SQ-CTX-004",
        expectedSource: "Legal clause library, Commercial Terms Section 5",
        expectedBehaviour:
          "Route to Legal. Do not draft or accept alternative legal language.",
      },
      {
        id: "TEST-05",
        question: "A quote request lacks customer segment and package information.",
        expectedEntry: "SQ-INT-001 + SQ-INT-002",
        expectedSource: "Product catalog + Current price book",
        expectedBehaviour:
          "Ask for missing segment and package context before drafting price or bundle recommendations.",
      },
    ],
    whatToNotice:
      "The test suite is where the blueprint proves commercial discipline: current source, correct approval, and no unauthorized legal language.",
  },

  retrievalInstructions: {
    scope:
      "Only answer questions about product-package eligibility, price-source selection, discount thresholds, approval routing, CRM context needed for quoting, and legal escalation triggers.",
    retrievalOrder: [
      "First search Layer 2 (Contextual) for approval, discount, legal, or precedence rules",
      "Then search Layer 1 (Internal) for product, price book, account, and opportunity facts",
      "Then search Layer 3 (Task-specific) for corrected quote or exception examples",
    ],
    sourcePrecedence: [
      "Current price book overrides old quote documents and informal CRM notes",
      "Approval matrix overrides seller preference",
      "Legal clause library overrides sales examples for terms and liability",
      "Signed exception records apply only to the named opportunity",
    ],
    citation:
      "Cite every product, price, discount, or approval claim with an entry ID. If no entry supports the claim, do not draft the quote line.",
    sensitivity:
      "Price book and CRM context are restricted to authorized commercial roles. Legal-boundary entries require human review before customer-facing use.",
    boundaryBehaviour:
      "When package, customer segment, current price source, exception record, or approval owner is missing, ask for the missing input and do not infer.",
  },
};
