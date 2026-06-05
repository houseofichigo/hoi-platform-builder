export type M02BlueprintStatus = "pass" | "partial" | "blocked";

export interface M02BlueprintEntryMetadata {
  version: string;
  lastUpdated: string;
  sensitivity: string;
  allowedAiUse: string;
  tags: string[];
}

export interface M02BlueprintEntry {
  id: string;
  title: string;
  category: string;
  source: string;
  sourceOwner: string;
  content: string;
  metadata: M02BlueprintEntryMetadata;
}

export interface M02BlueprintC1 {
  title: string;
  rawSource: {
    name: string;
    format: string;
    startingState: string;
    whyAiCannotUseItYet: string;
  };
  dataMapRow: {
    sourceLocation: string;
    owner: string;
    category: string;
    refreshCadence: string;
    sensitivity: string;
  };
  kbEntry: M02BlueprintEntry;
  whatToNotice: string;
}

export interface M02BlueprintC2 {
  title: string;
  sourcePrecedence: string[];
  accessRules: {
    level: string;
    appliesTo: string;
    aiBehaviour: string;
  }[];
  allowedAiBehaviour: string;
  escalationBoundary: string;
  whatToNotice: string;
}

export interface M02BlueprintC3 {
  title: string;
  retrievalTest: {
    id: string;
    userQuestion: string;
    expectedEntry: string;
    expectedSource: string;
    expectedBehaviour: string;
  };
  passCriteria: string[];
  gateEvidence: string[];
  whatToNotice: string;
}

export interface M02BlueprintData {
  useCaseId: string;
  useCaseName: string;
  useCaseDescription: string;
  components: {
    c1: M02BlueprintC1;
    c2: M02BlueprintC2;
    c3: M02BlueprintC3;
  };
  retrievalInstructions: {
    scope: string;
    retrievalOrder: string[];
    sourcePrecedence: string[];
    citation: string;
    sensitivity: string;
    boundaryBehaviour: string;
  };
}

export interface M02Step3State {
  useCaseId: string;
  revealedPanels: boolean[];
  collapsedPanels: boolean[];
  hardestComponents: string[];
  componentNotes: Record<string, string>;
  status: M02BlueprintStatus | "";
  statusExplanation: string;
  generated: boolean;
  generatedAt?: string;
}

export interface M02GeneratedBlueprint {
  useCaseId: string;
  useCaseName: string;
  generatedAt: string;
  namedGaps: string[];
  selectedSources: {
    internal: string[];
    contextual: string[];
    taskSpecific: string[];
  };
  hardestComponents: string[];
  componentNotes: Record<string, string>;
  status: M02BlueprintStatus;
  statusExplanation: string;
  markdown: string;
}

export const M02_BLUEPRINT_COMPONENTS = [
  "C1 - Data Map",
  "C2 - Trust + Safety",
  "C3 - Verification",
] as const;

function normalizePanelFlags(value: unknown): boolean[] {
  if (!Array.isArray(value) || value.length !== M02_BLUEPRINT_COMPONENTS.length) {
    return Array.from({ length: M02_BLUEPRINT_COMPONENTS.length }, () => false);
  }
  return value.map(Boolean);
}

function normalizeComponentTextList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .filter((item) => M02_BLUEPRINT_COMPONENTS.includes(item as (typeof M02_BLUEPRINT_COMPONENTS)[number]));
}

export function createDefaultM02Step3State(useCaseId: string): M02Step3State {
  return {
    useCaseId,
    revealedPanels: Array.from({ length: M02_BLUEPRINT_COMPONENTS.length }, () => false),
    collapsedPanels: Array.from({ length: M02_BLUEPRINT_COMPONENTS.length }, () => false),
    hardestComponents: [],
    componentNotes: {},
    status: "",
    statusExplanation: "",
    generated: false,
  };
}

export function normalizeM02Step3State(value: unknown, useCaseId: string): M02Step3State {
  const defaults = createDefaultM02Step3State(useCaseId);
  if (!value || typeof value !== "object" || Array.isArray(value)) return defaults;
  const source = value as Partial<M02Step3State>;
  if (source.useCaseId !== useCaseId) return defaults;
  const componentNotes =
    source.componentNotes && typeof source.componentNotes === "object" && !Array.isArray(source.componentNotes)
      ? Object.fromEntries(
          Object.entries(source.componentNotes).filter(([key, note]) =>
            M02_BLUEPRINT_COMPONENTS.includes(key as (typeof M02_BLUEPRINT_COMPONENTS)[number]) &&
            typeof note === "string",
          ),
        )
      : {};
  return {
    ...defaults,
    revealedPanels: normalizePanelFlags(source.revealedPanels),
    collapsedPanels: normalizePanelFlags(source.collapsedPanels),
    hardestComponents: normalizeComponentTextList(source.hardestComponents),
    componentNotes,
    status: source.status === "pass" || source.status === "partial" || source.status === "blocked" ? source.status : "",
    statusExplanation: typeof source.statusExplanation === "string" ? source.statusExplanation : "",
    generated: !!source.generated && normalizePanelFlags(source.revealedPanels).every(Boolean),
    generatedAt: typeof source.generatedAt === "string" ? source.generatedAt : undefined,
  };
}
