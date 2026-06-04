import type { M02BlueprintData, M02GeneratedBlueprint } from "@/data/m02/blueprintSchema";
import type { ReactNode } from "react";
import { governanceItems } from "./BlueprintGenerator";

interface BlueprintDocumentProps {
  blueprint: M02BlueprintData;
  generated: M02GeneratedBlueprint;
}

export function BlueprintDocument({ blueprint, generated }: BlueprintDocumentProps) {
  return (
    <article className="rounded-lg border border-chalk bg-white p-6 shadow-sm md:p-8">
      <div className="border-b border-chalk pb-5">
        <p className="eyebrow">GENERATED OPERATIONAL SPEC</p>
        <h3 className="mt-2 font-display text-3xl text-navy">
          {blueprint.useCaseName} Knowledge Base Blueprint
        </h3>
        <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-graphite">
          {blueprint.useCaseDescription}
        </p>
      </div>

      <BlueprintSection title="Section 1 - Index">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] border-collapse text-left text-[12px]">
            <thead>
              <tr className="border-b border-chalk text-[10px] uppercase tracking-[0.14em] text-slate">
                <th className="py-2 pr-3 font-mono">Entry ID</th>
                <th className="py-2 pr-3 font-mono">Title</th>
                <th className="py-2 pr-3 font-mono">Layer</th>
                <th className="py-2 pr-3 font-mono">Category</th>
                <th className="py-2 pr-3 font-mono">Source</th>
                <th className="py-2 font-mono">Summary</th>
              </tr>
            </thead>
            <tbody>
              {blueprint.entries.items.map((entry) => (
                <tr key={entry.id} className="border-b border-chalk/70 align-top">
                  <td className="py-3 pr-3 font-mono font-medium text-ink">{entry.id}</td>
                  <td className="py-3 pr-3 font-medium text-navy">{entry.title}</td>
                  <td className="py-3 pr-3 text-graphite">{entry.layer}</td>
                  <td className="py-3 pr-3 text-graphite">{entry.category}</td>
                  <td className="py-3 pr-3 text-graphite">
                    {entry.source}
                    <span className="block text-slate">{entry.sourceOwner}</span>
                  </td>
                  <td className="py-3 text-graphite">{entry.content.split(". ")[0]}.</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </BlueprintSection>

      <BlueprintSection title="Section 2 - Retrieval Instructions">
        <div className="rounded-lg bg-mist p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-terracotta">
            AI-FACING INSTRUCTIONS
          </p>
          <InstructionBlock label="Scope" value={blueprint.retrievalInstructions.scope} />
          <InstructionList label="Retrieval order" items={blueprint.retrievalInstructions.retrievalOrder} />
          <InstructionList label="Source precedence" items={blueprint.retrievalInstructions.sourcePrecedence} />
          <InstructionBlock label="Citation" value={blueprint.retrievalInstructions.citation} />
          <InstructionBlock label="Sensitivity" value={blueprint.retrievalInstructions.sensitivity} />
          <InstructionBlock label="Boundary behaviour" value={blueprint.retrievalInstructions.boundaryBehaviour} />
        </div>
      </BlueprintSection>

      <BlueprintSection title="Section 3 - Retrieval Test Suite">
        <div className="grid gap-3">
          {blueprint.retrievalTests.tests.map((test) => (
            <div key={test.id} className="rounded-md border border-chalk bg-paper p-4">
              <p className="font-mono text-[12px] font-medium text-ink">{test.id}</p>
              <h4 className="mt-2 font-display text-base text-navy">{test.question}</h4>
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
      </BlueprintSection>

      <BlueprintSection title="Section 4 - Governance Register">
        <div className="space-y-3">
          {governanceItems(generated).map((item) => (
            <div key={item.title} className="rounded-md border border-chalk bg-paper p-4">
              <h4 className="font-display text-base text-navy">{item.title}</h4>
              <p className="mt-1 text-[13px] text-graphite">{item.note}</p>
              <p className="mt-3 text-[12px] text-slate">Action needed: {item.action}</p>
              <p className="text-[12px] text-slate">Owner-of-the-fix: TBD - team to assign</p>
              <p className="text-[12px] text-slate">Target date: TBD</p>
            </div>
          ))}
          <div className="rounded-md bg-mist/50 p-4">
            <p className="eyebrow-muted">NAMED GAPS FROM STEP 2</p>
            <ul className="mt-3 space-y-1 text-[13px] text-graphite">
              {generated.namedGaps.length ? (
                generated.namedGaps.map((gap) => <li key={gap}>· {gap}</li>)
              ) : (
                <li>· No named gaps recorded.</li>
              )}
            </ul>
          </div>
        </div>
      </BlueprintSection>

      <BlueprintSection title="Section 5 - Forward Path">
        <div className="space-y-3 text-[14px] leading-relaxed text-graphite">
          <p>
            In M04, this blueprint becomes the specification for a real AI assistant. The
            assistant should ingest this index, apply these retrieval instructions, and run these
            tests before it is trusted in a workflow.
          </p>
          <p>
            At Gate 1, the governance register becomes the pre-Build checklist. The team should
            decide which open items must be resolved before building and which can move forward
            with named constraints.
          </p>
          <p>
            Your team now has a document that can be handed to a developer, vendor, CIO, or
            internal owner to explain what an AI-ready knowledge base for this process should look
            like.
          </p>
          <p className="rounded-md bg-terracotta/5 p-4 font-medium text-navy">
            Chosen readiness status: {generated.status.toUpperCase()}. {generated.statusExplanation}
          </p>
        </div>
      </BlueprintSection>
    </article>
  );
}

function BlueprintSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-chalk py-6 last:border-b-0">
      <h3 className="font-display text-2xl text-navy">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function InstructionBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate">{label}</p>
      <p className="mt-1 text-[13px] leading-relaxed text-ink">{value}</p>
    </div>
  );
}

function InstructionList({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="mt-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate">{label}</p>
      <ol className="mt-1 list-decimal space-y-1 pl-5 text-[13px] leading-relaxed text-ink">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ol>
    </div>
  );
}
