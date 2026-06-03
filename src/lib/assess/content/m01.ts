import type { InvoiceOcrProfileContext } from "./types";

export const M01_COURSE_CONTENT = {
  placeholder: false,

  storyHeader:
    "LLM Fundamentals. A language model is not a database or a reasoning engine by default. It predicts likely text, follows patterns, and can sound confident when it is wrong. Today's job: feel that behavior directly, then decide where confidence without evidence would be dangerous.",

  seeds: {
    "m01.reflection": [
      "Low temperature -> consistent, deterministic answers - fits structured operational tasks",
      "For governed workflows, defaults that reduce creativity are usually the right call",
    ],
  },

  step1: {
    title: "Hallucination Hunt",
    why:
      "Ask the same support-policy question twice: once without evidence, once with the relevant policy text or search allowed. Notice what changes when the model has grounding.",
    example:
      "A customer asks whether a refund is allowed after a product was opened. Without a policy source, the model may invent a confident answer. With approved guidance, the answer becomes more bounded and easier to audit.",
    whatToNotice: [
      "Confidence is independent of correctness",
      "Grounding reduces invention but does not remove the need to check the source",
      "A useful answer should say what it knows, what source it used, and what remains uncertain",
    ],
    produces: "The Foundation, section 1 (scepticism log)",
    nextLabel: "Step 2 - Parameter playground",
    prompts: {
      withoutSearch:
        "Do not use web search or any external sources.\n\nA customer bought a subscription, used it for 19 days, and now asks for a full refund. Should we approve it? Answer as if you are a support agent.",
      withSearch:
        "Use the provided policy text or web search if available.\n\nA customer bought a subscription, used it for 19 days, and now asks for a full refund. Should we approve it? Answer as if you are a support agent. Cite the policy rule you used and name any uncertainty.",
    },
  },

  step2: {
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
    nextLabel: "Method note -> marks M01 complete",
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
