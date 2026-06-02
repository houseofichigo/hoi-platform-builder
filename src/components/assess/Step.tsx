import { type ReactNode, useState, useEffect } from "react";
import { useAssessOutput } from "@/hooks/useAssess";

export interface StepSection {
  id: string;
  label?: string;
  content: ReactNode;
}

export interface StepProps {
  storyHeader?: string;
  chapterLabel: string;
  stepLabel: string;
  title: string;
  why?: ReactNode;
  example?: ReactNode;
  whatToNotice?: ReactNode;
  yourVersion?: ReactNode;
  produces?: ReactNode;
  sections?: StepSection[];
  chapterId?: string;
  outputKey?: string;
  ackOnly?: boolean;
  ackLabel?: string;
  disabledReason?: string;
  canContinue?: boolean;
  nextLabel?: string;
  onBack?: () => void;
  onContinue?: () => void;
}

export function Step({
  storyHeader,
  chapterLabel,
  stepLabel,
  title,
  why,
  example,
  whatToNotice,
  yourVersion,
  produces,
  sections,
  outputKey,
  ackOnly,
  ackLabel = "Mark as acknowledged",
  disabledReason,
  canContinue,
  nextLabel = "Continue",
  onBack,
  onContinue,
}: StepProps) {
  const output = useAssessOutput<string | boolean>(outputKey ?? "");
  const [draft, setDraft] = useState<string>("");
  const [acked, setAcked] = useState<boolean>(false);

  // Hydrate from persisted output
  useEffect(() => {
    if (!outputKey) return;
    if (output.isLoading) return;
    if (ackOnly) {
      setAcked(output.value === true);
    } else if (typeof output.value === "string") {
      setDraft(output.value);
    }
  }, [outputKey, output.isLoading, output.value, ackOnly]);

  const hasOutput = ackOnly ? acked : draft.trim().length > 0;
  const computedCanContinue = canContinue ?? (outputKey ? hasOutput : true);

  const persist = async () => {
    if (!outputKey) return;
    if (ackOnly) {
      await output.setValue.mutateAsync(true);
    } else if (draft.trim().length > 0) {
      await output.setValue.mutateAsync(draft);
    }
  };

  const handleContinue = async () => {
    await persist();
    onContinue?.();
  };

  const helperItems = [
    { label: "WHY THIS MATTERS", content: why, variant: "prose" },
    { label: "EXAMPLE", content: example, variant: "example" },
    { label: "WHAT TO NOTICE", content: whatToNotice, variant: "prose" },
    { label: "PRODUCES", content: produces, variant: "produce" },
  ].filter((item): item is { label: string; content: ReactNode; variant: string } => Boolean(item.content));

  return (
    <article className="space-y-8 opacity-100 transition-opacity duration-200">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <main className="min-w-0 space-y-8">
          {storyHeader && (
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-slate">
              {storyHeader}
            </p>
          )}

          <header className="space-y-3">
            <p className="eyebrow">
              {chapterLabel} · {stepLabel}
            </p>
            <h2 className="h-display-sm max-w-[30ch]">{title}</h2>
          </header>

          {yourVersion && (
            <section className="space-y-3">
              <p className="eyebrow-muted">YOUR VERSION</p>
              <div>{yourVersion}</div>
            </section>
          )}

          {sections?.map((s) => (
            <section key={s.id} className="space-y-3">
              {s.label && <p className="eyebrow-muted">{s.label}</p>}
              <div>{s.content}</div>
            </section>
          ))}

          {outputKey && !yourVersion && !ackOnly && (
            <section className="space-y-3">
              <p className="eyebrow-muted">YOUR RESPONSE</p>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={6}
                placeholder="Write your response..."
                className="w-full rounded-md border border-chalk bg-white p-3 text-[14px] text-navy outline-none focus:border-terracotta"
              />
            </section>
          )}

          {outputKey && ackOnly && (
            <section className="rounded-md border border-chalk bg-white p-4">
              <label className="inline-flex cursor-pointer items-center gap-3 text-[14px] text-navy">
                <input
                  type="checkbox"
                  checked={acked}
                  onChange={(e) => setAcked(e.target.checked)}
                  className="h-4 w-4 accent-terracotta"
                />
                {ackLabel}
              </label>
            </section>
          )}
        </main>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {helperItems.length > 0 ? (
            helperItems.map((item) => (
              <section
                key={item.label}
                className={`rounded-md border p-4 ${
                  item.variant === "produce"
                    ? "border-terracotta/25 bg-terracotta/5"
                    : item.variant === "example"
                      ? "border-chalk bg-mist/40"
                      : "border-chalk bg-white"
                }`}
              >
                <p className={item.variant === "produce" ? "eyebrow text-terracotta" : "eyebrow-muted"}>
                  {item.label}
                </p>
                <div className="prose-ichigo mt-3 text-[14px] leading-relaxed">{item.content}</div>
              </section>
            ))
          ) : (
            <section className="rounded-md border border-chalk bg-white p-4">
              <p className="eyebrow-muted">ASSIGNMENT STEP</p>
              <p className="mt-3 text-[14px] leading-relaxed text-graphite">
                Complete this step, save your response, then continue through the assignment.
              </p>
            </section>
          )}
        </aside>
      </div>

      <footer className="sticky bottom-0 z-20 -mx-4 flex items-center justify-between gap-4 border-t border-chalk bg-paper/95 px-4 py-4 backdrop-blur sm:mx-0 sm:px-0">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="text-[13px] font-medium text-slate hover:text-navy"
          >
            ← Back
          </button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3">
          {!computedCanContinue && disabledReason && (
            <span className="text-[12px] italic text-slate">{disabledReason}</span>
          )}
          <button
            type="button"
            disabled={!computedCanContinue || output.setValue.isPending}
            onClick={handleContinue}
            className="btn-ichigo btn-ichigo-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {nextLabel} →
          </button>
        </div>
      </footer>
    </article>
  );
}
