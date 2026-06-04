import type { TokenizerEncoding } from "./encode";

export type TokenizerModelLensId =
  | "openai_current"
  | "openai_legacy"
  | "claude_current"
  | "gemini_current";

export interface TokenizerModelLens {
  id: TokenizerModelLensId;
  label: string;
  shortLabel: string;
  encoding: TokenizerEncoding;
  accuracy: string;
  chatUi: string;
  developerApi: string;
  parameterGuidance: string;
  contextCostReminder: string;
  warning?: string;
  sources: Array<{
    label: string;
    url: string;
  }>;
}

export const DEFAULT_TOKENIZER_MODEL_LENS_ID: TokenizerModelLensId = "openai_current";

export const TOKENIZER_MODEL_LENSES: Record<TokenizerModelLensId, TokenizerModelLens> = {
  openai_current: {
    id: "openai_current",
    label: "OpenAI / ChatGPT current",
    shortLabel: "OpenAI current",
    encoding: "o200k_base",
    accuracy:
      "Uses o200k_base, the current OpenAI-class tokenizer available in this tool.",
    chatUi:
      "ChatGPT is mainly controlled through model choice, prompts, files, tools, and custom instructions.",
    developerApi:
      "OpenAI APIs expose model-specific token usage, context limits, and controls that can vary by model.",
    parameterGuidance:
      "Treat temperature and top-p as developer controls. For business users, prompts and trusted sources are the durable controls.",
    contextCostReminder:
      "Use this count for learning estimates, then check the current OpenAI model and pricing docs before budgeting production usage.",
    sources: [
      {
        label: "OpenAI tokens",
        url: "https://platform.openai.com/docs/concepts",
      },
      {
        label: "OpenAI models",
        url: "https://platform.openai.com/docs/models",
      },
    ],
  },
  openai_legacy: {
    id: "openai_legacy",
    label: "OpenAI legacy",
    shortLabel: "OpenAI legacy",
    encoding: "cl100k_base",
    accuracy:
      "Uses cl100k_base, useful for comparing GPT-4 and GPT-3.5-era tokenizer behavior.",
    chatUi:
      "Legacy behavior is mostly useful for comparison; learners should not assume old token counts match current models.",
    developerApi:
      "Older OpenAI models and older examples often reference cl100k_base-style counting.",
    parameterGuidance:
      "Use this lens to show how tokenizers improve over time, not as the default for current AI work.",
    contextCostReminder:
      "Legacy counts can differ meaningfully from current models, especially for multilingual or technical text.",
    sources: [
      {
        label: "OpenAI tokens",
        url: "https://platform.openai.com/docs/concepts",
      },
      {
        label: "OpenAI models",
        url: "https://platform.openai.com/docs/models",
      },
    ],
  },
  claude_current: {
    id: "claude_current",
    label: "Claude current",
    shortLabel: "Claude",
    encoding: "o200k_base",
    accuracy:
      "Approximation only. Claude uses its own tokenizer, so exact Claude counts will differ.",
    chatUi:
      "Claude.ai users mainly control behavior through prompts, files, projects, connectors, and review habits.",
    developerApi:
      "Anthropic pricing and API behavior are model-specific. Use Anthropic docs for production cost and context planning.",
    parameterGuidance:
      "Do not teach Claude as exact OpenAI tokenization. Use this lens to compare business implications: context, cost, prompting, and guardrails.",
    contextCostReminder:
      "Use this as a learning estimate only. For Claude billing, rely on Anthropic usage and pricing data.",
    warning:
      "Counting still uses the OpenAI-class tokenizer so learners can see token effects locally. It is not an exact Claude token counter.",
    sources: [
      {
        label: "Anthropic pricing",
        url: "https://docs.anthropic.com/en/docs/about-claude/pricing",
      },
      {
        label: "Claude docs",
        url: "https://docs.anthropic.com/",
      },
    ],
  },
  gemini_current: {
    id: "gemini_current",
    label: "Gemini current",
    shortLabel: "Gemini",
    encoding: "o200k_base",
    accuracy:
      "Approximation only. Exact Gemini token counts require Google's countTokens API.",
    chatUi:
      "Gemini app users mainly control behavior through prompts, attached context, tools, and review habits.",
    developerApi:
      "Gemini API and AI Studio expose model parameters and a provider-side token counting endpoint.",
    parameterGuidance:
      "Gemini docs describe temperature, topP, and topK. Some newer guidance recommends keeping defaults for certain models and tasks.",
    contextCostReminder:
      "Use this tool for intuition. Use Gemini countTokens and current model docs for production estimates.",
    warning:
      "Counting still uses the OpenAI-class tokenizer in-browser. It is not an exact Gemini token counter.",
    sources: [
      {
        label: "Gemini countTokens",
        url: "https://ai.google.dev/api/tokens",
      },
      {
        label: "Gemini parameters",
        url: "https://ai.google.dev/gemini-api/docs/prompting-strategies",
      },
    ],
  },
};
