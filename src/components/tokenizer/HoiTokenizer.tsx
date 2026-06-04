import { useEffect, useState } from "react";
import {
  createEmptyEncodedText,
  encodeText,
  TOKENIZER_ENCODINGS,
  type EncodedText,
  type EncodedToken,
  type TokenizerEncoding,
} from "@/lib/tokenizer/encode";
import {
  LANGUAGE_TAX_PRESETS,
  TOKENIZER_SINGLE_PRESETS,
  type LanguageTaxPreset,
} from "@/lib/tokenizer/presets";
import { estimateTokenCost, formatEur } from "@/lib/tokenizer/pricing";
import {
  DEFAULT_TOKENIZER_MODEL_LENS_ID,
  TOKENIZER_MODEL_LENSES,
  type TokenizerModelLens,
  type TokenizerModelLensId,
} from "@/lib/tokenizer/model-lenses";

const TOKEN_COLORS = [
  "var(--token-c1)",
  "var(--token-c2)",
  "var(--token-c3)",
  "var(--token-c4)",
  "var(--token-c5)",
  "var(--token-c6)",
] as const;

type TokenizerMode = "single" | "language_tax";
type TokenView = "text" | "ids";
type LanguageTaxTexts = {
  en: string;
  fr: string;
  ar: string;
};

interface HoiTokenizerProps {
  compact?: boolean;
  defaultText?: string;
  defaultMode?: TokenizerMode;
}

export function HoiTokenizer({
  compact = false,
  defaultText = TOKENIZER_SINGLE_PRESETS[0].text,
  defaultMode = "single",
}: HoiTokenizerProps) {
  const [mode, setMode] = useState<TokenizerMode>(defaultMode);
  const [modelLensId, setModelLensId] = useState<TokenizerModelLensId>(
    DEFAULT_TOKENIZER_MODEL_LENS_ID,
  );
  const [encoding, setEncoding] = useState<TokenizerEncoding>("o200k_base");
  const modelLens = TOKENIZER_MODEL_LENSES[modelLensId];

  const handleModelLensChange = (nextId: TokenizerModelLensId) => {
    const nextLens = TOKENIZER_MODEL_LENSES[nextId];
    setModelLensId(nextId);
    setEncoding(nextLens.encoding);
  };

  return (
    <section className="space-y-5 rounded-lg border border-chalk bg-white p-5 md:p-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <p className="eyebrow text-terracotta">HOI TOKENIZER</p>
          <h3 className="mt-2 font-display text-[30px] leading-tight text-navy md:text-[38px]">
            See the text as <span className="accent-italic">tokens</span>
          </h3>
          <p className="mt-2 max-w-[68ch] text-[14px] leading-relaxed text-graphite">
            A learning aid for intuition: token counts, token boundaries, cost estimates,
            and multilingual differences. Exact counts and costs vary by model and provider.
          </p>
        </div>

        <label className="min-w-[230px] space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate">
            Model lens
          </span>
          <select
            value={modelLensId}
            onChange={(event) =>
              handleModelLensChange(event.target.value as TokenizerModelLensId)
            }
            className="w-full rounded-md border border-chalk bg-paper px-3 py-2 text-[13px] text-navy outline-none focus:border-terracotta"
          >
            {Object.values(TOKENIZER_MODEL_LENSES).map((lens) => (
              <option key={lens.id} value={lens.id}>
                {lens.label}
              </option>
            ))}
          </select>
          <p className="text-[11px] leading-relaxed text-slate">
            Counting engine: {TOKENIZER_ENCODINGS[encoding].label}.{" "}
            {TOKENIZER_ENCODINGS[encoding].helper}
          </p>
        </label>
      </div>

      <div className="inline-flex overflow-hidden rounded-md border border-chalk bg-paper">
        <ModeButton active={mode === "single"} onClick={() => setMode("single")}>
          Single input
        </ModeButton>
        <ModeButton active={mode === "language_tax"} onClick={() => setMode("language_tax")}>
          Language tax
        </ModeButton>
      </div>

      <ModelLensPanel lens={modelLens} />

      {mode === "single" ? (
        <SingleInputTokenizer
          compact={compact}
          defaultText={defaultText}
          encoding={encoding}
        />
      ) : (
        <LanguageTaxComparator encoding={encoding} />
      )}

      <p className="rounded-md border border-chalk bg-paper p-3 text-[11px] leading-relaxed text-slate">
        The HOI Tokenizer uses OpenAI-class tokenizers via the open-source
        js-tiktoken library. It is representative for learning how many current
        frontier systems split text, but Claude, Gemini, and other providers do
        not tokenize identically. Use it to build intuition, not to invoice clients.
      </p>
    </section>
  );
}

