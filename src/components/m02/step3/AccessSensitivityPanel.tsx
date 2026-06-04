import type { M02BlueprintData } from "@/data/m02/blueprintSchema";

export function AccessSensitivityPanel({ blueprint }: { blueprint: M02BlueprintData }) {
  return (
    <div className="space-y-4">
      <p className="text-[14px] leading-relaxed text-graphite">
        {blueprint.accessSensitivity.intro}
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {blueprint.accessSensitivity.classifications.map((classification) => (
          <div key={classification.level} className="rounded-md border border-chalk bg-paper p-4">
            <h5 className="font-display text-lg text-navy">{classification.level}</h5>
            <p className="mt-1 text-[13px] leading-relaxed text-graphite">
              {classification.description}
            </p>
            <p className="mt-3 text-[12px] text-slate">
              Applies to: {classification.appliesTo.join(", ")}
            </p>
            <p className="mt-2 text-[12px] font-medium text-navy">
              AI behaviour: {classification.aiBehaviour}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
