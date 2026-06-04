import type { M02BlueprintData } from "@/data/m02/blueprintSchema";

export function LineagePanel({ blueprint }: { blueprint: M02BlueprintData }) {
  return (
    <div className="space-y-4">
      <p className="text-[14px] leading-relaxed text-graphite">{blueprint.lineage.intro}</p>
      <div className="rounded-md bg-mist/60 p-4">
        <p className="eyebrow-muted">SOURCE PRECEDENCE</p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-[13px] text-graphite">
          {blueprint.lineage.precedenceRules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ol>
      </div>
      <div className="rounded-md border border-chalk bg-paper p-4">
        <p className="eyebrow-muted">LINEAGE EXAMPLE</p>
        <p className="mt-2 text-[13px] leading-relaxed text-graphite">
          {blueprint.lineage.lineageExample}
        </p>
      </div>
    </div>
  );
}
