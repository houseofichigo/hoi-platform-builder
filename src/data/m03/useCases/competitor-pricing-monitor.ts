import type { PlatformRungVariant, RungSpec, UseCaseBlueprint } from "../m03Schema";
import { promptImproverSkill, skillToChatGPTFormat } from "../skillTemplate";

const promptContractArtifact = `GOAL
Compare the pricing pages of selected competitors and extract plan names, prices, limits, target segment, notable disclaimers, and source URLs.

CONTEXT
This will be used by the sales and strategy team to understand market positioning. Use only official pricing pages or approved source files.

RULES
- Do not invent missing prices.
- Do not use forums, blog posts, third-party comparison sites, or unsourced claims.
- Flag unclear or unavailable pricing.
- Return source URL and access date for every claim.
- If a competitor's pricing requires login, mark "Not publicly available".

OUTPUT CONTRACT
Return a table with these columns:
- Competitor name
- Plan name
- Monthly price
- Annual price
- Included features (key 3-5)
- Limits
- Disclaimers
- Source URL
- Last checked date
- Confidence (High/Medium/Low)

QUALITY BAR
- Every price must have a source URL.
- Missing prices must be marked "Not publicly available".
- Claims older than 30 days must be flagged.
- If two sources disagree, surface both with timestamps.

EXAMPLES
Include one example row for a competitor with transparent public pricing and one for a competitor with hidden enterprise pricing.`;

const reusablePromptArtifact = `PROMPT TITLE: Competitor Pricing Monitor
PURPOSE: Track public competitor pricing and summarize changes.
WHEN TO USE: Monthly or weekly competitive pricing review.
WHEN NOT TO USE: Pricing requires login, scraping protected content, bypassing access controls, or contacting sales.

INPUTS REQUIRED
- {competitors}: list of competitor names
- {competitor_urls}: official pricing page URLs
- {previous_tracker}: previous tracker version, if available
- {market}: target market or region
- {currency}: preferred output currency
- {output_format}: default table
- {review_period}: default monthly

PROMPT TEMPLATE
Compare the current public pricing pages for {competitors} in {market}. Use only official pricing pages listed in {competitor_urls} or approved source files. Extract plan names, monthly prices, annual prices, included features, limits, disclaimers, source URL, last checked date, and confidence.

If {previous_tracker} is provided, compare current findings with the previous tracker and add a change log. If a price requires login or sales contact, mark it "Not publicly available" and do not infer from third-party sites. Return the answer as {output_format}. Use {currency} where conversion is appropriate, and cite the original source currency.

QUALITY CHECKS
- Every price has a source URL and access date.
- Missing prices are marked "Not publicly available".
- Claims older than 30 days are flagged.
- Source conflicts are surfaced with timestamps.

OWNER: Strategy / Sales Ops
VERSION: 0.1`;

const promptPlusFileArtifact = `Summarize the attached meeting notes and extract the actions the team needs to follow up on.

Use only the attached file. Do not infer decisions that are not written in the notes.

Return a table with:
- Action item
- Owner
- Due date
- Source quote or note section
- Confidence
- Open question

If an owner or due date is missing, write "Needs confirmation" instead of guessing.`;

const connectorArtifact = `Use my Gmail connector to review emails from the last 7 days with the label or search query: {label_or_search_query}.

Goal: identify messages that need a reply, a follow-up, or human review.

Rules:
- Read only Gmail messages matching the label or query I provide.
- Do not send, draft, archive, delete, label, forward, or mark messages read.
- Cite the email subject, sender, and date for every recommendation.
- If the message contains sensitive HR, legal, medical, financial, or security content, mark "Human review required".

Return:
- Priority
- Sender
- Subject
- Why it matters
- Recommended next action
- Evidence from the email
- Human review flag`;

const searchArtifact = `Use web search to find the current official policy or regulation page for: {policy_or_requirement}.

Use only primary or official sources such as government, regulator, standards body, or the organization's own policy page. Do not rely on blogs, summaries, forum posts, or vendor explainers as authority.

Return:
- Current rule or requirement
- Official source URL
- Last updated date if visible
- Who it applies to
- What changed or what must be checked
- Confidence
- Follow-up question for a human owner

If official sources conflict, show both and explain the conflict.`;

const deepResearchArtifact = `Produce a vendor landscape brief for {tool_category} for a team deciding whether to shortlist vendors.

Include:
1. The main vendor categories in this market
2. 6-8 representative vendors
3. Common buying criteria
4. Differentiators and tradeoffs
5. Risks, lock-in considerations, and data/security concerns
6. A shortlist recommendation for three different buyer profiles

For every claim, cite sources. Separate direct evidence from inference. Surface source conflicts and missing information.`;

