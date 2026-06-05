import { useMemo, useRef, useState } from "react";
import type { M02UseCase } from "@/lib/assess/content/course1";
import {
  M02_BLUEPRINT_COMPONENTS,
  createDefaultM02Step3State,
  normalizeM02Step3State,
  type M02BlueprintC1,
  type M02BlueprintC2,
  type M02BlueprintC3,
  type M02BlueprintData,
  type M02GeneratedBlueprint,
  type M02Step3State,
} from "@/data/m02/blueprintSchema";
import { getM02Blueprint } from "@/data/m02/blueprints";
import { BlueprintDocument } from "./BlueprintDocument";
import { BlueprintExportButton } from "./BlueprintExportButton";
import {
  BLUEPRINT_LOADING_LINES,
  buildGeneratedM02Blueprint,
} from "./BlueprintGenerator";
import { ClosingDecisionPanel } from "./ClosingDecisionPanel";
import { ComponentRevealPanel } from "./ComponentRevealPanel";
import { ProgressIndicator } from "./ProgressIndicator";

type GateStatus = "pass" | "partial" | "blocked" | "";

interface GateReadinessShape {
  status: GateStatus;
  checks: string[];
  reasonCodes: string[];
  explanation?: string;
}

interface M02Step3GuidedProps {
  selectedUseCase: M02UseCase;
  namedGaps: string[];
  step3State: M02Step3State | undefined;
  generatedBlueprint: M02GeneratedBlueprint | null | undefined;
  gateReadiness: GateReadinessShape;
  onStep3StateChange: (state: M02Step3State, options?: { immediate?: boolean }) => void;
  onGeneratedBlueprintChange: (blueprint: M02GeneratedBlueprint | null) => void;
  onGateReadinessChange: (patch: Partial<GateReadinessShape>) => void;
  onChangeUseCase: () => void;
}

const PANEL_DEFINITIONS = [
  {
    title: "C1 - Data Map",
    whatItIs:
      "C1 turns a raw document, source, or system record into a named KB entry with owner, source location, metadata, sensitivity, and an entry ID.",
    whyItMatters:
      "Without C1, the AI sees a document pile. With C1, it sees source-backed knowledge that can be retrieved and governed.",
    revealLabel: "C1",
    render: (blueprint: M02BlueprintData) => <C1Panel component={blueprint.components.c1} />,
    notice: (blueprint: M02BlueprintData) => blueprint.components.c1.whatToNotice,
  },
  {
    title: "C2 - Trust + Safety",
    whatItIs:
      "C2 adds the rules around the entry: source precedence, access level, allowed AI behavior, and escalation boundaries.",
    whyItMatters:
      "Without C2, the AI may retrieve the right fact but use it for the wrong person, channel, or decision.",
    revealLabel: "C2",
    render: (blueprint: M02BlueprintData) => <C2Panel component={blueprint.components.c2} />,
    notice: (blueprint: M02BlueprintData) => blueprint.components.c2.whatToNotice,
  },
  {
    title: "C3 - Verification",
    whatItIs:
      "C3 proves the KB works with a retrieval test: user question, expected entry, expected source, expected behavior, and Gate 1 evidence.",
    whyItMatters:
      "Without C3, the team is assuming retrieval works. The failure only appears later, with real users and real risk.",
    revealLabel: "C3",
    render: (blueprint: M02BlueprintData) => <C3Panel component={blueprint.components.c3} />,
    notice: (blueprint: M02BlueprintData) => blueprint.components.c3.whatToNotice,
  },
] as const;

