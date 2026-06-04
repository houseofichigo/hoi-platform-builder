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
    why: "Same question, different generation behavior. Three parameters: temperature, top-k, top-p.",
    example:
      "You cannot directly set these on every chat product, but asking the model to act as if a parameter is set to a value is a useful proxy to feel the spread.",
    whatToNotice: [
      "Low temperature -> deterministic, factual, repetitive",
      "High temperature / top-k / top-p -> creative, varied, riskier on facts",
      "Operational systems usually need repeatability more than variety",
    ],
    produces: "The Foundation, section 2 (parameter notes)",
    nextLabel: "Complete method note",
    experiments: {
      temperature: {
        label: "Temperature - randomness control",
        low: {
          label: "Low temperature (0.1)",
          prompt:
            "Act as if your temperature is set to 0.1.\n\nExplain the difference between a chatbot, an assistant, an agent, and an AI system.",
        },
        high: {
          label: "High temperature (0.9)",
          prompt:
            "Act as if your temperature is set to 0.9.\n\nExplain the difference between a chatbot, an assistant, an agent, and an AI system.",
        },
      },
      topK: {
        label: "Top-k - choice pool size",
        low: {
          label: "Low top-k (10)",
          prompt:
            "Act as if top-k is set to 10.\n\nWrite a short answer to a customer asking why their request needs human review.",
        },
        high: {
          label: "High top-k (100)",
          prompt:
            "Act as if top-k is set to 100.\n\nWrite a short answer to a customer asking why their request needs human review.",
        },
      },
      topP: {
        label: "Top-p - probability threshold",
        low: {
          label: "Low top-p (0.4)",
          prompt:
            "Act as if top-p is set to 0.4.\n\nSummarize a short internal policy into three rules for a support agent.",
        },
        high: {
          label: "High top-p (0.95)",
          prompt:
            "Act as if top-p is set to 0.95.\n\nSummarize a short internal policy into three rules for a support agent.",
        },
      },
    },
    reflectionOptions: [
      "Low temperature -> consistent, deterministic answers - fits structured operational tasks",
      "High temperature -> creative variation - fits brainstorming, copywriting, naming",
      "Top-k caps the candidate pool - lower = safer, higher = more variety",
      "Top-p adapts the pool to context - flexible but harder to predict",
      "For governed workflows, defaults that reduce creativity are usually the right call",
      "For ideation or marketing copy, looser settings can produce richer options",
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
