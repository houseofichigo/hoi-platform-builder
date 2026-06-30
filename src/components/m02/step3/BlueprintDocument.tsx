import type { M02BlueprintData, M02GeneratedBlueprint } from "@/data/m02/blueprintSchema";
import type { ReactNode } from "react";
import { governanceItems } from "./BlueprintGenerator";

interface BlueprintDocumentProps {
  blueprint: M02BlueprintData;
  generated: M02GeneratedBlueprint;
}

export function BlueprintDocument({ blueprint, generated }: BlueprintDocumentProps) {
  const { c1, c2, c3 } = blueprint.components;
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

      <BlueprintSection title="C1 - Data Map">
        <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-md border border-chalk bg-paper p-4">
            <p className="eyebrow-muted">RAW SOURCE</p>
            <h4 className="mt-2 font-display text-lg text-navy">{c1.rawSource.name}</h4>
            <Fact label="Format" value={c1.rawSource.format} />
            <Fact label="Starting state" value={c1.rawSource.startingState} />
            <Fact label="Why AI cannot use it yet" value={c1.rawSource.whyAiCannotUseItYet} />
          </div>
          <div className="rounded-md border border-chalk bg-white p-4">
            <p className="eyebrow-muted">AI-READY KB ENTRY</p>
            <h4 className="mt-2 font-display text-lg text-navy">
              {c1.kbEntry.id} · {c1.kbEntry.title}
            </h4>
            <p className="mt-2 text-[13px] leading-relaxed text-graphite">{c1.kbEntry.content}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Fact label="Source" value={c1.kbEntry.source} />
              <Fact label="Owner" value={c1.kbEntry.sourceOwner} />
              <Fact label="Category" value={c1.dataMapRow.category} />
              <Fact label="Refresh cadence" value={c1.dataMapRow.refreshCadence} />
              <Fact label="Sensitivity" value={c1.kbEntry.metadata.sensitivity} />
              <Fact label="Allowed AI use" value={c1.kbEntry.metadata.allowedAiUse} />
              <Fact label="Version" value={c1.kbEntry.metadata.version} />
              <Fact label="Tags" value={c1.kbEntry.metadata.tags.join(", ")} />
            </div>
          </div>
        </div>
      </BlueprintSection>

      <BlueprintSection title="C2 - Trust + Safety">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-md border border-chalk bg-white p-4">
            <p className="eyebrow-muted">SOURCE PRECEDENCE</p>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-[13px] leading-relaxed text-graphite">
              {c2.sourcePrecedence.map((rule) => <li key={rule}>{rule}</li>)}
            </ol>
          </div>
          <div className="rounded-md border border-chalk bg-mist/50 p-4">
            <p className="eyebrow-muted">ALLOWED AI BEHAVIOR</p>
            <p className="mt-3 text-[13px] leading-relaxed text-graphite">{c2.allowedAiBehaviour}</p>
            <Fact label="Escalation boundary" value={c2.escalationBoundary} />
          </div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {c2.accessRules.map((rule) => (
            <div key={rule.level} className="rounded-md border border-chalk bg-paper p-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-terracotta">{rule.level}</p>
              <p className="mt-2 text-[13px] text-navy">{rule.appliesTo}</p>
              <p className="mt-2 text-[12px] leading-relaxed text-slate">{rule.aiBehaviour}</p>
            </div>
          ))}
        </div>
      </BlueprintSection>

      <BlueprintSection title="C3 - Verification">
        <div className="rounded-md border border-chalk bg-white p-4">
          <p className="eyebrow-muted">RETRIEVAL TEST</p>
          <h4 className="mt-2 font-display text-lg text-navy">
            {c3.retrievalTest.id} · {c3.retrievalTest.userQuestion}
          </h4>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Fact label="Expected entry" value={c3.retrievalTest.expectedEntry} />
            <Fact label="Expected source" value={c3.retrievalTest.expectedSource} />
            <Fact label="Expected behavior" value={c3.retrievalTest.expectedBehaviour} />
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <ListCard title="PASS / PARTIAL / FAIL" items={c3.passCriteria} />
          <ListCard title="READINESS EVIDENCE" items={c3.gateEvidence} />
        </div>
      </BlueprintSection>

      <BlueprintSection title="Example readiness Decision">
        <div className="space-y-3">
          <p className="rounded-md bg-terracotta/5 p-4 font-medium text-navy">
            Example readiness status: {generated.status.toUpperCase()}. {generated.statusExplanation}
          </p>
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
            <p className="eyebrow-muted">REFERENCE GAPS SHOWN IN THIS EXAMPLE</p>
            <ul className="mt-3 space-y-1 text-[13px] text-graphite">
              {generated.namedGaps.length ? (
                generated.namedGaps.map((gap) => <li key={gap}>· {gap}</li>)
              ) : (
                <li>· Source owner must approve the entry before production.</li>
              )}
            </ul>
          </div>
        </div>
      </BlueprintSection>

      <BlueprintSection title="Forward Path">
        <p className="text-[14px] leading-relaxed text-graphite">
          In M04, this blueprint becomes the specification for a real AI assistant. The assistant
          should ingest the C1 entry, apply the C2 trust and safety rules, and run the C3 verification
          test before it is trusted in a workflow.
        </p>
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

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate">{label}</p>
      <p className="mt-1 text-[13px] leading-relaxed text-graphite">{value}</p>
    </div>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md border border-chalk bg-paper p-4">
      <p className="eyebrow-muted">{title}</p>
      <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-graphite">
        {items.map((item) => <li key={item}>· {item}</li>)}
      </ul>
    </div>
  );
}
