import type { LadderRungResult, RungSpec } from "@/data/m03/m03Schema";

export function LadderProgressIndicator({
  rungs,
  walkthrough,
}: {
  rungs: RungSpec[];
  walkthrough: Record<number, LadderRungResult>;
}) {
  return (
    <div className="flex max-w-full gap-2 overflow-x-auto py-2" aria-label="Ladder progress">
      {rungs.map((rung) => {
        const revealed = Boolean(walkthrough[rung.rungNumber]?.revealed);
        return (
          <span
            key={rung.rungNumber}
            title={`Rung ${rung.rungNumber}: ${rung.rungName}`}
            className={`h-3 w-3 shrink-0 rounded-full border ${
              revealed ? "border-terracotta bg-terracotta" : "border-chalk bg-mist"
            }`}
          />
        );
      })}
    </div>
  );
}

