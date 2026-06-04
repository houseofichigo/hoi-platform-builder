export type M02BlueprintLayer = "Internal" | "Contextual" | "Task-specific";
export type M02BlueprintStatus = "pass" | "partial" | "blocked";

export interface M02BlueprintDataMapLocation {
  information: string;
  livesIn: string;
  owner: string;
  movement: string;
}

export interface M02BlueprintLayerSource {
  item: string;
  from: string;
}

export interface M02BlueprintKnowledgeLayer {
  name: M02BlueprintLayer;
  description: string;
  sources: M02BlueprintLayerSource[];
}

export interface M02BlueprintEntry {
  id: string;
  layer: M02BlueprintLayer;
  category: string;
  title: string;
  source: string;
  sourceOwner: string;
  content: string;
  metadata: {
    version: string;
    lastUpdated: string;
    sensitivity: string;
    allowedAiUse: string;
  };
}

export interface M02BlueprintMetadataField {
  field: string;
  description: string;
}

export interface M02BlueprintSensitivityClassification {
  level: string;
  description: string;
  appliesTo: string[];
  aiBehaviour: string;
}

export interface M02BlueprintRetrievalTest {
  id: string;
  question: string;
  expectedEntry: string;
  expectedSource: string;
  expectedBehaviour: string;
}

export interface M02BlueprintData {
  useCaseId: string;
  useCaseName: string;
  useCaseDescription: string;
  dataMap: {
    intro: string;
    locations: M02BlueprintDataMapLocation[];
    whatToNotice: string;
  };
  knowledgeLayers: {
    intro: string;
    layers: M02BlueprintKnowledgeLayer[];
    whatToNotice: string;
  };
  entries: {
    intro: string;
    items: M02BlueprintEntry[];
    whatToNotice: string;
  };
  metadata: {
    intro: string;
    required: M02BlueprintMetadataField[];
    optional: M02BlueprintMetadataField[];
    whatToNotice: string;
  };
  lineage: {
    intro: string;
    precedenceRules: string[];
    lineageExample: string;
    whatToNotice: string;
  };
  accessSensitivity: {
    intro: string;
    classifications: M02BlueprintSensitivityClassification[];
    whatToNotice: string;
  };
  retrievalTests: {
    intro: string;
    tests: M02BlueprintRetrievalTest[];
    whatToNotice: string;
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
  "Data map",
  "Three knowledge layers",
  "Knowledge entries",
  "Metadata",
  "Lineage and source precedence",
  "Access and sensitivity",
  "Retrieval tests",
] as const;

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
