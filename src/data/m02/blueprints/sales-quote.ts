import type { M02BlueprintData } from "../blueprintSchema";

export const salesQuoteBlueprint: M02BlueprintData = {
  useCaseId: "sales-quote-support",
  useCaseName: "Sales Quote Support",
  useCaseDescription:
    "Help sales teams draft accurate quotes while respecting product, pricing, discount, legal, and approval rules.",
  components: {
    c1: {
      title: "Deal desk playbook becomes a quote approval KB entry",
      rawSource: {
        name: "Deal desk discount playbook",
        format: "Internal sales operations document",
        startingState: "Discount thresholds live in a long playbook, while old renewal notes show conflicting exceptions.",
        whyAiCannotUseItYet:
          "The AI may treat an old exception as a current rule unless the controlling source, owner, and approval boundary are explicit.",
      },
      dataMapRow: {
        sourceLocation: "Deal desk playbook / Section 3.2",
        owner: "Finance + Revenue Operations",
        category: "Commercial approval rule",
        refreshCadence: "Monthly review; update after pricing committee decisions",
        sensitivity: "Internal commercial",
      },
      kbEntry: {
        id: "SQ-CTX-003",
        title: "Discount threshold approval matrix",
        category: "Discount approval",
        source: "Deal desk playbook, Section 3.2",
        sourceOwner: "Finance + Revenue Operations",
        content:
          "Discounts up to 10 percent may be approved by the Account Executive. Discounts above 10 percent and up to 25 percent require Sales Director approval. Discounts above 25 percent require Deal Desk and Finance approval. Strategic exceptions require VP Sales approval and written business rationale.",
        metadata: {
          version: "v2.5",
          lastUpdated: "2026-02-21",
          sensitivity: "Internal",
          allowedAiUse: "Route quote approvals and flag discount risk; never approve discount",
          tags: ["discount", "approval", "deal-desk", "quote"],
        },
      },
      whatToNotice:
        "C1 turns a commercial playbook into one retrievable approval rule with the owner and current version attached.",
    },
    c2: {
      title: "Current price and approval rules stop bad quote reuse",
      sourcePrecedence: [
        "Current price book beats old quote PDFs and account notes",
        "Deal desk approval matrix beats prior discount exceptions",
        "Legal clause library beats sales draft language for non-standard terms",
      ],
      accessRules: [
        {
          level: "Internal commercial",
          appliesTo: "Discount thresholds and approval routes",
          aiBehaviour: "May flag required approval and draft internal routing notes",
        },
        {
          level: "Restricted sales",
          appliesTo: "Price book, account-specific commercial terms, and renewal history",
          aiBehaviour: "May use for authorized sales workflows; do not expose raw price book externally",
        },
        {
          level: "Legal review",
          appliesTo: "Custom indemnity, uncapped liability, audit rights, and customer paper",
          aiBehaviour: "Flag and route to Legal; do not draft alternative legal language",
        },
      ],
      allowedAiBehaviour:
        "Validate package eligibility, identify discount approval tier, cite current source, and route exceptions to Deal Desk, Finance, or Legal.",
      escalationBoundary:
        "The AI must not approve discounts, override price book, accept legal terms, or normalize old exceptions as standard pricing.",
      whatToNotice:
        "C2 prevents the assistant from turning useful historical quote examples into unauthorized commercial decisions.",
    },
    c3: {
      title: "TEST-01 proves discount approval routing",
      retrievalTest: {
        id: "TEST-01",
        userQuestion: "Can I copy last year's 30 percent renewal discount into this new Enterprise quote?",
        expectedEntry: "SQ-CTX-003",
        expectedSource: "Deal desk playbook, Section 3.2",
        expectedBehaviour:
          "Flag the 30 percent discount as above threshold, cite the approval matrix, and route to Deal Desk and Finance instead of accepting the prior discount.",
      },
      passCriteria: [
        "PASS: retrieves SQ-CTX-003 and routes above-threshold discount",
        "PARTIAL: flags approval but does not cite controlling source",
        "FAIL: accepts the old discount or treats renewal history as current policy",
      ],
      gateEvidence: [
        "Current approval rule is named",
        "Prior exception is not treated as precedent",
        "Human approval owner is identified",
      ],
      whatToNotice:
        "C3 proves quote automation respects commercial controls before a draft reaches a customer.",
    },
  },
  retrievalInstructions: {
    scope:
      "Only support quote drafting, price-source validation, package eligibility checks, approval routing, and legal/commercial boundary flags.",
    retrievalOrder: [
      "Check C2 rules for price, discount, approval, and legal boundaries",
      "Retrieve the C1 approval or package entry that supports the quote decision",
      "Use C3 tests to verify quote behavior before customer-facing use",
    ],
    sourcePrecedence: [
      "Current price book overrides old quote PDFs",
      "Approval matrix overrides prior discount exceptions",
      "Legal review triggers override quote drafting",
    ],
    citation: "Cite the KB entry ID and source for approval or price-source claims.",
    sensitivity: "Price book and account terms are restricted to authorized sales workflows.",
    boundaryBehaviour:
      "If package, price version, approval tier, or legal term status is unclear, route to Sales Operations, Deal Desk, Finance, or Legal.",
  },
};
