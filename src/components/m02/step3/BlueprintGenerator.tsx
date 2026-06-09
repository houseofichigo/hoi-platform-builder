import type {
  M02BlueprintStatus,
  M02BlueprintData,
  M02GeneratedBlueprint,
  M02Step3State,
} from "@/data/m02/blueprintSchema";

export const M02_EXAMPLE_GATE_STATUS: M02BlueprintStatus = "partial";
export const M02_EXAMPLE_GATE_EXPLANATION =
  "The KB pattern is clear, but production readiness still depends on source ownership, access rules, and tests being approved by the business.";

export const BLUEPRINT_LOADING_LINES = [
  "Assembling the reference blueprint...",
  "· C1 Data Map",
  "· C2 Trust + Safety",
  "· C3 Verification",
  "· Gate 1 decision",
] as const;

interface BuildGeneratedBlueprintArgs {
  blueprint: M02BlueprintData;
  state: M02Step3State;
  namedGaps: string[];
  selectedSources: {
    internal: string[];
    contextual: string[];
    taskSpecific: string[];
  };
}

export function buildGeneratedM02Blueprint({
  blueprint,
  state,
  namedGaps,
  selectedSources,
}: BuildGeneratedBlueprintArgs): M02GeneratedBlueprint {
  const generatedAt = new Date().toISOString();
  const base: Omit<M02GeneratedBlueprint, "markdown"> = {
    useCaseId: blueprint.useCaseId,
    useCaseName: blueprint.useCaseName,
    generatedAt,
    namedGaps,
    selectedSources,
    hardestComponents: state.hardestComponents.length
      ? state.hardestComponents
      : ["C1 - Data Map", "C2 - Trust + Safety", "C3 - Verification"],
    componentNotes: state.componentNotes,
    status: state.status || M02_EXAMPLE_GATE_STATUS,
    statusExplanation: state.statusExplanation || M02_EXAMPLE_GATE_EXPLANATION,
  };
  return {
    ...base,
    markdown: generatedBlueprintToMarkdown(blueprint, base),
  };
}

export function generatedBlueprintToMarkdown(
  blueprint: M02BlueprintData,
  generated: Omit<M02GeneratedBlueprint, "markdown">,
): string {
  const { c1, c2, c3 } = blueprint.components;
  const status = generated.status.toUpperCase();
  return [
    `# ${blueprint.useCaseName} Knowledge Base Blueprint`,
    "",
    blueprint.useCaseDescription,
    "",
    `Generated: ${new Date(generated.generatedAt).toLocaleDateString()}`,
    "",
    "## C1 - Data Map",
    "",
    `Raw source: ${c1.rawSource.name}`,
    `Format: ${c1.rawSource.format}`,
    `Starting state: ${c1.rawSource.startingState}`,
    `Why AI cannot use it yet: ${c1.rawSource.whyAiCannotUseItYet}`,
    "",
    "| Field | Value |",
    "|---|---|",
    `| Source location | ${escapeMd(c1.dataMapRow.sourceLocation)} |`,
    `| Owner | ${escapeMd(c1.dataMapRow.owner)} |`,
    `| Category | ${escapeMd(c1.dataMapRow.category)} |`,
    `| Refresh cadence | ${escapeMd(c1.dataMapRow.refreshCadence)} |`,
    `| Sensitivity | ${escapeMd(c1.dataMapRow.sensitivity)} |`,
    "",
    "### AI-ready KB entry",
    "",
    `Entry ID: ${c1.kbEntry.id}`,
    `Title: ${c1.kbEntry.title}`,
    `Source: ${c1.kbEntry.source} (${c1.kbEntry.sourceOwner})`,
    `Content: ${c1.kbEntry.content}`,
    `Metadata: version ${c1.kbEntry.metadata.version}; last updated ${c1.kbEntry.metadata.lastUpdated}; sensitivity ${c1.kbEntry.metadata.sensitivity}; allowed AI use ${c1.kbEntry.metadata.allowedAiUse}; tags ${c1.kbEntry.metadata.tags.join(", ")}`,
    "",
    "## C2 - Trust + Safety",
    "",
    "Source precedence:",
    ...c2.sourcePrecedence.map((item, index) => `${index + 1}. ${item}`),
    "",
    "Access rules:",
    ...c2.accessRules.map((rule) => `- ${rule.level}: ${rule.appliesTo}. AI behavior: ${rule.aiBehaviour}`),
    "",
    `Allowed AI behavior: ${c2.allowedAiBehaviour}`,
    `Escalation boundary: ${c2.escalationBoundary}`,
    "",
    "## C3 - Verification",
    "",
    `Test ID: ${c3.retrievalTest.id}`,
    `User question: ${c3.retrievalTest.userQuestion}`,
    `Expected entry: ${c3.retrievalTest.expectedEntry}`,
    `Expected source: ${c3.retrievalTest.expectedSource}`,
    `Expected behavior: ${c3.retrievalTest.expectedBehaviour}`,
    "",
    "Pass criteria:",
    ...c3.passCriteria.map((item) => `- ${item}`),
    "",
    "Gate evidence:",
    ...c3.gateEvidence.map((item) => `- ${item}`),
    "",
    "## Example Gate 1 Decision",
    "",
    `Example readiness status: ${status}. ${generated.statusExplanation}`,
    "",
    "Example open items before Build:",
    "",
    ...governanceItems(generated).flatMap((item) => [
      `- ${item.title}: ${item.note}`,
      `  - Action needed: ${item.action}`,
      "  - Owner-of-the-fix: TBD - team to assign",
      "  - Target date: TBD",
    ]),
    "",
    "Reference gaps shown in this example:",
    "",
    ...(generated.namedGaps.length ? generated.namedGaps.map((gap) => `- ${gap}`) : [
      "- Source owner must approve the entry",
      "- Access rules must be checked against live systems",
      "- Retrieval tests must be run before deployment",
    ]),
    "",
    "## Forward Path",
    "",
    "In M04, this blueprint becomes the specification for a real AI assistant. The assistant should ingest the C1 entry, apply the C2 trust and safety rules, and run the C3 verification test before it is trusted in a workflow.",
    "",
  ].join("\n");
}

export function governanceItems(
  generated: Pick<M02GeneratedBlueprint, "hardestComponents" | "componentNotes">,
) {
  return generated.hardestComponents.map((component) => ({
    title: component,
    note: generated.componentNotes[component]?.trim() || exampleNoteForComponent(component),
    action: actionForComponent(component),
  }));
}

function actionForComponent(component: string): string {
  const lower = component.toLowerCase();
  if (lower.includes("c1")) return "Confirm the raw source, owner, metadata, sensitivity, and KB entry ID.";
  if (lower.includes("c2")) return "Confirm source precedence, access rules, allowed AI behavior, and escalation boundaries.";
  if (lower.includes("c3")) return "Run the retrieval test and record PASS, PARTIAL, or FAIL with evidence.";
  return "Assign an owner and document the missing readiness work.";
}

function exampleNoteForComponent(component: string): string {
  const lower = component.toLowerCase();
  if (lower.includes("c1")) return "The source is now mapped, but the owner still needs to approve version, sensitivity, and refresh cadence.";
  if (lower.includes("c2")) return "The safety rules are drafted, but access and escalation rules must be confirmed before production use.";
  if (lower.includes("c3")) return "The test is written, but the team still needs to run it and record PASS, PARTIAL, or FAIL.";
  return "This is an example readiness item to review before Build.";
}

function escapeMd(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}
