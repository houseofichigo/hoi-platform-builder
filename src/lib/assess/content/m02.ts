import type { InvoiceOcrProfileContext, OCRBlock } from "./types";

export const M02_COURSE_CONTENT = {
  placeholder: false,

  storyHeader:
    "Data Readiness & Knowledge Base Preparation. Before you prompt, before you build, you map the sources and turn them into trusted knowledge the AI can retrieve. Today's job: build a three-layer knowledge base blueprint for a candidate process.",

  step1: {
    title: "Internal knowledge - what already lives inside the company",
    why:
      "Internal knowledge is the governed meaning inside your systems of record: records, histories, policies, schemas, labels, and workflow data. Before asking a model to act, map what the system can read, who owns it, how current it is, and what metadata makes it retrievable.",
    example:
      "For support ticket triage, the internal layer may include ticket history, customer profile, product catalog, SLA rules, routing queues, and prior resolution notes.",
    whatToNotice: [
      "Every internal data source needs a named owner - 'IT' is not enough",
      "Quality is not the same as completeness - complete records can still be stale or wrong",
      "Access path matters as much as access itself - API beats CSV export beats manual lookup",
    ],
    produces: "Layer 01 - internal knowledge sources",
    nextLabel: "Step 2 - contextual knowledge",
  },

  step2: {
    title: "Contextual knowledge - the rules the system must respect",
    why:
      "Contextual knowledge is the rule layer around the process: laws, industry requirements, contracts, operating policies, escalation rules, and risk boundaries. Miss one and the AI may produce an answer that is fluent but unusable.",
    example:
      "For support triage, contextual rules may include GDPR, customer terms, escalation policy, security policy, refund policy, sector rules, and tone-of-voice guidance.",
    whatToNotice: [
      "Contextual rules have a regime and a consequence if ignored",
      "Internal policy counts as contextual knowledge even if no regulator enforces it",
      "When data crosses tools or vendors, residency and processor rules become part of the design",
    ],
    produces: "Layer 02 - contextual knowledge and regimes",
    nextLabel: "Step 3 - task-specific knowledge",
  },

  step3: {
    title: "Task-specific knowledge - examples and boundary cases",
    why:
      "Task-specific knowledge is the curated evidence that proves the AI can handle this task: clean examples, edge cases, adversarial cases, expected outputs, and known limitations.",
    example:
      "A minimum viable support-triage test set might include 5 clean tickets, 5 edge tickets with ambiguous routing, and 5 adversarial tickets with prompt injection, legal risk, or unsafe disclosure attempts.",
    whatToNotice: [
      "Edge cases are the ones that fail silently in production - explicitly bait them",
      "Adversarial cases test refusal and escalation, not just accuracy",
      "Test-set size matters less than coverage of the failure modes you already know",
    ],
    produces: "Layer 03 - task-specific examples, edge cases, and expected behavior",
    nextLabel: "Step 4 - knowledge base blueprint",
  },

  step4: {
    title: "Knowledge base blueprint - entries, retrieval tests, and readiness",
    why:
      "The source map tells us what exists. The knowledge base tells the AI what to use. M02 is complete when sources are mapped, entries are structured with metadata, retrieval tests are written, and gaps are named.",
    example:
      "A strong entry is not just 'refund policy'. It is an entry such as 'Refund window after product use' with source, owner, rule, tags, sensitivity, status, refresh rule, and a retrieval test.",
    whatToNotice: [
      "A knowledge base is structured, searchable, source-backed, versioned, permission-aware, and governed",
      "Retrieval tests prove whether the AI can find the right knowledge at the right time",
      "Readiness is based on evidence, not intention: missing owners, metadata, access, or tests become reason codes",
    ],
    produces: "Three-layer knowledge base blueprint -> completes M02",
  },

  knowledgeEntryOptions: [
    "Schema or field requirement - required fields, format, validation rule, applies_to, source, owner",
    "Internal policy rule - threshold, escalation path, exception owner, source policy, refresh rule",
    "External regulation or standard - privacy, retention, sector, contract, or residency rule",
    "Task-specific edge case - ambiguous request, missing data, conflicting rule, unsafe request, duplicate case",
    "Quality or safety rule - manual review trigger, confidence boundary, sensitive data handling, stop condition",
  ] as const,

  retrievalTestOptions: [
    "What fields or facts are mandatory for this workflow?",
    "What rule applies if required information is missing or conflicting?",
    "Which items require manager, specialist, or human review?",
    "What source confirms this answer?",
    "Which edge cases require refusal or escalation instead of automation?",
  ] as const,

  gateReadinessChecks: [
    "Data layers identified",
    "Knowledge base scope defined",
    "Trusted sources selected",
    "Ownership defined",
    "Metadata added",
    "Quality checks documented",
    "Access governed",
    "Privacy and residency known",
    "Boundary cases curated",
    "Retrieval test questions written",
    "Refresh process defined",
    "Gaps and blockers listed",
  ] as const,

  gateReasonCodes: [
    "NO_OWNER",
    "NO_SOURCE",
    "NO_METADATA",
    "NO_ACCESS",
    "RULES_UNDOCUMENTED",
    "NO_BOUNDARY_CASES",
    "NO_RETRIEVAL_TEST",
    "SENSITIVE_DATA_BLOCKED",
  ] as const,

  internalSources: {
    intro:
      "Five internal sources mapped to governance dimensions. The selected value sits next to rejected alternatives so learners see the method, not just the answer.",
    rows: [
      {
        label: "Primary process record",
        value: "Support ticket record with original message and status history",
        options: [
          "Support ticket record with original message and status history",
          "A spreadsheet exported once a month",
          "Agent memory of common cases",
          "Chat transcript only, with no status history",
        ],
        why:
          "The ticket record is the source of truth because it carries the request, status, owner, timestamps, and resolution history. A static export or memory-based source cannot support audit or repeatable triage.",
        governance: {
          ownership: "Support Operations Lead",
          lineage: "Customer channel -> ticketing system -> triage queue -> resolution log",
          quality: "Medium - structured fields are reliable, free-text quality varies",
          access: "Read-only API for analysis; write access gated by workflow role",
          privacy: "Personal data possible - customer identity and request content",
        },
      },
      {
        label: "Approved policy source",
        value: "Current policy knowledge base with version owner",
        options: [
          "Current policy knowledge base with version owner",
          "Old help-center pages copied into a document",
          "Slack answers from experienced agents",
          "Model-generated policy summary",
        ],
        why:
          "The AI needs the current approved rule, not the loudest historical answer. Version ownership makes every answer traceable.",
        governance: {
          ownership: "Customer Operations Manager",
          lineage: "Policy owner publishes -> knowledge base version -> retrieval index",
          quality: "High if review dates are enforced",
          access: "Read-only retrieval source",
          privacy: "Internal policy, usually no personal data",
        },
      },
      {
        label: "Routing taxonomy",
        value: "Controlled list of topics, queues, urgency levels, and owners",
        options: [
          "Controlled list of topics, queues, urgency levels, and owners",
          "Free-text labels created by agents",
          "Last quarter's most common labels",
          "Let the model decide a new label each time",
        ],
        why:
          "Routing needs a controlled vocabulary. If the model invents new labels, analytics, automation, and ownership break.",
        governance: {
          ownership: "Support Operations Lead",
          lineage: "Ops taxonomy -> ticketing fields -> dashboard reporting",
          quality: "High - limited vocabulary, periodically reviewed",
          access: "Read via ticketing metadata API",
          privacy: "Internal operational data",
        },
      },
      {
        label: "Customer and account context",
        value: "Customer profile with plan, region, entitlements, and account status",
        options: [
          "Customer profile with plan, region, entitlements, and account status",
          "Customer name only",
          "Sales CRM notes without entitlement fields",
          "No account context",
        ],
        why:
          "Many answers depend on plan, region, or entitlement. Without that context, the AI may answer a question for the wrong customer segment.",
        governance: {
          ownership: "Customer Success Operations",
          lineage: "CRM/account system -> support context panel -> ticket workspace",
          quality: "Medium - plan status is reliable, notes can be stale",
          access: "Read-only via customer profile API",
          privacy: "Personal and commercial data - permissioned access required",
        },
      },
      {
        label: "Historical resolution set",
        value: "Curated set of closed cases with expected classification and resolution",
        options: [
          "Curated set of closed cases with expected classification and resolution",
          "All historical tickets without labels",
          "Only last week's tickets",
          "No historical cases",
        ],
        why:
          "A curated set gives the evaluation something to compare against. Raw history without labels is data, not a test set.",
        governance: {
          ownership: "Quality Lead",
          lineage: "Closed tickets -> anonymized sample -> labelled evaluation set",
          quality: "Verified - expected outputs reviewed by senior agent",
          access: "Read-only evaluation set",
          privacy: "Anonymized before use in testing",
        },
      },
    ],
    computed: {
      label: "Layer 01 readout - source-backed, owner-backed, and access-aware",
      body:
        "The internal layer is ready when every source has an owner, a lineage, a quality note, an access path, and a sensitivity label. Missing one dimension becomes a named gap.",
    },
  } as const satisfies OCRBlock,

  contextualRules: {
    intro:
      "Five contextual rules that govern a support-triage style system. Each rule names the source of authority and the consequence of ignoring it.",
    rows: [
      {
        label: "Privacy and personal data",
        value: "GDPR or local privacy rule applies to customer identity and message content",
        options: [
          "Not applicable - these are normal business requests",
          "GDPR or local privacy rule applies to customer identity and message content",
          "Sector-specific privacy overlay applies",
          "Handle privacy case by case",
        ],
        why:
          "Customer names, emails, account data, and message content are personal data in many regimes. The system must know what can be read, stored, summarized, and sent to third-party tools.",
        governance: {
          ownership: "Data Protection Officer",
          lineage: "Privacy policy -> processing register -> support workflow rules",
          quality: "High if the processing purpose and processors are documented",
          access: "Compliance policy and processing register",
          privacy: "Personal data; purpose-limited handling",
        },
      },
      {
        label: "Customer commitment boundary",
        value: "Support can explain policy but cannot make new legal, price, or contract commitments",
        options: [
          "Support can make commitments when it sounds reasonable",
          "Support can explain policy but cannot make new legal, price, or contract commitments",
          "Every answer requires legal review",
          "Let the model decide based on tone",
        ],
        why:
          "A fluent model can accidentally promise refunds, discounts, dates, or contract positions. The boundary must be explicit before automation.",
        governance: {
          ownership: "Head of Customer Operations",
          lineage: "Support policy -> approved response rules -> quality review",
          quality: "Medium - escalation boundaries often drift in practice",
          access: "Internal policy knowledge base",
          privacy: "Internal operational rule",
        },
      },
      {
        label: "Escalation and safety",
        value: "Legal, safety, security, discrimination, or payment issues escalate to a human owner",
        options: [
          "Only angry customers escalate",
          "Legal, safety, security, discrimination, or payment issues escalate to a human owner",
          "Only enterprise customers escalate",
          "No escalation rule needed",
        ],
        why:
          "Risk is not the same as volume. Low-volume cases can create the highest operational or legal impact.",
        governance: {
          ownership: "Support Quality Lead",
          lineage: "Risk policy -> triage labels -> owner routing",
          quality: "High if labels and owners are maintained",
          access: "Routing policy and queue metadata",
          privacy: "May include sensitive personal or security-related content",
        },
      },
      {
        label: "Source precedence",
        value: "Current published policy outranks historical ticket answers and informal notes",
        options: [
          "Newest Slack answer wins",
          "Current published policy outranks historical ticket answers and informal notes",
          "Most common historical answer wins",
          "The model decides what sounds coherent",
        ],
        why:
          "The AI must know which source wins when evidence conflicts. Without precedence, retrieval can amplify old practice over current policy.",
        governance: {
          ownership: "Knowledge Manager",
          lineage: "Policy release -> versioned knowledge base -> retrieval metadata",
          quality: "High when version metadata is present",
          access: "Knowledge base with version history",
          privacy: "Internal policy data",
        },
      },
      {
        label: "Retention and audit trail",
        value: "System decisions, sources, and human overrides are logged for quality review",
        options: [
          "No logs needed for a helper tool",
          "System decisions, sources, and human overrides are logged for quality review",
          "Only failures are logged",
          "Logs are kept in chat history only",
        ],
        why:
          "If the system routes, drafts, or escalates, the team needs an evidence trail: what it saw, what it used, what it decided, and who changed it.",
        governance: {
          ownership: "Operations Analytics Lead",
          lineage: "AI output -> workflow event -> audit log -> quality dashboard",
          quality: "Medium until retention rules and dashboards are active",
          access: "Audit log table or reporting store",
          privacy: "Personal data possible; retention and role access required",
        },
      },
    ],
    computed: {
      label: "Layer 02 readout - rules, boundaries, and source precedence",
      body:
        "The contextual layer is ready when the AI knows which rules apply, which source wins, and when to escalate instead of answer.",
    },
  } as const satisfies OCRBlock,

  testSet: {
    intro:
      "A minimum viable task-specific test set: 15 examples across clean, edge, and adversarial buckets.",
    rows: [
      {
        label: "Clean cases (5 examples)",
        value: "Clear request, one topic, known policy, correct owner, enough context",
        options: [
          "All from one customer segment",
          "Clear request, one topic, known policy, correct owner, enough context",
          "Random tickets from last week",
          "Only the easiest solved cases",
        ],
        why:
          "Clean cases establish baseline behavior. They answer: can the system handle the obvious cases correctly and consistently?",
        governance: {
          ownership: "Support Quality Lead",
          lineage: "Closed cases -> anonymized sample -> expected labels",
          quality: "Verified by senior agent",
          access: "Read-only evaluation set",
          privacy: "Anonymized before testing",
        },
      },
      {
        label: "Edge cases (5 examples)",
        value: "Ambiguous topic, missing account data, conflicting rules, multi-issue request, unclear owner",
        options: [
          "Whatever cases were loudest last month",
          "Ambiguous topic, missing account data, conflicting rules, multi-issue request, unclear owner",
          "Three random failures",
          "Only the failure mode the team dislikes most",
        ],
        why:
          "Edge cases expose where the knowledge base, policy, and routing taxonomy are too weak for automation.",
        governance: {
          ownership: "Support Operations Lead",
          lineage: "Exception log -> edge-case catalog -> evaluation set",
          quality: "Expected outputs include the right escalation path",
          access: "Read-only evaluation set",
          privacy: "Anonymized or synthetic",
        },
      },
      {
        label: "Adversarial cases (5 examples)",
        value: "Prompt injection, unsafe disclosure request, fake policy quote, refund pressure, legal threat",
        options: [
          "We do not test adversarial cases",
          "Prompt injection, unsafe disclosure request, fake policy quote, refund pressure, legal threat",
          "Real security incidents copied verbatim",
          "Whatever the model fails on first",
        ],
        why:
          "Adversarial cases test refusal, not helpfulness. A correct response may be to stop, escalate, or ask for human review.",
        governance: {
          ownership: "Security or Risk Lead with Support Quality",
          lineage: "Risk patterns -> synthetic examples -> refusal/elevation answer key",
          quality: "Verified - expected outputs include stop/escalate behavior",
          access: "Read-only evaluation set",
          privacy: "Fully synthetic or heavily anonymized",
        },
      },
    ],
    computed: {
      label: "Layer 03 readout - clean, edge, and adversarial coverage",
      body:
        "The test set is useful when each bucket has a purpose, an owner, and an expected output. Random examples do not prove readiness.",
    },
  } as const satisfies OCRBlock,

  gapOptions: [
    "We do not have a named owner for one important source",
    "A key policy exists but has no version, review date, or source owner",
    "The taxonomy is inconsistent - teams use different labels for the same issue",
    "We cannot access the source through a reliable API or export",
    "We do not know which source wins when policy and historical practice conflict",
    "Sensitive data rules are unclear for one source or tool",
    "We have no edge-case examples - only clean cases get evaluated",
    "We have no adversarial cases - refusal and escalation are untested",
    "Historical cases are incomplete or not labelled with expected outcomes",
    "We have not defined the refresh process for the knowledge base",
  ] as const,

  seeds: {
    "m02.test_set": {
      clean: 5,
      edge: 5,
      adversarial: 5,
    },
  },

  methodNote:
    "The data map tells us what exists. The knowledge base tells the AI what to use. M02 is done when the knowledge is source-backed, metadata-rich, testable, and governed.",
} as const;

export function getM02InternalSourceOptions(ctx: InvoiceOcrProfileContext): string[] {
  const company = ctx.companyName ?? "your company";
  return [
    `Ticket, request, or process records at ${company}`,
    "Approved policy or procedure knowledge base",
    "Customer, employee, supplier, or account context",
    "Controlled taxonomy: topics, queues, urgency, owner, status",
    "Historical resolved cases with expected outcomes",
    "Product, service, contract, or entitlement catalog",
    "Audit log or quality review records",
  ];
}

export function getM02ContextualRuleOptions(ctx: InvoiceOcrProfileContext): string[] {
  const country = ctx.country ?? "your region";
  return [
    `Privacy and data-handling rules for ${country}`,
    "Internal policy boundaries and approval thresholds",
    "Customer commitment boundary: what the AI must not promise",
    "Escalation policy for legal, safety, security, or sensitive cases",
    "Source precedence rule when evidence conflicts",
    "Retention and audit trail requirements",
    "Sector-specific regulation if the workflow is regulated",
    "Vendor or processor rules if the data leaves your environment",
  ];
}
