import type { M02BlueprintData } from "../blueprintSchema";

export const hrPolicyBlueprint: M02BlueprintData = {
  useCaseId: "hr-policy-support",
  useCaseName: "HR Policy Support",
  useCaseDescription:
    "Help employees find accurate HR guidance while protecting privacy, regional policy boundaries, and human review requirements.",
  components: {
    c1: {
      title: "Regional leave policy becomes a governed KB entry",
      rawSource: {
        name: "Regional leave policy",
        format: "Country policy document in the HR portal",
        startingState: "Global handbook and country policy both mention leave carryover, but only the country policy is controlling.",
        whyAiCannotUseItYet:
          "The AI cannot know which policy wins, which employee context is required, or whether the answer is safe without metadata and ownership.",
      },
      dataMapRow: {
        sourceLocation: "Country policy library / Leave policy / Section 1.3",
        owner: "Regional HR",
        category: "Contextual HR policy",
        refreshCadence: "Quarterly review and after local employment-law changes",
        sensitivity: "Internal HR",
      },
      kbEntry: {
        id: "HR-CTX-002",
        title: "Country-specific leave policy wins over global summary",
        category: "Regional policy",
        source: "Regional HR policy library, Leave Section 1.3",
        sourceOwner: "Regional HR",
        content:
          "When global handbook guidance conflicts with a country-specific leave policy, the country-specific policy is the controlling source. The AI must identify the employee country and contract type before answering and must cite the regional policy when it applies.",
        metadata: {
          version: "v2.0",
          lastUpdated: "2026-01-12",
          sensitivity: "Internal",
          allowedAiUse: "Explain policy boundaries; do not decide sensitive HR cases",
          tags: ["leave", "regional-policy", "employee-country", "hr"],
        },
      },
      whatToNotice:
        "C1 makes the policy retrievable as one owned entry and records the context required before the AI can use it.",
    },
    c2: {
      title: "Employee context and HR review rules protect the answer",
      sourcePrecedence: [
        "Country-specific policy beats global handbook summary",
        "Verified HRIS country and contract fields beat free-text employee statements",
        "Sensitive-case escalation rules beat self-service answer drafting",
      ],
      accessRules: [
        {
          level: "Internal HR",
          appliesTo: "Policy guidance and manager process steps",
          aiBehaviour: "May explain process to employees using approved policy language",
        },
        {
          level: "Restricted employee data",
          appliesTo: "Country, contract type, manager, employment status, and medical context",
          aiBehaviour: "May use only for authorized internal HR support",
        },
        {
          level: "HRBP review",
          appliesTo: "Medical, complaint, disciplinary, termination, or compensation dispute cases",
          aiBehaviour: "Route to HR Business Partner; do not interpret facts or recommend outcome",
        },
      ],
      allowedAiBehaviour:
        "Ask for country or contract context, explain the applicable policy process, and route sensitive cases to HR.",
      escalationBoundary:
        "The AI must not make employment decisions, interpret medical facts, judge complaints, approve exceptions, or expose restricted employee context.",
      whatToNotice:
        "C2 keeps HR guidance helpful without letting the AI become the decision-maker in sensitive employee matters.",
    },
    c3: {
      title: "TEST-01 proves regional policy retrieval",
      retrievalTest: {
        id: "TEST-01",
        userQuestion: "How many leave days can I carry over? I work in Germany but the handbook says five days globally.",
        expectedEntry: "HR-CTX-002",
        expectedSource: "Regional HR policy library, Leave Section 1.3",
        expectedBehaviour:
          "Use the country-specific policy as controlling, cite HR-CTX-002, and avoid answering if country or contract type is not verified.",
      },
      passCriteria: [
        "PASS: retrieves HR-CTX-002 and applies regional precedence",
        "PARTIAL: finds leave guidance but does not verify country/contract context",
        "FAIL: answers from the global handbook alone or invents a carryover rule",
      ],
      gateEvidence: [
        "Regional source is named",
        "Required employee context is listed",
        "Sensitive HR escalation boundary is present",
      ],
      whatToNotice:
        "C3 tests whether the assistant respects the policy hierarchy instead of giving the fastest generic HR answer.",
    },
  },
  retrievalInstructions: {
    scope:
      "Only answer HR policy navigation questions that can be supported by approved policy entries and verified employee context.",
    retrievalOrder: [
      "Check C2 rules for privacy, regional precedence, and HR escalation triggers",
      "Retrieve the C1 policy entry and required employee-context fields",
      "Use C3 tests to verify that regional and sensitive-case boundaries hold",
    ],
    sourcePrecedence: [
      "Country policy overrides global handbook",
      "Verified HRIS context overrides employee free text",
      "HRBP escalation rules override self-service answers",
    ],
    citation: "Cite the KB entry ID and policy source for every HR policy claim.",
    sensitivity: "Employee data and sensitive HR cases are restricted to authorized HR workflows.",
    boundaryBehaviour:
      "If country, contract type, employment status, or sensitivity is unclear, ask for HR verification or route to People Operations.",
  },
};
