import type { ReactNode } from "react";
import type {
  Platform,
  ReflectionAnswers,
  RungSpec,
} from "@/data/m03/m03Schema";
import { isRungAvailable } from "@/data/m03/capabilityMatrix";
import { platforms } from "@/data/m03/platforms";
import { CapabilityMatrixView } from "./CapabilityMatrixView";
import { GOVERNANCE_GAP_LABELS, RUNG_LABELS } from "./m03Display";

interface ClosingReflectionPanelProps {
  platform: Platform;
  revealedRungs: RungSpec[];
  reflectionAnswers?: ReflectionAnswers;
  readinessStatus?: "PASS" | "PARTIAL" | "BLOCKED";
  readinessExplanation?: string;
  onReflectionChange: (answers: ReflectionAnswers) => void;
  onReadinessChange: (status: "PASS" | "PARTIAL" | "BLOCKED", explanation: string) => void;
  children: ReactNode;
}

const statuses: Array<{
  id: "PASS" | "PARTIAL" | "BLOCKED";
  label: string;
  description: string;
}> = [
  { id: "PASS", label: "PASS", description: "Ready to use at the chosen rung with normal review." },
  { id: "PARTIAL", label: "PARTIAL", description: "Useful, but one or more controls must be closed first." },
  { id: "BLOCKED", label: "BLOCKED", description: "Do not automate this yet; prerequisites are missing." },
];

export function ClosingReflectionPanel({
  platform,
  revealedRungs,
  reflectionAnswers,
  readinessStatus,
  readinessExplanation = "",
  onReflectionChange,
  onReadinessChange,
  children,
}: ClosingReflectionPanelProps) {
  const platformConfig = platforms[platform];
  const answers = reflectionAnswers ?? { currentRung: 0, targetRung: 0, governanceGaps: [] };

  const updateAnswers = (patch: Partial<ReflectionAnswers>) => {
    onReflectionChange({ ...answers, ...patch });
  };

  return (
    <section className="card space-y-6">
      <header className="space-y-2">
        <p className="eyebrow">You have walked the ladder for {platformConfig.displayName}</p>
        <p className="text-[14px] text-graphite">
          You saw these rungs applied to Competitor Pricing Monitor:
        </p>
        <ul className="grid gap-1 text-[13px] text-navy md:grid-cols-2">
          {revealedRungs.map((rung) => (
            <li key={rung.rungNumber}>✓ Rung {rung.rungNumber} — {rung.rungName}</li>
          ))}
        </ul>
      </header>

      <CapabilityMatrixView defaultOpen highlightedPlatform={platform} />

      <div className="space-y-6">
        <RungChoice
          label="Looking at the full ladder, which rung is right for your team today?"
          platform={platform}
          value={answers.currentRung}
          onChange={(currentRung) => updateAnswers({ currentRung })}
        />
        <RungChoice
          label="Which rung would you aspire to in 6 months?"
          platform={platform}
          value={answers.targetRung}
          onChange={(targetRung) => updateAnswers({ targetRung })}
        />

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-navy">
            What governance do you need in place before climbing higher?
          </legend>
          <div className="grid gap-2 md:grid-cols-2">
            {Object.entries(GOVERNANCE_GAP_LABELS).map(([key, label]) => (
              <label key={key} className="flex cursor-pointer items-start gap-3 rounded-md border border-chalk bg-white p-3 text-[13px] text-navy">
                <input
                  type="checkbox"
                  checked={answers.governanceGaps.includes(key)}
                  onChange={() =>
                    updateAnswers({
                      governanceGaps: answers.governanceGaps.includes(key)
                        ? answers.governanceGaps.filter((item) => item !== key)
                        : [...answers.governanceGaps, key],
                    })
                  }
                  className="mt-1 h-4 w-4 accent-terracotta"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-navy">
            What is your overall automation readiness status?
          </legend>
          <div className="grid gap-2 md:grid-cols-3">
            {statuses.map((status) => (
              <label
                key={status.id}
                className={`cursor-pointer rounded-md border p-3 ${
                  readinessStatus === status.id ? "border-terracotta bg-mist" : "border-chalk bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="m03-readiness"
                  checked={readinessStatus === status.id}
                  onChange={() => onReadinessChange(status.id, readinessExplanation)}
                  className="sr-only"
                />
                <span className="font-mono text-[12px] text-navy">{status.label}</span>
                <span className="mt-1 block text-[12px] text-slate">{status.description}</span>
              </label>
            ))}
          </div>
          <textarea
            value={readinessExplanation}
            maxLength={200}
            rows={3}
            onChange={(e) =>
              onReadinessChange(readinessStatus ?? "PARTIAL", e.target.value)
            }
            className="input-ichigo"
            placeholder="One sentence: why this status?"
          />
          <p className="text-right font-mono text-[11px] text-slate">
            {readinessExplanation.length} / 200
          </p>
        </fieldset>
      </div>

      {children}
    </section>
  );
}

function RungChoice({
  label,
  platform,
  value,
  onChange,
}: {
  label: string;
  platform: Platform;
  value: number;
  onChange: (rung: number) => void;
}) {
  const platformConfig = platforms[platform];
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-navy">{label}</legend>
      <div className="grid gap-2 md:grid-cols-2">
        {Array.from({ length: 10 }, (_, index) => index + 1).map((rung) => {
          const available = isRungAvailable(rung, platform);
          return (
            <label
              key={rung}
              className={`cursor-pointer rounded-md border p-3 ${
                value === rung ? "border-terracotta bg-mist" : "border-chalk bg-white"
              }`}
            >
              <input
                type="radio"
                checked={value === rung}
                onChange={() => onChange(rung)}
                className="sr-only"
              />
              <span className="text-[13px] font-medium text-navy">
                Rung {rung} — {RUNG_LABELS[rung]}
              </span>
              {!available && (
                <span className="mt-1 block text-[11px] text-slate">
                  Not available in {platformConfig.displayName} today; use this as a tooling
                  decision for M04.
                </span>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

