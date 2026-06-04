import type { SecurityRisk } from "@/lib/assess/content/types";

interface Props {
  risks: readonly SecurityRisk[];
  selected: string[];
  mitigations: Record<string, string>;
  onToggle: (id: string) => void;
  onMitigationChange: (id: string, text: string) => void;
}

export function SecurityRiskPicker({
  risks,
  selected,
  mitigations,
  onToggle,
  onMitigationChange,
}: Props) {
  return (
    <ul className="space-y-3">
      {risks.map((r) => {
        const isSelected = selected.includes(r.id);
        const atLimit = selected.length >= 3 && !isSelected;
        return (
          <li
            key={r.id}
            className={`rounded-md border px-3 py-3 space-y-2 transition-colors ${
              isSelected ? "border-terracotta bg-terracotta/5" : "border-chalk bg-white"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-navy">{r.title}</p>
                <p className="text-[12px] text-slate">{r.threat}</p>
                <p className="text-[12px] text-slate">
                  <span className="font-medium text-navy">Evidence:</span> {r.evidence}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (atLimit) return;
                  onToggle(r.id);
                }}
                disabled={atLimit}
                className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-mono uppercase tracking-[0.16em] transition-colors ${
                  isSelected
                    ? "bg-terracotta text-white"
                    : atLimit
                      ? "bg-mist text-slate/50 cursor-not-allowed"
                      : "bg-mist text-slate hover:bg-mist/70"
                }`}
              >
                {isSelected ? "selected" : atLimit ? "limit 3" : "select"}
              </button>
            </div>
            {isSelected && (
              <div className="space-y-2 rounded-md border border-chalk bg-paper p-3">
                <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-slate">
                  Generated mitigation
                </p>
                <p className="text-[12px] leading-relaxed text-navy">
                  {mitigations[r.id] || r.mitigation}
                </p>
                <details className="group">
                  <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.16em] text-slate hover:text-navy">
                    Advanced edit (optional)
                  </summary>
                  <textarea
                    value={mitigations[r.id] ?? r.mitigation}
                    onChange={(e) => onMitigationChange(r.id, e.target.value)}
                    rows={2}
                    placeholder={r.mitigation}
                    className="mt-2 w-full rounded-md border border-chalk bg-white p-2 font-mono text-[12px] text-navy outline-none focus:border-terracotta"
                  />
                </details>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
