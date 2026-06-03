import type { OCRBlock as KnowledgeBlock } from "@/lib/assess/content/types";

interface KnowledgeBlockWalkthroughProps {
  block: KnowledgeBlock;
  showGovernance?: boolean;
}

export function KnowledgeBlockWalkthrough({
  block,
  showGovernance = true,
}: KnowledgeBlockWalkthroughProps) {
  return (
    <div className="space-y-6">
      {block.intro && <p className="text-slate text-sm leading-relaxed">{block.intro}</p>}

      {block.rows.map((row, i) => (
        <div
          key={i}
          className="space-y-3 rounded-md border border-chalk bg-white p-4"
        >
          <h4 className="font-display text-navy text-base">{row.label}</h4>

          <div className="flex flex-wrap gap-2">
            {row.options.map((opt) => {
              const chosen = opt === row.value;
              return (
                <span
                  key={opt}
                  className={
                    chosen
                      ? "inline-flex items-center rounded-full border border-terracotta bg-terracotta/10 px-2.5 py-1 text-xs font-medium text-terracotta"
                      : "inline-flex items-center rounded-full border border-chalk bg-mist/40 px-2.5 py-1 text-xs text-slate line-through"
                  }
                >
                  {opt}
                </span>
              );
            })}
          </div>

          <div className="space-y-1">
            <div className="eyebrow-muted">Why we chose this over the others</div>
            <p className="text-sm leading-relaxed text-graphite">{row.why}</p>
          </div>

          {showGovernance && row.governance && (
            <div className="grid grid-cols-1 gap-3 border-t border-chalk pt-3 md:grid-cols-2">
              <GovItem label="Ownership" value={row.governance.ownership} />
              <GovItem label="Lineage" value={row.governance.lineage} />
              <GovItem label="Quality" value={row.governance.quality} />
              <GovItem label="Access" value={row.governance.access} />
              <div className="md:col-span-2">
                <GovItem label="Privacy" value={row.governance.privacy} />
              </div>
            </div>
          )}
        </div>
      ))}

      {block.computed && (
        <div className="space-y-1 rounded-md border border-navy/20 bg-mist/40 p-4">
          <div className="eyebrow text-navy">{block.computed.label}</div>
          <p className="text-sm leading-relaxed text-graphite">{block.computed.body}</p>
        </div>
      )}
    </div>
  );
}

function GovItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <div className="eyebrow-muted">{label}</div>
      <p className="text-sm leading-snug text-graphite">{value}</p>
    </div>
  );
}
