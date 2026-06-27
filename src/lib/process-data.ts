// @ts-nocheck — Ported PFS module.
import {
  AlertTriangle,
  Archive,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock3,
  Database,
  FileSpreadsheet,
  GitBranch,
  Layers3,
  ListChecks,
  Map,
  Settings,
  ShieldCheck,
  Users,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Priority = "High" | "Medium" | "Low";
export type ProcessStatus = "Draft" | "Submitted" | "Under review" | "Approved";
export type NodeKind = "trigger" | "task" | "decision" | "approval" | "handoff" | "output" | "merge" | "end";
export type TriggerType = "manual" | "schedule" | "event";
export type ToolRole = "creates" | "stores" | "updates" | "sends" | "receives" | "approves" | "reads" | "exports" | "notifies" | "custom";
export type DataQualityRating = "trusted" | "needs_checking" | "unreliable" | "not_assessed";
export type DataProfileSource = "inherited" | "overridden" | "ai_suggested";
export type DataStructure = "structured" | "semi_structured" | "unstructured";
export type DataAccessibility = "api_accessible" | "export_only" | "manual";
export type DataSensitivity = "public" | "internal" | "personal" | "sensitive";
export type InputType = "System Record" | "Manual Entry" | "Email" | "File/PDF" | "Call notes" | "Routing";
export type RiskTier = "low" | "standard" | "elevated" | "critical" | "unclassified";

export type DataProfile = {
  structure: DataStructure;
  accessibility: DataAccessibility;
  sensitivity: DataSensitivity;
  ownership: string;
  source: DataProfileSource;
};

export type ToolDataSource = {
  id: string;
  tool: string;
  dataStored: string;
  integrationStatus: number;
  apiAvailable: boolean;
  reliability: DataQualityRating;
  profile: Omit<DataProfile, "source">;
};

export type ProcessRecord = {
  id: string;
  name: string;
  department: string;
  owner: string;
  status: ProcessStatus;
  maturity: number;
  automationValue: number;
  aiReadiness: number;
  dataReadiness: number;
  effortSavings: number;
  ebitdaImpact: number;
  errorReduction: number;
  dataValue: number;
  priority: Priority;
  frequencyWeight: number;
  strategicAlignment: number;
  impact: number;
  readiness: number;
  riskTier?: RiskTier;
  riskReason?: string;
  dataValidated?: boolean;
};

export type FlowNode = {
  id: string;
  kind: NodeKind;
  label: string;
  description?: string;
  triggerType?: TriggerType;
  triggerConfig?: {
    scheduleKind?: "interval" | "cron";
    interval?: string;
    cron?: string;
    toolId?: string | null;
    toolName?: string | null;
    eventName?: string;
    toolActionId?: string | null;
    toolActionName?: string | null;
  };
  actor?: string;
  owner?: string[];
  tool: string | null;
  toolRole?: ToolRole | string;
  toolActionId?: string | null;
  toolActionName?: string | null;
  toolActionObject?: string | null;
  toolActionFamily?: string | null;
  automationLevel: number;
  inputType: InputType;
  producesData: boolean;
  dataSourceId?: string;
  dataProfile?: DataProfile;
  dataQuality?: DataQualityRating;
  isDataCritical?: boolean;
  assistantOpportunity?: boolean;
  x: number;
  y: number;
};

export type DerivedData = {
  source: "steps";
  dataReadiness: number;
  dataAccessibility: DataAccessibility;
  dataStructureType: DataStructure;
  dataClassification: DataSensitivity;
  dataQuality: Exclude<DataQualityRating, "not_assessed">;
  evidence: Array<{
    nodeId: string;
    label: string;
    dataSourceId?: string;
    accessibility: DataAccessibility;
    structure: DataStructure;
    sensitivity: DataSensitivity;
    dataQuality: DataQualityRating;
    isDataCritical: boolean;
  }>;
};

export type DepartmentRollup = {
  department: string;
  score: number;
  processes: number;
  approved: number;
  automationValue: number;
};

export type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "mapping", label: "Process Map", icon: Workflow },
  { id: "tasks", label: "Pending Tasks", icon: ListChecks },
  { id: "import", label: "Data Import", icon: FileSpreadsheet },
  { id: "settings", label: "Settings", icon: Settings },
];

