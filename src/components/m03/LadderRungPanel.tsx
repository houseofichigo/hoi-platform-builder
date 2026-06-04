import { useState } from "react";
import type { LadderRungResult, Platform, RungSpec } from "@/data/m03/m03Schema";

interface LadderRungPanelProps {
  rung: RungSpec;
  platform: Platform;
  locked: boolean;
  result?: LadderRungResult;
  onReveal: () => void;
  onResultChange: (result: LadderRungResult) => void;
  onContinue: () => void;
  isLast: boolean;
}

const answerOptions: Array<"yes" | "no" | "maybe"> = ["yes", "no", "maybe"];

export function LadderRungPanel({
  rung,
  platform,
  locked,
  result,
  onReveal,
  onResultChange,
  onContinue,
  isLast,
}: LadderRungPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const revealed = Boolean(result?.revealed);
  const variant = rung.platformVariants[platform];

  if (locked) {
    return (
      <section
        id={`m03-rung-${rung.rungNumber}`}
        aria-disabled="true"
        tabIndex={-1}
        className="rounded-lg bg-white p-5 opacity-50"
      >
        <p className="font-display text-lg text-navy">
          {rung.rungNumber}. {rung.rungName} <span aria-hidden>🔒</span>
        </p>
      </section>
    );
  }

  if (revealed && collapsed) {
    return (
      <button
        type="button"
        id={`m03-rung-${rung.rungNumber}`}
        aria-expanded="false"
        onClick={() => setCollapsed(false)}
        className="w-full rounded-lg border border-chalk bg-white p-5 text-left"
      >
        <span className="font-display text-lg text-navy">
          Rung {rung.rungNumber} — {rung.rungName}
        </span>
        <span className="mt-1 block text-[13px] text-slate">{rung.capability}</span>
      </button>
    );
  }

  return (
    <section
      id={`m03-rung-${rung.rungNumber}`}
      aria-expanded={revealed}
      className="rounded-lg border border-chalk bg-white p-5 space-y-5"
    >
      <header className="space-y-3">
        <button
          type="button"
          onClick={() => revealed && setCollapsed(true)}
          className="text-left"
        >
          <p className="eyebrow">Rung {rung.rungNumber}</p>
          <h3 className="font-display text-xl text-navy">{rung.rungName}</h3>
        </button>
        <GovernanceDots weight={rung.governanceWeight} />
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <InfoBlock label="What it is">{rung.conceptDefinition}</InfoBlock>
        <InfoBlock label="Why it matters">{rung.whyItMatters}</InfoBlock>
      </div>
      <InfoBlock label="What is at stake">
        <span className="font-medium text-navy">Capability gained:</span> {rung.capability}
        <br />
        <span className="font-medium text-navy">Failure mode:</span> {rung.failureMode}
      </InfoBlock>

      {!revealed ? (
        <button type="button" className="btn-ichigo btn-ichigo-primary" onClick={onReveal}>
          Show me this rung →
        </button>
      ) : (
        <div className="space-y-5">
          <div className="rounded-md border border-chalk bg-mist p-4">
            <p className="eyebrow-muted">Artifact for this rung</p>
            <pre className="mt-3 whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-ink">
              {rung.promptOrArtifact}
            </pre>
          </div>

          {variant && (
            <div className="rounded-md border border-chalk bg-white p-4">
              <p className="eyebrow-muted">How to try it in your platform</p>
              <p className="mt-2 text-[13px] font-medium text-navy">{variant.whereToFindIt}</p>
              <ol className="mt-3 list-decimal space-y-1 pl-5 text-[13px] text-navy">
                {variant.stepByStepInstructions.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <p className="mt-3 text-[13px] text-graphite">{variant.expectedOutcome}</p>
              {variant.tipsAndCautions?.length ? (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-[12px] text-slate">
                  {variant.tipsAndCautions.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          )}

          {rung.rungNumber === 9 && (
            <div className="rounded-lg border border-danger/30 bg-danger/5 p-4 space-y-2">
              <p className="eyebrow text-danger">Safety framing</p>
              <p className="text-[13px] leading-relaxed text-navy">
                For your first run, use a sandbox or demo website instead of a live business system.
                Agentic browsing can be misdirected by page content, and any form click can become a
                visible business action. Keep human gates on every write, sign-in, purchase, message,
                or contact action.
              </p>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <RadioCluster
              label="Tested this rung?"
              value={result?.tested}
              onChange={(tested) => onResultChange({ revealed: true, tested, relevantForTeam: result?.relevantForTeam })}
            />
            <RadioCluster
              label="Relevant for your team?"
              value={result?.relevantForTeam}
              onChange={(relevantForTeam) =>
                onResultChange({ revealed: true, tested: result?.tested, relevantForTeam })
              }
            />
          </div>

          <div className="flex justify-end">
            <button type="button" className="btn-ichigo btn-ichigo-secondary" onClick={onContinue}>
              {isLast ? "Continue → reflection" : "Continue → next rung"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function GovernanceDots({ weight }: { weight: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`Governance weight ${weight} out of 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          className={`h-2 w-8 rounded-full ${index < weight ? "bg-terracotta" : "bg-chalk"}`}
        />
      ))}
    </div>
  );
}

function InfoBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-chalk bg-paper/60 p-4">
      <p className="eyebrow-muted">{label}</p>
      <p className="mt-2 text-[13px] leading-relaxed text-graphite">{children}</p>
    </div>
  );
}

function RadioCluster({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: "yes" | "no" | "maybe";
  onChange: (value: "yes" | "no" | "maybe") => void;
}) {
  return (
    <fieldset className="rounded-md border border-chalk bg-white p-4">
      <legend className="text-sm font-medium text-navy">{label}</legend>
      <div className="mt-3 flex gap-2">
        {answerOptions.map((option) => (
          <label key={option} className="cursor-pointer">
            <input
              type="radio"
              checked={value === option}
              onChange={() => onChange(option)}
              className="sr-only"
            />
            <span
              className={`inline-flex rounded-md border px-3 py-1.5 text-[13px] capitalize ${
                value === option ? "border-terracotta bg-terracotta text-white" : "border-chalk bg-white text-navy"
              }`}
            >
              {option}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
