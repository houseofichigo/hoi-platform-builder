import type { SkillSpec } from "./m03Schema";

export const competitorPricingMonitorSkill: SkillSpec = {
  name: "Competitor Pricing Monitor",
  description:
    "Use when the user asks to compare competitor pricing, update a pricing tracker, or summarize market positioning changes. Applies a structured Prompt Contract with grounded sources, citations, and explicit uncertainty handling.",
  triggers: [
    "compare competitor pricing",
    "update pricing tracker",
    "check competitor pricing pages",
    "summarize pricing changes",
    "competitive pricing review",
  ],
  instructions: `# Competitor Pricing Monitor

## When to use
Use this Skill when the user asks to compare competitor pricing, update a pricing tracker, check competitor pricing pages, or summarize pricing changes.

## When not to use
- The user is asking about internal pricing strategy.
- The user wants pricing that requires login, gated access, or contacting sales.
- The user is asking for a one-off market research synthesis that should use Deep Research instead.

## Method
1. Confirm the competitor list. If it is not provided, ask for it before proceeding.
2. Use only official competitor pricing pages or approved source files.
3. Do not use forums, blog posts, third-party comparison sites, or aggregators as price evidence.
4. For each competitor and plan, extract plan name, monthly price, annual price if listed, key features, limits, disclaimers, source URL, and last checked date.
5. Return a structured table with one row per plan.
6. If pricing requires login or is hidden behind "Contact sales", mark the row "Not publicly available" and do not infer the price.
7. If two approved sources disagree, surface both with timestamps instead of choosing silently.
8. If a previous tracker is supplied, add a "Changes since last check" section.

## Quality bar
- Every price has a source URL.
- Every claim has an access date.
- Missing prices are marked "Not publicly available".
- Claims older than 30 days are flagged.
- Source conflicts are surfaced, not hidden.

## Safety constraints
- Never sign up for a competitor product.
- Never submit forms, request demos, contact sales, or create accounts.
- Never bypass paywalls, login screens, robots restrictions, or access controls.
- Do not visit pages beyond public pricing and plan information unless the user approves.
- Flag compliance considerations if the user operates in a regulated sector.`,
  qualityBar: [
    "Every price has a source URL",
    "Every claim has an access date",
    "Missing prices are marked 'Not publicly available'",
    "Claims older than 30 days are flagged",
    "Source conflicts are surfaced, not hidden",
  ],
  safetyConstraints: [
    "Never sign up for competitor products",
    "Never submit forms or contact sales",
    "Never bypass access controls",
    "Do not visit pages beyond public pricing and plan information without approval",
    "Flag regulatory compliance considerations",
  ],
  whenNotToUse: [
    "Internal pricing strategy questions",
    "Pricing that requires login or sales contact",
    "One-off market research synthesis that belongs in Deep Research",
  ],
};

export function skillToClaudeMarkdown(skill: SkillSpec): string {
  return `---
name: ${skill.name}
description: ${skill.description}
---

${skill.instructions}
`;
}

export function skillToChatGPTFormat(skill: SkillSpec): string {
  return `# ${skill.name}

**Description:** ${skill.description}

**Triggers:** ${skill.triggers.join(", ")}

${skill.instructions}
`;
}

export const skillCreationMetaPrompt = `Take the Prompt Contract below and convert it into a reusable Skill specification. Output exactly this structure:

1. SKILL NAME: short, descriptive (2-4 words)
2. DESCRIPTION: 1-2 sentences explaining when this Skill should trigger
3. TRIGGERS: 3-5 phrases that should activate this Skill
4. INSTRUCTIONS: the core method, written as direct instructions to a future AI assistant
5. QUALITY BAR: the verification checks before responding
6. SAFETY CONSTRAINTS: what the AI must never do under this Skill
7. WHEN NOT TO USE: situations where this Skill should not activate

Format the output as valid markdown that could be saved as a SKILL.md file. Do not omit any of the seven sections.

PROMPT CONTRACT TO CONVERT:
{{PROMPT_CONTRACT}}`;
