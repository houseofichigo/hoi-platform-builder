import type { InvoiceOcrProfileContext, OCRBlock } from "./types";

export const M02_DEFAULT_USE_CASE_ID = "supplier-onboarding";

export interface M02UseCaseSource {
  title: string;
  description: string;
  examples: readonly string[];
  gapIfMissing: string;
}

export interface M02UseCase {
  id: string;
  title: string;
  shortLabel: string;
  businessGoal: string;
  whatAiShouldDo: string;
  internalSources: readonly M02UseCaseSource[];
  contextualRules: readonly M02UseCaseSource[];
  taskSpecificSources: readonly M02UseCaseSource[];
  commonGaps: readonly string[];
  sampleKnowledgeEntries: readonly string[];
  sampleRetrievalTests: readonly string[];
}

export const M02_USE_CASES: readonly M02UseCase[] = [
  {
    id: "customer-support-kb",
    title: "Customer Support Knowledge Base",
    shortLabel: "Support",
    businessGoal:
      "Help an AI assistant answer, route, and escalate customer questions using approved knowledge.",
    whatAiShouldDo:
      "Find the right product or policy source, draft a bounded answer, and know when to escalate to a human.",
    internalSources: [
      {
        title: "Product brochure or catalog",
        description: "The official description of what the product does, who it is for, and what is included.",
        examples: ["Product brochure", "pricing/package page", "feature list"],
        gapIfMissing: "The AI may describe the wrong feature, promise unsupported behavior, or answer from memory.",
      },
      {
        title: "FAQ or help-center articles",
        description: "Approved answers to common customer questions.",
        examples: ["FAQ page", "help center", "getting-started guide"],
        gapIfMissing: "Common questions become inconsistent because the AI has no approved answer to retrieve.",
      },
      {
        title: "Product documentation and release notes",
        description: "The detailed source for setup steps, limitations, changes, and known issues.",
        examples: ["user guide", "release notes", "known issue log"],
        gapIfMissing: "The AI may answer with outdated instructions or miss current limitations.",
      },
      {
        title: "Customer or account context",
        description: "The business context that changes the answer for different customers.",
        examples: ["plan", "region", "entitlements", "account status"],
        gapIfMissing: "The AI may give the right answer to the wrong customer segment.",
      },
      {
        title: "Resolved and unresolved tickets",
        description: "Past requests showing what was solved, what failed, and what needed escalation.",
        examples: ["resolved tickets", "unresolved complaints", "quality review notes"],
        gapIfMissing: "The AI cannot learn the real operating patterns or edge cases of the support team.",
      },
    ],
    contextualRules: [
      {
        title: "Refund, return, or service policy",
        description: "The rule that controls what support can approve, refuse, or escalate.",
        examples: ["refund policy", "return policy", "service terms"],
        gapIfMissing: "The AI may invent exceptions or promise outcomes the business cannot honor.",
      },
      {
        title: "Privacy and data-handling rules",
        description: "The boundary for what customer data can be read, summarized, stored, or shared.",
        examples: ["privacy policy", "data retention rule", "processor list"],
        gapIfMissing: "The AI may expose or process customer information outside approved boundaries.",
      },
      {
        title: "Escalation procedure",
        description: "The rules for routing legal, safety, security, payment, or high-risk cases to a human.",
        examples: ["escalation matrix", "queue owners", "risk triggers"],
        gapIfMissing: "The AI may keep answering when the correct action is to stop and escalate.",
      },
      {
        title: "SLA and urgency rules",
        description: "The service commitment that changes how quickly a case should move and who owns it.",
        examples: ["SLA table", "priority matrix", "enterprise support rules"],
        gapIfMissing: "The AI may route urgent cases like normal cases or over-prioritize low-risk requests.",
      },
      {
        title: "Tone and commitment boundaries",
        description: "The voice, approval limits, and promises the AI must avoid making.",
        examples: ["tone guide", "approval thresholds", "do-not-promise list"],
        gapIfMissing: "The AI may sound helpful while making unauthorized commercial or legal commitments.",
      },
    ],
    taskSpecificSources: [
      {
        title: "Clean resolved examples",
        description: "Straightforward cases where the right answer, owner, and source are obvious.",
        examples: ["simple password reset", "clear feature question", "standard policy answer"],
        gapIfMissing: "The team cannot prove the baseline assistant behavior works.",
      },
      {
        title: "Ambiguous or incomplete cases",
        description: "Examples where the AI must ask a follow-up question or identify missing context.",
        examples: ["missing account plan", "multi-topic request", "unclear product version"],
        gapIfMissing: "The AI may answer too early instead of asking for the information it needs.",
      },
      {
        title: "Escalated cases",
        description: "Examples where the correct behavior is routing to a specialist or manager.",
        examples: ["legal threat", "security concern", "commercial exception request"],
        gapIfMissing: "The AI may automate cases that should remain human-owned.",
      },
      {
        title: "Unsafe or adversarial requests",
        description: "Requests that test refusal, privacy, source conflict, or prompt-injection behavior.",
        examples: ["fake policy quote", "private data request", "ignore previous instructions"],
        gapIfMissing: "The system has no evidence that it can refuse or protect the business.",
      },
      {
        title: "Unresolved or failed cases",
        description: "Cases that show where current knowledge is missing, conflicting, or hard to apply.",
        examples: ["unresolved complaints", "reopened tickets", "quality failures"],
        gapIfMissing: "The blueprint hides the highest-value gaps and only proves the easy cases.",
      },
    ],
    commonGaps: [
      "No owner for the product or policy source",
      "FAQ exists but has no review date or version",
      "Ticket history is messy, duplicated, or not labelled",
      "Escalation rules live in messages instead of an approved procedure",
      "Customer data access is unclear or too broad",
    ],
    sampleKnowledgeEntries: [
      "Product eligibility answer - source-backed product or plan rule",
      "Refund or service-policy rule - approved boundary and owner",
      "Escalation trigger - when the AI must route to a human",
      "Known issue or limitation - current source and review date",
      "Edge-case example - ambiguous request with expected response",
    ],
    sampleRetrievalTests: [
      "A customer asks a standard product question. Which approved source should answer it?",
      "A customer asks for an exception. Which policy and approval rule applies?",
      "A message mentions legal, security, or payment risk. Who owns the escalation?",
      "The FAQ and a historical ticket conflict. Which source wins?",
      "The request is missing account context. What should the AI ask before answering?",
    ],
  },
  {
    id: "hr-policy-support",
    title: "HR Policy Support",
    shortLabel: "HR",
    businessGoal: "Help employees find accurate HR guidance without bypassing privacy or manager review.",
    whatAiShouldDo:
      "Retrieve the right policy, explain it safely, and route sensitive employee cases to HR.",
    internalSources: [
      {
        title: "Employee handbook",
        description: "The approved source for employment rules and employee-facing guidance.",
        examples: ["handbook", "benefits guide", "people policy portal"],
        gapIfMissing: "The AI may answer from informal practice instead of approved policy.",
      },
      {
        title: "HR case history",
        description: "Past employee questions and how HR resolved them.",
        examples: ["closed HR tickets", "request categories", "resolution notes"],
        gapIfMissing: "The AI cannot learn common patterns or expected handling paths.",
      },
      {
        title: "Employee profile context",
        description: "The fields that change policy answers for each employee.",
        examples: ["country", "contract type", "team", "tenure"],
        gapIfMissing: "The AI may give guidance for the wrong region or employment type.",
      },
    ],
    contextualRules: [
      {
        title: "Privacy and confidentiality rules",
        description: "The boundary for employee data access and disclosure.",
        examples: ["HR privacy rule", "access role matrix", "retention policy"],
        gapIfMissing: "The AI may expose or summarize sensitive employee information incorrectly.",
      },
      {
        title: "Manager or HR approval boundary",
        description: "The cases where an employee needs human review or approval.",
        examples: ["leave approval rule", "compensation escalation", "disciplinary process"],
        gapIfMissing: "The AI may imply approval for actions it cannot authorize.",
      },
      {
        title: "Regional policy variants",
        description: "Differences by location, contract type, or local employment rule.",
        examples: ["France policy", "UAE policy", "remote-work variant"],
        gapIfMissing: "The AI may apply a general policy to a local exception.",
      },
    ],
    taskSpecificSources: [
      {
        title: "Routine employee questions",
        description: "Clear examples where the policy answer is simple.",
        examples: ["leave balance question", "benefits deadline", "expense policy"],
        gapIfMissing: "The baseline assistant behavior is not proven.",
      },
      {
        title: "Sensitive HR cases",
        description: "Examples where privacy, manager involvement, or HR escalation is required.",
        examples: ["medical leave", "complaint", "compensation concern"],
        gapIfMissing: "The assistant may over-answer sensitive situations.",
      },
      {
        title: "Policy conflict cases",
        description: "Examples where two policies or regions could point to different answers.",
        examples: ["remote-work exception", "contract variant", "local holiday"],
        gapIfMissing: "The assistant will not know when to ask for context or escalate.",
      },
    ],
    commonGaps: [
      "Policy variants by country are not separated",
      "Employee data access is too broad",
      "Approval boundaries are not documented",
      "Sensitive cases are not labelled for escalation",
    ],
    sampleKnowledgeEntries: [
      "Employee policy answer - approved handbook source",
      "Regional policy variant - location and contract boundary",
      "Sensitive-case escalation - HR owner and trigger",
      "Approval rule - manager or HR sign-off requirement",
      "Edge-case example - missing employee context",
    ],
    sampleRetrievalTests: [
      "An employee asks a routine policy question. Which handbook source answers it?",
      "The answer changes by country. What context must be checked first?",
      "A request includes sensitive personal information. What escalation rule applies?",
      "Two policy pages conflict. Which source wins?",
      "The employee asks for approval. What should the AI refuse to promise?",
    ],
  },
  {
    id: "sales-quote-support",
    title: "Sales Quote Support",
    shortLabel: "Sales",
    businessGoal: "Help sales teams draft accurate quotes while respecting pricing and approval rules.",
    whatAiShouldDo:
      "Use approved product, package, account, and discount knowledge to draft a quote that a human can review.",
    internalSources: [
      {
        title: "Product and package catalog",
        description: "The approved list of products, bundles, options, and limitations.",
        examples: ["catalog", "package table", "feature matrix"],
        gapIfMissing: "The AI may quote unsupported bundles or omit required options.",
      },
      {
        title: "Pricing and discount history",
        description: "Approved price structures and examples of accepted discount logic.",
        examples: ["pricing table", "discount log", "approval history"],
        gapIfMissing: "The AI may invent pricing or normalize exceptions as standard practice.",
      },
      {
        title: "Account and opportunity context",
        description: "The deal context that changes eligibility, terms, or next steps.",
        examples: ["CRM opportunity", "customer segment", "renewal status"],
        gapIfMissing: "The AI may generate a quote that ignores customer context.",
      },
    ],
    contextualRules: [
      {
        title: "Approval thresholds",
        description: "The levels where sales, finance, or leadership must approve.",
        examples: ["discount threshold", "deal desk rule", "approval matrix"],
        gapIfMissing: "The AI may propose terms that need approval without flagging them.",
      },
      {
        title: "Legal and commercial boundaries",
        description: "The clauses, promises, or terms that cannot be changed freely.",
        examples: ["standard terms", "redline boundary", "commitment list"],
        gapIfMissing: "The AI may draft commercial promises outside approved boundaries.",
      },
      {
        title: "Source precedence",
        description: "Which source wins when price lists, CRM notes, and prior quotes disagree.",
        examples: ["current price book", "approved exception record", "deal desk note"],
        gapIfMissing: "The AI may copy a stale exception into a new quote.",
      },
    ],
    taskSpecificSources: [
      {
        title: "Clean quote examples",
        description: "Standard quotes with clear products, pricing, and approval status.",
        examples: ["standard SMB quote", "renewal quote", "approved package"],
        gapIfMissing: "The AI has no baseline pattern for a clean draft.",
      },
      {
        title: "Exception examples",
        description: "Quotes requiring approval, non-standard terms, or missing context.",
        examples: ["large discount", "non-standard term", "missing plan data"],
        gapIfMissing: "The AI may treat risky exceptions as normal quotes.",
      },
      {
        title: "Rejected or corrected quotes",
        description: "Examples that show common mistakes and what changed during review.",
        examples: ["rejected discount", "incorrect bundle", "missing approval"],
        gapIfMissing: "The blueprint misses the real failure modes of quote drafting.",
      },
    ],
    commonGaps: [
      "Pricing source is not clearly current",
      "Approval thresholds are informal",
      "Prior quote exceptions are not labelled",
      "CRM context is incomplete",
    ],
    sampleKnowledgeEntries: [
      "Product/package rule - current catalog source",
      "Discount boundary - approval threshold and owner",
      "Commercial term limit - legal source and escalation",
      "Account-context requirement - fields needed before drafting",
      "Corrected-quote example - common mistake and expected fix",
    ],
    sampleRetrievalTests: [
      "A standard quote is requested. Which catalog and price source should be used?",
      "A discount exceeds threshold. Who must approve it?",
      "CRM notes conflict with the price book. Which source wins?",
      "A non-standard term is requested. What must be escalated?",
      "A quote is missing customer segment. What should the AI ask first?",
    ],
  },
  {
    id: "rfp-response-support",
    title: "RFP Response Support",
    shortLabel: "RFP",
    businessGoal: "Help teams draft consistent proposal answers from approved product and company knowledge.",
    whatAiShouldDo:
      "Retrieve approved answer blocks, adapt them to the question, and flag claims needing human confirmation.",
    internalSources: [
      {
        title: "Approved answer library",
        description: "Reusable responses for common company, security, product, and delivery questions.",
        examples: ["proposal answer bank", "security answers", "implementation FAQ"],
        gapIfMissing: "The AI may invent claims or reuse outdated proposal language.",
      },
      {
        title: "Product and delivery documentation",
        description: "The source for capabilities, limitations, timelines, and delivery model.",
        examples: ["product docs", "delivery playbook", "case study repository"],
        gapIfMissing: "The AI may overstate capabilities or miss current delivery limits.",
      },
      {
        title: "Past proposal outcomes",
        description: "Accepted, corrected, and rejected responses from previous RFPs.",
        examples: ["won proposals", "red-team notes", "client clarifications"],
        gapIfMissing: "The AI cannot learn which answers survived review.",
      },
    ],
    contextualRules: [
      {
        title: "Claims and evidence boundary",
        description: "Which claims require proof, citation, or leadership approval.",
        examples: ["claim approval rule", "case-study permission", "security evidence rule"],
        gapIfMissing: "The AI may make unsupported client-facing claims.",
      },
      {
        title: "Confidentiality and sharing rules",
        description: "What internal proof can be used, cited, summarized, or excluded.",
        examples: ["NDA boundary", "client reference permission", "internal-only note"],
        gapIfMissing: "The AI may include information that cannot be shared externally.",
      },
      {
        title: "Review workflow",
        description: "Who reviews technical, legal, security, and commercial sections.",
        examples: ["review owner map", "red-team checklist", "submission workflow"],
        gapIfMissing: "The AI may produce answers with no accountable reviewer.",
      },
    ],
    taskSpecificSources: [
      {
        title: "Standard RFP questions",
        description: "Common questions where approved answer blocks already exist.",
        examples: ["company overview", "implementation process", "support model"],
        gapIfMissing: "The AI cannot prove baseline answer reuse.",
      },
      {
        title: "High-risk claims",
        description: "Questions that ask for metrics, guarantees, security posture, or customer proof.",
        examples: ["uptime claim", "security certification", "client reference"],
        gapIfMissing: "The AI may answer with unsupported evidence.",
      },
      {
        title: "Ambiguous requirements",
        description: "Questions that require clarification before an answer is safe.",
        examples: ["broad integration ask", "unclear timeline", "undefined scope"],
        gapIfMissing: "The AI may assume requirements that the customer did not state.",
      },
    ],
    commonGaps: [
      "Approved answer library is outdated",
      "Evidence for claims is missing",
      "External sharing permissions are unclear",
      "Review owners differ by section but are not mapped",
    ],
    sampleKnowledgeEntries: [
      "Approved answer block - source and last review",
      "Claim requiring evidence - proof source and owner",
      "External-sharing boundary - what can be included",
      "Review owner rule - section and accountable reviewer",
      "Ambiguous requirement example - required clarification",
    ],
    sampleRetrievalTests: [
      "A standard implementation question appears. Which answer block applies?",
      "A question asks for a metric. What evidence must be retrieved?",
      "A customer asks for confidential proof. What can be shared?",
      "A security answer needs review. Who owns it?",
      "A requirement is ambiguous. What clarification should the AI ask for?",
    ],
  },
  {
    id: "supplier-onboarding",
    title: "Supplier Onboarding",
    shortLabel: "Supplier",
    businessGoal: "Help operations teams collect, review, and route supplier onboarding information.",
    whatAiShouldDo:
      "Identify missing supplier information, apply onboarding rules, and route risk cases to the right owner.",
    internalSources: [
      {
        title: "Supplier profile and questionnaire",
        description: "The information collected from each supplier before approval.",
        examples: ["supplier form", "business profile", "capability questionnaire"],
        gapIfMissing: "The AI cannot tell whether the supplier file is complete.",
      },
      {
        title: "Approved supplier records",
        description: "Past onboarding files showing what complete and approved records look like.",
        examples: ["approved supplier profiles", "review notes", "status history"],
        gapIfMissing: "The AI cannot compare a new case with a known-good pattern.",
      },
      {
        title: "Contract and service templates",
        description: "The reusable language and requirements that shape onboarding decisions.",
        examples: ["service template", "standard terms", "scope checklist"],
        gapIfMissing: "The AI may miss required information or suggest unapproved terms.",
      },
    ],
    contextualRules: [
      {
        title: "Procurement approval rules",
        description: "The thresholds and owners for supplier approval.",
        examples: ["approval matrix", "spend threshold", "category owner"],
        gapIfMissing: "The AI may route a supplier to the wrong reviewer.",
      },
      {
        title: "Security and data requirements",
        description: "The checks required before sharing systems, data, or customer context.",
        examples: ["security questionnaire", "data processing rule", "access policy"],
        gapIfMissing: "The AI may approve a supplier before risk review.",
      },
      {
        title: "Risk and exception rules",
        description: "The conditions that require legal, finance, security, or leadership review.",
        examples: ["risk triggers", "exception approval", "country restriction"],
        gapIfMissing: "The AI may normalize exceptions that need human judgment.",
      },
    ],
    taskSpecificSources: [
      {
        title: "Clean onboarding examples",
        description: "Complete supplier files that should pass standard review.",
        examples: ["complete profile", "standard category", "approved review note"],
        gapIfMissing: "The baseline workflow cannot be tested.",
      },
      {
        title: "Incomplete supplier examples",
        description: "Cases with missing documents, missing owner, or unclear category.",
        examples: ["missing questionnaire", "unclear service scope", "no review owner"],
        gapIfMissing: "The AI may fail to ask for missing information.",
      },
      {
        title: "Risk escalation examples",
        description: "Cases that require security, legal, finance, or leadership review.",
        examples: ["sensitive access", "non-standard terms", "restricted geography"],
        gapIfMissing: "The AI may treat risk cases as routine onboarding.",
      },
    ],
    commonGaps: [
      "Supplier categories are inconsistent",
      "Approval owner is missing for some cases",
      "Security requirements are not linked to supplier type",
      "Exception rules are handled informally",
    ],
    sampleKnowledgeEntries: [
      "Required supplier profile field - source and owner",
      "Approval threshold - category and accountable reviewer",
      "Security requirement - data/access boundary",
      "Exception trigger - escalation owner",
      "Incomplete-file example - missing information and expected action",
    ],
    sampleRetrievalTests: [
      "A supplier file is missing a required field. What should the AI ask for?",
      "A supplier belongs to a high-risk category. Who must review it?",
      "A standard supplier is complete. Which rule allows it to move forward?",
      "Security access is requested. What requirement must be checked?",
      "A supplier category is unclear. What clarification should the AI request?",
    ],
  },
] as const;

