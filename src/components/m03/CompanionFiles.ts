import type { AutomationPlaybookData, PromptContract } from "@/data/m03/m03Schema";
import { skillToChatGPTFormat, skillToClaudeMarkdown } from "@/data/m03/skillTemplate";
import { competitorPricingMonitor } from "@/data/m03/useCases/competitor-pricing-monitor";
import { promptContractToMarkdown } from "./skillDownload";

export function getSkillMarkdown(data: AutomationPlaybookData): string {
  if (data.platform === "claude") return skillToClaudeMarkdown(data.skillSpec);
  if (data.platform === "chatgpt" || data.platform === "mistral") return skillToChatGPTFormat(data.skillSpec);
  return promptContractToMarkdown(data.promptContract, "Reusable Prompt Contract");
}

export async function getSetupGuidePDF(data: AutomationPlaybookData): Promise<Blob | null> {
  if (!["chatgpt", "claude", "mistral"].includes(data.platform)) return null;
  const { generateSetupGuidePDF } = await import("./PlaybookPDFRenderer");
  return generateSetupGuidePDF(data.platform);
}

export async function getPricingTrackerXLSX(): Promise<Blob> {
  const response = await fetch("/downloads/m03/pricing-tracker.xlsx");
  if (!response.ok) throw new Error("Pricing tracker template was not found.");
  return response.blob();
}

export async function getCrossPlatformReferencePDF(): Promise<Blob> {
  const { generateCrossPlatformReferencePDF } = await import("./PlaybookPDFRenderer");
  return generateCrossPlatformReferencePDF();
}

export function getPromptsLibraryMarkdown(data: AutomationPlaybookData): string {
  let md = `# M03 Prompts Library - Competitor Pricing Monitor\n\n`;
  md += `Generated for ${data.platform} on ${data.generatedAt}\n\n`;
  md += `Every prompt you saw in M03, ready to paste.\n\n`;

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