// Optional pilot seeds only. Routed screens read Supabase through src/lib/db hooks.
export const pilotSeedToolDataSources: ToolDataSource[] = [
  {
    id: "ds-hubspot",
    tool: "HubSpot",
    dataStored: "Customer account and lifecycle data",
    integrationStatus: 4,
    apiAvailable: true,
    reliability: "trusted",
    profile: {
      structure: "structured",
      accessibility: "api_accessible",
      sensitivity: "personal",
      ownership: "Revenue Operations",
    },
  },
  {
    id: "ds-notion",
    tool: "Notion",
    dataStored: "Workspace notes and onboarding tasks",
    integrationStatus: 3,
    apiAvailable: true,
    reliability: "needs_checking",
    profile: {
      structure: "semi_structured",
      accessibility: "api_accessible",
      sensitivity: "internal",
      ownership: "Operations",
    },
  },
  {
    id: "ds-docusign",
    tool: "DocuSign",
    dataStored: "Contracts and signature state",
    integrationStatus: 4,
    apiAvailable: true,
    reliability: "trusted",
    profile: {
      structure: "structured",
      accessibility: "api_accessible",
      sensitivity: "sensitive",
      ownership: "Legal",
    },
  },
  {
    id: "ds-sharepoint",
    tool: "SharePoint",
    dataStored: "Risk documents and uploaded files",
    integrationStatus: 2,
    apiAvailable: false,
    reliability: "needs_checking",
    profile: {
      structure: "unstructured",
      accessibility: "export_only",
      sensitivity: "sensitive",
      ownership: "Legal",
    },
  },
  {
    id: "ds-slack",
    tool: "Slack",
    dataStored: "Operational handoff messages",
    integrationStatus: 2,
    apiAvailable: true,
    reliability: "needs_checking",
    profile: {
      structure: "unstructured",
      accessibility: "export_only",
      sensitivity: "internal",
      ownership: "Customer Success",
    },
  },
  {
    id: "ds-gmail",
    tool: "Gmail",
    dataStored: "Email attachments and customer messages",
    integrationStatus: 2,
    apiAvailable: true,
    reliability: "needs_checking",
    profile: {
      structure: "unstructured",
      accessibility: "export_only",
      sensitivity: "personal",
      ownership: "Customer Success",
    },
  },
  {
    id: "ds-crm",
    tool: "CRM",
    dataStored: "Activation status and account owner",
    integrationStatus: 4,
    apiAvailable: true,
    reliability: "trusted",
    profile: {
      structure: "structured",
      accessibility: "api_accessible",
      sensitivity: "personal",
      ownership: "Operations",
    },
  },
];

export const manualDataProfile: DataProfile = {
  structure: "unstructured",
  accessibility: "manual",
  sensitivity: "internal",
  ownership: "Step owner",
  source: "inherited",
};

export const pilotSeedProcesses: ProcessRecord[] = [
  {
    id: "P-104",
    name: "Customer onboarding",
    department: "Operations",
    owner: "Nadia Simon",
    status: "Approved",
    maturity: 76,
    automationValue: 84,
    aiReadiness: 71,
    dataReadiness: 68,
    effortSavings: 21,
    ebitdaImpact: 146000,
    errorReduction: 34,
    dataValue: 82,
    priority: "High",
    frequencyWeight: 0.9,
    strategicAlignment: 0.92,
    impact: 86,
    readiness: 78,
  },
  {
    id: "P-118",
    name: "Invoice exception handling",
    department: "Finance",
    owner: "Marc Girard",
    status: "Under review",
    maturity: 58,
    automationValue: 79,
    aiReadiness: 66,
    dataReadiness: 72,
    effortSavings: 17,
    ebitdaImpact: 118000,
    errorReduction: 41,
    dataValue: 74,
    priority: "High",
    frequencyWeight: 0.78,
    strategicAlignment: 0.84,
    impact: 80,
    readiness: 62,
  },
  {
    id: "P-126",
    name: "New supplier validation",
    department: "Procurement",
    owner: "Lea Martin",
    status: "Approved",
    maturity: 69,
    automationValue: 63,
    aiReadiness: 54,
    dataReadiness: 61,
    effortSavings: 12,
    ebitdaImpact: 82000,
    errorReduction: 27,
    dataValue: 64,
    priority: "Medium",
    frequencyWeight: 0.62,
    strategicAlignment: 0.71,
    impact: 61,
    readiness: 67,
  },
  {
    id: "P-131",
    name: "Hiring approval chain",
    department: "People",
    owner: "Sarah Dubois",
    status: "Submitted",
    maturity: 43,
    automationValue: 55,
    aiReadiness: 39,
    dataReadiness: 48,
    effortSavings: 8,
    ebitdaImpact: 51000,
    errorReduction: 18,
    dataValue: 45,
    priority: "Medium",
    frequencyWeight: 0.44,
    strategicAlignment: 0.69,
    impact: 56,
    readiness: 45,
  },
  {
    id: "P-144",
    name: "Monthly executive reporting",
    department: "Data",
    owner: "Youssef Amrani",
    status: "Approved",
    maturity: 81,
    automationValue: 71,
    aiReadiness: 77,
    dataReadiness: 86,
    effortSavings: 15,
    ebitdaImpact: 105000,
    errorReduction: 22,
    dataValue: 91,
    priority: "High",
    frequencyWeight: 0.7,
    strategicAlignment: 0.88,
    impact: 74,
    readiness: 84,
  },
  {
    id: "P-152",
    name: "Customer renewal risk review",
    department: "Sales",
    owner: "Ines Laurent",
    status: "Draft",
    maturity: 36,
    automationValue: 48,
    aiReadiness: 52,
    dataReadiness: 42,
    effortSavings: 6,
    ebitdaImpact: 44000,
    errorReduction: 13,
    dataValue: 58,
    priority: "Low",
    frequencyWeight: 0.31,
    strategicAlignment: 0.76,
    impact: 64,
    readiness: 38,
  },
];

