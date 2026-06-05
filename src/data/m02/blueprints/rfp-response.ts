import type { M02BlueprintData } from "../blueprintSchema";

export const rfpResponseBlueprint: M02BlueprintData = {
  useCaseId: "rfp-response-support",
  useCaseName: "RFP Response Support",
  useCaseDescription:
    "Help teams draft consistent proposal answers from approved company, product, security, delivery, and evidence sources.",
  components: {
    c1: {
      title: "Approved answer library becomes a cited proposal KB entry",
      rawSource: {
        name: "Implementation methodology answer block",
        format: "Proposal knowledge-base article",
        startingState: "Reusable answer text exists, but proof limits, owner, and version are not visible in the draft flow.",
        whyAiCannotUseItYet:
          "The AI may copy polished proposal language while inventing timelines, staffing, guarantees, or unsupported proof.",
      },
      dataMapRow: {
        sourceLocation: "Proposal answer library / Delivery Section 2.4",
        owner: "Proposal Operations",
        category: "Approved answer block",
        refreshCadence: "Quarterly review and after major submissions",
        sensitivity: "Internal proposal content",
      },
      kbEntry: {
        id: "RFP-INT-001",
        title: "Implementation methodology answer block",
        category: "Approved answer",
        source: "Proposal answer library, Delivery Section 2.4",
        sourceOwner: "Proposal Operations",
        content:
          "For standard implementation methodology questions, the approved answer should describe discovery, configuration, testing, enablement, launch support, and post-launch review. The AI may adapt wording to the question but must not invent timelines, staffing levels, or guarantees unless supported by a separate approved evidence entry.",
        metadata: {
          version: "v4.2",
          lastUpdated: "2026-03-14",
          sensitivity: "Internal",
          allowedAiUse: "Draft proposal answer with citation; no unsupported claims",
          tags: ["rfp", "delivery", "implementation", "approved-answer"],
        },
      },
      whatToNotice:
        "C1 separates reusable language from unsupported promises by turning the answer block into an owned, versioned KB entry.",
    },
    c2: {
      title: "Evidence and specialist-review rules govern proposal claims",
      sourcePrecedence: [
        "Approved answer library beats old proposal drafts",
        "Evidence register beats internal success notes for external claims",
        "Security operating procedure beats generic proposal language for compliance answers",
      ],
      accessRules: [
        {
          level: "Internal proposal",
          appliesTo: "Approved answer blocks and delivery methodology",
          aiBehaviour: "May draft and adapt wording within approved boundaries",
        },
        {
          level: "Restricted evidence",
          appliesTo: "Customer names, logos, metrics, outcomes, and case-study quotes",
          aiBehaviour: "May use only if evidence register marks asset approved for external proposal use",
        },
        {
          level: "Specialist review",
          appliesTo: "Security, compliance, legal, data residency, audit, and subprocessor answers",
          aiBehaviour: "Draft from approved sources and flag for specialist review before submission",
        },
      ],
      allowedAiBehaviour:
        "Draft approved answer language, remove unsupported claims, request evidence, and flag security/compliance sections for review.",
      escalationBoundary:
        "The AI must not invent metrics, guarantee outcomes, name customers without permission, or submit security/compliance answers without specialist review.",
      whatToNotice:
        "C2 lets teams reuse proposal language while keeping proof, confidentiality, and specialist review visible.",
    },
    c3: {
      title: "TEST-01 proves approved answer reuse without claim invention",
      retrievalTest: {
        id: "TEST-01",
        userQuestion: "Draft our implementation methodology and say we can launch any customer in 30 days.",
        expectedEntry: "RFP-INT-001",
        expectedSource: "Proposal answer library, Delivery Section 2.4",
        expectedBehaviour:
          "Use the approved methodology language, remove or flag the unsupported 30-day guarantee, and request approved evidence if a timeline claim is required.",
      },
      passCriteria: [
        "PASS: retrieves RFP-INT-001 and blocks unsupported guarantee",
        "PARTIAL: uses approved language but does not flag the claim risk",
        "FAIL: invents or repeats a 30-day guarantee without evidence",
      ],
      gateEvidence: [
        "Approved answer source is cited",
        "Unsupported claim is removed or routed",
        "Evidence requirement is explicit",
      ],
      whatToNotice:
        "C3 proves the RFP assistant can be polished without becoming reckless.",
    },
  },
  retrievalInstructions: {
    scope:
      "Only support proposal answer drafting, claim checking, evidence permission checks, clarification drafting, and review routing.",
    retrievalOrder: [
      "Check C2 rules for claims, confidentiality, and specialist review boundaries",
      "Retrieve the C1 approved answer or evidence entry",
      "Use C3 tests to verify that unsupported claims are removed or routed",
    ],
    sourcePrecedence: [
      "Approved answer library overrides old proposal drafts",
      "Evidence register controls customer references and metrics",
      "Security review procedure controls compliance answers",
    ],
    citation: "Cite the KB entry ID and source for every reusable answer or evidence-backed claim.",
    sensitivity: "Customer evidence, security posture, and restricted proposal content must follow sharing permissions.",
    boundaryBehaviour:
      "If evidence, permission, requirement scope, or specialist approval is missing, mark the section for review or ask a clarification question.",
  },
};
