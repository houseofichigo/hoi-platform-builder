import type { SkillSpec } from "./m03Schema";

export const promptImproverSkill: SkillSpec = {
  name: "Prompt Improver",
  description:
    "Use when the user has a rough prompt, recurring task instruction, or draft Prompt Contract and wants it rewritten into a clearer, safer, more reusable prompt. The Skill improves the prompt without changing the user's intent.",
  triggers: [
    "improve this prompt",
    "make this prompt better",
    "turn this into a prompt contract",
    "rewrite my prompt for work",
    "create a reusable prompt",
  ],
  instructions: `# Prompt Improver

## When to use
Use this Skill when the user gives a rough prompt, a recurring task instruction, or a draft Prompt Contract and wants a clearer prompt they can reuse. The goal is to preserve the user's intent while adding structure, boundaries, examples, and quality checks.

## When not to use
- The user is asking you to complete the underlying task instead of improving the prompt.
- The request needs fresh research before the prompt can be written.
- The task involves regulated, legal, medical, financial, HR, or safety-sensitive decisions and the user has not named the required reviewer or evidence source.
- The user wants an autonomous action, connector write, purchase, message send, or external submission.

## Method
1. Identify the intended task, audience, source material, output format, and decision the prompt should support.
2. If the user's intent is ambiguous, ask up to three clarifying questions before rewriting.
3. Rewrite the prompt as a Prompt Contract with these sections: Goal, Context, Inputs, Rules, Output Contract, Quality Bar, and Examples.
4. Make source rules explicit: what the AI may use, what it must not use, and how to label missing evidence.
5. Add safety boundaries and escalation rules for sensitive, external, or irreversible work.
6. Include variables in braces for details the user should replace, such as {audience}, {source}, {deadline}, or {format}.
7. Return the improved prompt first, then a short note explaining the highest-impact changes.

## Quality bar
- The improved prompt has a clear goal and audience.
- Required inputs are named.
- Source rules and forbidden sources are explicit.
- The output format is concrete enough to verify.
- The prompt includes checks for missing, stale, or conflicting information.
- The wording is reusable by another team member without extra explanation.

## Safety constraints
- Do not invent facts, policies, citations, or source material to make the prompt look complete.
- Do not remove human review gates for high-stakes decisions.
- Do not turn a read-only prompt into an action-taking prompt unless the user explicitly asks.
- Do not include hidden chain-of-thought requirements.
- Do not optimize for persuasion when the task requires neutral analysis.

## Example
User's rough prompt:
"Summarize these customer emails and tell me what to do."

Improved prompt:
"Goal: Summarize customer emails so the support lead can decide next actions.

Context: Use only the emails provided in this conversation or the connected inbox thread I name. Do not infer customer intent from missing messages.

Inputs: {email thread or file}, {product area}, {support policy}, {response deadline}.

Rules:
- Identify each customer request separately.
- Quote or cite the source email for every claim.
- Flag missing order IDs, unclear dates, or policy gaps.
- Do not draft an external reply unless I ask.

Output Contract:
Return a table with Customer, Request, Evidence, Urgency, Suggested next action, Owner, and Open question.

Quality Bar:
Every next action must map to a cited email or named policy. If the evidence is unclear, write 'Needs human review.'"
`,
  qualityBar: [
    "The improved prompt has a clear goal and audience",
    "Required inputs are named",
    "Source rules and forbidden sources are explicit",
    "The output format is concrete enough to verify",
    "The prompt includes checks for missing, stale, or conflicting information",
    "The wording is reusable by another team member",
  ],
  safetyConstraints: [
    "Do not invent facts, policies, citations, or source material",
    "Do not remove human review gates for high-stakes decisions",
    "Do not turn read-only work into action-taking work without explicit approval",
    "Do not include hidden chain-of-thought requirements",
    "Do not optimize for persuasion when neutral analysis is required",
  ],
  whenNotToUse: [
    "The user wants the underlying task completed, not the prompt improved",
    "Fresh research is needed before the prompt can be written",
    "A high-stakes task lacks named reviewer or evidence rules",
    "The user wants an autonomous external action",
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

export const genericSkillCreationMetaPrompt = `You are helping me turn a good prompt into a reusable AI Skill.

First, read the prompt or Prompt Contract I provide. Then write a Skill specification that another AI assistant could load automatically when the task matches.

Output exactly these sections:

1. SKILL NAME
Short, specific, and action-oriented.

2. DESCRIPTION
Explain when the Skill should trigger and what outcome it helps produce.

3. TRIGGERS
List 5 natural phrases a user might say that should activate this Skill.

4. WHEN TO USE
Name the recurring task types where this Skill is appropriate.

5. WHEN NOT TO USE
Name tasks where the Skill should not activate, including one-off exploration, tasks needing fresh research, unclear ownership, or actions requiring approval.

6. INSTRUCTIONS
Write direct instructions for the future AI assistant. Include goal, inputs, method, output format, source rules, and escalation rules.

7. QUALITY BAR
List concrete checks the assistant must pass before responding.

8. SAFETY CONSTRAINTS
List what the assistant must never do under this Skill.

Use clear markdown. Do not complete the underlying task. Build the Skill only.

PROMPT OR PROMPT CONTRACT TO CONVERT:
[paste the prompt here]`;

// Backwards-compatible alias for older saved M03 data and imports.
export const competitorPricingMonitorSkill = promptImproverSkill;