export const pilotSeedFlowNodes: FlowNode[] = [
  {
    id: "n1",
    kind: "trigger",
    triggerType: "manual",
    triggerConfig: {},
    label: "Lead converts",
    actor: "Sales Ops",
    tool: "HubSpot",
    automationLevel: 2,
    inputType: "System Record",
    producesData: false,
    x: 40,
    y: 132,
  },
  {
    id: "n2",
    kind: "task",
    label: "Create onboarding workspace",
    actor: "Operations",
    tool: "Notion",
    automationLevel: 1,
    inputType: "Manual Entry",
    producesData: true,
    x: 216,
    y: 112,
  },
  {
    id: "n3",
    kind: "decision",
    label: "Contract complete?",
    actor: "Finance",
    tool: "DocuSign",
    automationLevel: 2,
    inputType: "File/PDF",
    producesData: false,
    x: 424,
    y: 112,
  },
  {
    id: "n4",
    kind: "approval",
    label: "Approve risk tier",
    actor: "Legal",
    tool: "SharePoint",
    automationLevel: 1,
    inputType: "File/PDF",
    producesData: false,
    x: 640,
    y: 64,
  },
  {
    id: "n5",
    kind: "handoff",
    label: "Send setup request",
    actor: "Customer Success",
    tool: "Slack",
    automationLevel: 2,
    inputType: "Routing",
    producesData: false,
    x: 640,
    y: 180,
  },
  {
    id: "n6",
    kind: "output",
    label: "Welcome pack issued",
    actor: "Customer Success",
    tool: "Gmail",
    automationLevel: 3,
    inputType: "Email",
    producesData: true,
    x: 864,
    y: 112,
  },
  {
    id: "n7",
    kind: "end",
    label: "Client activated",
    actor: "Operations",
    tool: "CRM",
    automationLevel: 3,
    inputType: "System Record",
    producesData: true,
    x: 1080,
    y: 132,
  },
];

export const pilotSeedProcessEdges = [
  ["n1", "n2"],
  ["n2", "n3"],
  ["n3", "n4"],
  ["n3", "n5"],
  ["n4", "n6"],
  ["n5", "n6"],
  ["n6", "n7"],
];

export const pilotSeedDepartments: DepartmentRollup[] = [
  { department: "Operations", score: 78, processes: 12, approved: 75, automationValue: 84 },
  { department: "Finance", score: 64, processes: 8, approved: 63, automationValue: 79 },
  { department: "Data", score: 82, processes: 5, approved: 80, automationValue: 71 },
  { department: "Procurement", score: 66, processes: 7, approved: 57, automationValue: 63 },
  { department: "People", score: 48, processes: 4, approved: 25, automationValue: 55 },
];

export const pilotSeedImports = [
  { name: "Department directory", rows: 18, status: "Validated", icon: Building2 },
  { name: "Tool stack", rows: 42, status: "Needs mapping", icon: Database },
  { name: "Employee invitations", rows: 128, status: "Ready to send", icon: Users },
  { name: "Data sources", rows: 31, status: "Validated", icon: Archive },
];

