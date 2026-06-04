export type Platform = "chatgpt" | "claude" | "gemini" | "mistral" | "copilot";

export type RungAvailability = "available" | "not_available";

export type CapabilityMatrix = {
  lastVerified: string;
  matrix: Record<number, Record<Platform, RungAvailability>>;
};

export type PlatformConfig = {
  id: Platform;
  displayName: string;
  shortName: string;
  url: string;
  rungCount: number;
  searchTermInUI: string;
  deepResearchTermInUI?: string;
  skillInstallPath?: string;
  skillInstallSteps?: string[];
};

export type RungSpec = {
  rungNumber: number;
  rungName: string;
  capability: string;
  whyItMatters: string;
  whatToNotice: string;
  conceptDefinition: string;
  failureMode: string;
  governanceWeight: 1 | 2 | 3 | 4 | 5;
  promptOrArtifact: string;
  artifactDownloadPath?: string;
  platformVariants: Partial<Record<Platform, PlatformRungVariant>>;
};

export type PlatformRungVariant = {
  whereToFindIt: string;
  stepByStepInstructions: string[];
  expectedOutcome: string;
  tipsAndCautions?: string[];
};

export type SkillSpec = {
  name: string;
  description: string;
  triggers: string[];
  instructions: string;
  qualityBar: string[];
  safetyConstraints: string[];
  whenNotToUse: string[];
};

export type UseCaseBlueprint = {
  id: string;
  displayName: string;
  shortDescription: string;
  vaguePrompt: string;
  promptContract: PromptContract;
  skillSpec: SkillSpec;
  rungs: RungSpec[];
};

export type PromptContract = {
  goal: string;
  context: string;
  rules: string[];
  outputContract: {
    description: string;
    columns?: string[];
  };
  qualityBar: string[];
  examples: string;
};

export type M03AssignmentState = {
  platform?: Platform;
  useCase?: string;
  vaguePromptTest?: VaguePromptTestResult;
  structuredPrompt?: PromptContract;
  skillSpec?: SkillSpec;
  ladderWalkthrough?: Record<number, LadderRungResult>;
  reflectionAnswers?: ReflectionAnswers;
  readinessStatus?: "PASS" | "PARTIAL" | "BLOCKED";
  readinessExplanation?: string;
  automationPlaybook?: AutomationPlaybookData;
};

export type VaguePromptTestResult = {
  observations: {
    askedWhichCompetitors: boolean;
    citedSources: boolean;
    structuredOutput: boolean;
    specifiedCurrency: boolean;
    inventedDetails: boolean;
    couldDefend: boolean;
  };
  pastedResult?: string;
};

export type LadderRungResult = {
  revealed: boolean;
  tested?: "yes" | "no" | "maybe";
  relevantForTeam?: "yes" | "no" | "maybe";
};

export type ReflectionAnswers = {
  currentRung: number;
  targetRung: number;
  governanceGaps: string[];
};

export type AutomationPlaybookData = {
  generatedAt: string;
  platform: Platform;
  useCase: string;
  rungsCovered: number[];
};