export function M02Step3Guided({
  selectedUseCase,
  namedGaps,
  step3State,
  generatedBlueprint,
  gateReadiness: _gateReadiness,
  onStep3StateChange,
  onGeneratedBlueprintChange,
  onGateReadinessChange,
  onChangeUseCase,
}: M02Step3GuidedProps) {
  const blueprint = getM02Blueprint(selectedUseCase.id);
  const documentRef = useRef<HTMLDivElement | null>(null);
  const [loadingIndex, setLoadingIndex] = useState(-1);

  const state = useMemo(() => {
    return normalizeM02Step3State(step3State, selectedUseCase.id);
  }, [selectedUseCase.id, step3State]);

  if (!blueprint) {
    return (
      <div className="space-y-6">
        <Step3Header selectedUseCase={selectedUseCase} onChangeUseCase={onChangeUseCase} />
        <section className="rounded-lg border border-chalk bg-white p-6">
          <p className="eyebrow">REFERENCE BLUEPRINT UNAVAILABLE</p>
          <h4 className="mt-2 font-display text-2xl text-navy">
            {selectedUseCase.title} is mapped, but the generated Step 3 blueprint could not load.
          </h4>
          <p className="mt-3 text-[14px] leading-relaxed text-graphite">
            Choose another use case and return to this step. If this keeps happening, the blueprint
            registry needs to be checked.
          </p>
          <button
            type="button"
            onClick={onChangeUseCase}
            className="mt-4 rounded-md bg-terracotta px-4 py-2 text-sm font-medium text-white hover:bg-navy"
          >
            Change use case
          </button>
        </section>
      </div>
    );
  }

  const allPanelsRevealed = state.revealedPanels.every(Boolean);
  const reflectionsComplete =
    state.hardestComponents.length > 0 && !!state.status && state.statusExplanation.trim().length > 0;
  const canGenerate = allPanelsRevealed && reflectionsComplete;

  const updateState = (patch: Partial<M02Step3State>, options?: { immediate?: boolean }) => {
    onStep3StateChange(normalizeM02Step3State({ ...state, ...patch, useCaseId: selectedUseCase.id }, selectedUseCase.id), options);
  };

  const revealPanel = (index: number) => {
    const revealedPanels = [...state.revealedPanels];
    const collapsedPanels = [...state.collapsedPanels];
    revealedPanels[index] = true;
    collapsedPanels[index] = false;
    updateState({ revealedPanels, collapsedPanels, generated: false, generatedAt: undefined });
    onGeneratedBlueprintChange(null);
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

  const generateBlueprint = async () => {
    if (!canGenerate) return;
    setLoadingIndex(0);
    for (let i = 1; i < BLUEPRINT_LOADING_LINES.length; i += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 450));
      setLoadingIndex(i);
    }

    const generated = buildGeneratedM02Blueprint({
      blueprint,
      state,
      namedGaps,
      selectedSources: {
        internal: [],
        contextual: [],
        taskSpecific: [],
      },
    });
    onGeneratedBlueprintChange(generated);
    onGateReadinessChange({ status: state.status, explanation: state.statusExplanation });
    onStep3StateChange(
      {
        ...state,
        generated: true,
        generatedAt: generated.generatedAt,
      },
      { immediate: true },
    );
    setLoadingIndex(-1);
    window.setTimeout(() => documentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  return (
    <div className="space-y-8">
      <Step3Header
        selectedUseCase={selectedUseCase}
        onChangeUseCase={() => {
          const hasStep3Work = state.revealedPanels.some(Boolean) || state.generated || !!generatedBlueprint;
          if (!hasStep3Work || window.confirm("Changing use case will reset Step 3. Continue?")) {
            onStep3StateChange(createDefaultM02Step3State(selectedUseCase.id), { immediate: true });
            onGeneratedBlueprintChange(null);
            onChangeUseCase();
          }
        }}
      />

      <div className="rounded-lg bg-mist/40 p-5">
        <p className="text-[14px] leading-relaxed text-graphite">
          A real operating knowledge base has three components. You will watch one raw source become
          an AI-ready KB entry, then add the rules that make it safe, then prove it with a retrieval
          test. Same source, three components, one Gate 1 decision.
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
        <ClosingDecisionPanel
          useCaseName={blueprint.useCaseName}
          componentLabels={M02_BLUEPRINT_COMPONENTS}
          hardestComponents={state.hardestComponents}
          componentNotes={state.componentNotes}
          status={state.status}
          statusExplanation={state.statusExplanation}
          onHardestChange={(hardestComponents) => {
            onGeneratedBlueprintChange(null);
            updateState({ hardestComponents, generated: false, generatedAt: undefined });
          }}
          onNoteChange={(component, value) => {
            onGeneratedBlueprintChange(null);
            updateState({
              componentNotes: { ...state.componentNotes, [component]: value },
              generated: false,
              generatedAt: undefined,
            });
          }}
          onStatusChange={(status) => {
            onGeneratedBlueprintChange(null);
            updateState({ status, generated: false, generatedAt: undefined });
          }}
          onStatusExplanationChange={(statusExplanation) => {
            onGeneratedBlueprintChange(null);
            updateState({ statusExplanation, generated: false, generatedAt: undefined });
          }}
        />
      )}

      {allPanelsRevealed && (
        <section className="rounded-lg border border-chalk bg-white p-6 text-center">
          <button
            type="button"
            onClick={generateBlueprint}
            disabled={!canGenerate || loadingIndex >= 0}
            title={!canGenerate ? "Answer both questions to generate your blueprint." : undefined}
            className="rounded-md bg-terracotta px-5 py-3 text-sm font-medium text-white hover:bg-navy disabled:cursor-not-allowed disabled:opacity-50"
          >
            Generate the Blueprint for {blueprint.useCaseName} →
          </button>
          {loadingIndex >= 0 && (
            <div className="mt-5 space-y-1 text-left font-mono text-[12px] text-terracotta" aria-live="polite">
              {BLUEPRINT_LOADING_LINES.slice(0, loadingIndex + 1).map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          )}
        </section>
      )}

      {generatedBlueprint && (
        <div ref={documentRef} className="space-y-4">
          <div className="flex flex-col gap-3 rounded-lg border border-chalk bg-mist/40 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="eyebrow-muted">BLUEPRINT READY</p>
              <p className="mt-1 text-[13px] text-graphite">
                Download the operational spec or copy the Markdown for your team.
              </p>
            </div>
            <BlueprintExportButton blueprint={blueprint} generated={generatedBlueprint} />
          </div>

          <BlueprintDocument blueprint={blueprint} generated={generatedBlueprint} />

          <section className="rounded-lg border border-chalk bg-white p-6">
            <p className="eyebrow">WHAT HAPPENS NEXT</p>
            <h4 className="mt-2 font-display text-2xl text-navy">
              What happens to this blueprint next
            </h4>
            <div className="mt-4 space-y-3 text-[14px] leading-relaxed text-graphite">
              <p>
                Next: <strong>M04 (AI Assistants & RAG)</strong> ingests this entry, applies these
                trust rules, and runs this verification test.
              </p>
              <p>
                Gate check: <strong>Gate 1</strong> uses C1, C2, and C3 as the pre-Build checklist for
                whether this process is ready to take into Build.
              </p>
              <p>
                Handoff: <strong>Your team</strong> can hand the document above to a developer, vendor, or
                CIO to explain what an AI-ready knowledge base for this process should look like.
              </p>
            </div>
          </section>
        </div>
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
        <div className="rounded-md border border-chalk bg-paper p-4">
          <p className="eyebrow-muted">PASS / PARTIAL / FAIL</p>
          <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-graphite">
            {component.passCriteria.map((item) => <li key={item}>· {item}</li>)}
          </ul>
        </div>
        <div className="rounded-md border border-chalk bg-mist/50 p-4">
          <p className="eyebrow-muted">GATE 1 EVIDENCE</p>
          <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-graphite">
            {component.gateEvidence.map((item) => <li key={item}>· {item}</li>)}
          </ul>
        </div>
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

function Step3Header({
  selectedUseCase,
  onChangeUseCase,
}: {
  selectedUseCase: M02UseCase;
  onChangeUseCase: () => void;
}) {
  return (
    <div className="rounded-lg border border-chalk bg-white p-5">
      <p className="eyebrow">STEP 3 of 3 · BUILD THE KB BLUEPRINT</p>
      <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="font-display text-2xl text-navy">{selectedUseCase.title}</h3>
          <p className="mt-1 text-[14px] leading-relaxed text-graphite">
            {selectedUseCase.whatAiShouldDo}
          </p>
        </div>
        <button
          type="button"
          onClick={onChangeUseCase}
          className="text-left text-[12px] font-medium text-terracotta hover:text-navy"
        >
          Change use case
        </button>
      </div>
    </div>
  );
}
