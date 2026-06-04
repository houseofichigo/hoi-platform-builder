import type { M02BlueprintData } from "@/data/m02/blueprintSchema";

export function EntriesPanel({ blueprint }: { blueprint: M02BlueprintData }) {
  return (
    <div className="space-y-4">
      <p className="text-[14px] leading-relaxed text-graphite">{blueprint.entries.intro}</p>
      <div className="space-y-3">
        {blueprint.entries.items.map((entry) => (
          <div key={entry.id} className="rounded-md border border-chalk bg-paper p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[12px] font-medium text-ink">{entry.id}</span>
              <span className="rounded-full bg-mist px-2 py-0.5 text-[11px] text-slate">
                {entry.layer}
              </span>
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-slate">
                {entry.category}
              </span>
            </div>
            <h5 className="mt-3 font-display text-lg text-navy">{entry.title}</h5>
            <p className="mt-2 text-[13px] leading-relaxed text-graphite">{entry.content}</p>
            <p className="mt-3 text-[12px] text-slate">
              Source: {entry.source} · Owner: {entry.sourceOwner}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
