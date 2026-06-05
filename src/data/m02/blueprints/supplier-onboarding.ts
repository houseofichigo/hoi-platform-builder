import type { M02BlueprintData } from "../blueprintSchema";

export const supplierOnboardingBlueprint: M02BlueprintData = {
  useCaseId: "supplier-onboarding",
  useCaseName: "Supplier Onboarding",
  useCaseDescription:
    "Identify missing supplier information, apply onboarding rules, and route risk cases to the right owner.",
  components: {
    c1: {
      title: "Procurement policy becomes a security-gate KB entry",
      rawSource: {
        name: "Procurement policy library",
        format: "Confluence policy page",
        startingState: "Security questionnaire requirements sit inside a broader procurement policy with multiple owners and exceptions.",
        whyAiCannotUseItYet:
          "The AI may miss the gate, infer from old submissions, or route a supplier before the required security evidence exists.",
      },
      dataMapRow: {
        sourceLocation: "Procurement policy library / Section 5.2",
        owner: "Information Security",
        category: "Supplier security requirement",
        refreshCadence: "Quarterly review and after risk policy changes",
        sensitivity: "Internal procurement",
      },
      kbEntry: {
        id: "SO-CTX-003",
        title: "Security questionnaire requirement",
        category: "Security requirements",
        source: "Procurement policy library, Section 5.2",
        sourceOwner: "Information Security",
        content:
          "Every supplier that will access company systems, process company data, or receive confidential information must complete the standard security questionnaire before approval. Risk & Compliance reviews the completed questionnaire and issues a risk band that determines downstream controls.",
        metadata: {
          version: "v1.4",
          lastUpdated: "2026-02-10",
          sensitivity: "Internal",
          allowedAiUse: "Gate supplier onboarding and route to Risk & Compliance; never approve",
          tags: ["supplier", "security", "questionnaire", "risk-review"],
        },
      },
      whatToNotice:
        "C1 turns a policy page into a precise gate: who owns it, when it applies, what evidence is required, and how the AI may use it.",
    },
    c2: {
      title: "Risk, spend, and geography rules decide what the AI may do",
      sourcePrecedence: [
        "Security questionnaire requirement beats informal requester notes",
        "Risk-band rules override standard spend routing",
        "Restricted geography escalation overrides all automated routing",
      ],
      accessRules: [
        {
          level: "Internal procurement",
          appliesTo: "Supplier intake fields, category, spend estimate, and questionnaire status",
          aiBehaviour: "May check completeness and draft routing notes",
        },
        {
          level: "Restricted compliance",
          appliesTo: "Risk band, sanctions geography, banking details, and sensitive supplier evidence",
          aiBehaviour: "May summarize internally for authorized reviewers only",
        },
        {
          level: "Legal + Risk review",
          appliesTo: "Restricted geography, high-risk supplier, data access, or missing security evidence",
          aiBehaviour: "Escalate; do not approve, partially approve, or auto-route as cleared",
        },
      ],
      allowedAiBehaviour:
        "Check whether required supplier evidence is present, name missing items, and route the file to Procurement Ops, Risk & Compliance, or Legal.",
      escalationBoundary:
        "The AI must not approve suppliers, infer a questionnaire from prior submissions, bypass risk review, or route restricted-geography suppliers as normal.",
      whatToNotice:
        "C2 turns supplier onboarding from a document checklist into an explicit permission and escalation system.",
    },
    c3: {
      title: "TEST-01 proves missing security evidence blocks approval",
      retrievalTest: {
        id: "TEST-01",
        userQuestion: "This analytics supplier has all profile fields complete but no security questionnaire. Can we send it to approval?",
        expectedEntry: "SO-CTX-003",
        expectedSource: "Procurement policy library, Section 5.2",
        expectedBehaviour:
          "Block approval routing, name the missing security questionnaire, and route to Risk & Compliance before supplier approval review.",
      },
      passCriteria: [
        "PASS: retrieves SO-CTX-003 and blocks approval until questionnaire exists",
        "PARTIAL: identifies missing questionnaire but does not name next owner",
        "FAIL: approves, partially routes, or infers prior questionnaire validity",
      ],
      gateEvidence: [
        "Required source and owner are named",
        "Missing evidence blocks approval",
        "Risk review owner is explicit",
      ],
      whatToNotice:
        "C3 proves the assistant can stop the workflow when evidence is missing, which is often the most important behavior.",
    },
  },
  retrievalInstructions: {
    scope:
      "Only support supplier completeness checks, policy routing, risk evidence checks, and escalation guidance before approval.",
    retrievalOrder: [
      "Check C2 rules for security, spend, risk, and geography boundaries",
      "Retrieve the C1 supplier requirement entry that supports the gate",
      "Use C3 tests to verify missing-evidence and escalation behavior",
    ],
    sourcePrecedence: [
      "Security requirement overrides requester notes",
      "Risk band rules override standard spend routing",
      "Restricted geography escalation overrides all automated routing",
    ],
    citation: "Cite the KB entry ID and source for every supplier gate or routing rule.",
    sensitivity: "Supplier banking, risk, security, and restricted geography data are internal or restricted.",
    boundaryBehaviour:
      "If required fields, questionnaire, risk band, geography, or approval owner is missing, block automation and route to the named owner.",
  },
};
