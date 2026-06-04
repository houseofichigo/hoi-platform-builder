import type {
  M02BlueprintData,
  M02GeneratedBlueprint,
  M02Step3State,
} from "@/data/m02/blueprintSchema";

export const BLUEPRINT_LOADING_LINES = [
  "Assembling your blueprint...",
  "· Index",
  "· Retrieval instructions",
  "· Test suite",
  "· Governance register",
  "· Forward path",
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
  if (!state.status) {
    throw new Error("Cannot generate M02 blueprint without readiness status.");
  }
  const generatedAt = new Date().toISOString();
  const base: Omit<M02GeneratedBlueprint, "markdown"> = {
    useCaseId: blueprint.useCaseId,
    useCaseName: blueprint.useCaseName,
    generatedAt,
    namedGaps,
    selectedSources,
    hardestComponents: state.hardestComponents,
    componentNotes: state.componentNotes,
    status: state.status,
    statusExplanation: state.statusExplanation,
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
  const status = generated.status.toUpperCase();
  return [
    `# ${blueprint.useCaseName} Knowledge Base Blueprint`,
    "",
    blueprint.useCaseDescription,
    "",
    `Generated: ${new Date(generated.generatedAt).toLocaleDateString()}`,
    "",
    "## Section 1 - Index",
    "",
    "| Entry ID | Title | Layer | Category | Source | Summary |",
    "|---|---|---|---|---|---|",
    ...blueprint.entries.items.map((entry) =>
      `| ${entry.id} | ${escapeMd(entry.title)} | ${entry.layer} | ${escapeMd(entry.category)} | ${escapeMd(`${entry.source} (${entry.sourceOwner})`)} | ${escapeMd(summarizeEntry(entry.content))} |`,
    ),
    "",
    "## Section 2 - Retrieval Instructions (AI-facing)",
    "",
    "```",
    `Scope: ${blueprint.retrievalInstructions.scope}`,
    "",
    "Retrieval order:",
    ...blueprint.retrievalInstructions.retrievalOrder.map((item, index) => `${index + 1}. ${item}`),
    "",
    "Source precedence:",
    ...blueprint.retrievalInstructions.sourcePrecedence.map((item, index) => `${index + 1}. ${item}`),
    "",
    `Citation: ${blueprint.retrievalInstructions.citation}`,
    "",
    `Sensitivity: ${blueprint.retrievalInstructions.sensitivity}`,
    "",
    `Boundary behaviour: ${blueprint.retrievalInstructions.boundaryBehaviour}`,
    "```",
    "",
    "## Section 3 - Retrieval Test Suite",
    "",
    "| Test ID | Question | Expected entry | Expected source | Expected behaviour |",
    "|---|---|---|---|---|",
    ...blueprint.retrievalTests.tests.map((test) =>
      `| ${test.id} | ${escapeMd(test.question)} | ${escapeMd(test.expectedEntry)} | ${escapeMd(test.expectedSource)} | ${escapeMd(test.expectedBehaviour)} |`,
    ),
    "",
    "## Section 4 - Governance Register",
    "",
    "Open items to address before Build:",
    "",
    ...governanceItems(generated).flatMap((item) => [
      `- ${item.title}: ${item.note}`,
      `  - Action needed: ${item.action}`,
      "  - Owner-of-the-fix: TBD - team to assign",
      "  - Target date: TBD",
    ]),
    "",
    "Named gaps from Step 2:",
    "",
    ...(generated.namedGaps.length ? generated.namedGaps.map((gap) => `- ${gap}`) : ["- No named gaps recorded."]),
    "",
    "## Section 5 - Forward Path",
    "",
    "In M04, this blueprint becomes the specification for a real AI assistant. The assistant should ingest this index, apply these retrieval instructions, and run this test suite before it is trusted in a workflow.",
    "",
    "At Gate 1, the governance register becomes the pre-Build checklist. The team should decide which open items must be resolved before building and which can move forward with named constraints.",
    "",
    "Your team now has a document that can be handed to a developer, vendor, CIO, or internal owner to explain what an AI-ready knowledge base for this process should look like.",
    "",
    `Chosen readiness status: ${status}. ${generated.statusExplanation}`,
    "",
  ].join("\n");
}

export function governanceItems(
  generated: Pick<M02GeneratedBlueprint, "hardestComponents" | "componentNotes">,
) {
  return generated.hardestComponents.map((component) => ({
    title: component,
    note: generated.componentNotes[component]?.trim() || "Learner flagged this component as hard to put in place.",
    action: actionForComponent(component),
  }));
}

function actionForComponent(component: string): string {
  const lower = component.toLowerCase();
  if (lower.includes("data map")) return "Confirm source locations, owners, and refresh cadence.";
  if (lower.includes("knowledge layers")) return "Separate sources into internal facts, contextual rules, and task examples.";
  if (lower.includes("entries")) return "Break large documents into atomic source-backed entries.";
  if (lower.includes("metadata")) return "Add title, layer, source, owner, and usable rule/fact/example to every entry.";
  if (lower.includes("lineage")) return "Define which source wins when records, policies, and examples conflict.";
  if (lower.includes("access")) return "Classify entries by who can see them and what AI may do with them.";
  if (lower.includes("retrieval")) return "Write test questions with expected entry, source, and behaviour.";
  return "Assign an owner and document the missing readiness work.";
}

function summarizeEntry(content: string): string {
  const [firstSentence] = content.split(/(?<=[.!?])\s+/);
  return firstSentence || content.slice(0, 120);
}

function escapeMd(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}
