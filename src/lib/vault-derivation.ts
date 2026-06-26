export type VaultType =
  | "company"
  | "company_core"
  | "department"
  | "client"
  | "training"
  | "process_library"
  | "operating_model"
  | "data_dictionary"
  | "tool_stack"
  | "compliance"
  | "risk_control"
  | "templates_playbooks"
  | "market_intelligence"
  | "performance_analytics"
  | "external_contracts";

export type VaultIsolation = "shared" | "confidential" | "scoped" | "read_only" | "internal";
export type VaultPersistenceStatus = "confirmed" | "active" | "dormant";

export type ProposedVault = {
  key: string;
  name: string;
  vaultType: VaultType;
  tier: 1 | 2 | 3;
  vaultKey: string;
  isolation: VaultIsolation;
  sourceDepartmentId?: string;
  sourceClientId?: string;
  audienceId?: string;
  audience?: string;
  jurisdiction?: string;
  residency?: string;
  owner?: string;
  purpose: string;
  sensitivityCeiling: "public" | "internal" | "confidential" | "personal" | "sensitive";
  referenceKeys: string[];
  references: Array<{ type: string; key: string; label: string }>;
  isReadonly: boolean;
  status: "proposed";
  persistenceStatus: VaultPersistenceStatus;
  reason: string;
  agentConstitution: Record<string, unknown>;
  knowledgeConfig: Record<string, unknown>;
  routingRules: Record<string, unknown>;
  required: boolean;
  enabled: boolean;
};

type ProfileLike = {
  overview?: string | null;
  mission?: string | null;
  value_proposition?: string | null;
  primary_jurisdiction?: string | null;
  data_residency?: unknown;
  is_regulated?: boolean | null;
  regulatory_regimes?: unknown;
  sells_training?: boolean | null;
};

type ReadinessLike = {
  decision_authority?: string | null;
  has_ai_owner?: boolean | null;
  governance_body?: string | null;
  risk_register?: string | null;
  canonical_knowledge_owner_user_id?: string | null;
};

type OrganizationContext = {
  profile?: ProfileLike | null;
  readiness?: ReadinessLike | null;
  departments?: Array<{
    id: string;
    name: string;
    holds_sensitive_data?: boolean | null;
    distinct_audience?: boolean | null;
    audience_id?: string | null;
    knowledge_owner_user_id?: string | null;
  }>;
  clients?: Array<{
    id: string;
    name: string;
    kind?: string | null;
    under_nda?: boolean | null;
    reusable_ip?: boolean | null;
    data_residency?: string | null;
    status?: string | null;
  }>;
  audiences?: Array<{ id: string; name: string; scope?: string | null }>;
  tools?: unknown[];
  dataSources?: unknown[];
  knowledgeSources?: unknown[];
  strategicPriority?: unknown;
  processes?: unknown[];
  processTemplates?: unknown[];
};

