import type { Platform, PlatformConfig } from "./m03Schema";
import { getRungCountForPlatform } from "./capabilityMatrix";

export const platforms: Record<Platform, PlatformConfig> = {
  chatgpt: {
    id: "chatgpt",
    displayName: "ChatGPT",
    shortName: "ChatGPT",
    url: "https://chatgpt.com",
    rungCount: getRungCountForPlatform("chatgpt"),
    searchTermInUI: "Search the web",
    deepResearchTermInUI: "Deep Research",
    skillInstallPath: "Profile menu -> Skills",
    skillInstallSteps: [
      "Open ChatGPT in your browser.",
      "Open your profile menu and select Skills.",
      "Create a new Skill or use the Skills editor if it is enabled for your plan.",
      "Paste the downloaded Skill content into the editor.",
      "Review the scan result, save the Skill, and install or enable it for your workspace.",
    ],
  },
  claude: {
    id: "claude",
    displayName: "Claude",
    shortName: "Claude",
    url: "https://claude.ai",
    rungCount: getRungCountForPlatform("claude"),
    searchTermInUI: "Web search",
    deepResearchTermInUI: "Research",
    skillInstallPath: "Settings -> Skills",
    skillInstallSteps: [
      "Open Claude in your browser.",
      "Go to Settings, then Skills.",
      "Create or upload a Skill package that includes the SKILL.md file.",
      "Confirm the name, description, triggers, and any supporting files.",
      "Enable the Skill and test it with a pricing-monitor request.",
    ],
  },
  gemini: {
    id: "gemini",
    displayName: "Gemini",
    shortName: "Gemini",
    url: "https://gemini.google.com",
    rungCount: getRungCountForPlatform("gemini"),
    searchTermInUI: "Search with Gemini",
    deepResearchTermInUI: "Deep Research",
  },
  mistral: {
    id: "mistral",
    displayName: "Mistral / Vibe",
    shortName: "Mistral",
    url: "https://chat.mistral.ai",
    rungCount: getRungCountForPlatform("mistral"),
    searchTermInUI: "Web search",
    deepResearchTermInUI: "Deep Research",
    skillInstallPath: "Vibe Work -> Skills",
    skillInstallSteps: [
      "Open Vibe Work from chat.mistral.ai.",
      "Open the Skills area or create a Skill from the Work interface.",
      "Paste the Skill method and quality bar into the Skill instructions.",
      "Attach any reference files if your workspace allows them.",
      "Save the Skill and run a competitor pricing request to test activation.",
    ],
  },
  copilot: {
    id: "copilot",
    displayName: "Microsoft Copilot",
    shortName: "Copilot",
    url: "https://copilot.microsoft.com",
    rungCount: getRungCountForPlatform("copilot"),
    searchTermInUI: "Web search",
    deepResearchTermInUI: "Deep Research / Researcher",
  },
};

export function getPlatform(id: string): PlatformConfig | undefined {
  return platforms[id as Platform];
}