function ModelLensPanel({ lens }: { lens: TokenizerModelLens }) {
  return (
    <section className="rounded-md border border-chalk bg-paper p-4">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <p className="eyebrow-muted">WHAT CHANGES BY MODEL?</p>
          <h4 className="mt-1 text-[17px] font-semibold text-navy">{lens.shortLabel}</h4>
          <p className="mt-2 max-w-[70ch] text-[13px] leading-relaxed text-graphite">
            {lens.accuracy}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 md:justify-end">
          {lens.sources.map((source) => (
            <a
              key={source.url}
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-chalk bg-white px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-slate transition-colors hover:border-terracotta hover:text-terracotta"
            >
              {source.label}
            </a>
          ))}
        </div>
      </div>

      {lens.warning && (
        <p className="mt-3 rounded-md border border-warning/30 bg-warning/10 p-3 text-[12px] leading-relaxed text-navy">
          {lens.warning}
        </p>
      )}

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <LensFact label="Chat UI" value={lens.chatUi} />
        <LensFact label="Developer/API" value={lens.developerApi} />
        <LensFact label="Parameters" value={lens.parameterGuidance} />
        <LensFact label="Cost/context" value={lens.contextCostReminder} />
      </div>
    </section>
  );
}

function LensFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-chalk bg-white p-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate">
        {label}
      </p>
      <p className="mt-2 text-[12px] leading-relaxed text-graphite">{value}</p>
    </div>
  );
}

function SingleInputTokenizer({
  compact,
  defaultText,
  encoding,
}: {
  compact: boolean;
  defaultText: string;
  encoding: TokenizerEncoding;
}) {
  const [text, setText] = useState(defaultText);
  const debouncedText = useDebouncedValue(text, 180);
  const encoded = useEncodedText(debouncedText, encoding);
  const stats = encoded.data;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {TOKENIZER_SINGLE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => setText(preset.text)}
            className="rounded-full border border-chalk bg-paper px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-slate transition-colors hover:border-terracotta hover:text-terracotta"
          >
            {preset.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setText("")}
          className="rounded-full border border-chalk bg-paper px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-slate transition-colors hover:border-slate hover:text-navy"
        >
          Clear
        </button>
      </div>

      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={compact ? 6 : 9}
        placeholder="Type or paste any text to see how a language model breaks it into tokens..."
        className="min-h-[200px] w-full rounded-md border border-chalk bg-paper p-4 text-[16px] leading-relaxed text-navy outline-none transition-colors placeholder:text-slate focus:border-terracotta"
      />

      {encoded.error ? (
        <TokenizerError message={encoded.error} />
      ) : (
        <>
          <TokenizerStats encoded={stats} />
          <TokenVisualization encoded={stats} />
        </>
      )}
    </div>
  );
}

