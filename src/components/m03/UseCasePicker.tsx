interface UseCasePickerProps {
  value?: string;
  onChange: (useCaseId: string) => void;
}

const waveTwo = [
  "Customer Support Triage",
  "HR Policy Lookup",
  "Sales Quote Drafter",
];

export function UseCasePicker({ value, onChange }: UseCasePickerProps) {
  const selected = value === "competitor-pricing-monitor";
  return (
    <section className="card space-y-5">
      <header className="space-y-2">
        <p className="eyebrow">Which recurring task should we work through?</p>
        <p className="text-[14px] text-graphite">
          This is the example we will carry through every rung of the automation ladder.
        </p>
      </header>

      <button
        type="button"
        aria-pressed={selected}
        onClick={() => onChange("competitor-pricing-monitor")}
        className={`w-full rounded-lg border p-4 text-left transition-colors ${
          selected ? "border-terracotta bg-mist/70" : "border-chalk bg-white hover:border-terracotta/60"
        }`}
      >
        <span className="font-display text-lg text-navy">Competitor Pricing Monitor</span>
        <span className="ml-2 rounded-full bg-terracotta px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-white">
          Recommended
        </span>
        <span className="mt-2 block text-[13px] text-slate">
          Track public competitor pricing pages, extract plans and limits, summarize changes.
        </span>
      </button>

      <div className="space-y-2">
        {waveTwo.map((label) => (
          <div key={label} className="rounded-lg border border-chalk bg-paper/70 p-4 opacity-70">
            <span className="font-medium text-navy">{label}</span>
            <span className="ml-2 rounded-full border border-chalk px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-slate">
              Wave 2
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

