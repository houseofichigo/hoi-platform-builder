import type { Platform } from "@/data/m03/m03Schema";

export const RUNG_LABELS: Record<number, string> = {
  1: "Vague prompt",
  2: "Structured prompt",
  3: "Reusable prompt",
  4: "Skill",
  5: "Prompt + File",
  6: "Prompt + Connector",
  7: "Prompt + Search",
  8: "Prompt + Deep Research",
  9: "Agent mode",
  10: "Scheduled prompt",
};

export const GOVERNANCE_GAP_LABELS: Record<string, string> = {
  source_controls: "Source controls",
  access_governance: "Access governance",
  audit_trails: "Audit trails",
  exception_handling: "Exception handling",
  scheduled_review: "Scheduled review",
  sandboxing: "Sandboxing",
  data_residency: "Data residency",
  sensitivity_tagging: "Sensitivity tagging",
};

export const PLATFORM_EQUIVALENTS: Partial<Record<Platform, string>> = {
  gemini: "Gems",
  mistral: "Mistral Agents",
  copilot: "Copilot Studio",
};

export function formatRungList(rungs: number[]): string {
  return rungs.length ? `Rungs ${rungs.join(", ")}` : "No rungs available";
}

export function formatDateForFilename(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function formatPromptValue(value?: "yes" | "no" | "maybe"): string {
  if (!value) return "Not recorded";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

