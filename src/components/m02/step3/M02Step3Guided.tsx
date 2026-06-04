import { useMemo, useRef, useState } from "react";
import type { M02UseCase } from "@/lib/assess/content/course1";
import {
  M02_BLUEPRINT_COMPONENTS,
  createDefaultM02Step3State,
  type M02BlueprintData,
  type M02GeneratedBlueprint,
  type M02Step3State,
} from "@/data/m02/blueprintSchema";
import { getM02Blueprint } from "@/data/m02/blueprints";
import { AccessSensitivityPanel } from "./AccessSensitivityPanel";
import { BlueprintDocument } from "./BlueprintDocument";
import { BlueprintExportButton } from "./BlueprintExportButton";
import {
  BLUEPRINT_LOADING_LINES,
  buildGeneratedM02Blueprint,
} from "./BlueprintGenerator";
import { ClosingDecisionPanel } from "./ClosingDecisionPanel";
import { ComponentRevealPanel } from "./ComponentRevealPanel";
import { DataMapPanel } from "./DataMapPanel";
import { EntriesPanel } from "./EntriesPanel";
import { KnowledgeLayersPanel } from "./KnowledgeLayersPanel";
import { LineagePanel } from "./LineagePanel";
import { MetadataPanel } from "./MetadataPanel";
import { ProgressIndicator } from "./ProgressIndicator";
import { RetrievalTestsPanel } from "./RetrievalTestsPanel";

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
  onStep3StateChange: (state: M02Step3State) => void;
  onGeneratedBlueprintChange: (blueprint: M02GeneratedBlueprint | null) => void;
  onGateReadinessChange: (patch: Partial<GateReadinessShape>) => void;
  onChangeUseCase: () => void;
}

const PANEL_DEFINITIONS = [
  {
    title: "Data Map (the visibility layer)",
    whatItIs:
      "A data map shows where the information for a process actually lives: systems, documents, owners, and refresh cadence. It is the business visibility layer before anything becomes AI-ready.",
    whyItMatters:
      "Without it, teams ask AI to use knowledge that no one can locate, own, or refresh. The predictable failure is stale or untraceable answers.",
    revealLabel: "the data map",
    render: (blueprint: M02BlueprintData) => <DataMapPanel blueprint={blueprint} />,
    notice: (blueprint: M02BlueprintData) => blueprint.dataMap.whatToNotice,
  },
  {
    title: "The Three Knowledge Layers (the structural layer)",
    whatItIs:
      "The same sources are organised by job: internal facts, contextual rules, and task-specific examples. The layers prevent one messy pile of documents from pretending to be a knowledge base.",
    whyItMatters:
      "Without the layers, the AI cannot tell the difference between a fact, a policy, and an example. The predictable failure is using yesterday's example as if it were today's rule.",
    revealLabel: "the three layers",
    render: (blueprint: M02BlueprintData) => <KnowledgeLayersPanel blueprint={blueprint} />,
    notice: (blueprint: M02BlueprintData) => blueprint.knowledgeLayers.whatToNotice,
  },
  {
    title: "Knowledge Entries (the content layer)",
    whatItIs:
      "Knowledge entries are atomic units the AI can retrieve: one rule, one fact, or one example with a source. They turn broad documents into usable evidence.",
    whyItMatters:
      "Without entries, retrieval returns long documents and hopes the model finds the right sentence. The predictable failure is vague answers that cannot be audited.",
    revealLabel: "the entries",
    render: (blueprint: M02BlueprintData) => <EntriesPanel blueprint={blueprint} />,
    notice: (blueprint: M02BlueprintData) => blueprint.entries.whatToNotice,
  },
  {
    title: "Metadata (the governance layer)",
    whatItIs:
      "Metadata is the label set that makes each entry governable: title, layer, source, owner, and usable content. It is the minimum operating discipline around knowledge.",
    whyItMatters:
      "Without metadata, nobody knows whether an entry is current, who owns it, or how AI is allowed to use it. The predictable failure is an impressive answer with no accountable source.",
    revealLabel: "the metadata standard",
    render: (blueprint: M02BlueprintData) => <MetadataPanel blueprint={blueprint} />,
    notice: (blueprint: M02BlueprintData) => blueprint.metadata.whatToNotice,
  },
  {
    title: "Lineage and Source Precedence (the trust layer)",
    whatItIs:
      "Lineage traces an AI answer back to the entry and source that support it. Source precedence decides which source wins when two sources conflict.",
    whyItMatters:
      "Without lineage and precedence, conflicting sources become confident contradictions. The predictable failure is an answer that sounds right but cannot be defended.",
    revealLabel: "lineage and precedence",
    render: (blueprint: M02BlueprintData) => <LineagePanel blueprint={blueprint} />,
    notice: (blueprint: M02BlueprintData) => blueprint.lineage.whatToNotice,
  },
  {
    title: "Access and Sensitivity (the safety layer)",
    whatItIs:
      "Access and sensitivity rules decide who can see an entry, what the AI may use, and what cannot leave the company boundary.",
    whyItMatters:
      "Without this layer, the AI may use the right knowledge in the wrong place or expose internal material externally. The predictable failure is a useful answer that creates risk.",
    revealLabel: "access and sensitivity",
    render: (blueprint: M02BlueprintData) => <AccessSensitivityPanel blueprint={blueprint} />,
    notice: (blueprint: M02BlueprintData) => blueprint.accessSensitivity.whatToNotice,
  },
  {
    title: "Retrieval Tests (the verification layer)",
    whatItIs:
      "Retrieval tests are questions with expected entries, sources, and behaviours. They prove whether the knowledge base works before it is used in a real workflow.",
    whyItMatters:
      "Without tests, the team is trusting vibes. The predictable failure is discovering only after deployment that the assistant retrieves the wrong rule or skips escalation.",
    revealLabel: "the test suite",
    render: (blueprint: M02BlueprintData) => <RetrievalTestsPanel blueprint={blueprint} />,
    notice: (blueprint: M02BlueprintData) => blueprint.retrievalTests.whatToNotice,
  },
] as const;

