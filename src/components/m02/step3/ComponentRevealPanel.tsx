import { Lock } from "lucide-react";
import type { ReactNode } from "react";

interface ComponentRevealPanelProps {
  num: number;
  title: string;
  whatItIs: string;
  whyItMatters: string;
  useCaseName: string;
  revealLabel: string;
  isLocked: boolean;
  isRevealed: boolean;
  isCollapsed: boolean;
  isLast: boolean;
  whatToNotice: string;
  children: ReactNode;
  onReveal: () => void;
  onContinue: () => void;
  onToggleCollapse: () => void;
}

export function ComponentRevealPanel({
  num,
  title,
  whatItIs,
  whyItMatters,
  useCaseName,
  revealLabel,
  isLocked,
  isRevealed,
  isCollapsed,
  isLast,
  whatToNotice,
  children,
  onReveal,
  onContinue,
  onToggleCollapse,
}: ComponentRevealPanelProps) {
  if (isLocked) {
    return (
      <section
        tabIndex={-1}
        aria-disabled="true"
        aria-expanded="false"
        className="rounded-lg bg-mist/40 p-6 opacity-50"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow-muted">COMPONENT {num}</p>
            <h4 className="mt-2 font-display text-xl text-navy">{title}</h4>
          </div>
          <Lock className="h-5 w-5 text-slate" aria-hidden="true" />
        </div>
      </section>
    );
  }

  return (
    <section
      aria-expanded={isRevealed && !isCollapsed}
      className="rounded-lg border border-chalk bg-white p-6 shadow-sm"
    >
      <button
        type="button"
        onClick={isRevealed ? onToggleCollapse : undefined}
        className={`w-full text-left ${isRevealed ? "cursor-pointer" : "cursor-default"}`}
      >
        <p className="eyebrow">COMPONENT {num}</p>
        <div className="mt-2 flex items-start justify-between gap-3">
          <h4 className="font-display text-2xl text-navy">{title}</h4>
          {isRevealed && (
            <span className="rounded-full border border-chalk px-2 py-1 text-[11px] text-slate">
              {isCollapsed ? "Expand" : "Collapse"}
            </span>
          )}
        </div>
      </button>

      {(!isRevealed || !isCollapsed) && (
        <div className="mt-5 space-y-5">
          {!isRevealed && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="eyebrow-muted">WHAT IT IS</p>
                  <p className="mt-2 text-[14px] leading-relaxed text-graphite">{whatItIs}</p>
                </div>
                <div className="rounded-md bg-mist/60 p-4">
                  <p className="eyebrow-muted">WHY IT MATTERS</p>
                  <p className="mt-2 text-[14px] leading-relaxed text-graphite">{whyItMatters}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onReveal}
                className="rounded-md bg-terracotta px-4 py-2 text-sm font-medium text-white hover:bg-navy"
              >
                Show me {revealLabel} for {useCaseName} →
              </button>
            </>
          )}

          {isRevealed && (
            <>
              <div>{children}</div>
              <div className="rounded-md bg-mist/50 p-4">
                <p className="eyebrow-muted">WHAT TO NOTICE</p>
                <p className="mt-2 text-[14px] leading-relaxed text-graphite">{whatToNotice}</p>
              </div>
              {!isLast && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={onContinue}
                    className="rounded-md border border-terracotta/30 bg-terracotta/5 px-4 py-2 text-sm font-medium text-terracotta hover:bg-terracotta/10"
                  >
                    Continue → next component
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
