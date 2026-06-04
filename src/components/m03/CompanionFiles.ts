import type { AutomationPlaybookData, PromptContract } from "@/data/m03/m03Schema";
import {
  genericSkillCreationMetaPrompt,
  promptImproverSkill,
  skillToChatGPTFormat,
  skillToClaudeMarkdown,
} from "@/data/m03/skillTemplate";
import { competitorPricingMonitor } from "@/data/m03/useCases/competitor-pricing-monitor";
import { promptContractToMarkdown } from "./skillDownload";

export function getSkillMarkdown(data: AutomationPlaybookData): string {
  if (data.platform === "claude") return skillToClaudeMarkdown(promptImproverSkill);
  if (data.platform === "chatgpt" || data.platform === "mistral") return skillToChatGPTFormat(promptImproverSkill);
  return promptContractToMarkdown(data.promptContract, "Reusable Prompt Contract");
}

export async function getSetupGuidePDF(data: AutomationPlaybookData): Promise<Blob | null> {
  if (!["chatgpt", "claude", "mistral"].includes(data.platform)) return null;
  const { generateSetupGuidePDF } = await import("./PlaybookPDFRenderer");
  return generateSetupGuidePDF(data.platform);
}

export async function getCrossPlatformReferencePDF(): Promise<Blob> {
  const { generateCrossPlatformReferencePDF } = await import("./PlaybookPDFRenderer");
  return generateCrossPlatformReferencePDF();
}

export function getPromptsLibraryMarkdown(data: AutomationPlaybookData): string {
  let md = `# M03 Prompt Automation Playbook\n\n`;
  md += `Generated for ${data.platform} on ${data.generatedAt}\n\n`;
  md += `A shareable prompt library for the M03 automation ladder. Copy the artifact that matches the rung you need, replace variables in braces, and keep the source and safety rules intact.\n\n`;

  md += `## Skill-building meta-prompt\n\n`;
  md += "```text\n";
  md += genericSkillCreationMetaPrompt;
  md += "\n```\n\n";

  md += `## Prompt Improver Skill example\n\n`;
  md += "```markdown\n";
  md += skillToChatGPTFormat(promptImproverSkill);
  md += "\n```\n\n";

  for (const rungNum of data.rungsCovered) {
    const rung = competitorPricingMonitor.rungs.find((r) => r.rungNumber === rungNum);
    if (!rung) continue;
    md += `## Rung ${rungNum} - ${rung.rungName}\n\n`;
    md += `${rung.conceptDefinition}\n\n`;
    md += "```\n";
    md += rung.promptOrArtifact;
    md += "\n```\n\n";
  }

  return md;
}

export function promptContractMarkdown(contract: PromptContract): string {
  return promptContractToMarkdown(contract, "Prompt Contract");
}
