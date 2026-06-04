import type { CapabilityMatrix, Platform } from "./m03Schema";

/**
 * Capability matrix for M03's generic automation ladder.
 *
 * Last verified against official provider documentation on 2026-06-04.
 * Re-verify quarterly. AI product surfaces change quickly, and several
 * capabilities below are plan-, admin-, preview-, or region-gated.
 *
 * Major verified changes from the original working hypothesis:
 * - Mistral Vibe/Work documents Skills, Connectors, Deep Research, and
 *   Scheduled tasks. These are marked available with caveats in platform copy.
 * - Gemini documents Scheduled actions and Gemini Agent. Gemini Agent is marked
 *   available but is restricted to personal Google AI Ultra, US, English, and
 *   is not available for work/school accounts at verification time.
 * - Microsoft documents Copilot scheduled prompts, Deep Research/Researcher,
 *   connectors, and Researcher with Computer Use. Agent mode is marked
 *   available with Frontier/admin/license caveats.
 * - ChatGPT Skills are real, but plan-gated beta for Business, Enterprise, Edu,
 *   Teachers, and Healthcare at verification time.
 *
 * Rung 4 remains "not_available" for Gemini and Copilot because their closest
 * equivalents are Gems and Copilot Studio, which M04 covers as productised
 * assistants rather than M03 generic Skills.
 */
export const capabilityMatrix: CapabilityMatrix = {
  lastVerified: "2026-06-04",
  matrix: {
    1: {
      chatgpt: "available",
      claude: "available",
      gemini: "available",
      mistral: "available",
      copilot: "available",
    },
    2: {
      chatgpt: "available",
      claude: "available",
      gemini: "available",
      mistral: "available",
      copilot: "available",
    },
    3: {
      chatgpt: "available",
      claude: "available",
      gemini: "available",
      mistral: "available",
      copilot: "available",
    },
    4: {
      chatgpt: "available",
      claude: "available",
      gemini: "not_available",
      mistral: "available",
      copilot: "not_available",
    },
    5: {
      chatgpt: "available",
      claude: "available",
      gemini: "available",
      mistral: "available",
      copilot: "available",
    },
    6: {
      chatgpt: "available",
      claude: "available",
      gemini: "available",
      mistral: "available",
      copilot: "available",
    },
    7: {
      chatgpt: "available",
      claude: "available",
      gemini: "available",
      mistral: "available",
      copilot: "available",
    },
    8: {
      chatgpt: "available",
      claude: "available",
      gemini: "available",
      mistral: "available",
      copilot: "available",
    },
    9: {
      chatgpt: "available",
      claude: "not_available",
      gemini: "available",
      mistral: "not_available",
      copilot: "available",
    },
    10: {
      chatgpt: "available",
      claude: "not_available",
      gemini: "available",
      mistral: "available",
      copilot: "available",
    },
  },
};

export function getRungCountForPlatform(platform: Platform): number {
  return Object.values(capabilityMatrix.matrix).filter(
    (rungAvailability) => rungAvailability[platform] === "available",
  ).length;
}

export function getRungsForPlatform(platform: Platform): number[] {
  return Object.entries(capabilityMatrix.matrix)
    .filter(([, rungAvailability]) => rungAvailability[platform] === "available")
    .map(([rungNumber]) => Number.parseInt(rungNumber, 10))
    .sort((a, b) => a - b);
}

export function isRungAvailable(rungNumber: number, platform: Platform): boolean {
  return capabilityMatrix.matrix[rungNumber]?.[platform] === "available";
}