export const pilotSeedReviewQueue = [
  { title: "Invoice exception handling", meta: "Finance · duplicate risk 82%", icon: AlertTriangle },
  { title: "Hiring approval chain", meta: "People · awaiting lead review", icon: Clock3 },
  { title: "Supplier validation", meta: "Procurement · requested changes resolved", icon: CheckCircle2 },
];

export const pilotSeedSettingsSections = [
  { title: "Company profile", detail: "Industry, size, locations, business model", icon: Building2 },
  { title: "Departments", detail: "Teams, leads, goals, pain points", icon: Users },
  { title: "Tools", detail: "Approved systems for process steps", icon: Layers3 },
  { title: "Governance", detail: "Data classes, residency, approval gates", icon: ShieldCheck },
  { title: "Campaign", detail: "Participants, deadlines, reviewer rules", icon: Map },
];

export function confidenceTier(approvedPct: number, count: number) {
  if (count >= 8 && approvedPct >= 70) return "High confidence";
  if (count >= 4 && approvedPct >= 45) return "Provisional";
  return "Low coverage";
}

export function computeAggregateScores(records: ProcessRecord[], rollups: DepartmentRollup[]) {
  const totalWeight = records.reduce(
    (sum, item) => sum + item.frequencyWeight * item.strategicAlignment,
    0,
  );

  const weighted = (key: keyof Pick<ProcessRecord, "maturity" | "automationValue" | "aiReadiness" | "dataReadiness">) =>
    Math.round(
      records.reduce(
        (sum, item) => sum + Number(item[key]) * item.frequencyWeight * item.strategicAlignment,
        0,
      ) / totalWeight,
    );

  const deptWeight = rollups.reduce((sum, dept) => sum + dept.processes * (dept.score / 100), 0);
  const companyMaturity = Math.round(
    rollups.reduce((sum, dept) => sum + dept.score * dept.processes * (dept.score / 100), 0) /
      deptWeight,
  );

  return {
    maturity: Math.round((weighted("maturity") + companyMaturity) / 2),
    automation: weighted("automationValue"),
    ai: weighted("aiReadiness"),
    data: weighted("dataReadiness"),
    savings: records.reduce((sum, item) => sum + item.effortSavings, 0),
    ebitda: records.reduce((sum, item) => sum + item.ebitdaImpact, 0),
    approvedPct: Math.round(
      (records.filter((item) => item.status === "Approved").length / records.length) * 100,
    ),
  };
}

export function derivedFromDiagram(nodes: FlowNode[]) {
  const taskNodes = nodes.filter((node) => !["trigger", "end", "merge"].includes(node.kind));
  const decisionNodes = nodes.filter((node) => node.kind === "decision");
  const automationCeiling = Math.max(0, ...nodes.filter((node) => !["trigger", "end", "merge"].includes(node.kind)).map((node) => node.automationLevel));

  return {
    stepCount: taskNodes.length,
    decisionPoints: decisionNodes.length,
    automationCeiling,
    tools: Array.from(new Set(nodes.map((node) => node.tool))).length,
  };
}

export function toolProfileFor(tool: string | null) {
  return pilotSeedToolDataSources.find((source) => source.tool === tool);
}

export function resolveDataProfile(node: FlowNode): DataProfile {
  if (node.dataProfile) return node.dataProfile;

  const source = toolProfileFor(node.tool);
  if (!source) return manualDataProfile;

  return {
    ...source.profile,
    source: "inherited",
  };
}

export function resolveDataSourceId(node: FlowNode) {
  return node.dataSourceId ?? toolProfileFor(node.tool)?.id;
}

export function computeIsDataCritical(node: FlowNode, profile = resolveDataProfile(node)) {
  return (
    ["Manual Entry", "Email", "File/PDF", "Call notes"].includes(node.inputType) ||
    profile.structure === "unstructured" ||
    node.producesData ||
    node.automationLevel >= 3
  );
}

export function defaultDataQuality(node: FlowNode): Exclude<DataQualityRating, "not_assessed"> {
  const source = toolProfileFor(node.tool);
  if (source?.reliability && source.reliability !== "not_assessed") return source.reliability;
  return "needs_checking";
}

export function hydrateStepData(node: FlowNode): FlowNode {
  const profile = resolveDataProfile(node);
  const isDataCritical = computeIsDataCritical(node, profile);
  const dataQuality = isDataCritical
    ? node.dataQuality && node.dataQuality !== "not_assessed"
      ? node.dataQuality
      : defaultDataQuality(node)
    : (node.dataQuality ?? "not_assessed");

  return {
    ...node,
    dataSourceId: resolveDataSourceId(node),
    dataProfile: profile,
    dataQuality,
    isDataCritical,
  };
}