function LanguageTaxComparator({ encoding }: { encoding: TokenizerEncoding }) {
  const [presetId, setPresetId] = useState<LanguageTaxPreset["id"]>(
    LANGUAGE_TAX_PRESETS[0].id,
  );
  const [texts, setTexts] = useState<LanguageTaxTexts>({
    en: LANGUAGE_TAX_PRESETS[0].en,
    fr: LANGUAGE_TAX_PRESETS[0].fr,
    ar: LANGUAGE_TAX_PRESETS[0].ar,
  });
  const debouncedTexts = useDebouncedValue(texts, 180);
  const en = useEncodedText(debouncedTexts.en, encoding);
  const fr = useEncodedText(debouncedTexts.fr, encoding);
  const ar = useEncodedText(debouncedTexts.ar, encoding);

  const applyPreset = (id: LanguageTaxPreset["id"]) => {
    const preset = LANGUAGE_TAX_PRESETS.find((item) => item.id === id);
    if (!preset) return;
    setPresetId(id);
    setTexts({ en: preset.en, fr: preset.fr, ar: preset.ar });
  };

  const enTokens = en.data.tokenIds.length;
  const frMultiplier = enTokens > 0 ? fr.data.tokenIds.length / enTokens : null;
  const arMultiplier = enTokens > 0 ? ar.data.tokenIds.length / enTokens : null;

  return (
    <div className="space-y-5">
      <label className="max-w-[360px] space-y-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate">
          Preset
        </span>
        <select
          value={presetId}
          onChange={(event) => applyPreset(event.target.value as LanguageTaxPreset["id"])}
          className="w-full rounded-md border border-chalk bg-paper px-3 py-2 text-[13px] text-navy outline-none focus:border-terracotta"
        >
          {LANGUAGE_TAX_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 lg:grid-cols-3">
        <LanguagePanel
          label="English"
          value={texts.en}
          encoded={en.data}
          error={en.error}
          onChange={(value) => setTexts((current) => ({ ...current, en: value }))}
        />
        <LanguagePanel
          label="French"
          value={texts.fr}
          encoded={fr.data}
          error={fr.error}
          onChange={(value) => setTexts((current) => ({ ...current, fr: value }))}
        />
        <LanguagePanel
          label="Arabic"
          value={texts.ar}
          encoded={ar.data}
          error={ar.error}
          dir="rtl"
          onChange={(value) => setTexts((current) => ({ ...current, ar: value }))}
        />
      </div>

      <div className="rounded-md border border-terracotta/25 bg-terracotta/5 p-4">
        <p className="eyebrow text-terracotta">LANGUAGE TAX</p>
        <p className="mt-2 text-[15px] leading-relaxed text-navy">
          French uses{" "}
          <strong>{formatMultiplier(frMultiplier)} more tokens than English</strong>.
          Arabic uses{" "}
          <strong>{formatMultiplier(arMultiplier)} more tokens than English</strong>.
        </p>
        <p className="mt-1 text-[12px] leading-relaxed text-slate">
          Same meaning, different token budget. This affects cost, context-window
          capacity, and long-document planning.
        </p>
      </div>
    </div>
  );
}

function LanguagePanel({
  label,
  value,
  encoded,
  error,
  dir = "ltr",
  onChange,
}: {
  label: string;
  value: string;
  encoded: EncodedText;
  error: string | null;
  dir?: "ltr" | "rtl";
  onChange: (value: string) => void;
}) {
  const costs = estimateTokenCost(encoded.tokenIds.length);

  return (
    <div className="space-y-3 rounded-md border border-chalk bg-paper p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow-muted">{label}</p>
        <span className="font-mono text-[11px] text-slate">
          {encoded.tokenIds.length} tokens
        </span>
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={7}
        dir={dir}
        className="w-full rounded-md border border-chalk bg-white p-3 text-[14px] leading-relaxed text-navy outline-none focus:border-terracotta"
        style={{ textAlign: dir === "rtl" ? "right" : "left" }}
      />
      {error ? (
        <TokenizerError message={error} />
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <MiniStat label="Chars" value={encoded.characters.toLocaleString()} />
          <MiniStat label="Words" value={encoded.words.toLocaleString()} />
          <MiniStat label="Cost" value={formatEur(costs.inputCost)} />
        </div>
      )}
    </div>
  );
}

function TokenizerStats({ encoded }: { encoded: EncodedText }) {
  const costs = estimateTokenCost(encoded.tokenIds.length);

  return (
    <div className="grid gap-3 md:grid-cols-[repeat(3,minmax(0,1fr))_1.4fr]">
      <StatCard label="Tokens" value={encoded.tokenIds.length.toLocaleString()} />
      <StatCard label="Characters" value={encoded.characters.toLocaleString()} />
      <StatCard label="Words" value={encoded.words.toLocaleString()} />
      <div className="rounded-md border border-chalk bg-paper p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate">
          Estimated cost at typical rates
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3 md:grid-cols-1 xl:grid-cols-3">
          <MiniStat label="Input only" value={formatEur(costs.inputCost)} />
          <MiniStat
            label="2x output"
            value={formatEur(costs.outputCost)}
          />
          <MiniStat label="Input + output" value={formatEur(costs.totalCost)} />
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-slate">
          Assumes €3/M input tokens and €12/M output tokens. Learning estimate only.
        </p>
      </div>
    </div>
  );
}

function TokenVisualization({ encoded }: { encoded: EncodedText }) {
  const [view, setView] = useState<TokenView>("text");

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate">
          Token visualisation
        </p>
        <div className="inline-flex overflow-hidden rounded-md border border-chalk bg-paper">
          <ModeButton active={view === "text"} onClick={() => setView("text")}>
            Text view
          </ModeButton>
          <ModeButton active={view === "ids"} onClick={() => setView("ids")}>
            Token IDs
          </ModeButton>
        </div>
      </div>

      <div
        className="min-h-[120px] overflow-hidden break-words [overflow-wrap:anywhere] rounded-md border border-chalk bg-paper p-4 font-mono text-[14px] leading-[2.1] text-navy"
        aria-label="Tokenized text. Each coloured segment is one token. Focus a token to hear its token ID."
      >
        {encoded.tokens.length === 0 ? (
          <span className="text-slate">Tokens will appear here as you type.</span>
        ) : view === "ids" ? (
          <span className="break-all text-[12px] text-slate">
            [{encoded.tokenIds.join(", ")}]
          </span>
        ) : (
          encoded.tokens.map((token, index) => (
            <TokenChip
              key={`${token.id}-${index}`}
              token={token}
              color={TOKEN_COLORS[index % TOKEN_COLORS.length]}
            />
          ))
        )}
      </div>
    </div>
  );
}

