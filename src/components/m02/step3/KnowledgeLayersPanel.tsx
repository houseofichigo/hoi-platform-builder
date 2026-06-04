import type { M02BlueprintData } from "@/data/m02/blueprintSchema";

export function KnowledgeLayersPanel({ blueprint }: { blueprint: M02BlueprintData }) {
  return (
    <div className="space-y-4">
      <p className="text-[14px] leading-relaxed text-graphite">{blueprint.knowledgeLayers.intro}</p>
      <div className="grid gap-3 lg:grid-cols-3">
        {blueprint.knowledgeLayers.layers.map((layer, index) => (
          <div key={layer.name} className="rounded-md border border-chalk bg-paper p-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-terracotta">
              Layer {index + 1}
            </p>
            <h5 className="mt-2 font-display text-lg text-navy">{layer.name} knowledge</h5>
            <p className="mt-1 text-[12px] text-slate">{layer.description}</p>
            <ul className="mt-3 space-y-2">
              {layer.sources.map((source) => (
                <li key={source.item} className="text-[13px] text-graphite">
                  <strong className="text-navy">{source.item}</strong>
                  <span className="block text-[12px] text-slate">from {source.from}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
