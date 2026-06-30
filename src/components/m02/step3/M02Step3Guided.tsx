import { useMemo } from "react";
import type { M02UseCase } from "@/lib/assess/content/course1";
import {
  M02_BLUEPRINT_COMPONENTS,
  normalizeM02Step3State,
  type M02BlueprintC1,
  type M02BlueprintC2,
  type M02BlueprintC3,
  type M02BlueprintData,
  type M02Step3State,
} from "@/data/m02/blueprintSchema";
import { getM02Blueprint } from "@/data/m02/blueprints";
import { ComponentRevealPanel } from "./ComponentRevealPanel";
import { ProgressIndicator } from "./ProgressIndicator";

interface M02Step3GuidedProps {
  selectedUseCase: M02UseCase;
  step3State: M02Step3State | undefined;
  onStep3StateChange: (state: M02Step3State, options?: { immediate?: boolean }) => void;
}

const PANEL_DEFINITIONS = [
  {
    title: "C1 - Data Map",
    whatItIs:
      "C1 turns the document into an inventory row and an AI-ready KB entry: source, owner, metadata, sensitivity, and entry ID.",
    whyItMatters:
      "A document is data. C1 adds the meaning and ownership that make it retrievable knowledge.",
    revealLabel: "C1",
    render: (blueprint: M02BlueprintData) => <C1Panel component={blueprint.components.c1} />,
    notice: (blueprint: M02BlueprintData) => blueprint.components.c1.whatToNotice,
  },
  {
    title: "C2 - Trust + Safety",
    whatItIs:
      "C2 adds the operating rules: source precedence, access level, allowed AI behavior, and escalation boundaries.",
    whyItMatters:
      "Retrieving the right entry is not enough. The AI also needs to know who may see it, which source wins, and when to stop.",
    revealLabel: "C2",
    render: (blueprint: M02BlueprintData) => <C2Panel component={blueprint.components.c2} />,
    notice: (blueprint: M02BlueprintData) => blueprint.components.c2.whatToNotice,
  },
  {
    title: "C3 - Verification",
    whatItIs:
      "C3 proves the KB works with a retrieval test: user question, expected entry, expected source, expected behavior, and Readiness review evidence.",
    whyItMatters:
      "Without proof, the team is only hoping the assistant retrieves and behaves correctly.",
    revealLabel: "C3",
    render: (blueprint: M02BlueprintData) => <C3Panel component={blueprint.components.c3} />,
    notice: (blueprint: M02BlueprintData) => blueprint.components.c3.whatToNotice,
  },
] as const;

export function M02Step3Guided({
  selectedUseCase,
  step3State,
  onStep3StateChange,
}: M02Step3GuidedProps) {
  const blueprint = getM02Blueprint(selectedUseCase.id);

  const state = useMemo(() => {
    return normalizeM02Step3State(step3State, selectedUseCase.id);
  }, [selectedUseCase.id, step3State]);

  if (!blueprint) {
    return (
      <section className="rounded-lg border border-chalk bg-white p-6">
        <p className="eyebrow">REFERENCE BLUEPRINT UNAVAILABLE</p>
        <h4 className="mt-2 font-display text-2xl text-navy">
          {selectedUseCase.title} is mapped, but the reference walkthrough could not load.
        </h4>
      </section>
    );
  }

  const updateState = (patch: Partial<M02Step3State>, options?: { immediate?: boolean }) => {
    onStep3StateChange(
      normalizeM02Step3State({ ...state, ...patch, useCaseId: selectedUseCase.id }, selectedUseCase.id),
      options,
    );
  };

  const revealPanel = (index: number) => {
    const revealedPanels = [...state.revealedPanels];
    const collapsedPanels = [...state.collapsedPanels];
    revealedPanels[index] = true;
    collapsedPanels[index] = false;
    updateState({ revealedPanels, collapsedPanels, generated: false, generatedAt: undefined }, { immediate: true });
  };

  const continueFromPanel = (index: number) => {
    const collapsedPanels = [...state.collapsedPanels];
    collapsedPanels[index] = true;
    if (index + 1 < collapsedPanels.length) collapsedPanels[index + 1] = false;
    updateState({ collapsedPanels });
  };

  const toggleCollapse = (index: number) => {
    const collapsedPanels = [...state.collapsedPanels];
    collapsedPanels[index] = !collapsedPanels[index];
    updateState({ collapsedPanels });
  };

  const allPanelsRevealed = state.revealedPanels.every(Boolean);

  return (
    <div className="space-y-8">
      <div className="rounded-lg bg-mist/40 p-5">
        <p className="text-[14px] leading-relaxed text-graphite">
          Same document, three transformations. First it becomes visible and owned. Then it gets
          rules for safe use. Then it gets a test that proves retrieval and behavior.
        </p>
        <div className="mt-4">
          <ProgressIndicator labels={M02_BLUEPRINT_COMPONENTS} revealedPanels={state.revealedPanels} />
        </div>
      </div>

      {PANEL_DEFINITIONS.map((panel, index) => {
        const isLocked = index > 0 && !state.revealedPanels[index - 1];
        return (
          <ComponentRevealPanel
            key={panel.title}
            num={index + 1}
            title={panel.title}
            whatItIs={panel.whatItIs}
            whyItMatters={panel.whyItMatters}
            useCaseName={blueprint.useCaseName}
            revealLabel={panel.revealLabel}
            isLocked={isLocked}
            isRevealed={!!state.revealedPanels[index]}
            isCollapsed={!!state.collapsedPanels[index]}
            isLast={index === PANEL_DEFINITIONS.length - 1}
            whatToNotice={panel.notice(blueprint)}
            onReveal={() => revealPanel(index)}
            onContinue={() => continueFromPanel(index)}
            onToggleCollapse={() => toggleCollapse(index)}
          >
            {panel.render(blueprint)}
          </ComponentRevealPanel>
        );
      })}

      {allPanelsRevealed && (
        <section className="rounded-lg border border-chalk bg-white p-5">
          <p className="eyebrow">WALKTHROUGH COMPLETE</p>
          <h4 className="mt-2 font-display text-xl text-navy">
            The document is now an operating KB example.
          </h4>
          <p className="mt-2 text-[14px] leading-relaxed text-graphite">
            You have seen the transformation from raw document to C1 Data Map, C2 Trust + Safety,
            and C3 Verification. The next screen shows the finished reference blueprint.
          </p>
        </section>
      )}
    </div>
  );
}

