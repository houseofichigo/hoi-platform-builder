import { Tiktoken, type TiktokenBPE } from "js-tiktoken/lite";

export const TOKENIZER_ENCODINGS = {
  o200k_base: {
    label: "OpenAI current (o200k_base)",
    helper:
      "Representative for OpenAI-class learning estimates. Other providers tokenize differently.",
  },
  cl100k_base: {
    label: "OpenAI legacy (cl100k_base)",
    helper: "Useful for comparing older tokenizer behavior.",
  },
} as const;

export type TokenizerEncoding = keyof typeof TOKENIZER_ENCODINGS;

export interface EncodedToken {
  id: number;
  text: string;
}

export interface EncodedText {
  encoding: TokenizerEncoding;
  tokens: EncodedToken[];
  tokenIds: number[];
  characters: number;
  words: number;
}

const encoderCache = new Map<TokenizerEncoding, Tiktoken>();
const encoderPromises = new Map<TokenizerEncoding, Promise<Tiktoken>>();

async function getEncoder(encoding: TokenizerEncoding) {
  const cached = encoderCache.get(encoding);
  if (cached) return cached;

  const pending = encoderPromises.get(encoding);
  if (pending) return pending;

  const promise = loadRanks(encoding).then((ranks) => {
    const encoder = new Tiktoken(ranks);
    encoderCache.set(encoding, encoder);
    encoderPromises.delete(encoding);
    return encoder;
  });
  encoderPromises.set(encoding, promise);
  return promise;
}

export async function encodeText(
  text: string,
  encoding: TokenizerEncoding = "o200k_base",
): Promise<EncodedText> {
  const encoder = await getEncoder(encoding);
  const tokenIds = text ? encoder.encode(text, [], []) : [];
  const tokens = tokenIds.map((id) => ({
    id,
    text: encoder.decode([id]),
  }));

  return {
    encoding,
    tokens,
    tokenIds,
    characters: [...text].length,
    words: countWords(text),
  };
}

export function createEmptyEncodedText(
  encoding: TokenizerEncoding = "o200k_base",
): EncodedText {
  return {
    encoding,
    tokens: [],
    tokenIds: [],
    characters: 0,
    words: 0,
  };
}

async function loadRanks(encoding: TokenizerEncoding): Promise<TiktokenBPE> {
  if (encoding === "o200k_base") {
    const module = await import("js-tiktoken/ranks/o200k_base");
    return module.default;
  }

  const module = await import("js-tiktoken/ranks/cl100k_base");
  return module.default;
}

function countWords(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/u).filter(Boolean).length;
}