export function M02Step3Guided({
  selectedUseCase,
  namedGaps,
  step3State,
  generatedBlueprint,
  gateReadiness,
  onStep3StateChange,
  onGeneratedBlueprintChange,
  onGateReadinessChange,
  onChangeUseCase,
}: M02Step3GuidedProps) {
  const blueprint = getM02Blueprint(selectedUseCase.id);
  const documentRef = useRef<HTMLDivElement | null>(null);
  const [loadingIndex, setLoadingIndex] = useState(-1);

  const state = useMemo(() => {
    if (step3State?.useCaseId === selectedUseCase.id) return step3State;
    return createDefaultM02Step3State(selectedUseCase.id);
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

  const updateState = (patch: Partial<M02Step3State>) => {
    onStep3StateChange({ ...state, ...patch, useCaseId: selectedUseCase.id });
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
    onStep3StateChange({
      ...state,
      generated: true,
      generatedAt: generated.generatedAt,
    });
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
            onStep3StateChange(createDefaultM02Step3State(selectedUseCase.id));
            onGeneratedBlueprintChange(null);
            onChangeUseCase();
          }
        }}
      />

      <div className="rounded-lg bg-mist/40 p-5">
        <p className="text-[14px] leading-relaxed text-graphite">
          A real operating knowledge base has seven components. Each one solves a specific failure
          mode, and skipping any one creates a predictable kind of breakdown. We will walk through
          all seven, applied to your use case. By the end you will have the complete reference
          blueprint, and you will know exactly what good looks like.
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
                → <strong>M04 (AI Assistants & RAG)</strong> ingests this index, applies these
                retrieval instructions, and runs these tests.
              </p>
              <p>
                → <strong>Gate 1</strong> uses the governance register as the pre-Build checklist
                for whether this process is ready to take into Build.
              </p>
              <p>
                → <strong>Your team</strong> can hand the document above to a developer, vendor, or
                CIO to explain what an AI-ready knowledge base for this process should look like.
              </p>
              <p className="text-[12px] italic text-slate">
                You will still complete M03 next. This blueprint becomes especially useful once M04
                asks you to design a real assistant.
              </p>
            </div>
          </section>
        </div>
      )}
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