const agentModeArtifact = `Use agent mode to perform a read-only QA walkthrough of this sandbox or demo website: {sandbox_url}.

Goal: identify broken navigation, unclear labels, obvious layout issues, and missing expected information.

CONSTRAINTS
- Stay on the sandbox/demo site I provide.
- Do not sign in, create accounts, submit forms, purchase anything, send messages, or trigger external actions.
- Do not click ads, payment links, social share buttons, or contact links.
- If a page asks for personal data or credentials, stop and report it.
- Take screenshots or capture URLs where the platform supports it.
- Ask for confirmation before any click that could change data or be visible externally.

Return:
- Page or URL
- Issue observed
- Evidence
- Severity
- Suggested fix
- Whether human review is required`;

const scheduledPromptArtifact = `Every Friday at 4:00 PM, prepare a weekly team digest for {team_name}.

Use only the sources I explicitly connect or provide for this scheduled prompt, such as a calendar, project board, or weekly notes document.

Return:
1. Completed work
2. Blocked items
3. Decisions needed
4. Upcoming deadlines
5. People who need follow-up
6. Suggested Monday priorities

QUALITY CHECKS
- Cite the source for every item.
- Do not create tasks, send messages, or edit calendars.
- If a source is unavailable, write "Source unavailable" and continue.
- Flag anything sensitive or unclear for human review.`;

const chatgptFile: PlatformRungVariant = {
  whereToFindIt: "Click the paperclip or plus icon next to the message input.",
  stepByStepInstructions: [
    "Open ChatGPT in your browser.",
    "Attach a meeting notes file or a short sample notes document.",
    "Paste the Prompt + File artifact.",
    "Run the prompt and review the action table.",
  ],
  expectedOutcome:
    "ChatGPT uses the file as grounded context and returns action items with owners, evidence, and missing-detail flags.",
  tipsAndCautions: [
    "Check workspace data settings before uploading sensitive notes.",
    "Ask for source quotes when the output will drive team follow-up.",
  ],
};

const claudeFile: PlatformRungVariant = {
  whereToFindIt: "Click the attachment icon or drag the file into the conversation.",
  stepByStepInstructions: [
    "Open Claude.",
    "Attach a meeting notes file or a short sample notes document.",
    "Paste the Prompt + File artifact.",
    "Ask Claude to return only actions grounded in the file.",
  ],
  expectedOutcome:
    "Claude analyzes the notes and returns a grounded action list with uncertainty where details are missing.",
  tipsAndCautions: [
    "For long notes, upload the relevant section first.",
    "Ask for evidence instead of accepting a summary alone.",
  ],
};

const geminiFile: PlatformRungVariant = {
  whereToFindIt: "Use the upload or add-files control in Gemini.",
  stepByStepInstructions: [
    "Open Gemini.",
    "Upload meeting notes or add them from Drive if your account supports it.",
    "Paste the Prompt + File artifact.",
    "Review the resulting action table and source handling.",
  ],
  expectedOutcome: "Gemini analyzes the notes and returns a structured follow-up summary.",
  tipsAndCautions: [
    "Workspace admins may control which apps and uploads are available.",
    "Confirm whether Gemini is using the uploaded file, Drive, or general knowledge.",
  ],
};

const mistralFile: PlatformRungVariant = {
  whereToFindIt: "Use the file upload option in Mistral/Vibe chat.",
  stepByStepInstructions: [
    "Open Mistral/Vibe.",
    "Attach a meeting notes file or a short sample notes document.",
    "Paste the Prompt + File artifact.",
    "Ask for an action list with confidence and source fields.",
  ],
  expectedOutcome: "Mistral/Vibe uses the uploaded file as context and returns a follow-up plan.",
  tipsAndCautions: [
    "Use descriptive filenames so the AI can reference the right file clearly.",
    "For notes, ask for source quotes rather than prose-only summaries.",
  ],
};

const copilotFile: PlatformRungVariant = {
  whereToFindIt: "Use Add content in Microsoft Copilot or reference a OneDrive file.",
  stepByStepInstructions: [
    "Open Microsoft Copilot or Microsoft 365 Copilot Chat.",
    "Upload meeting notes or reference a OneDrive/Teams notes file.",
    "Paste the Prompt + File artifact.",
    "Review citations, file references, and missing-detail flags.",
  ],
  expectedOutcome:
    "Copilot analyzes the file or referenced Microsoft 365 content and returns a structured action list.",
  tipsAndCautions: [
    "Local file paths are not enough in Microsoft 365 Copilot; use uploaded or cloud-hosted files.",
    "Work and school accounts may have different file rules from consumer Copilot.",
  ],
};

