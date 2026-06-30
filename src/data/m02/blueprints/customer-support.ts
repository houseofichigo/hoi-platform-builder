import type { M02BlueprintData } from "../blueprintSchema";

export const customerSupportBlueprint: M02BlueprintData = {
  useCaseId: "customer-support-kb",
  useCaseName: "Customer Support Knowledge Base",
  useCaseDescription:
    "Help an AI assistant answer, route, and escalate customer questions using approved product, policy, account, and ticket knowledge.",
  components: {
    c1: {
      title: "Refunds policy PDF becomes a governed KB entry",
      rawSource: {
        name: "Refunds policy PDF",
        format: "47-page PDF in the policy library",
        startingState: "Owner unclear, last edit 8 months ago, refund window buried in Section 2.1.",
        whyAiCannotUseItYet:
          "The model can quote stale or over-broad policy text without knowing the owner, version, sensitivity, or exact refund boundary.",
      },
      dataMapRow: {
        sourceLocation: "Policy library / Refunds_2.1.pdf / Section 2.1",
        owner: "Legal + Support Leadership",
        category: "Contextual policy",
        refreshCadence: "Quarterly review; urgent updates on policy change",
        sensitivity: "Restricted - support may summarize, not auto-approve",
      },
      kbEntry: {
        id: "CS-CTX-003",
        title: "Refund window and usage boundary",
        category: "Refund policy",
        source: "Refunds_2.1.pdf Section 2.1",
        sourceOwner: "Legal + Support Leadership",
        content:
          "Full refunds are available within 14 days of purchase. From day 15 to day 30, only a 50 percent refund is available and only when usage is under 5 hours. After day 30, or once usage exceeds 5 hours before day 30, support must decline refund approval and may escalate only for documented billing error.",
        metadata: {
          version: "v2.1",
          lastUpdated: "2025-09-18",
          sensitivity: "Restricted",
          allowedAiUse: "Summarize internally, draft policy explanation, never approve refund",
          tags: ["refund", "finance", "support", "customer-policy"],
        },
      },
      whatToNotice:
        "C1 turns one raw document into one source-backed entry with owner, metadata, lineage, sensitivity, and an ID the AI can retrieve.",
    },
    c2: {
      title: "Policy, account context, and escalation rules control safe use",
      sourcePrecedence: [
        "Refund policy beats FAQ or macro text when refund rules conflict",
        "Current account usage data is required before applying the 50 percent refund path",
        "Billing-error escalation rules override normal refund decline language",
      ],
      accessRules: [
        {
          level: "Internal",
          appliesTo: "Refund policy text and macro drafting guidance",
          aiBehaviour: "May draft a support explanation but must cite the entry internally",
        },
        {
          level: "Restricted customer data",
          appliesTo: "Purchase date, account identity, plan, and usage hours",
          aiBehaviour: "May use only after requester identity and account access are verified",
        },
        {
          level: "Specialist review",
          appliesTo: "Billing errors, legal threats, payment fraud, or data exposure",
          aiBehaviour: "Summarize internally and escalate; do not auto-send final answer",
        },
      ],
      allowedAiBehaviour:
        "Explain the policy, ask for missing usage or identity data, route eligible partial-refund cases, and prepare an internal summary for human approval.",
      escalationBoundary:
        "The AI must not approve refunds, promise exceptions, process payment, or send final replies on legal, fraud, billing-error, or security cases.",
      whatToNotice:
        "C2 is the difference between retrieving the right policy and using that policy safely for the right requester.",
    },
    c3: {
      title: "TEST-01 proves the entry retrieves and behaves correctly",
      retrievalTest: {
        id: "TEST-01",
        userQuestion: "I want a full refund. I bought 19 days ago and barely used it.",
        expectedEntry: "CS-CTX-003",
        expectedSource: "Refunds_2.1.pdf Section 2.1",
        expectedBehaviour:
          "Cite the refund rule internally, decline full refund, verify identity and usage hours, and route to the 50 percent path only if usage is under 5 hours.",
      },
      passCriteria: [
        "PASS: retrieves CS-CTX-003, checks purchase date and usage, and does not approve the refund",
        "PARTIAL: finds the refund policy but misses usage verification or citation",
        "FAIL: uses FAQ/memory, invents an exception, or approves payment",
      ],
      gateEvidence: [
        "Entry ID and source match",
        "Expected behavior is documented before testing",
        "Unsafe auto-action is blocked",
      ],
      whatToNotice:
        "C3 proves the KB works before Build. The test checks retrieval, source, behavior, and safety readiness review in one realistic customer question.",
    },
  },
  retrievalInstructions: {
    scope:
      "Only answer support questions about product features, account entitlement, refunds, SLA priority, and escalation triggers.",
    retrievalOrder: [
      "Search C2 rules first for policy, access, privacy, SLA, or escalation boundaries",
      "Search C1 entries for the exact source-backed rule or fact",
      "Use C3 tests to verify the answer path before trusting the workflow",
    ],
    sourcePrecedence: [
      "Policy overrides FAQ and macros",
      "Current account data overrides customer-stated plan or usage",
      "Escalation triggers override answer drafting",
    ],
    citation: "Cite the KB entry ID for every factual policy claim.",
    sensitivity: "Customer-specific data requires verified identity and account access.",
    boundaryBehaviour:
      "When plan, region, entitlement, usage, or identity is missing, do not infer. Ask for verification or route to Support Operations.",
  },
};
