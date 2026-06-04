import type { M02BlueprintData } from "@/data/m02/blueprintSchema";

export function RetrievalTestsPanel({ blueprint }: { blueprint: M02BlueprintData }) {
  return (
    <div className="space-y-4">
      <p className="text-[14px] leading-relaxed text-graphite">{blueprint.retrievalTests.intro}</p>
      <div className="space-y-3">
        {blueprint.retrievalTests.tests.map((test) => (
          <div key={test.id} className="rounded-md border border-chalk bg-paper p-4">
            <p className="font-mono text-[12px] font-medium text-ink">{test.id}</p>
            <h5 className="mt-2 font-display text-base text-navy">{test.question}</h5>
            <dl className="mt-3 grid gap-2 text-[12px] md:grid-cols-3">
              <div>
                <dt className="font-mono uppercase tracking-[0.14em] text-slate">Expected entry</dt>
                <dd className="mt-1 text-graphite">{test.expectedEntry}</dd>
              </div>
              <div>
                <dt className="font-mono uppercase tracking-[0.14em] text-slate">Expected source</dt>
                <dd className="mt-1 text-graphite">{test.expectedSource}</dd>
              </div>
              <div>
                <dt className="font-mono uppercase tracking-[0.14em] text-slate">Expected behaviour</dt>
                <dd className="mt-1 text-graphite">{test.expectedBehaviour}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}
