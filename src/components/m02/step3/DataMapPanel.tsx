import type { M02BlueprintData } from "@/data/m02/blueprintSchema";

export function DataMapPanel({ blueprint }: { blueprint: M02BlueprintData }) {
  return (
    <div className="space-y-4">
      <p className="text-[14px] leading-relaxed text-graphite">{blueprint.dataMap.intro}</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-chalk text-[11px] uppercase tracking-[0.14em] text-slate">
              <th className="py-2 pr-3 font-mono">Information</th>
              <th className="py-2 pr-3 font-mono">Lives in</th>
              <th className="py-2 pr-3 font-mono">Owner</th>
              <th className="py-2 font-mono">Movement</th>
            </tr>
          </thead>
          <tbody>
            {blueprint.dataMap.locations.map((location) => (
              <tr key={location.information} className="border-b border-chalk/70 align-top">
                <td className="py-3 pr-3 font-medium text-navy">{location.information}</td>
                <td className="py-3 pr-3 text-graphite">{location.livesIn}</td>
                <td className="py-3 pr-3 text-graphite">{location.owner}</td>
                <td className="py-3 text-graphite">{location.movement}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