function C1Panel({ component }: { component: M02BlueprintC1 }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="rounded-md border border-chalk bg-paper p-4">
        <p className="eyebrow-muted">RAW DOCUMENT</p>
        <h5 className="mt-2 font-display text-lg text-navy">{component.rawSource.name}</h5>
        <div className="mt-3 space-y-3 text-[13px] text-graphite">
          <Fact label="Format" value={component.rawSource.format} />
          <Fact label="Starting state" value={component.rawSource.startingState} />
          <Fact label="Why AI cannot use it yet" value={component.rawSource.whyAiCannotUseItYet} />
        </div>
      </div>
      <div className="rounded-md border border-chalk bg-white p-4">
        <p className="eyebrow-muted">AI-READY KB ENTRY</p>
        <h5 className="mt-2 font-display text-lg text-navy">
          {component.kbEntry.id} · {component.kbEntry.title}
        </h5>
        <p className="mt-2 text-[13px] leading-relaxed text-graphite">{component.kbEntry.content}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Fact label="Source location" value={component.dataMapRow.sourceLocation} />
          <Fact label="Owner" value={component.dataMapRow.owner} />
          <Fact label="Category" value={component.dataMapRow.category} />
          <Fact label="Refresh cadence" value={component.dataMapRow.refreshCadence} />
          <Fact label="Sensitivity" value={component.kbEntry.metadata.sensitivity} />
          <Fact label="Allowed AI use" value={component.kbEntry.metadata.allowedAiUse} />
          <Fact label="Version" value={component.kbEntry.metadata.version} />
          <Fact label="Tags" value={component.kbEntry.metadata.tags.join(", ")} />
        </div>
      </div>
    </div>
  );
}

function C2Panel({ component }: { component: M02BlueprintC2 }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-md border border-chalk bg-white p-4">
          <p className="eyebrow-muted">SOURCE PRECEDENCE</p>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-[13px] leading-relaxed text-graphite">
            {component.sourcePrecedence.map((rule) => <li key={rule}>{rule}</li>)}
          </ol>
        </div>
        <div className="rounded-md border border-chalk bg-mist/50 p-4">
          <p className="eyebrow-muted">ALLOWED AI BEHAVIOR</p>
          <p className="mt-3 text-[13px] leading-relaxed text-graphite">{component.allowedAiBehaviour}</p>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-slate">
            Escalation boundary
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-graphite">{component.escalationBoundary}</p>
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {component.accessRules.map((rule) => (
          <div key={rule.level} className="rounded-md border border-chalk bg-paper p-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-terracotta">{rule.level}</p>
            <p className="mt-2 text-[13px] text-navy">{rule.appliesTo}</p>
            <p className="mt-2 text-[12px] leading-relaxed text-slate">{rule.aiBehaviour}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function C3Panel({ component }: { component: M02BlueprintC3 }) {
  const test = component.retrievalTest;
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-chalk bg-white p-4">
        <p className="eyebrow-muted">RETRIEVAL TEST</p>
        <h5 className="mt-2 font-display text-lg text-navy">
          {test.id} · {test.userQuestion}
        </h5>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Fact label="Expected entry" value={test.expectedEntry} />
          <Fact label="Expected source" value={test.expectedSource} />
          <Fact label="Expected behavior" value={test.expectedBehaviour} />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <ListCard title="PASS / PARTIAL / FAIL" items={component.passCriteria} />
        <ListCard title="READINESS EVIDENCE" items={component.gateEvidence} />
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
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
