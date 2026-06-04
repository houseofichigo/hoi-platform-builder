import type { Platform, PromptContract, SkillSpec } from "@/data/m03/m03Schema";
import { skillToChatGPTFormat, skillToClaudeMarkdown } from "@/data/m03/skillTemplate";

export function promptContractToMarkdown(promptContract: PromptContract, title = "Prompt Contract"): string {
  const columns = promptContract.outputContract.columns?.length
    ? `\n\nColumns:\n${promptContract.outputContract.columns.map((c) => `- ${c}`).join("\n")}`
    : "";

  return `# ${title}

## Goal
${promptContract.goal}

## Context
${promptContract.context}

## Rules
${promptContract.rules.map((r) => `- ${r}`).join("\n")}

## Output Contract
${promptContract.outputContract.description}${columns}

## Quality Bar
${promptContract.qualityBar.map((q) => `- ${q}`).join("\n")}

## Examples
${promptContract.examples}
`;
}

export function downloadTextFile(content: string, filename: string, type = "text/markdown"): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadSkillAsMarkdown(skill: SkillSpec, platform: Platform): void {
  const content = platform === "claude" ? skillToClaudeMarkdown(skill) : skillToChatGPTFormat(skill);
  const filename = `${skill.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-skill.md`;
  downloadTextFile(content, filename);
}

export function downloadPromptContractAsMarkdown(
  promptContract: PromptContract,
  useCaseId: string,
): void {
  downloadTextFile(
    promptContractToMarkdown(promptContract, `Prompt Contract: ${useCaseId}`),
    `${useCaseId}-prompt-contract.md`,
  );
}