export function withDataProfileOverride(
  node: FlowNode,
  key: keyof Omit<DataProfile, "source">,
  value: string,
): FlowNode {
  const nextProfile = {
    ...resolveDataProfile(node),
    [key]: value,
    source: "overridden" as const,
  };

  return hydrateStepData({
    ...node,
    dataProfile: nextProfile,
  });
}

export function withToolSelection(node: FlowNode, tool: string | null): FlowNode {
  const source = toolProfileFor(tool);
  return hydrateStepData({
    ...node,
    tool,
    dataSourceId: source?.id,
    dataProfile: source ? { ...source.profile, source: "inherited" } : manualDataProfile,
    dataQuality: source?.reliability ?? "not_assessed",
  });
}

const accessibilityRank: Record<DataAccessibility, number> = {
  api_accessible: 3,
  export_only: 2,
  manual: 1,
};

const structureRank: Record<DataStructure, number> = {
  structured: 3,
  semi_structured: 2,
  unstructured: 1,
};

const sensitivityRank: Record<DataSensitivity, number> = {
  public: 1,
  internal: 2,
  personal: 3,
  sensitive: 4,
};

const qualityRank: Record<DataQualityRating, number> = {
  trusted: 3,
  needs_checking: 2,
  unreliable: 1,
  not_assessed: 0,
};

function weakestByRank<T extends string>(values: T[], rank: Record<T, number>) {
  return values.reduce((weakest, value) => (rank[value] < rank[weakest] ? value : weakest), values[0]);
}

function strongestByRank<T extends string>(values: T[], rank: Record<T, number>) {
  return values.reduce((strongest, value) => (rank[value] > rank[strongest] ? value : strongest), values[0]);
}

function readinessFrom(accessibility: DataAccessibility, structure: DataStructure, quality: DataQualityRating) {
  const accessibilityScore = { api_accessible: 95, export_only: 65, manual: 35 }[accessibility];
  const structureScore = { structured: 95, semi_structured: 70, unstructured: 40 }[structure];
  const qualityScore = { trusted: 95, needs_checking: 65, unreliable: 25, not_assessed: 50 }[quality];
  return Math.round(Math.min(accessibilityScore, structureScore, qualityScore));
}

export function deriveDataFromSteps(nodes: FlowNode[]): DerivedData {
  const hydrated = nodes.map(hydrateStepData);
  const profiledSteps = hydrated.filter((node) => node.dataSourceId || node.dataProfile);
  const scopedSteps = profiledSteps.length > 0 ? profiledSteps : hydrated;

  const evidence = scopedSteps.map((node) => {
    const profile = resolveDataProfile(node);
    return {
      nodeId: node.id,
      label: node.label,
      dataSourceId: resolveDataSourceId(node),
      accessibility: profile.accessibility,
      structure: profile.structure,
      sensitivity: profile.sensitivity,
      dataQuality: node.isDataCritical ? (node.dataQuality ?? defaultDataQuality(node)) : "not_assessed",
      isDataCritical: Boolean(node.isDataCritical),
    };
  });

  const dataAccessibility = weakestByRank(
    evidence.map((item) => item.accessibility),
    accessibilityRank,
  );
  const dataStructureType = weakestByRank(
    evidence.map((item) => item.structure),
    structureRank,
  );
  const dataClassification = strongestByRank(
    evidence.map((item) => item.sensitivity),
    sensitivityRank,
  );
  const criticalQualities = evidence
    .filter((item) => item.isDataCritical)
    .map((item) => item.dataQuality === "not_assessed" ? "needs_checking" : item.dataQuality);
  const dataQuality = weakestByRank(
    criticalQualities.length > 0 ? criticalQualities : ["needs_checking"],
    qualityRank,
  ) as Exclude<DataQualityRating, "not_assessed">;

  /*
   * Engine data fields are deliberately derived with conservative rules:
   * automation readiness follows the weakest data step, while governance
   * classification follows the most-sensitive data touched anywhere.
   */
  return {
    source: "steps",
    dataReadiness: readinessFrom(dataAccessibility, dataStructureType, dataQuality),
    dataAccessibility,
    dataStructureType,
    dataClassification,
    dataQuality,
    evidence,
  };
}

export function isGovernanceProvisional(derivedData: DerivedData, dataValidated: boolean) {
  return !dataValidated && ["personal", "sensitive"].includes(derivedData.dataClassification);
}