function TokenChip({ token, color }: { token: EncodedToken; color: string }) {
  return (
    <span
      tabIndex={0}
      title={`Token ID ${token.id}`}
      aria-label={`Token ID ${token.id}: ${describeToken(token.text)}`}
      className="mx-[1px] rounded-sm px-1 py-0.5 outline-none ring-terracotta focus:ring-2 [overflow-wrap:anywhere]"
      style={{ backgroundColor: color, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
    >
      {visibleTokenText(token.text)}
    </span>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${
        active ? "bg-navy text-white" : "text-slate hover:bg-white hover:text-navy"
      }`}
    >
      {children}
    </button>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-chalk bg-paper p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate">
        {label}
      </p>
      <p className="mt-2 font-display text-[34px] leading-none text-terracotta">
        {value}
      </p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate">
        {label}
      </p>
      <p className="mt-1 font-mono text-[12px] font-semibold text-navy">
        {value}
      </p>
    </div>
  );
}

function TokenizerError({ message }: { message: string }) {
  return (
    <p className="rounded-md border border-danger/25 bg-danger/5 p-3 text-[13px] leading-relaxed text-danger">
      Tokenization failed gracefully: {message}
    </p>
  );
}

function useEncodedText(text: string, encoding: TokenizerEncoding) {
  const [state, setState] = useState<{
    data: EncodedText;
    error: string | null;
    loading: boolean;
  }>({
    data: createEmptyEncodedText(encoding),
    error: null,
    loading: false,
  });

  useEffect(() => {
    let cancelled = false;
    setState((current) => ({
      ...current,
      loading: true,
      error: null,
      data: current.data.encoding === encoding ? current.data : createEmptyEncodedText(encoding),
    }));

    encodeText(text, encoding)
      .then((data) => {
        if (cancelled) return;
        setState({ data, error: null, loading: false });
      })
      .catch((error) => {
        if (cancelled) return;
        setState({
          data: createEmptyEncodedText(encoding),
          error: error instanceof Error ? error.message : "Unknown tokenizer error",
          loading: false,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [encoding, text]);

  return state;
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timeout);
  }, [delayMs, value]);

  return debounced;
}

function visibleTokenText(text: string) {
  if (!text) return "∅";
  return text
    .replace(/\t/g, "⇥")
    .replace(/\n/g, "↵\n");
}

function describeToken(text: string) {
  if (text === " ") return "space";
  if (text === "\n") return "line break";
  if (!text.trim()) return "whitespace";
  return text;
}

function formatMultiplier(multiplier: number | null) {
  if (!multiplier || !Number.isFinite(multiplier)) return "—";
  return `${multiplier.toFixed(1)}x`;
}
