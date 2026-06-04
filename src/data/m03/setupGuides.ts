export type SetupGuide = {
  platformName: string;
  title: string;
  sections: { heading: string; body: string }[];
};

export const setupGuides: Record<string, SetupGuide> = {
  chatgpt: {
    platformName: "ChatGPT",
    title: "How to install your Competitor Pricing Monitor Skill in ChatGPT",
    sections: [
      {
        heading: "Step 1 - Open the Skills interface",
        body: "In ChatGPT, open the profile or workspace menu and look for Skills. If Skills is not visible, verify your plan and workspace settings because ChatGPT Skills are plan-gated.",
      },
      {
        heading: "Step 2 - Create a new Skill",
        body: "Create a new Skill and prepare the fields for name, description, triggers, and instructions.",
      },
      {
        heading: "Step 3 - Paste the Skill content",
        body: "Open skill.md from your companion bundle. Copy the name, description, triggers, and instruction body into the corresponding Skill fields.",
      },
      {
        heading: "Step 4 - Save and enable",
        body: "Save the Skill, then enable it for yourself or your workspace according to your plan permissions.",
      },
      {
        heading: "Step 5 - Test it",
        body: "Open a new chat and type: 'Compare competitor pricing for [your list].' Confirm that the Skill applies the Prompt Contract and quality bar.",
      },
    ],
  },
  claude: {
    platformName: "Claude",
    title: "How to install your Competitor Pricing Monitor Skill in Claude",
    sections: [
      {
        heading: "Step 1 - Open Claude Skills",
        body: "In Claude, open Settings and navigate to Skills. Skills may be managed at the user or workspace level depending on your plan.",
      },
      {
        heading: "Step 2 - Add the Skill",
        body: "Add a Skill package that includes the SKILL.md file from your companion bundle.",
      },
      {
        heading: "Step 3 - Confirm metadata",
        body: "Claude reads the Skill metadata from the markdown file. Confirm the name and description are correct.",
      },
      {
        heading: "Step 4 - Enable the Skill",
        body: "Enable the Skill so it can trigger in new conversations.",
      },
      {
        heading: "Step 5 - Test it",
        body: "Open a new conversation and ask Claude to update a competitor pricing tracker. Confirm that the Skill applies the source and safety constraints.",
      },
    ],
  },
  mistral: {
    platformName: "Mistral / Vibe",
    title: "How to install your Competitor Pricing Monitor Skill in Mistral Vibe",
    sections: [
      {
        heading: "Step 1 - Open Vibe Work",
        body: "Open Mistral Vibe or Work from chat.mistral.ai. Skill availability may depend on workspace and plan settings.",
      },
      {
        heading: "Step 2 - Create a Skill",
        body: "Create a new Skill and paste the Skill method, trigger phrases, quality bar, and safety constraints.",
      },
      {
        heading: "Step 3 - Attach references if allowed",
        body: "If your workspace supports Skill reference files, attach the approved competitor list or pricing tracker template.",
      },
      {
        heading: "Step 4 - Test activation",
        body: "Ask for a competitive pricing review and confirm the Skill activates only for the intended task.",
      },
    ],
  },
};