const rungs: RungSpec[] = [
  {
    rungNumber: 1,
    rungName: "Vague Prompt",
    capability: "A direct natural-language request with no structure.",
    whyItMatters:
      "Most workplace AI use starts here. It feels fast, but the model has to guess the competitors, source rules, freshness needs, and output shape.",
    whatToNotice:
      "Vague intent produces vague output. There is no source discipline, no consistent structure, and no audit trail.",
    conceptDefinition:
      "A vague prompt is a broad request stated in ordinary language, without constraints, examples, source rules, or success criteria. It is useful for exploration but weak for repeatable business work.",
    failureMode:
      "The AI may hallucinate competitors, invent prices, mix current and outdated information, or produce a response nobody can defend.",
    governanceWeight: 1,
    promptOrArtifact: "Check our competitors' pricing.",
    platformVariants: {
      chatgpt: {
        whereToFindIt: "Type directly into ChatGPT.",
        stepByStepInstructions: ["Open ChatGPT.", "Paste the vague prompt.", "Run it once and observe what is missing."],
        expectedOutcome: "A plausible answer that may lack source rules, competitor scope, and structured fields.",
      },
      claude: {
        whereToFindIt: "Type directly into Claude.",
        stepByStepInstructions: ["Open Claude.", "Paste the vague prompt.", "Run it once and observe what Claude asks or assumes."],
        expectedOutcome: "Claude may ask clarifying questions or produce a general answer without enough operational structure.",
      },
      gemini: {
        whereToFindIt: "Type directly into Gemini.",
        stepByStepInstructions: ["Open Gemini.", "Paste the vague prompt.", "Run it once and inspect source handling."],
        expectedOutcome: "A general response that may rely on search or broad market knowledge without your business rules.",
      },
      mistral: {
        whereToFindIt: "Type directly into Mistral/Vibe.",
        stepByStepInstructions: ["Open Mistral/Vibe.", "Paste the vague prompt.", "Run it once."],
        expectedOutcome: "A broad answer with limited reuse value.",
      },
      copilot: {
        whereToFindIt: "Type directly into Copilot.",
        stepByStepInstructions: ["Open Copilot.", "Paste the vague prompt.", "Run it once and review citations."],
        expectedOutcome: "A search-grounded or general answer that still lacks your tracker schema and decision rules.",
      },
    },
  },
  {
    rungNumber: 2,
    rungName: "Structured Prompt",
    capability: "A six-part Prompt Contract that constrains the AI response.",
    whyItMatters:
      "Structure is the highest-leverage prompting move. It turns an open request into a governed instruction with sources, rules, output shape, and quality checks.",
    whatToNotice:
      "The same AI becomes more useful because the prompt defines what good looks like.",
    conceptDefinition:
      "A Prompt Contract contains Goal, Context, Rules, Output Contract, Quality Bar, and Examples. Each element removes one kind of ambiguity from the task.",
    failureMode:
      "The AI may follow the visible format while still skipping source quality, missing-data handling, or conflict handling.",
    governanceWeight: 2,
    promptOrArtifact: promptContractArtifact,
    platformVariants: {
      chatgpt: {
        whereToFindIt: "Paste the Prompt Contract into ChatGPT.",
        stepByStepInstructions: ["Copy the Prompt Contract.", "Paste it into ChatGPT.", "Add your competitor list at the top.", "Run and inspect the table."],
        expectedOutcome: "A structured table with source URLs, missing-data flags, and confidence values.",
      },
      claude: {
        whereToFindIt: "Paste the Prompt Contract into Claude.",
        stepByStepInstructions: ["Copy the Prompt Contract.", "Paste it into Claude.", "Add competitor names and URLs.", "Run and compare against the vague result."],
        expectedOutcome: "A structured response that is easier to audit.",
      },
      gemini: {
        whereToFindIt: "Paste the Prompt Contract into Gemini.",
        stepByStepInstructions: ["Copy the Prompt Contract.", "Paste it into Gemini.", "Add competitor names and target market.", "Run and check source citations."],
        expectedOutcome: "A structured, source-aware pricing comparison.",
      },
      mistral: {
        whereToFindIt: "Paste the Prompt Contract into Mistral/Vibe.",
        stepByStepInstructions: ["Copy the Prompt Contract.", "Paste it into Mistral/Vibe.", "Add competitor list and source URLs.", "Run it."],
        expectedOutcome: "A structured output with explicit missing-data handling.",
      },
      copilot: {
        whereToFindIt: "Paste the Prompt Contract into Copilot.",
        stepByStepInstructions: ["Copy the Prompt Contract.", "Paste it into Copilot.", "Add competitor names and URLs.", "Run and review cited sources."],
        expectedOutcome: "A structured comparison grounded in web or Microsoft 365 context.",
      },
    },
  },
  {
    rungNumber: 3,
    rungName: "Reusable Prompt",
    capability: "A Prompt Contract becomes a variable-based team template.",
    whyItMatters:
      "A prompt that worked once is not reusable. Reuse needs variables, owner, version, source rules, and a standard output contract.",
    whatToNotice:
      "Variables make the method portable across teams, markets, and review periods.",
    conceptDefinition:
      "A reusable prompt is a documented template with named inputs, stable output expectations, quality checks, safety boundaries, owner, and version. It belongs in a prompt library.",
    failureMode:
      "Variables may become too vague, too narrow, or undocumented, causing the prompt to decay into another one-off request.",
    governanceWeight: 2,
    promptOrArtifact: reusablePromptArtifact,
    platformVariants: {
      chatgpt: {
        whereToFindIt: "Save in your prompt library, Project, or workspace docs.",
        stepByStepInstructions: ["Copy the reusable prompt.", "Replace the variables.", "Run it in ChatGPT.", "Store the version that worked."],
        expectedOutcome: "A repeatable prompt that can be reused by the same team.",
      },
      claude: {
        whereToFindIt: "Save in a prompt library, Project, or shared document.",
        stepByStepInstructions: ["Copy the reusable prompt.", "Replace variables.", "Run in Claude.", "Record any edits to version 0.2."],
        expectedOutcome: "A reusable method with fewer copy-paste errors.",
      },
      gemini: {
        whereToFindIt: "Save in Google Drive or your team prompt library.",
        stepByStepInstructions: ["Copy the reusable prompt.", "Replace variables.", "Run in Gemini.", "Save the final prompt template."],
        expectedOutcome: "A reusable prompt compatible with Gemini chat.",
      },
      mistral: {
        whereToFindIt: "Save in your Mistral/Vibe workspace or prompt library.",
        stepByStepInstructions: ["Copy the reusable prompt.", "Replace variables.", "Run in Mistral/Vibe.", "Record the owner and version."],
        expectedOutcome: "A reusable team asset.",
      },
      copilot: {
        whereToFindIt: "Save in SharePoint, OneDrive, Loop, or your prompt library.",
        stepByStepInstructions: ["Copy the reusable prompt.", "Replace variables.", "Run in Copilot.", "Store the approved version."],
        expectedOutcome: "A prompt template that fits Microsoft 365 workflows.",
      },
    },
  },
  {
    rungNumber: 4,
    rungName: "Skill",
    capability: "A packaged, named, auto-triggering instruction set.",
    whyItMatters:
      "Skills remove the need to improve the same kind of prompt by hand every time. The improvement method becomes something the AI can load when the task matches.",
    whatToNotice:
      "A Skill is organizational memory. The description and triggers decide when it activates, while the instructions decide how consistently it improves prompts.",
    conceptDefinition:
      "A Skill packages a reusable method as named instructions with triggers, safety constraints, and quality checks. In this example, the Prompt Improver Skill turns rough prompts into stronger Prompt Contracts.",
    failureMode:
      "The Skill triggers on the wrong task, changes the user's intent, removes needed review gates, or writes a polished prompt that still lacks evidence rules.",
    governanceWeight: 3,
    promptOrArtifact: skillToChatGPTFormat(promptImproverSkill),
    platformVariants: {
      chatgpt: {
        whereToFindIt: "Profile menu -> Skills.",
        stepByStepInstructions: [
          "Open the Skills area if it is enabled for your plan.",
          "Create a new Skill.",
          "Paste the Prompt Improver Skill content.",
          "Review any scan or workspace warning.",
          "Save, install, and test with: 'Improve this prompt for a weekly project update.'",
        ],
        expectedOutcome: "ChatGPT can automatically use the Skill when a prompt-improvement request matches.",
        tipsAndCautions: [
          "ChatGPT Skills are plan-gated beta at verification time.",
          "Review generated or imported Skills before enabling them for a team.",
        ],
      },
      claude: {
        whereToFindIt: "Settings -> Skills.",
        stepByStepInstructions: [
          "Create a Skill package with SKILL.md.",
          "Include the Skill name and description in frontmatter.",
          "Paste the Skill body into the markdown file.",
          "Upload or add the Skill in Claude.",
          "Test activation with a rough prompt-improvement request.",
        ],
        expectedOutcome: "Claude can discover and use the Skill when the request matches its description.",
        tipsAndCautions: [
          "The description is critical. It tells Claude when to load the Skill.",
          "Treat third-party Skills as operational instructions that need review.",
        ],
      },
      mistral: {
        whereToFindIt: "Vibe Work -> Skills.",
        stepByStepInstructions: [
          "Open Vibe Work.",
          "Create a new Skill if Skills are enabled for your plan or workspace.",
          "Paste the Prompt Improver method, quality bar, and safety constraints.",
          "Save the Skill.",
          "Test it with a rough prompt that needs a reusable structure.",
        ],
        expectedOutcome: "Vibe Work applies the repeatable method to matching tasks.",
        tipsAndCautions: [
          "Mistral's consumer product naming has shifted from Le Chat to Vibe; confirm your workspace surface.",
          "Keep productised Agents for M04. In M03, focus on the reusable Skill method.",
        ],
      },
    },
  },
  {
    rungNumber: 5,
    rungName: "Prompt + File",
    capability: "The AI uses an uploaded file as grounded context.",
    whyItMatters:
      "Files are the simplest way to ground a prompt in real source material. You do not need connector setup or a full knowledge base.",
    whatToNotice:
      "The file reduces hallucination risk, but creates new questions about freshness, size, sensitivity, and permissions.",
    conceptDefinition:
      "Prompt + File means attaching a document or spreadsheet so the AI can use it as evidence for the current conversation.",
    failureMode:
      "The AI may use an outdated file, miss content in a large file, or expose sensitive information to a tool that should not receive it.",
    governanceWeight: 3,
    promptOrArtifact: promptPlusFileArtifact,
    platformVariants: {
      chatgpt: chatgptFile,
      claude: claudeFile,
      gemini: geminiFile,
      mistral: mistralFile,
      copilot: copilotFile,
    },
  },
  {
    rungNumber: 6,
    rungName: "Prompt + Connector",
    capability: "The AI reads from connected workspace tools or live data sources.",
    whyItMatters:
      "Connectors remove the repeated upload step. They let AI work where the data already lives.",
    whatToNotice:
      "Connectors increase usefulness and risk at the same time. Access governance becomes part of prompt quality.",
    conceptDefinition:
      "Prompt + Connector means the AI can retrieve data from approved apps such as Gmail, Drive, SharePoint, Notion, Slack, or other workspace systems.",
    failureMode:
      "The AI may access too much, select the wrong messages, expose sensitive content, or attempt a write action without proper approval.",
    governanceWeight: 4,
    promptOrArtifact: connectorArtifact,
    platformVariants: {
      chatgpt: {
        whereToFindIt: "Apps or connectors in ChatGPT settings and tools.",
        stepByStepInstructions: [
          "Enable the Gmail app or connector if your plan and workspace allow it.",
          "Confirm the Gmail scope is read-only for this exercise.",
          "Name the label or search query to inspect.",
          "Paste the connector artifact.",
          "Approve only read actions.",
        ],
        expectedOutcome: "ChatGPT retrieves matching Gmail messages and returns a triage table.",
        tipsAndCautions: [
          "OpenAI now uses the term apps for many connector experiences.",
          "Deep Research may use connected apps read-only; agent mode has separate controls.",
        ],
      },
      claude: {
        whereToFindIt: "Settings -> Connectors, Integrations, or the plus menu in chat.",
        stepByStepInstructions: [
          "Enable Gmail if it is available in your workspace connector list.",
          "Authenticate the source with the narrowest practical scope.",
          "Confirm whether the connector is native, remote MCP, or workspace-managed.",
          "Paste the connector artifact.",
          "Review any approval request before allowing access.",
        ],
        expectedOutcome: "Claude retrieves approved email context and returns a structured triage summary.",
        tipsAndCautions: [
          "Research may invoke connected tools during investigation.",
          "Disable connector tools that can write when you only need read access.",
        ],
      },
      gemini: {
        whereToFindIt: "Google Workspace apps in Gemini.",
        stepByStepInstructions: [
          "Sign in with the Google account that has access to the Gmail messages.",
          "Make sure Workspace apps are enabled by the administrator if this is a work account.",
          "Reference Gmail and the label or search query explicitly.",
          "Paste the connector artifact.",
          "Check which email sources Gemini used before relying on the answer.",
        ],
        expectedOutcome: "Gemini reads from Gmail or Google Workspace context and returns a sourced triage table.",
        tipsAndCautions: [
          "Workspace app availability varies by account type, edition, location, language, and admin settings.",
          "Ask Gemini to show source references for every recommendation.",
        ],
      },
      mistral: {
        whereToFindIt: "Vibe Work or Le Chat -> Connectors.",
        stepByStepInstructions: [
          "Open the Connectors area.",
          "Connect Gmail if it is available for your workspace.",
          "Enable the connector in the task or conversation.",
          "Paste the connector artifact.",
          "Approve sensitive connector actions only after review.",
        ],
        expectedOutcome: "Mistral/Vibe retrieves email context through connected tools and returns a governed triage summary.",
        tipsAndCautions: [
          "Knowledge connectors may index files; regular connectors may fetch data in real time.",
          "Review per-function permissions before pre-authorizing actions.",
        ],
      },
      copilot: {
        whereToFindIt: "Microsoft 365 Copilot Chat, Copilot Search, or admin-enabled connectors.",
        stepByStepInstructions: [
          "Sign in with the Microsoft 365 account that has access to the source.",
          "Use Outlook as the Microsoft 365 equivalent if Gmail is not connected.",
          "Reference the mailbox folder, sender, or search query.",
          "Paste the connector artifact.",
          "Check citations and permission-filtered sources.",
          "Escalate Gmail connector setup to an admin if the source is outside Microsoft 365.",
        ],
        expectedOutcome: "Copilot retrieves mailbox or connector-indexed content and returns cited triage results.",
        tipsAndCautions: [
          "Microsoft 365 Copilot connectors are often admin-configured.",
          "Connector content respects source permissions, but poor source ownership still creates risk.",
        ],
      },
    },
  },
  {
    rungNumber: 7,
    rungName: "Prompt + Search",
    capability: "The AI searches the web for current information before responding.",
    whyItMatters:
      "Search handles freshness. Policies, regulations, and public requirements can change, while training data is not a live source.",
    whatToNotice:
      "Search introduces source quality questions: which domains count, how recent is recent enough, and what happens when sources conflict.",
    conceptDefinition:
      "Prompt + Search asks the AI to retrieve current web information and cite sources before answering.",
    failureMode:
      "The AI may use third-party summaries, stale pages, forum posts, or conflicting search results without explaining the conflict.",
    governanceWeight: 3,
    promptOrArtifact: searchArtifact,
    platformVariants: {
      chatgpt: {
        whereToFindIt: "Select Search or type /search.",
        stepByStepInstructions: ["Turn on Search.", "Paste the search artifact.", "Run it.", "Open and check the cited official sources."],
        expectedOutcome: "ChatGPT returns current web-sourced results with links.",
      },
      claude: {
        whereToFindIt: "Enable web search from the tools/search control.",
        stepByStepInstructions: ["Turn on web search.", "Paste the search artifact.", "Run it.", "Review citations and unsupported claims."],
        expectedOutcome: "Claude returns cited web findings.",
      },
      gemini: {
        whereToFindIt: "Search is built into Gemini responses.",
        stepByStepInstructions: ["Paste the search artifact.", "Run it.", "Use source chips or links to verify official pages."],
        expectedOutcome: "Gemini returns Google-grounded results and source references where available.",
      },
      mistral: {
        whereToFindIt: "Enable web search or web access.",
        stepByStepInstructions: ["Turn on web access.", "Paste the search artifact.", "Run it.", "Review official URLs and dates."],
        expectedOutcome: "Mistral/Vibe returns web-sourced findings.",
      },
      copilot: {
        whereToFindIt: "Web search is built into Copilot.",
        stepByStepInstructions: ["Paste the search artifact.", "Run it.", "Check Bing-backed citations and official source URLs."],
        expectedOutcome: "Copilot returns current web results with citations.",
      },
    },
  },
  {
    rungNumber: 8,
    rungName: "Prompt + Deep Research",
    capability: "The AI runs an extended research process and produces a sourced report.",
    whyItMatters:
      "Deep Research is for synthesis, not quick lookup. It turns scattered vendor information into a defensible landscape brief.",
    whatToNotice:
      "The artifact changes from a table to a report. That means review criteria change too.",
    conceptDefinition:
      "Deep Research is a multi-step research mode that searches, reads, evaluates, and synthesizes many sources into a structured report with citations.",
    failureMode:
      "Teams treat a long report as automatically authoritative, or use Deep Research when a short search would be faster and cheaper.",
    governanceWeight: 4,
    promptOrArtifact: deepResearchArtifact,
    platformVariants: {
      chatgpt: {
        whereToFindIt: "Select Deep Research from ChatGPT tools.",
        stepByStepInstructions: [
          "Choose Deep Research.",
          "Paste the deep research artifact.",
          "Review the proposed plan before research starts.",
          "Wait for the report.",
          "Check the sources-used section before acting on recommendations.",
        ],
        expectedOutcome: "A structured vendor landscape brief with citations and a research trail.",
        tipsAndCautions: [
          "Deep Research usage varies by plan and geography.",
          "Use Search for quick facts and Deep Research for defensible synthesis.",
        ],
      },
      claude: {
        whereToFindIt: "Select Research mode.",
        stepByStepInstructions: [
          "Turn on Research.",
          "Paste the deep research artifact.",
          "Let Claude investigate web and connected context where enabled.",
          "Review citations, gaps, and assumptions.",
        ],
        expectedOutcome: "A multi-source research brief with citations.",
        tipsAndCautions: [
          "Research requires web search to function.",
          "Research can consume message limits faster than standard conversation.",
        ],
      },
      gemini: {
        whereToFindIt: "Select Deep Research in Gemini tools.",
        stepByStepInstructions: [
          "Choose Deep Research.",
          "Paste the deep research artifact.",
          "Select or review sources if the option is available.",
          "Wait for the report.",
          "Review sources and unsupported inferences.",
        ],
        expectedOutcome: "A Gemini Deep Research report with sourced findings.",
        tipsAndCautions: [
          "Availability and limits vary by plan.",
          "Some source-selection features may roll out gradually by device and region.",
        ],
      },
      mistral: {
        whereToFindIt: "Toggle Research mode in Mistral/Vibe.",
        stepByStepInstructions: [
          "Activate Research or Deep Research.",
          "Paste the deep research artifact.",
          "Review the proposed research plan.",
          "Start the research and inspect the final citations.",
        ],
        expectedOutcome: "A multi-step public-web research report with citations.",
        tipsAndCautions: [
          "Mistral marks Deep Research as beta at verification time.",
          "Keep quick policy lookups on the Search rung.",
        ],
      },
      copilot: {
        whereToFindIt: "Select Deep Research or Researcher in Copilot.",
        stepByStepInstructions: [
          "Open Copilot or Microsoft 365 Copilot.",
          "Choose Deep Research or the Researcher agent if your plan includes it.",
          "Paste the deep research artifact.",
          "Review the report and source list.",
        ],
        expectedOutcome: "A structured research report grounded in web and, where licensed, work content.",
        tipsAndCautions: [
          "Microsoft distinguishes consumer Copilot Deep Research from Microsoft 365 Copilot Researcher.",
          "License and admin settings affect availability.",
        ],
      },
    },
  },
  {
    rungNumber: 9,
    rungName: "Agent Mode",
    capability: "The AI can take supervised actions in a browser or computer-use environment.",
    whyItMatters:
      "This is where AI starts acting like a worker. It can navigate and perform steps, so human gates become essential.",
    whatToNotice:
      "The decision not to use agent mode is often the right decision. The safety frame matters more than the novelty.",
    conceptDefinition:
      "Agent mode gives AI a supervised execution environment where it can navigate websites, interact with interfaces, and complete multi-step tasks with user control points.",
    failureMode:
      "Prompt injection from visited pages, accidental form submission, access-policy violations, scraping concerns, or unverified agent output.",
    governanceWeight: 5,
    promptOrArtifact: agentModeArtifact,
    platformVariants: {
      chatgpt: {
        whereToFindIt: "Select Agent mode or type /agent.",
        stepByStepInstructions: [
          "Start Agent mode.",
          "Use a sandbox or demo website for the first run.",
          "Paste the agent artifact.",
          "Watch the browser steps.",
          "Interrupt if the agent approaches sign-in, forms, payment, contact, or external actions.",
        ],
        expectedOutcome: "ChatGPT agent performs a read-only QA walkthrough and pauses for confirmations when needed.",
        tipsAndCautions: [
          "Agent mode is available only on eligible paid plans.",
          "Operator functionality is integrated into ChatGPT agent mode.",
          "Do not allow sign-ups, forms, purchases, messages, or external contact.",
          "Use screenshots and source links for verification.",
        ],
      },
      gemini: {
        whereToFindIt: "Gemini Agent in Gemini Apps Labs where available.",
        stepByStepInstructions: [
          "Confirm your account meets Gemini Agent requirements.",
          "Start Gemini Agent.",
          "Use a sandbox URL first.",
          "Paste the agent artifact.",
          "Take control if the browser approaches any gated, form, payment, or external action.",
        ],
        expectedOutcome: "Gemini Agent can perform supervised multi-step browser tasks where the feature is available.",
        tipsAndCautions: [
          "At verification time, Gemini Agent is limited to personal Google AI Ultra, US, English, and is not available for work/school accounts.",
          "Use this rung as landscape awareness if your business account cannot access it.",
        ],
      },
      copilot: {
        whereToFindIt: "Researcher with Computer Use in Microsoft 365 Copilot where enabled.",
        stepByStepInstructions: [
          "Open Microsoft 365 Copilot.",
          "Open Researcher if your license and administrator allow it.",
          "Select Computer Use if the Frontier feature is enabled.",
          "Use a sandbox or demo page first.",
          "Review every confirmation request before allowing action.",
        ],
        expectedOutcome: "Researcher can interact with websites and tools in a supervised virtual environment.",
        tipsAndCautions: [
          "This is a Frontier/admin-enabled capability at verification time.",
          "It is not the same as Copilot Studio, which belongs in M04.",
          "Keep the first run read-only and sandboxed.",
        ],
      },
    },
  },
  {
    rungNumber: 10,
    rungName: "Scheduled Prompt",
    capability: "The AI runs a prompt at a future time or recurring cadence.",
    whyItMatters:
      "This is lightweight automation. The workflow runs whether someone remembers it or not.",
    whatToNotice:
      "Scheduling changes accountability. Outputs now push to the team, so review routines matter.",
    conceptDefinition:
      "A scheduled prompt is a saved prompt that runs later or repeatedly and notifies the user when complete.",
    failureMode:
      "The schedule runs forever without review, pages change silently, outputs pile up unread, or the prompt keeps using stale assumptions.",
    governanceWeight: 4,
    promptOrArtifact: scheduledPromptArtifact,
    platformVariants: {
      chatgpt: {
        whereToFindIt: "Tasks in ChatGPT.",
        stepByStepInstructions: [
          "Create a new task from the prompt or use the task scheduling control.",
          "Paste the scheduled prompt artifact.",
          "Set Friday at 4:00 PM or your preferred cadence.",
          "Confirm notification settings.",
          "Review the first run manually.",
        ],
        expectedOutcome: "ChatGPT runs the prompt on schedule and notifies you when the response is ready.",
        tipsAndCautions: [
          "Tasks have active-task limits and plan/model restrictions.",
          "File uploads and GPTs are not supported in ChatGPT Tasks at verification time.",
        ],
      },
      gemini: {
        whereToFindIt: "Scheduled actions in Gemini Apps.",
        stepByStepInstructions: [
          "Ask Gemini to schedule the prompt with a specific time and frequency.",
          "Review Gemini's schedule summary.",
          "Confirm the scheduled action.",
          "Manage it later from Scheduled actions settings.",
        ],
        expectedOutcome: "Gemini runs the recurring action and notifies you when ready.",
        tipsAndCautions: [
          "Scheduled actions require Google AI Pro/Ultra for personal accounts or qualifying Workspace editions.",
          "The feature requires activity history to be enabled.",
        ],
      },
      mistral: {
        whereToFindIt: "Scheduled tasks in Vibe Work.",
        stepByStepInstructions: [
          "Open Vibe Work.",
          "Go to Scheduled or ask Work to schedule the current prompt.",
          "Paste the scheduled prompt artifact.",
          "Choose the cadence.",
          "Confirm the schedule and review the first result.",
        ],
        expectedOutcome: "Vibe Work runs the task on schedule and stores the result in the task history.",
        tipsAndCautions: [
          "Scheduled tasks are preview at verification time.",
          "Use read-only scheduled prompts unless connector actions are explicitly approved.",
        ],
      },
      copilot: {
        whereToFindIt: "Schedule this prompt in Microsoft 365 Copilot Chat.",
        stepByStepInstructions: [
          "Open Microsoft 365 Copilot Chat in a supported surface.",
          "Run or draft the scheduled prompt.",
          "Choose Schedule this prompt from the prompt controls.",
          "Set time and frequency.",
          "Review the first scheduled output.",
        ],
        expectedOutcome: "Copilot runs the prompt automatically on the selected schedule.",
        tipsAndCautions: [
          "A Microsoft 365 Copilot license is required at verification time.",
          "Admins can disable optional connected experiences.",
        ],
      },
    },
  },
];

