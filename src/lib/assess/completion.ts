import type { ModuleId } from "@/lib/curriculum";

export interface ArtifactDef {
  id: string;
  title: string;
  phase: number;
  phaseName: string;
  modules: ModuleId[];
  outputKeys: string[];
}

export const ARTIFACTS: ArtifactDef[] = [
  {
    id: "artifact-01",
    title: "The Foundation",
    phase: 1,
    phaseName: "Scope",
    modules: ["m01", "m02", "m03"],
    outputKeys: [
      "m01.reflection",
      "m01.method_note",
      "m02.internal_sources",
      "m02.contextual_rules",
      "m02.test_set",
      "m02.gaps",
      "m03.platform",
      "m03.use_case",
      "m03.vague_prompt_test",
      "m03.structured_prompt",
      "m03.skill_spec",
      "m03.ladder_walkthrough",
      "m03.reflection_answers",
      "m03.readiness_status",
      "m03.automation_playbook",
    ],
  },
  {
    id: "artifact-02",
    title: "The System",
    phase: 2,
    phaseName: "Build",
    modules: ["m04", "m05", "m06"],
    outputKeys: [
      "m04.architecture",
      "m04.knowledge_base",
      "m04.rag_governance",
      "m04.test_results",
      "m04.readiness",
      "m05.surfaces",
      "m05.prototype_brief",
      "m05.walkthrough",
      "m05.agent_requirements",
      "m06.agent_design",
      "m06.integration_plan",
      "m06.hitl_policy",
      "m06.pilot_plan",
      "m06.readiness",
    ],
  },
  {
    id: "artifact-03",
    title: "The Operating Plan",
    phase: 3,
    phaseName: "Govern",
    modules: ["m07", "m08", "m09"],
    outputKeys: [
      "m07.stack_inventory",
      "m07.comparison_matrix",
      "m07.adr",
      "m07.stack_decision",
      "m08.architecture",
      "m08.security_risks",
      "m08.cost_model",
      "m08.integration_plan",
      "m09.candidates",
      "m09.scores",
      "m09.automation_maps",
      "m09.ranking",
      "m09.readiness",
    ],
  },
  {
    id: "artifact-04",
    title: "The Handoff Pack",
    phase: 4,
    phaseName: "Scale",
    modules: ["m10", "m11", "m12"],
    outputKeys: [
      "m10.documentation_outline",
      "m10.playbook",
      "m10.handoff_plan",
      "m11.metrics",
      "m11.alerts",
      "m11.drift_response",
      "m11.rescoring",
      "m12.roadmap",
      "m12.capability_gaps",
      "m12.scorecard",
      "m12.executive_summary",
    ],
  },
];

export const GATES = [
  { num: 1 as const, moduleId: "m04" as ModuleId, formal: false, question: "Is it safe to build?" },
  { num: 2 as const, moduleId: "m06" as ModuleId, formal: false, question: "Is it safe to deploy?" },
  { num: 3 as const, moduleId: "m09" as ModuleId, formal: true, question: "Which use cases earn the next investment cycle?" },
];

/**
 * Backward-compatibility aliases for output keys.
 * Canonical key -> list of legacy keys that also satisfy it.
 * Lets users whose data was written under an older key (e.g. before a
 * rename) still reach artifact readiness without re-completing the module.
 */
export const OUTPUT_KEY_ALIASES: Record<string, string[]> = {
  "m03.platform": ["m03.architecture"],
  "m03.use_case": ["m03.architecture"],
  "m03.vague_prompt_test": ["m03.architecture"],
  "m03.structured_prompt": ["m03.prompts"],
  "m03.skill_spec": ["m03.prompts"],
  "m03.ladder_walkthrough": ["m03.ladder_understood"],
  "m03.reflection_answers": ["m03.quality_checked"],
  "m03.readiness_status": ["m03.quality_checked"],
  "m03.automation_playbook": ["m03.quality_checked"],
  "m05.surfaces": ["m05.prototype_scope"],
  // Walkthrough findings/notes are persisted inside the agent_requirements
  // payload by M05Work, so presence of agent_requirements satisfies walkthrough.
  "m05.walkthrough": ["m05.agent_requirements"],
};

export function isOutputPresent(key: string, presentOutputs: Set<string>): boolean {
  if (presentOutputs.has(key)) return true;
  const aliases = OUTPUT_KEY_ALIASES[key];
  return aliases ? aliases.some((a) => presentOutputs.has(a)) : false;
}

export function artifactStatus(
  artifact: ArtifactDef,
  moduleProgress: Record<string, { status: "not_started" | "in_progress" | "complete" } | undefined>,
  presentOutputs: Set<string>,
): "complete" | "in_progress" | "blocked" {
  const statuses = artifact.modules.map((m) => moduleProgress[m]?.status ?? "not_started");
  const allKeysPresent = artifact.outputKeys.every((k) => isOutputPresent(k, presentOutputs));
  if (statuses.every((s) => s === "complete") && allKeysPresent) return "complete";
  if (statuses.some((s) => s !== "not_started")) return "in_progress";
  return "blocked";
}
