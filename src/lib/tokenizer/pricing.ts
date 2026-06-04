export const TOKENIZER_PRICING_EUR = {
  inputPerMillion: 3,
  outputPerMillion: 12,
  estimatedOutputRatio: 2,
} as const;

export function estimateTokenCost(tokens: number) {
  const inputCost =
    (tokens / 1_000_000) * TOKENIZER_PRICING_EUR.inputPerMillion;
  const estimatedOutputTokens = Math.round(
    tokens * TOKENIZER_PRICING_EUR.estimatedOutputRatio,
  );
  const outputCost =
    (estimatedOutputTokens / 1_000_000) *
    TOKENIZER_PRICING_EUR.outputPerMillion;

  return {
    inputCost,
    estimatedOutputTokens,
    outputCost,
    totalCost: inputCost + outputCost,
  };
}

export function formatEur(value: number) {
  if (value === 0) return "€0.0000";
  if (value < 0.01) return `€${value.toFixed(6)}`;
  if (value < 1) return `€${value.toFixed(4)}`;
  return `€${value.toFixed(2)}`;
}
