import { capabilityMatrix } from "./capabilityMatrix";

export const crossPlatformReference = {
  title: "Cross-Platform AI Capability Reference",
  subtitle:
    "The 10-rung automation ladder across ChatGPT, Claude, Gemini, Mistral, and Microsoft Copilot",
  introText: `This reference shows which rungs of the M03 Automation Ladder are available on each major AI platform as of ${capabilityMatrix.lastVerified}. Use it when choosing tools, planning upgrades, or deciding which platform your team should standardise on.`,
  notes: [
    "Productised concepts (Custom GPTs, Gems, Mistral Agents, Copilot Studio) are covered in M04, not M03.",
    "This capability matrix changes frequently as platforms ship new features. HOI reviews and updates the matrix quarterly.",
    "Where a rung is marked not available, it means the capability is not exposed in that platform's chat/work surface for M03 scope.",
  ],
  generatedNote:
    "Generated as part of your M03 Automation Playbook. The full matrix is available in the M03 module page on the HOI platform.",
};