function arrayValue(value: unknown) {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function learnerAudienceId(audiences: OrganizationContext["audiences"] = []) {
  return audiences.find((audience) => audience.scope === "learners")?.id;
}

function hasRows(value: unknown[] | undefined) {
  return Array.isArray(value) && value.length > 0;
}

function sensitivityForDepartment(department: NonNullable<OrganizationContext["departments"]>[number]) {
  return department.holds_sensitive_data ? "sensitive" : "internal";
}

function constitution(input: {
  isolation: VaultIsolation;
  tier: 1 | 2 | 3;
  sensitivityCeiling: ProposedVault["sensitivityCeiling"];
  audience?: string;
  jurisdiction?: string;
  residency?: string;
  neverLeak?: string[];
}) {
  return {
    layer: "constitution",
    humanControlled: true,
    aiMayEdit: false,
    isolation: input.isolation,
    tier: input.tier,
    sensitivityCeiling: input.sensitivityCeiling,
    audience: input.audience ?? null,
    jurisdiction: input.jurisdiction ?? null,
    residency: input.residency ?? null,
    neverLeak: input.neverLeak ?? [],
    note: "Draft generated from onboarding. Human confirmation required before content ingestion.",
  };
}

function knowledgeConfig(input: {
  vaultKey: string;
  departments?: string[];
  regulations?: string[];
  defaultTags?: string[];
}) {
  return {
    layer: "knowledge_config",
    aiMayPropose: true,
    humanApprovalRequired: true,
    vaultKey: input.vaultKey,
    defaultTags: input.defaultTags ?? [],
    departments: input.departments ?? [],
    regulations: input.regulations ?? [],
    referencePolicy: "reference_never_duplicate",
    indexingPolicy: "classify_by_kind_of_fact_not_topic",
  };
}

function routingRules(kind: string, examples: string[]) {
  return {
    kind,
    examples,
    rule: "Store the fact once in this home vault; connect related facts through typed references.",
  };
}

function baseVault(input: Omit<ProposedVault, "status" | "enabled" | "required" | "references"> & {
  references?: ProposedVault["references"];
  required?: boolean;
  enabled?: boolean;
}): ProposedVault {
  return {
    ...input,
    status: "proposed",
    references: input.references ?? [],
    required: input.required ?? true,
    enabled: input.enabled ?? true,
  };
}

const verticalSpecs: Array<{
  key: string;
  name: string;
  vaultType: VaultType;
  purpose: string;
  isolation: VaultIsolation;
  sensitivityCeiling: ProposedVault["sensitivityCeiling"];
  activeWhen: (context: OrganizationContext) => boolean;
  routeKind: string;
  examples: string[];
}> = [
  {
    key: "process_library",
    name: "Process Library",
    vaultType: "process_library",
    purpose: "System of record for mapped, scored, approved process knowledge.",
    isolation: "internal",
    sensitivityCeiling: "confidential",
    activeWhen: (context) => hasRows(context.processes),
    routeKind: "mapped_process",
    examples: ["approved process diagrams", "risk tiers", "automation and maturity context"],
  },
  {
    key: "operating_model",
    name: "Operating Model & Governance",
    vaultType: "operating_model",
    purpose: "Defines who has authority to decide, approve, escalate, and govern AI work.",
    isolation: "confidential",
    sensitivityCeiling: "confidential",
    activeWhen: (context) => Boolean(context.readiness),
    routeKind: "decision_authority",
    examples: ["approval matrices", "AI owner", "governance body", "discount authority"],
  },
  {
    key: "data_dictionary",
    name: "Data Dictionary & Taxonomy",
    vaultType: "data_dictionary",
    purpose: "Canonical definitions, lineage, ownership, sensitivity, and data meaning.",
    isolation: "internal",
    sensitivityCeiling: "internal",
    activeWhen: (context) => hasRows(context.dataSources),
    routeKind: "definition",
    examples: ["entity definitions", "field ownership", "lake catalog summaries"],
  },
  {
    key: "tool_stack",
    name: "Tool & Integration Stack",
    vaultType: "tool_stack",
    purpose: "Approved systems, data held, residency, API availability, and integration facts.",
    isolation: "internal",
    sensitivityCeiling: "internal",
    activeWhen: (context) => hasRows(context.tools),
    routeKind: "system_tool_fact",
    examples: ["approved tools", "trigger capability", "integration status", "tool residency"],
  },
  {
    key: "compliance",
    name: "Regulatory & Compliance",
    vaultType: "compliance",
    purpose: "Jurisdictional rules, frameworks, audit checklists, and obligations.",
    isolation: "confidential",
    sensitivityCeiling: "confidential",
    activeWhen: (context) => Boolean(context.profile?.is_regulated),
    routeKind: "legal_or_regulatory_rule",
    examples: ["GDPR", "PDPL", "NDMO", "SDAIA", "ISO evidence"],
  },
  {
    key: "risk_control",
    name: "Risk & Control Matrix",
    vaultType: "risk_control",
    purpose: "Risk catalogue, controls, owners, testing cadence, and governance overlays.",
    isolation: "confidential",
    sensitivityCeiling: "confidential",
    activeWhen: (context) => Boolean(context.readiness?.risk_register && context.readiness.risk_register !== "no"),
    routeKind: "risk_control",
    examples: ["control owners", "risk tier flags", "audit cadence", "mitigations"],
  },
  {
    key: "templates_playbooks",
    name: "Templates & Playbooks",
    vaultType: "templates_playbooks",
    purpose: "Reusable process skeletons, checklists, communication templates, and documentation standards.",
    isolation: "shared",
    sensitivityCeiling: "internal",
    activeWhen: (context) => hasRows(context.processTemplates),
    routeKind: "reusable_template_or_playbook",
    examples: ["process templates", "checklists", "standard operating playbooks"],
  },
  {
    key: "market_intelligence",
    name: "Market & Competitive Intelligence",
    vaultType: "market_intelligence",
    purpose: "Competitors, industry trends, win/loss, segments, and positioning facts.",
    isolation: "confidential",
    sensitivityCeiling: "confidential",
    activeWhen: () => false,
    routeKind: "market_context",
    examples: ["competitor pricing", "positioning", "industry trend notes"],
  },
  {
    key: "performance_analytics",
    name: "Performance & Analytics",
    vaultType: "performance_analytics",
    purpose: "Metrics, KPIs, AI-readiness heat maps, bottlenecks, and process performance.",
    isolation: "internal",
    sensitivityCeiling: "confidential",
    activeWhen: (context) => hasRows(context.processes),
    routeKind: "metric_or_kpi",
    examples: ["KPIs", "bottleneck metrics", "AI readiness heat maps", "score rollups"],
  },
  {
    key: "external_contracts",
    name: "External Contracts & Dependencies",
    vaultType: "external_contracts",
    purpose: "Vendor/client obligations, DPAs, SLAs, partner dependencies, and renewal dates.",
    isolation: "confidential",
    sensitivityCeiling: "confidential",
    activeWhen: (context) => (context.clients ?? []).some((client) => (client.status ?? "active") === "active"),
    routeKind: "external_obligation",
    examples: ["vendor SLA", "client commitment", "DPA obligation", "partner dependency"],
  },
];

export function deriveVaults(context: OrganizationContext): ProposedVault[] {
  const profile = context.profile ?? {};
  const readiness = context.readiness ?? {};
  const companyKey = "company";
  const coreKey = "company_core";
  const jurisdiction = profile.primary_jurisdiction ?? undefined;
  const residency = arrayValue(profile.data_residency).join(", ") || jurisdiction;
  const regimes = arrayValue(profile.regulatory_regimes);

  const proposed: ProposedVault[] = [
    baseVault({
      key: companyKey,
      vaultKey: companyKey,
      name: "Company",
      vaultType: "company",
      tier: 1,
      isolation: "shared",
      jurisdiction,
      residency,
      owner: readiness.canonical_knowledge_owner_user_id ?? undefined,
      purpose: "Canonical company identity, strategy, products, public policies, jurisdiction, and maturity self-view.",
      sensitivityCeiling: "internal",
      referenceKeys: [],
      isReadonly: true,
      persistenceStatus: "active",
      reason: "Tier 1: canonical grounding vault. Every other vault may reference it; facts are not copied.",
      agentConstitution: constitution({
        isolation: "shared",
        tier: 1,
        sensitivityCeiling: "internal",
        audience: "all staff",
        jurisdiction,
        residency,
      }),
      knowledgeConfig: knowledgeConfig({
        vaultKey: companyKey,
        defaultTags: ["company", "identity", "products", "strategy"],
      }),
      routingRules: routingRules("company_canonical_fact", [
        "mission",
        "public product catalogue",
        "strategic priorities",
        "primary jurisdiction",
      ]),
    }),
    baseVault({
      key: coreKey,
      vaultKey: coreKey,
      name: "Company Core",
      vaultType: "company_core",
      tier: 1,
      isolation: "read_only",
      jurisdiction,
      residency,
      owner: readiness.canonical_knowledge_owner_user_id ?? undefined,
      purpose: "Backward-compatible read-only partition for canonical Company facts while the model converges on the Company vault.",
      sensitivityCeiling: "internal",
      referenceKeys: [companyKey],
      references: [{ type: "vault", key: companyKey, label: "Company canonical vault" }],
      isReadonly: true,
      persistenceStatus: "confirmed",
      reason: "Compatibility: kept temporarily as an internal read-only Company partition.",
      agentConstitution: constitution({
        isolation: "read_only",
        tier: 1,
        sensitivityCeiling: "internal",
        audience: "all staff",
        jurisdiction,
        residency,
      }),
      knowledgeConfig: knowledgeConfig({
        vaultKey: coreKey,
        defaultTags: ["company_core", "canonical", "compatibility"],
      }),
      routingRules: routingRules("canonical_company_reference", ["overview", "products", "public policies"]),
    }),
  ];

  for (const department of context.departments ?? []) {
    const sensitivityCeiling = sensitivityForDepartment(department);
    proposed.push(baseVault({
      key: `department:${department.id}`,
      vaultKey: `department:${department.id}`,
      name: `${department.name} Department`,
      vaultType: "department",
      tier: 2,
      isolation: "confidential",
      sourceDepartmentId: department.id,
      audienceId: department.audience_id ?? undefined,
      jurisdiction,
      residency,
      owner: department.knowledge_owner_user_id ?? undefined,
      purpose: `Team-owned policies, SOPs, tool configuration, and sensitive knowledge for ${department.name}.`,
      sensitivityCeiling,
      referenceKeys: [companyKey],
      references: [{ type: "vault", key: companyKey, label: "Company grounding context" }],
      isReadonly: false,
      persistenceStatus: "active",
      reason: "Tier 2: every department gets a governed team vault; sensitive facts stay department-owned.",
      agentConstitution: constitution({
        isolation: "confidential",
        tier: 2,
        sensitivityCeiling,
        audience: department.distinct_audience ? "department scoped audience" : "department leadership and approved contributors",
        jurisdiction,
        residency,
        neverLeak: department.holds_sensitive_data ? ["personal data", "team-sensitive records"] : [],
      }),
      knowledgeConfig: knowledgeConfig({
        vaultKey: `department:${department.id}`,
        departments: [department.name],
        defaultTags: ["department", department.name],
      }),
      routingRules: routingRules("department_owned_sensitive_fact", [
        "team SOP",
        "team-only policy",
        "team-specific tool configuration",
      ]),
    }));
  }

  for (const spec of verticalSpecs) {
    const isActive = spec.activeWhen(context);
    proposed.push(baseVault({
      key: spec.key,
      vaultKey: spec.key,
      name: spec.name,
      vaultType: spec.vaultType,
      tier: 3,
      isolation: spec.isolation,
      jurisdiction,
      residency,
      owner: readiness.canonical_knowledge_owner_user_id ?? undefined,
      purpose: spec.purpose,
      sensitivityCeiling: spec.sensitivityCeiling,
      referenceKeys: [companyKey],
      references: [{ type: "vault", key: companyKey, label: "Company grounding context" }],
      isReadonly: false,
      persistenceStatus: isActive ? "active" : "dormant",
      reason: `Tier 3: fixed vertical skeleton. ${isActive ? "Activated by current onboarding/platform data." : "Dormant until matching content exists."}`,
      agentConstitution: constitution({
        isolation: spec.isolation,
        tier: 3,
        sensitivityCeiling: spec.sensitivityCeiling,
        audience: spec.isolation === "shared" ? "all staff" : "approved internal audience",
        jurisdiction,
        residency,
        neverLeak: spec.sensitivityCeiling === "confidential" ? ["confidential business facts outside approved audience"] : [],
      }),
      knowledgeConfig: knowledgeConfig({
        vaultKey: spec.key,
        regulations: spec.key === "compliance" ? regimes : [],
        defaultTags: [spec.key, spec.routeKind],
      }),
      routingRules: routingRules(spec.routeKind, spec.examples),
    }));
  }

  for (const client of context.clients ?? []) {
    if ((client.status ?? "active") !== "active" || client.kind !== "client") continue;
    if (!client.under_nda && !client.reusable_ip) continue;
    proposed.push(baseVault({
      key: `client:${client.id}`,
      vaultKey: `client:${client.id}`,
      name: `${client.name} Client`,
      vaultType: "client",
      tier: 2,
      isolation: "confidential",
      sourceClientId: client.id,
      jurisdiction: client.data_residency ?? jurisdiction,
      residency: client.data_residency ?? residency,
      purpose: `Client-confidential obligations, reusable IP boundaries, and owned client context for ${client.name}.`,
      sensitivityCeiling: "confidential",
      referenceKeys: [companyKey, "external_contracts"],
      references: [
        { type: "vault", key: companyKey, label: "Company grounding context" },
        { type: "vault", key: "external_contracts", label: "External obligations vertical" },
      ],
      isReadonly: false,
      persistenceStatus: "active",
      reason: `Client vault: ${client.name} has NDA or reusable-IP boundaries.`,
      agentConstitution: constitution({
        isolation: "confidential",
        tier: 2,
        sensitivityCeiling: "confidential",
        audience: "approved client team",
        jurisdiction: client.data_residency ?? jurisdiction,
        residency: client.data_residency ?? residency,
        neverLeak: ["client-confidential facts", "client reusable IP boundaries"],
      }),
      knowledgeConfig: knowledgeConfig({
        vaultKey: `client:${client.id}`,
        defaultTags: ["client", client.name],
      }),
      routingRules: routingRules("client_confidential_obligation", [
        "client commitment",
        "client DPA",
        "client-specific reusable IP",
      ]),
    }));
  }

  if (profile.sells_training) {
    proposed.push(baseVault({
      key: "training",
      vaultKey: "training",
      name: "Training",
      vaultType: "training",
      tier: 2,
      isolation: "scoped",
      audienceId: learnerAudienceId(context.audiences),
      audience: "learners",
      jurisdiction,
      residency,
      purpose: "Scoped learner-facing training knowledge and course context.",
      sensitivityCeiling: "internal",
      referenceKeys: [companyKey],
      references: [{ type: "vault", key: companyKey, label: "Company grounding context" }],
      isReadonly: false,
      persistenceStatus: "active",
      reason: "Training vault: company sells training or learner-facing content.",
      agentConstitution: constitution({
        isolation: "scoped",
        tier: 2,
        sensitivityCeiling: "internal",
        audience: "learners",
        jurisdiction,
        residency,
      }),
      knowledgeConfig: knowledgeConfig({
        vaultKey: "training",
        defaultTags: ["training", "learner"],
      }),
      routingRules: routingRules("learner_training_content", ["course material", "learner guide", "training SOP"]),
    }));
  }

  return proposed;
}