export const competitorPricingMonitor: UseCaseBlueprint = {
  id: "competitor-pricing-monitor",
  displayName: "Competitor Pricing Monitor",
  shortDescription:
    "Track public competitor pricing pages, extract plans and limits, and summarize changes.",
  vaguePrompt: "Check our competitors' pricing.",
  promptContract: {
    goal:
      "Compare the pricing pages of selected competitors and extract plan names, prices, limits, target segment, notable disclaimers, and source URLs.",
    context:
      "This will be used by the sales and strategy team to understand market positioning. Use only official pricing pages or approved source files.",
    rules: [
      "Do not invent missing prices",
      "Do not use forums, blog posts, third-party comparison sites, or unsourced claims",
      "Flag unclear or unavailable pricing",
      "Return source URL and access date for every claim",
      "If a competitor's pricing requires login, mark 'Not publicly available'",
    ],
    outputContract: {
      description: "Return a table with one row per plan.",
      columns: [
        "Competitor name",
        "Plan name",
        "Monthly price",
        "Annual price",
        "Included features (key 3-5)",
        "Limits",
        "Disclaimers",
        "Source URL",
        "Last checked date",
        "Confidence (High/Medium/Low)",
      ],
    },
    qualityBar: [
      "Every price must have a source URL",
      "Missing prices must be marked 'Not publicly available'",
      "Claims older than 30 days must be flagged",
      "If two sources disagree, surface both with timestamps",
    ],
    examples:
      "Include one example row for a competitor with transparent public pricing and one example row for a competitor with hidden enterprise pricing.",
  },
  skillSpec: promptImproverSkill,
  rungs,
};