export function getM02UseCase(caseId?: string): M02UseCase {
  return (
    M02_USE_CASES.find((useCase) => useCase.id === caseId) ??
    M02_USE_CASES.find((useCase) => useCase.id === M02_DEFAULT_USE_CASE_ID) ??
    M02_USE_CASES[0]
  );
}

export const M02_COURSE_CONTENT = {
  placeholder: false,

  storyHeader:
    "Data Readiness & Knowledge Base Preparation. In M01 you saw why models need verification. M02 asks what knowledge must exist before AI can be useful. Today's job: choose one business process, map its three knowledge layers, and turn those sources into a practical knowledge base blueprint.",

  step1: {
    title: "Choose the use case and map the layers",
    why:
      "Before a model can answer, route, summarize, or draft reliably, it needs a specific business situation. Start by choosing the process, then look at the three knowledge layers the AI would need.",
    example:
      "For a customer support knowledge base, the AI needs product and FAQ sources, policy and escalation rules, plus real examples of clean, ambiguous, escalated, and unsafe support cases.",
    whatToNotice: [
      "A use case turns abstract data readiness into a concrete source map",
      "The same three layers show up across support, HR, sales, RFP, and supplier workflows",
      "The task-specific layer is where real examples prove how the system should behave",
    ],
    examplesInTheWild: [
      {
        label: "VISIBILITY EXAMPLE",
        title: "CompStat turned scattered signals into operating knowledge",
        body:
          "The useful shift was not just more data. It was shared categories, ownership, cadence, and visibility so teams could act on patterns instead of anecdotes.",
        sourceLabel: "NYPD CompStat",
        sourceUrl: "https://www.nyc.gov/site/nypd/stats/crime-statistics/compstat.page",
      },
      {
        label: "METADATA EXAMPLE",
        title: "Netflix-style metadata shows why labels matter",
        body:
          "Recommendations work because content is described in structured ways. AI workflows need the same discipline: source, category, owner, status, and context.",
        sourceLabel: "Netflix Help Center",
        sourceUrl: "https://help.netflix.com/en/node/100639",
      },
    ],
    produces: "Selected use case and three-layer source map preview",
    nextLabel: "Step 2 - review readiness gaps",
  },

  step2: {
    title: "Review the map and name the gaps",
    why:
      "Now compare HOI's reference map to your own business. You are not building the KB yet. You are spotting what your business would need before Build: owners, current sources, access rules, examples, and review boundaries.",
    example:
      "A support workflow may need product docs, FAQs, tickets, refund rules, escalation paths, and privacy boundaries. The readiness question is not 'can I list sources?' It is 'which of these would be missing, stale, ownerless, or risky in my business?'",
    whatToNotice: [
      "Step 2 is diagnosis, not curation",
      "A missing owner is a readiness gap even when the document exists",
      "The gaps you name become the Governance Register in the generated blueprint",
    ],
    examplesInTheWild: [
      {
        label: "BAD CONSEQUENCE",
        title: "Air Canada showed why source conflicts must be governed",
        body:
          "A chatbot gave a customer bereavement-fare guidance that conflicted with the linked policy page. The operational lesson for M02: if two sources conflict, the system needs a source-precedence rule before it answers.",
        sourceLabel: "Moffatt v. Air Canada, 2024 BCCRT 149",
        sourceUrl: "https://www.canlii.org/en/bc/bccrt/doc/2024/2024bccrt149/2024bccrt149.html",
      },
      {
        label: "BAD CONSEQUENCE",
        title: "Internal articles still need sharing rules",
        body:
          "Service teams often mix internal and customer-facing articles. The readiness gap is not just missing content; it is knowing which article can be shared, by whom, and in which channel.",
        sourceLabel: "Atlassian Support",
        sourceUrl: "https://support.atlassian.com/jira-service-management-cloud/docs/use-internal-articles-in-the-knowledge-base-panel/",
      },
    ],
    produces: "Readiness gaps for the selected use case",
    nextLabel: "Step 3 - build the blueprint",
  },

  step3: {
    title: "Build the KB blueprint",
    why:
      "The final M02 deliverable is a generated operating blueprint, not another curation exercise. HOI now shows the complete reference blueprint for your chosen use case, then turns it into a document your team can use.",
    example:
      "For each use case, the blueprint includes a data map, layered knowledge sources, atomic entries, metadata, source precedence, access rules, retrieval tests, and AI-facing instructions.",
    whatToNotice: [
      "The learner is not expected to invent the operating standard from scratch",
      "A strong blueprint explains what the AI can retrieve, what it must cite, and when it must stop",
      "PASS, PARTIAL, or BLOCKED should reflect the governance work still needed before Build",
    ],
    examplesInTheWild: [
      {
        label: "GOOD PRACTICE",
        title: "Atlassian treats the knowledge base as part of service operations",
        body:
          "Knowledge articles work best when they are searchable in the service flow, connected to requests, and managed as reusable operational assets rather than loose documents.",
        sourceLabel: "Atlassian Knowledge Management",
        sourceUrl: "https://www.atlassian.com/software/confluence/guides/knowledge-management",
      },
      {
        label: "GOOD PRACTICE",
        title: "Internal visibility labels protect what agents can share",
        body:
          "A blueprint should separate what the AI may use internally from what can be sent to a customer. Visibility and sharing rules belong in the entry metadata, not in memory.",
        sourceLabel: "Atlassian Support",
        sourceUrl: "https://support.atlassian.com/jira-service-management-cloud/docs/use-internal-articles-in-the-knowledge-base-panel/",
      },
    ],
    produces: "Generated operating knowledge-base blueprint and Gate 1 readiness decision",
    nextLabel: "Complete M02",
  },

  knowledgeEntryOptions: [
    "Source-backed fact or record - the business data the AI is allowed to use",
    "Internal policy rule - threshold, escalation path, exception owner, source policy",
    "External rule or contract boundary - privacy, retention, sector, customer, or residency rule",
    "Task-specific edge case - ambiguous request, missing data, conflicting rule, or unsafe request",
    "Quality or safety rule - manual review trigger, confidence boundary, stop condition, or sensitive-data handling",
  ] as const,

  retrievalTestOptions: [
    "When a user asks a standard question, which entry should the AI retrieve first?",
    "If required information is missing or conflicting, what rule should the AI apply?",
    "Which request should trigger manager, specialist, or human review?",
    "What source confirms the answer, and what source should be ignored if it conflicts?",
    "Which edge case requires refusal or escalation instead of automation?",
  ] as const,

  requiredMetadata: [
    "Title",
    "Layer or category",
    "Source",
    "Owner",
    "Rule, fact, or example the AI may use",
  ] as const,

  advancedMetadata: [
    "Source location",
    "Version or review date",
    "Sensitivity",
    "Allowed AI use",
    "Tags",
    "Review status",
    "Refresh frequency",
  ] as const,

  glossaryDefinitions: [
    {
      term: "Data readiness",
      definition: "The evidence that a process has usable sources, owners, quality checks, access rules, and known gaps before AI is introduced.",
    },
    {
      term: "Knowledge base",
      definition: "A structured, source-backed layer of business knowledge that an AI system can retrieve, cite, and use within agreed boundaries.",
    },
    {
      term: "Metadata",
      definition: "The labels around a knowledge entry: source, owner, version, sensitivity, status, and refresh rule. Metadata is what makes knowledge governable.",
    },
    {
      term: "Data map",
      definition: "A view of where useful information lives, who owns it, how it moves, and whether it can be accessed safely.",
    },
    {
      term: "Lineage",
      definition: "The trace from original source to AI use. Lineage helps the team explain where an answer came from and what changed it.",
    },
    {
      term: "Sensitivity",
      definition: "The handling level for a source or entry, based on privacy, commercial risk, legal exposure, or internal confidentiality.",
    },
    {
      term: "Retrieval test",
      definition: "A question designed to prove whether the AI can find the right entry, use the right source, and respect the right limitation.",
    },
    {
      term: "Reason code",
      definition: "A short label for why readiness is partial or blocked, such as NO_OWNER, NO_METADATA, or NO_ACCESS.",
    },
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
      sources: [],
    },
  },

  methodNote:
    "The data map tells us what exists. The knowledge base tells the AI what to use. M02 is done when the knowledge is source-backed, metadata-rich, testable, and governed.",
} as const;

