import type { InvoiceOcrProfileContext } from "./types";

export const M01_COURSE_CONTENT = {
  placeholder: false,

  storyHeader:
    "LLM Fundamentals. Before we talk about how language models fail or how to control them, we need to understand how they see. A model does not read words like you do. It processes tokens: fragments of text, one at a time.",

  seeds: {
    "m01.reflection": [
      "Low temperature -> consistent, deterministic answers - fits structured operational tasks",
      "For governed workflows, defaults that reduce creativity are usually the right call",
    ],
  },

  step1: {
    title: "How the Model Sees",
    why:
      "Tokens are the unit of cost, memory, and generation. Once you can see token boundaries, model behavior starts to make practical sense: weird counting failures, decimal mistakes, multilingual cost, and context-window limits.",
    example:
      "The model does not predict the next word. It predicts the next token. A token can be a whole word, part of a word, punctuation, whitespace, a number fragment, or a chunk of code.",
    whatToNotice: [
      "Common short words often become one token; rare names and typos split into pieces",
      "Numbers, dates, phone numbers, and decimals are processed as fragments, not exact values",
      "The same meaning can cost more tokens in French or Arabic than in English",
      "Character-level precision needs extra help: tools, explicit reasoning, or validation code",
    ],
    produces: "The Foundation, section 0 (tokenisation notes)",
    nextLabel: "Step 2 - Hallucination hunt",
    exercises: [
      {
        id: "words",
        title: "A1 - Your name, your company, your words",
        instruction:
          "Try your first name, last name, company name, job title, hello, anthropomorphism, and your name with a typo.",
      },
      {
        id: "numbers",
        title: "A2 - Numbers, dates, and precision",
        instruction:
          "Try long numbers, phone numbers, dates, currency, 3.9 vs 3.11, and s-t-r-a-w-b-e-r-r-y.",
      },
      {
        id: "language_tax",
        title: "A3 - The language tax",
        instruction:
          "Open the Language Tax tab and compare English, French, and Arabic token counts.",
      },
      {
        id: "examples",
        title: "Examples in the wild",
        instruction:
          "Review the strawberry problem, decimal comparison, and why familiar brand names can sound more fluent.",
      },
      {
        id: "work_implications",
        title: "What it means for your work",
        instruction:
          "Connect tokens to money, memory, fragile exact tasks, and multilingual planning.",
      },
    ],
  },

  step2: {
    title: "Hallucination Hunt",
    why:
      "You saw in Step 1 that the model generates likely token continuations. Now you will see the consequence: when it lacks evidence, it may keep producing plausible-looking output instead of stopping.",
    example:
      "The risky hallucination in business work is rarely nonsense. It is a confident estimate, policy answer, citation, or synthesis that sounds professional enough to paste into a deck.",
    whatToNotice: [
      "Confidence is independent of correctness",
      "Hallucinations are often unstable across fresh conversations",
      "Grounding moves an answer from invention toward reference, but the source still needs checking",
      "The technology is improving, so the failure mode is moving from obvious to subtle",
    ],
    produces: "The Foundation, section 1 (scepticism log)",
    nextLabel: "Step 3 - Parameter playground",
    intro:
      "Models are getting better at refusing obvious traps, especially when they have tools like search or retrieval. The professional risk is shifting toward subtle hallucinations: plausible estimates, mixed facts, overconfident summaries, and well-hedged answers that are wrong in substance.",
    headingPoints: [
      "Hallucinations are moving, not disappearing.",
      "Capability varies across tools, plans, model versions, and enterprise deployments.",
      "The structural cause remains: the model is trained to produce likely answers, not to be a perfect truth checkpoint.",
    ],
    exercises: [
      {
        id: "confident_analyst",
        title: "A1 - The confident analyst",
        description:
          "Ask for a specific current business fact without web search, then verify it yourself. Notice whether the model invents a plausible quantitative answer.",
        prompts: [
          {
            label: "Prompt - no web search",
            text:
              "Without using web search: how many direct commercial flights per week are there between Montpellier and Tunis? Include likely airlines and seasonal variation.",
          },
        ],
        lookFor: [
          "Did the model provide a specific weekly number?",
          "Did it hedge the precision while still inventing the substance?",
          "After a live check, does the public schedule support the answer?",
        ],
        sourceLabel: "Verify live schedule",
        sourceUrl: "https://www.flightsfrom.com/MPL-TUN",
        note:
          "Current public schedule checks may show one direct weekly flight, but flight schedules change. The lesson is to verify live instead of trusting a confident estimate.",
      },
      {
        id: "consistency_test",
        title: "A2 - The consistency test",
        description:
          "Ask the same current-fact question in three fresh chats. Real facts should not move between conversations.",
        prompts: [
          {
            label: "Prompt - fresh chat 1/2/3",
            text:
              "Without using web search: how many direct commercial flights per week between Montpellier and Tunis, on which airlines? Be specific.",
          },
        ],
        lookFor: [
          "Do the weekly numbers shift?",
          "Do the named airlines change?",
          "Does confidence stay high even when details move?",
        ],
      },
      {
        id: "grounded_ungrounded",
        title: "A3 - Grounded vs. ungrounded",
        description:
          "Compare a policy answer with and without source material. Grounding should make the answer easier to audit, not magically perfect.",
        prompts: [
          {
            label: "Prompt 1 - no source material",
            text:
              "Do not use web search or any external sources.\n\nA customer bought a subscription, used it for 19 days, and now asks for a full refund. Should we approve it? Answer as if you are a support agent.",
          },
          {
            label: "Prompt 2 - with source material",
            text:
              "Use only the policy text below to answer. If the policy does not cover this situation, say so.\n\nREFUND POLICY:\n- Full refund: within 14 days of purchase, regardless of usage.\n- Partial refund (50%): between 15 and 30 days, if usage is under 5 hours total.\n- No refund: after 30 days, or if usage exceeds 5 hours before day 30.\n\nQuestion: A customer bought a subscription, used it for 19 days, and now asks for a full refund. Should we approve it? Cite the specific policy rule you applied and name anything that is still uncertain.",
          },
        ],
        lookFor: [
          "Without a source, what policy did the model assume?",
          "With a source, did it cite the partial-refund rule?",
          "Did it identify the missing usage-hours information?",
        ],
      },
    ],
    examples: [
      {
        title: "The fabricated dissertation",
        sourceLabel: "OpenAI - Why language models hallucinate",
        sourceUrl: "https://openai.com/index/why-language-models-hallucinate/",
        body:
          "OpenAI describes a chatbot giving three different dissertation titles and three different birthdays for a real person. None were correct.",
        why:
          "The instability is the signal. If you only ask once, you can walk away with one confident falsehood.",
      },
      {
        title: "The customer support agent that misread policy",
        sourceLabel: "OpenAI Cookbook - hallucination guardrails",
        sourceUrl: "https://cookbook.openai.com/examples/developing_hallucination_guardrails",
        body:
          "The Cookbook uses refund-policy examples to show why support agents need hallucination checks and source-grounded evaluation.",
        why:
          "Grounding helps, but support answers still need auditing against the actual policy.",
      },
      {
        title: "Mata v. Avianca",
        sourceLabel: "Mata v. Avianca reference",
        sourceUrl: "https://www.section1983.org/cases/mata-v-avianca-inc/",
        body:
          "In 2023, lawyers were sanctioned after submitting AI-generated legal citations that referred to nonexistent cases.",
        why:
          "This is the cautionary case for professional verification: plausible citations are not evidence.",
      },
    ],
    promptTechniques: [
      {
        title: "Hallucination Audit",
        useWhen:
          "Use after high-stakes generation: client proposals, policy answers, financial summaries, or research claims.",
        glimpse:
          "Act as a hallucination auditor. Extract every factual claim, mark each LOW / MEDIUM / HIGH risk, flag numbers/dates/names/citations, and rewrite using only supported claims.",
      },
      {
        title: "Hallucination Prevention",
        useWhen:
          "Use before generating reports, recommendations, summaries, or client-facing content where accuracy matters.",
        glimpse:
          "Do not guess. Separate verified facts from assumptions. Do not invent citations, names, dates, statistics, or examples. End with What should be verified.",
      },
    ],
    libraryPrompts: [
      {
        title: "Citation Audit",
        useWhen: "Every claim needs a source and every citation must support the attached claim.",
      },
      {
        title: "Source-Only Lock",
        useWhen: "The model must answer from a specific document and avoid outside knowledge.",
      },
      {
        title: "Quote-First Grounding",
        useWhen: "You have a long document and want exact quotes before the model answers.",
      },
      {
        title: "Claim Extraction Table",
        useWhen: "You need to review AI-generated work into supported, unsupported, contradicted, and verify buckets.",
      },
    ],
    riskTasks: [
      "Summarising a legal contract, policy document, or regulated procedure",
      "Producing market sizing, competitive analysis, or quantitative forecasts",
      "Quoting statistics, percentages, citations, or research findings in client documents",
      "Generating step-by-step procedures or compliance checklists",
      "Answering customers or employees on behalf of the company without approved sources",
      "Triggering workflow actions where reversal is hard or sensitive",
    ],
  },

  step3: {
    title: "Parameter Playground",
    why:
      "Parameters explain why AI outputs vary, but most business users will not control them directly. In real work, you control AI through prompts, trusted sources, tool permissions, review rules, and escalation paths.",
    example:
      "In ChatGPT or Claude.ai you usually cannot set temperature, top-p, or top-k. But you can still say: use only this policy, respond in this structure, ask before taking action, cite sources, and escalate uncertainty.",
    whatToNotice: [
      "Temperature changes consistency versus variety; it does not make the model more truthful",
      "Top-p and top-k shape the candidate pool, but most teams should leave them at provider defaults",
      "For everyday tools, prompting is the control surface people actually have",
      "For agents, control means tools, sources, human review, forbidden actions, and audit logs",
    ],
    produces: "The Foundation, section 2 (parameter notes)",
    nextLabel: "Complete M01",
    intro:
      "Step 1 showed how the model sees text as tokens. Step 2 showed why it can produce confident wrong answers. Step 3 shows what you can control: old-school sampling dials when you are in a developer playground, and durable business controls when you are using ChatGPT, Claude, Gemini, or an AI agent.",
    headingPoints: [
      "These dials live mainly in APIs and developer playgrounds, not everyday chat apps.",
      "The frontier-model trend is toward fewer sampling knobs and more instruction-based control.",
      "Managers should care less about tuning numbers and more about designing prompts, evidence, and guardrails.",
    ],
    dials: [
      {
        id: "temperature",
        title: "Temperature",
        plain: "The consistency-versus-variety dial.",
        businessUse:
          "Low temperature fits extraction, classification, compliance, and repeatable operations. Higher temperature fits brainstorming, naming, and creative variation.",
        watchOut:
          "Low temperature is more predictable, not automatically more accurate. A confident wrong answer can still be repeated consistently.",
        example:
          "Support policy summary: keep it low. Ten campaign ideas: allow more variety.",
      },
      {
        id: "top_p",
        title: "Top-p",
        plain: "The probability-pool dial.",
        businessUse:
          "It narrows or widens the pool of likely next tokens. Most business teams should leave it at default and control output through instructions.",
        watchOut:
          "Changing top-p and temperature together makes behavior harder to interpret.",
        example:
          "If you need safer, less surprising wording, use clearer constraints before changing top-p.",
      },
      {
        id: "top_k",
        title: "Top-k",
        plain: "The candidate-count dial.",
        businessUse:
          "It limits how many likely next tokens the model can consider. Some platforms expose it; others do not.",
        watchOut:
          "It is a blunt tool. It can reduce variety, but it does not understand business risk.",
        example:
          "A developer may tune it in Gemini-style workflows; a manager should specify acceptable behavior instead.",
      },
    ],
    studio: {
      url: "https://aistudio.google.com",
      label: "Open Google AI Studio",
      note:
        "Optional: use this if you want to see the dials live. The course does not require a Google account or playground access.",
    },
    tryPrompts: [
      {
        label: "Temperature test - consistency vs variety",
        prompt:
          "Write a 3-sentence product description for a premium Moroccan argan oil brand sold in upscale French boutiques.",
        variants: [
          {
            label: "Low temperature",
            settings: "Temperature 0.0-0.2. Expect safer, more repeatable wording.",
          },
          {
            label: "High temperature",
            settings: "Temperature 1.0-1.5. Expect more varied wording and more drift risk.",
          },
        ],
      },
      {
        label: "Top-p test - candidate pool",
        prompt:
          "Write five taglines for a French SaaS startup that helps small businesses adopt AI responsibly.",
        variants: [
          {
            label: "Low top-p",
            settings: "Top-p 0.1-0.5, temperature default. Expect narrower, safer phrasing.",
          },
          {
            label: "High top-p",
            settings: "Top-p 0.9-1.0, temperature default. Expect a wider candidate pool.",
          },
        ],
      },
      {
        label: "Top-k test - candidate count",
        prompt:
          "Write the opening sentence of a French detective novel set in Marseille.",
        variants: [
          {
            label: "Low top-k",
            settings: "Top-k 1-10. Expect constrained, repeatable openings.",
          },
          {
            label: "High top-k",
            settings: "Top-k 40-100. Expect more variety in the first words and imagery.",
          },
        ],
      },
    ],
    taskGuide: [
      {
        task: "Data extraction from documents",
        when: "Use when values must be captured reliably from contracts, forms, claims, or standard business records.",
        setting: "Low temperature when available",
        pattern: "Low randomness + strict output schema + validation",
        example: "Extract customer name, date, amount, and reference number into fixed fields, then validate missing or unusual values.",
        control:
          "Use strict output fields, source-only instructions, validation rules, and human review for exceptions.",
      },
      {
        task: "Classification or triage",
        when: "Use when items need consistent routing, priority, or category labels.",
        setting: "Low temperature when available",
        pattern: "Clear categories + examples + confidence threshold",
        example: "Classify support tickets into billing, technical, legal, or escalation-needed, with uncertain cases routed to a person.",
        control:
          "Define categories, examples, confidence thresholds, escalation paths, and audit logs.",
      },
      {
        task: "Summarising long documents",
        when: "Use when leaders need a short answer from long source material.",
        setting: "Low to medium",
        pattern: "Quote-first grounding + concise output structure",
        example: "Summarise board notes into decisions, risks, owners, and open questions, citing the relevant source section.",
        control:
          "Ask for quotes first, cite sections, separate facts from assumptions, and flag missing evidence.",
      },
      {
        task: "Translation or localisation",
        when: "Use when meaning, terminology, and tone must survive across languages.",
        setting: "Low for faithful, medium for creative",
        pattern: "Glossary + audience + tone rules",
        example: "Translate a technical support article into French using approved product terms and a formal customer tone.",
        control:
          "Provide glossary, audience, tone, forbidden terms, and review rules for regulated language.",
      },
      {
        task: "Emails, memos, and internal drafts",
        when: "Use when the goal is useful drafting, not autonomous decision-making.",
        setting: "Medium",
        pattern: "Audience + length + tone + no-invention rule",
        example: "Draft a client follow-up email in 120 words, warm but direct, with no new promises or dates.",
        control:
          "Specify audience, length, structure, tone, and what must not be invented.",
      },
      {
        task: "Creative campaigns and ideation",
        when: "Use when variety is useful and humans will choose the winner.",
        setting: "Higher temperature can help when exposed",
        pattern: "Distinct angles + human selection",
        example: "Generate campaign concepts across trust, speed, simplicity, governance, and differentiation.",
        control:
          "Ask for multiple distinct directions, then choose and refine with human judgement.",
      },
      {
        task: "Code, automations, or agents",
        when: "Use when AI can call tools, move data, or trigger workflow actions.",
        setting: "Low for repeatability",
        pattern: "Tool permissions + dry runs + approval gates + logs",
        example: "Let an agent draft a refund response, but require approved policy evidence and human approval before sending.",
        control:
          "Use tests, tool permissions, dry runs, approval gates, rollback paths, and logs.",
      },
    ],
    promptControls: [
      {
        title: "Need consistency?",
        promptMove:
          "Ask for the same structure every time, provide examples, and require a fixed output format.",
      },
      {
        title: "Need variety?",
        promptMove:
          "Ask for several distinct options with named angles instead of simply raising randomness.",
      },
      {
        title: "Need truthfulness?",
        promptMove:
          "Use source-only instructions, citations, quote-first grounding, and the hallucination audit from Step 2.",
      },
      {
        title: "Need agent safety?",
        promptMove:
          "Define allowed tools, forbidden actions, when to ask a human, and what must be logged.",
      },
    ],
    agentControls: [
      "Allowed tools: which systems, APIs, files, or databases the agent can touch",
      "Trusted sources: which policies, documents, or systems count as evidence",
      "Human review: when the agent must ask before acting",
      "Forbidden actions: what the agent can never do without approval",
      "Audit logs: what decision, source, tool call, and handoff evidence must be recorded",
    ],
    controlExercise: [
      {
        id: "invoice_extraction",
        task: "Extract dates, names, and amounts from 1,000 documents",
        answer: "Low randomness + strict output schema + validation",
      },
      {
        id: "tagline_generation",
        task: "Generate twenty campaign directions for a new product",
        answer: "Prompt for distinct angles + human selection",
      },
      {
        id: "policy_agent",
        task: "Let an AI support agent answer refund requests",
        answer: "Trusted policy source + escalation rule + audit log",
      },
      {
        id: "board_summary",
        task: "Summarise board notes for executives",
        answer: "Quote-first grounding + concise output structure",
      },
    ],
    controlOptions: [
      "Low randomness + strict output schema + validation",
      "Prompt for distinct angles + human selection",
      "Trusted policy source + escalation rule + audit log",
      "Quote-first grounding + concise output structure",
    ],
    workReflections: [
      "I need more consistent outputs from a repeated workflow",
      "I need more varied outputs for ideation or marketing",
      "I need AI to cite trusted sources before answering",
      "I need an agent to ask for human approval before taking action",
      "I need logs that show what the AI decided and why",
      "I need clearer prompts because my team uses chat tools without parameter controls",
    ],
    checks: [
      {
        id: "dials_reviewed",
        label: "I can explain temperature, top-p, and top-k in business language.",
      },
      {
        id: "task_controls_reviewed",
        label: "I can choose different controls for extraction, ideation, summaries, and agents.",
      },
      {
        id: "agent_guardrails_reviewed",
        label: "I understand that agent control means tools, sources, human review, forbidden actions, and logs.",
      },
    ],
    sources: [
      {
        label: "Anthropic model deprecations",
        url: "https://platform.claude.com/docs/en/about-claude/model-deprecations",
      },
      {
        label: "OpenAI temperature and top-p documentation",
        url: "https://platform.openai.com/docs/api-reference/responses/create",
      },
      {
        label: "Google Gemini generation config",
        url: "https://ai.google.dev/api/generate-content",
      },
    ],
    reflectionOptions: [
      "Low temperature means more consistent output, not guaranteed truth",
      "Higher randomness can help ideation, but it also needs stronger prompt guardrails",
      "Top-p and top-k shape the candidate pool, but most teams should leave them at defaults",
      "For chat tools, prompt design is usually the only control surface available",
      "For agents, tool permissions and human-review rules matter more than sampling dials",
      "For governed workflows, sources, schemas, validation, and logs are the real control system",
    ],
  },

  methodNote: {
    title: "What you'll carry into every chapter",
    why:
      "Each chapter ends with a method note: the transferable lesson you will reuse beyond this training.",
    produces: "Method Notes archive (visible in the Handoff Pack)",
    nextLabel: "Marks M01 complete and unlocks M02",
  },
};

export function getM01DangerousTaskOptions(ctx: InvoiceOcrProfileContext): string[] {
  const company = ctx.companyName ?? "your company";
  const country = ctx.country ?? "your country";

  return [
    `Answering a customer policy question on behalf of ${company} without citing the approved source`,
    "Promising a refund, discount, delivery date, or legal position that the policy does not support",
    "Summarizing a contract clause and missing a termination, liability, or renewal condition",
    "Classifying a complaint as low priority when it contains safety, legal, or discrimination signals",
    `Using customer or employee personal data in ${country} without the right handling rule`,
    "Triggering a workflow action without human review when the decision is hard to reverse",
  ];
}
