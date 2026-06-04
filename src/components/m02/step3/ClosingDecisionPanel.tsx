import type { M02BlueprintStatus } from "@/data/m02/blueprintSchema";

interface ClosingDecisionPanelProps {
  useCaseName: string;
  componentLabels: readonly string[];
  hardestComponents: string[];
  componentNotes: Record<string, string>;
  status: M02BlueprintStatus | "";
  statusExplanation: string;
  onHardestChange: (components: string[]) => void;
  onNoteChange: (component: string, value: string) => void;
  onStatusChange: (status: M02BlueprintStatus) => void;
  onStatusExplanationChange: (value: string) => void;
}

const STATUS_OPTIONS: { id: M02BlueprintStatus; label: string; body: string }[] = [
  { id: "pass", label: "PASS", body: "All checks satisfied with evidence." },
  { id: "partial", label: "PARTIAL", body: "Most checks satisfied; gaps have owners and timelines." },
  { id: "blocked", label: "BLOCKED", body: "Critical gaps remain without a resolution path." },
];

export function ClosingDecisionPanel({
  useCaseName,
  componentLabels,
  hardestComponents,
  componentNotes,
  status,
  statusExplanation,
  onHardestChange,
  onNoteChange,
  onStatusChange,
  onStatusExplanationChange,
}: ClosingDecisionPanelProps) {
  const toggleComponent = (component: string) => {
    if (hardestComponents.includes(component)) {
      onHardestChange(hardestComponents.filter((item) => item !== component));
      return;
    }
    if (hardestComponents.length >= 3) return;
    onHardestChange([...hardestComponents, component]);
  };

  return (
    <section className="rounded-lg border border-chalk bg-white p-6 shadow-sm">
      <p className="eyebrow">CLOSING DECISION</p>
      <h4 className="mt-2 font-display text-2xl text-navy">
        You have now seen the seven components for {useCaseName}
      </h4>
      <div className="mt-4 grid gap-2 text-[13px] text-graphite sm:grid-cols-2">
        {componentLabels.map((label) => (
          <p key={label}>✓ {label}</p>
        ))}
      </div>

      <div className="mt-6 border-t border-chalk pt-5">
        <p className="text-sm font-medium text-navy">
          Looking at this blueprint, which one or two components would be hardest for your business to put in place today?
        </p>
        <p className="mt-1 text-[12px] italic text-slate">Choose 1-3. Add a one-sentence note if useful.</p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {componentLabels.map((component) => {
            const checked = hardestComponents.includes(component);
            const disabled = !checked && hardestComponents.length >= 3;
            return (
              <label
                key={component}
                className={`rounded-md border p-3 transition-colors ${
                  checked ? "border-terracotta bg-terracotta/5" : "border-chalk bg-paper"
                } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
              >
                <span className="flex items-start gap-2 text-[13px] text-navy">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggleComponent(component)}
                    className="mt-1 h-4 w-4 accent-terracotta"
                  />
                  <span>{component}</span>
                </span>
                {checked && (
                  <input
                    type="text"
                    value={componentNotes[component] ?? ""}
                    onChange={(event) => onNoteChange(component, event.target.value)}
                    placeholder="What makes this hard?"
                    className="mt-3 w-full rounded border border-chalk bg-white px-3 py-2 text-[12px] text-navy outline-none focus:border-terracotta"
                  />
                )}
              </label>
            );
          })}
        </div>
      </div>

      <div className="mt-6 border-t border-chalk pt-5">
        <p className="text-sm font-medium text-navy">
          What is your readiness status for taking this process into Build?
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onStatusChange(option.id)}
              className={`rounded-md border p-3 text-left transition-colors ${
                status === option.id ? "border-terracotta bg-terracotta/5" : "border-chalk bg-paper hover:bg-mist/40"
              }`}
            >
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-terracotta">
                {option.label}
              </span>
              <span className="mt-1 block text-[12px] leading-relaxed text-graphite">
                {option.body}
              </span>
            </button>
          ))}
        </div>
        <label className="mt-3 block">
          <span className="text-[12px] font-medium text-navy">Why this status?</span>
          <textarea
            value={statusExplanation}
            onChange={(event) => onStatusExplanationChange(event.target.value.slice(0, 200))}
            maxLength={200}
            rows={2}
            placeholder="One sentence. Example: We can build, but source ownership and security review need named owners."
            className="mt-2 w-full rounded-md border border-chalk bg-paper px-3 py-2 text-[13px] text-navy outline-none focus:border-terracotta"
          />
          <span className="mt-1 block text-right text-[11px] text-slate">
            {statusExplanation.length}/200
          </span>
        </label>
      </div>
    </section>
  );
}