export function getM02InternalSourceOptions(ctx: InvoiceOcrProfileContext, caseId?: string): string[] {
  const company = ctx.companyName ?? "your company";
  const useCase = getM02UseCase(caseId);
  return [
    ...useCase.internalSources.map((source) => `${source.title} at ${company}`),
    `Ticket, request, or process records at ${company}`,
    "Approved policy or procedure knowledge base",
    "Customer, employee, supplier, or account context",
    "Controlled taxonomy: topics, queues, urgency, owner, status",
    "Historical resolved cases with expected outcomes",
    "Product, service, contract, or entitlement catalog",
    "Audit log or quality review records",
  ].filter((value, index, arr) => arr.indexOf(value) === index);
}

export function getM02ContextualRuleOptions(ctx: InvoiceOcrProfileContext, caseId?: string): string[] {
  const country = ctx.country ?? "your region";
  const useCase = getM02UseCase(caseId);
  return [
    ...useCase.contextualRules.map((source) => source.title),
    `Privacy and data-handling rules for ${country}`,
    "Internal policy boundaries and approval thresholds",
    "Customer commitment boundary: what the AI must not promise",
    "Escalation policy for legal, safety, security, or sensitive cases",
    "Source precedence rule when evidence conflicts",
    "Retention and audit trail requirements",
    "Sector-specific regulation if the workflow is regulated",
    "Vendor or processor rules if the data leaves your environment",
  ].filter((value, index, arr) => arr.indexOf(value) === index);
}
