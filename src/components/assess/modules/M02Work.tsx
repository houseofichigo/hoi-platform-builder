import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAssessProgress, useAssessOutput } from "@/hooks/useAssess";
import { supabase } from "@/integrations/supabase/client";
import { Step } from "@/components/assess/Step";
import { M02Step3Guided } from "@/components/m02/step3/M02Step3Guided";
import {
  M02_DEFAULT_USE_CASE_ID,
  M02_COURSE_CONTENT,
  M02_USE_CASES,
  getM02UseCase,
} from "@/lib/assess/content/course1";
import type { M02UseCase, M02UseCaseSource } from "@/lib/assess/content/course1";
import { getM02Blueprint } from "@/data/m02/blueprints";
import {
  createDefaultM02Step3State,
  type M02BlueprintData,
  type M02GeneratedBlueprint,
  type M02Step3State,
} from "@/data/m02/blueprintSchema";

const CHAPTER_LABEL = "PHASE 01 · M02 · DATA READINESS & KNOWLEDGE BASE";
const TOTAL_STEPS = 3;

type StepNum = 1 | 2 | 3;
type GateStatus = "pass" | "partial" | "blocked" | "";

interface TestSetShape {
  clean: number;
  edge: number;
  adversarial: number;
  sources?: string[];
}

interface GateReadinessShape {
  status: GateStatus;
  checks: string[];
  reasonCodes: string[];
  explanation?: string;
}

const DEFAULT_TEST_SET: TestSetShape = { clean: 5, edge: 5, adversarial: 5 };
const DEFAULT_GATE_READINESS: GateReadinessShape = {
  status: "",
  checks: [],
  reasonCodes: [],
};

export function M02Work() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const qc = useQueryClient();

  const progress = useAssessProgress("m02");

  const internalSourcesOut = useAssessOutput<string[]>("m02.internal_sources");
  const contextualRulesOut = useAssessOutput<string[]>("m02.contextual_rules");
  const testSetOut = useAssessOutput<TestSetShape>("m02.test_set");
  const selectedCaseOut = useAssessOutput<string>("m02.selected_case");
  const gapsOut = useAssessOutput<string[]>("m02.gaps");
  const knowledgeEntriesOut = useAssessOutput<string[]>("m02.knowledge_entries");
  const retrievalTestsOut = useAssessOutput<string[]>("m02.retrieval_tests");
  const gateReadinessOut = useAssessOutput<GateReadinessShape>("m02.gate1_readiness");
  const step3StateOut = useAssessOutput<M02Step3State>("m02.step3_state");
  const kbBlueprintOut = useAssessOutput<M02GeneratedBlueprint | null>("m02.kb_blueprint");

  const [step, setStep] = useState<StepNum>(1);
  const [selectedCaseId, setSelectedCaseId] = useState(M02_DEFAULT_USE_CASE_ID);
  const [internalSel, setInternalSel] = useState<string[]>([]);
  const [contextualSel, setContextualSel] = useState<string[]>([]);
  const [testSet, setTestSet] = useState<TestSetShape>(DEFAULT_TEST_SET);
  const [gapsSel, setGapsSel] = useState<string[]>([]);
  const [knowledgeEntrySel, setKnowledgeEntrySel] = useState<string[]>([]);
  const [retrievalTestSel, setRetrievalTestSel] = useState<string[]>([]);
  const [gateReadiness, setGateReadiness] =
    useState<GateReadinessShape>(DEFAULT_GATE_READINESS);
  const [customGap, setCustomGap] = useState("");

  const [hydrated, setHydrated] = useState({
    step: false,
    selectedCase: false,
    internal: false,
    contextual: false,
    testSet: false,
    gaps: false,
    knowledgeEntries: false,
    retrievalTests: false,
    gateReadiness: false,
  });

  const selectedUseCase = useMemo(
    () => getM02UseCase(selectedCaseId),
    [selectedCaseId],
  );
  const selectedBlueprint = getM02Blueprint(selectedCaseId);

  // Hydrate step from progress
  useEffect(() => {
    if (hydrated.step || progress.isLoading) return;
    const status = progress.data?.status;
    if (status === "complete") {
      setStep(TOTAL_STEPS as StepNum);
    } else {
      const cs = progress.data?.current_step;
      if (cs && cs >= 1) setStep(Math.min(cs, TOTAL_STEPS) as StepNum);
    }
    setHydrated((h) => ({ ...h, step: true }));
  }, [hydrated.step, progress.isLoading, progress.data?.current_step, progress.data?.status]);

  // Mark in_progress on mount if not started
  useEffect(() => {
    if (progress.isLoading) return;
    const status = progress.data?.status;
    if (!status || status === "not_started") {
      const nextStep = Math.min(Math.max(progress.data?.current_step ?? 1, 1), TOTAL_STEPS) as StepNum;
      progress.setStep.mutate(nextStep);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress.isLoading]);

  // Hydrate selected use case. Older M02 progress defaults to the current reference blueprint.
  useEffect(() => {
    if (hydrated.selectedCase || selectedCaseOut.isLoading) return;
    const saved = selectedCaseOut.value;
    if (typeof saved === "string" && M02_USE_CASES.some((useCase) => useCase.id === saved)) {
      setSelectedCaseId(saved);
    }
    setHydrated((h) => ({ ...h, selectedCase: true }));
  }, [hydrated.selectedCase, selectedCaseOut.isLoading, selectedCaseOut.value]);

  // Seed m02.test_set defaults once if missing
  useEffect(() => {
    if (!user || !workspace) return;
    if (testSetOut.isLoading) return;
    if (testSetOut.value !== undefined) return;
    (async () => {
      const seeds = M02_COURSE_CONTENT.seeds["m02.test_set"];
      const { error } = await supabase.from("assess_outputs").upsert(
        {
          workspace_id: workspace.id,
          user_id: user.id,
          output_key: "m02.test_set",
          value: seeds as never,
          seeded: true,
          touched: false,
        },
        { onConflict: "workspace_id,user_id,output_key" },
      );
      if (!error) {
        qc.invalidateQueries({
          queryKey: ["assess-output", workspace.id, user.id, "m02.test_set"],
        });
      }
    })();
  }, [user, workspace, testSetOut.isLoading, testSetOut.value, qc]);

  // Hydrate local state from persisted outputs
  useEffect(() => {
    if (hydrated.internal || internalSourcesOut.isLoading) return;
    if (Array.isArray(internalSourcesOut.value)) setInternalSel(internalSourcesOut.value);
    setHydrated((h) => ({ ...h, internal: true }));
  }, [hydrated.internal, internalSourcesOut.isLoading, internalSourcesOut.value]);

  useEffect(() => {
    if (hydrated.contextual || contextualRulesOut.isLoading) return;
    if (Array.isArray(contextualRulesOut.value)) setContextualSel(contextualRulesOut.value);
    setHydrated((h) => ({ ...h, contextual: true }));
  }, [hydrated.contextual, contextualRulesOut.isLoading, contextualRulesOut.value]);

  useEffect(() => {
    if (hydrated.testSet || testSetOut.isLoading) return;
    if (testSetOut.value && typeof testSetOut.value === "object") {
      const value = testSetOut.value as Partial<TestSetShape>;
      setTestSet({
        ...DEFAULT_TEST_SET,
        ...value,
        sources: Array.isArray(value.sources) ? value.sources : [],
      });
    }
    setHydrated((h) => ({ ...h, testSet: true }));
  }, [hydrated.testSet, testSetOut.isLoading, testSetOut.value]);

  useEffect(() => {
    if (hydrated.gaps || gapsOut.isLoading) return;
    if (Array.isArray(gapsOut.value)) setGapsSel(gapsOut.value);
    setHydrated((h) => ({ ...h, gaps: true }));
  }, [hydrated.gaps, gapsOut.isLoading, gapsOut.value]);

  useEffect(() => {
    if (hydrated.knowledgeEntries || knowledgeEntriesOut.isLoading) return;
    if (Array.isArray(knowledgeEntriesOut.value)) {
      setKnowledgeEntrySel(knowledgeEntriesOut.value);
    }
    setHydrated((h) => ({ ...h, knowledgeEntries: true }));
  }, [hydrated.knowledgeEntries, knowledgeEntriesOut.isLoading, knowledgeEntriesOut.value]);

  useEffect(() => {
    if (hydrated.retrievalTests || retrievalTestsOut.isLoading) return;
    if (Array.isArray(retrievalTestsOut.value)) {
      setRetrievalTestSel(retrievalTestsOut.value);
    }
    setHydrated((h) => ({ ...h, retrievalTests: true }));
  }, [hydrated.retrievalTests, retrievalTestsOut.isLoading, retrievalTestsOut.value]);

  useEffect(() => {
    if (hydrated.gateReadiness || gateReadinessOut.isLoading) return;
    if (gateReadinessOut.value && typeof gateReadinessOut.value === "object") {
      const v = gateReadinessOut.value as Partial<GateReadinessShape>;
      setGateReadiness({
        status: v.status ?? "",
        checks: Array.isArray(v.checks) ? v.checks : [],
        reasonCodes: Array.isArray(v.reasonCodes) ? v.reasonCodes : [],
        explanation: typeof v.explanation === "string" ? v.explanation : "",
      });
    }
    setHydrated((h) => ({ ...h, gateReadiness: true }));
  }, [hydrated.gateReadiness, gateReadinessOut.isLoading, gateReadinessOut.value]);

  const toggle = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  const selectUseCase = (caseId: string) => {
    if (caseId !== selectedCaseId) {
      const hasStep3Work =
        !!kbBlueprintOut.value ||
        !!step3StateOut.value?.generated ||
        !!step3StateOut.value?.revealedPanels?.some(Boolean);
      if (hasStep3Work && !window.confirm("Changing use case will reset Step 3. Continue?")) {
        return;
      }
      const resetState = createDefaultM02Step3State(caseId);
      step3StateOut.setValue.mutate(resetState);
      kbBlueprintOut.setValue.mutate(null);
      setGateReadiness(DEFAULT_GATE_READINESS);
      gateReadinessOut.setValue.mutate(DEFAULT_GATE_READINESS);
      setGapsSel([]);
      gapsOut.setValue.mutate([]);
    }
    setSelectedCaseId(caseId);
    selectedCaseOut.setValue.mutate(caseId);
  };

  const addCustomSelection = (
    value: string,
    selected: string[],
    setSelected: (next: string[]) => void,
    persist: (next: string[]) => void,
    clear: () => void,
  ) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const next = selected.includes(trimmed) ? selected : [...selected, trimmed];
    setSelected(next);
    persist(next);
    clear();
  };

  const goToStep = async (next: StepNum) => {
    setStep(next);
    await progress.setStep.mutateAsync(next);
  };

  const completeM02 = async () => {
    if (!user || !workspace) return;
    await selectedCaseOut.setValue.mutateAsync(selectedCaseId);
    await internalSourcesOut.setValue.mutateAsync(internalSel);
    await contextualRulesOut.setValue.mutateAsync(contextualSel);
    await testSetOut.setValue.mutateAsync(testSet);
    await gapsOut.setValue.mutateAsync(gapsSel);
    await knowledgeEntriesOut.setValue.mutateAsync(knowledgeEntrySel);
    await retrievalTestsOut.setValue.mutateAsync(retrievalTestSel);
    await gateReadinessOut.setValue.mutateAsync(gateReadiness);
    const { error } = await supabase.from("assess_progress").upsert(
      {
        workspace_id: workspace.id,
        user_id: user.id,
        module_id: "m02",
        status: "complete",
        studied: progress.data?.studied ?? false,
        current_step: null,
        max_step_reached: Math.max(progress.data?.max_step_reached ?? 0, TOTAL_STEPS),
        started_at: progress.data?.started_at ?? new Date().toISOString(),
        completed_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id,user_id,module_id" },
    );
    if (error) {
      toast.error("Could not complete M02. Try again.");
      return;
    }
    qc.invalidateQueries({ queryKey: ["assess-progress", workspace.id, user.id, "m02"] });
    qc.invalidateQueries({ queryKey: ["assess-progress-all", workspace.id, user.id] });
    qc.invalidateQueries({ queryKey: ["resume", workspace.id] });
    qc.invalidateQueries({ queryKey: ["team-status", workspace.id] });
    toast.success("M02 complete. M03 Prompt-Driven Automation is unlocked.");
  };

  if (!workspace) return null;

  // ============ STEP 1 — Three-layer knowledge map ============
  if (step === 1) {
    const s = M02_COURSE_CONTENT.step1;

    return (
      <Step
        storyHeader={M02_COURSE_CONTENT.storyHeader}
        chapterLabel={CHAPTER_LABEL}
        stepLabel="STEP 1 of 3"
        title={s.title}
        why={<p>{s.why}</p>}
        example={<p className="text-[14px] text-navy">{s.example}</p>}
        whatToNotice={
          <ul className="list-disc pl-5 text-[14px] text-navy">
            {s.whatToNotice.map((w) => <li key={w}>{w}</li>)}
          </ul>
        }
        yourVersion={
          <div className="space-y-8">
            <div className="card bg-mist/40 space-y-2">
              <p className="eyebrow-muted">WHERE THIS IS HEADING</p>
              <p className="text-[14px] leading-relaxed text-graphite">
                In M01 you saw that models can sound fluent without being grounded. M02 starts
                with a practical question: if we want AI to help with one business process, what
                documents, files, rules, and examples must it be allowed to use?
              </p>
              <p className="text-[14px] leading-relaxed text-graphite">
                Choose the business process you want to use as your lens. HOI now provides a
                complete generated reference blueprint for each listed use case, so you can compare
                how the same knowledge-base pattern changes by workflow.
              </p>
            </div>

            <ExamplesInTheWild items={M02_COURSE_CONTENT.step1.examplesInTheWild} />

            <div className="border-t border-chalk pt-6 space-y-4">
              <div>
                <p className="eyebrow">PART A · PICK THE BUSINESS USE CASE</p>
                <h4 className="mt-2 font-display text-xl text-navy">
                  Which process should the knowledge base prepare?
                </h4>
                <p className="mt-2 text-[14px] leading-relaxed text-graphite">
                  This is not your final capstone choice. It is the practical example you will use
                  to learn how the three knowledge layers work.
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {M02_USE_CASES.map((useCase) => (
                  <button
                    key={useCase.id}
                    type="button"
                    onClick={() => selectUseCase(useCase.id)}
                    className={`rounded-md border p-4 text-left transition-colors ${
                      selectedCaseId === useCase.id
                        ? "border-terracotta bg-terracotta/5"
                        : "border-chalk bg-white hover:bg-mist/40"
                    }`}
                  >
                    <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-terracotta">
                      {useCase.shortLabel}
                      {useCase.id === M02_DEFAULT_USE_CASE_ID ? " · recommended" : ""}
                    </span>
                    <span className="mt-2 block font-display text-base text-navy">
                      {useCase.title}
                    </span>
                    <span className="mt-1 block text-[13px] leading-relaxed text-graphite">
                      {useCase.businessGoal}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <UseCaseLayerPreview useCase={selectedUseCase} />
          </div>
        }
        produces={<p className="text-[14px] text-navy">{s.produces}</p>}
        canContinue={!!selectedUseCase}
        disabledReason="Choose one business use case."
        nextLabel={s.nextLabel}
        onContinue={async () => {
          await selectedCaseOut.setValue.mutateAsync(selectedCaseId);
          await goToStep(2);
        }}
      />
    );
  }

  // ============ STEP 2 — Readiness gaps ============
  if (step === 2) {
    const s = M02_COURSE_CONTENT.step2;
    const gapOptions = Array.from(new Set([...selectedUseCase.commonGaps, ...M02_COURSE_CONTENT.gapOptions]));
    return (
      <Step
        chapterLabel={CHAPTER_LABEL}
        stepLabel="STEP 2 of 3"
        title={s.title}
        why={<p>{s.why}</p>}
        example={<p className="text-[14px] text-navy">{s.example}</p>}
        whatToNotice={
          <ul className="list-disc pl-5 text-[14px] text-navy">
            {s.whatToNotice.map((w) => <li key={w}>{w}</li>)}
          </ul>
        }
        yourVersion={
          <div className="space-y-8">
            <div className="card border-l-[3px] border-l-terracotta space-y-3">
              <p className="eyebrow">SELECTED USE CASE</p>
              <h4 className="font-display text-xl text-navy">{selectedUseCase.title}</h4>
              <p className="text-[14px] leading-relaxed text-graphite">
                {selectedUseCase.whatAiShouldDo}
              </p>
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="text-left text-[12px] font-medium text-terracotta hover:text-navy"
              >
                Change use case
              </button>
            </div>

            <div className="card bg-mist/40 space-y-2">
              <p className="eyebrow-muted">WHAT YOU ARE DOING HERE</p>
              <p className="text-[14px] leading-relaxed text-graphite">
                You are not building the KB yet. You are spotting what your business would need
                before Build. HOI will show the reference blueprint in Step 3; your job here is to
                notice where your own documents, owners, examples, or rules would be incomplete.
              </p>
            </div>

            {selectedBlueprint ? (
              <BlueprintReferenceMap blueprint={selectedBlueprint} />
            ) : (
              <UseCaseLayerPreview useCase={selectedUseCase} />
            )}

            <ExamplesInTheWild items={M02_COURSE_CONTENT.step2.examplesInTheWild} />

            <ChecklistSection
              title="Which gaps would be real in your business?"
              hint="Pick at least one. These become the Governance Register inputs in Step 3."
              items={gapOptions}
              selected={gapsSel}
              onToggle={(opt) => {
                const next = toggle(gapsSel, opt);
                setGapsSel(next);
                gapsOut.setValue.mutate(next);
              }}
              footer={`${gapsSel.length} selected - pick at least one gap.`}
            />

            <div className="flex flex-col gap-2 rounded-md border border-chalk bg-white p-3 sm:flex-row">
              <input
                type="text"
                value={customGap}
                onChange={(event) => setCustomGap(event.target.value)}
                placeholder="Add a gap specific to your business..."
                className="min-w-0 flex-1 rounded border border-chalk bg-paper px-3 py-2 text-[13px] text-navy outline-none focus:border-terracotta"
              />
              <button
                type="button"
                onClick={() =>
                  addCustomSelection(
                    customGap,
                    gapsSel,
                    setGapsSel,
                    (next) => gapsOut.setValue.mutate(next),
                    () => setCustomGap(""),
                  )
                }
                className="rounded-md border border-terracotta/30 bg-terracotta/5 px-3 py-2 text-[12px] font-medium text-terracotta hover:bg-terracotta/10"
              >
                Add gap
              </button>
            </div>

            <div className="card bg-mist/40 space-y-2">
              <p className="eyebrow-muted">WHAT CARRIES FORWARD</p>
              <p className="text-[14px] leading-relaxed text-graphite">
                Step 3 will show the full HOI blueprint for {selectedUseCase.title}. Your selected
                gaps will appear in the generated Governance Register as open items to address
                before Build.
              </p>
            </div>
          </div>
        }
        produces={<p className="text-[14px] text-navy">{s.produces}</p>}
        canContinue={!!selectedUseCase && gapsSel.length > 0}
        disabledReason="Name at least one readiness gap before moving to the blueprint."
        nextLabel={s.nextLabel}
        onBack={() => goToStep(1)}
        onContinue={() => goToStep(3)}
      />
    );
  }

  // ============ STEP 3 — Guided blueprint generation ============
  const s = M02_COURSE_CONTENT.step3;
  const updateGateReadiness = (patch: Partial<GateReadinessShape>) => {
    const next = { ...gateReadiness, ...patch };
    setGateReadiness(next);
    gateReadinessOut.setValue.mutate(next);
  };
  const canCompleteM02 = !!kbBlueprintOut.value && !!step3StateOut.value?.generated;

  return (
    <Step
      chapterLabel={CHAPTER_LABEL}
      stepLabel="STEP 3 of 3 · KNOWLEDGE BASE BLUEPRINT"
      title={s.title}
      why={<p>{s.why}</p>}
      example={<p className="text-[14px] text-navy">{s.example}</p>}
      whatToNotice={
        <ul className="list-disc pl-5 text-[14px] text-navy">
          {s.whatToNotice.map((w) => <li key={w}>{w}</li>)}
        </ul>
      }
      yourVersion={
        <M02Step3Guided
          selectedUseCase={selectedUseCase}
          namedGaps={gapsSel}
          step3State={step3StateOut.value}
          generatedBlueprint={kbBlueprintOut.value}
          gateReadiness={gateReadiness}
          onStep3StateChange={(next) => step3StateOut.setValue.mutate(next)}
          onGeneratedBlueprintChange={(next) => kbBlueprintOut.setValue.mutate(next)}
          onGateReadinessChange={updateGateReadiness}
          onChangeUseCase={() => goToStep(1)}
        />
      }
      produces={<p className="text-[14px] text-navy">{s.produces}</p>}
      canContinue={canCompleteM02}
      disabledReason="Reveal all seven components, answer both reflections, and generate the blueprint."
      nextLabel="Complete M02"
      onBack={() => goToStep(2)}
      onContinue={completeM02}
    />
  );
}

function ExamplesInTheWild({
  items,
}: {
  items: readonly {
    label: string;
    title: string;
    body: string;
    sourceLabel?: string;
    sourceUrl?: string;
  }[];
}) {
  return (
    <div className="space-y-3">
      <p className="eyebrow-muted">EXAMPLES IN THE WILD</p>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <div key={item.title} className="rounded-md border border-chalk bg-white p-4">
            <p className="eyebrow-muted">{item.label}</p>
            <h4 className="mt-2 font-display text-base text-navy">{item.title}</h4>
            <p className="mt-2 text-[13px] leading-relaxed text-graphite">{item.body}</p>
            {item.sourceUrl && (
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex text-[12px] font-medium text-terracotta hover:text-navy"
              >
                Source: {item.sourceLabel ?? "reference"} →
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function UseCaseLayerPreview({ useCase }: { useCase: M02UseCase }) {
  return (
    <div className="border-t border-chalk pt-6 space-y-4">
      <div>
        <p className="eyebrow">PART B · SEE THE THREE KNOWLEDGE LAYERS</p>
        <h4 className="mt-2 font-display text-xl text-navy">
          What {useCase.shortLabel} needs before AI can help
        </h4>
        <p className="mt-2 text-[14px] leading-relaxed text-graphite">
          {useCase.whatAiShouldDo}
        </p>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <LayerPreviewCard
          num="01"
          title="Internal knowledge"
          description="The business facts, records, and documents the AI needs to know what exists."
          sources={useCase.internalSources}
        />
        <LayerPreviewCard
          num="02"
          title="Contextual knowledge"
          description="The policies, procedures, and boundaries that tell the AI what it is allowed to do."
          sources={useCase.contextualRules}
        />
        <LayerPreviewCard
          num="03"
          title="Task-specific knowledge"
          description="The real examples that show the AI what good, risky, and incomplete cases look like."
          sources={useCase.taskSpecificSources}
        />
      </div>
    </div>
  );
}

function BlueprintReferenceMap({ blueprint }: { blueprint: M02BlueprintData }) {
  return (
    <div className="border-t border-chalk pt-6 space-y-6">
      <div>
        <p className="eyebrow">REFERENCE MAP · {blueprint.useCaseName.toUpperCase()}</p>
        <h4 className="mt-2 font-display text-xl text-navy">
          What a complete knowledge base would need
        </h4>
        <p className="mt-2 text-[14px] leading-relaxed text-graphite">
          {blueprint.dataMap.intro}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {blueprint.dataMap.locations.map((location) => (
          <div key={location.information} className="rounded-md border border-chalk bg-white p-4">
            <p className="text-sm font-medium text-navy">{location.information}</p>
            <dl className="mt-3 space-y-2 text-[12px] text-graphite">
              <div>
                <dt className="font-mono uppercase tracking-[0.14em] text-slate">Lives in</dt>
                <dd>{location.livesIn}</dd>
              </div>
              <div>
                <dt className="font-mono uppercase tracking-[0.14em] text-slate">Owner</dt>
                <dd>{location.owner}</dd>
              </div>
              <div>
                <dt className="font-mono uppercase tracking-[0.14em] text-slate">Movement</dt>
                <dd>{location.movement}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {blueprint.knowledgeLayers.layers.map((layer, index) => (
          <div key={layer.name} className="rounded-md border border-chalk bg-white p-4">
            <span className="inline-flex items-center rounded-full border border-chalk bg-mist/60 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-slate">
              LAYER {index + 1}
            </span>
            <h5 className="mt-3 font-display text-base text-navy">{layer.name} knowledge</h5>
            <p className="mt-1 text-[12px] leading-relaxed text-slate">{layer.description}</p>
            <ul className="mt-3 space-y-2">
              {layer.sources.map((source) => (
                <li key={`${source.item}-${source.from}`} className="text-[13px] text-graphite">
                  <strong className="text-navy">{source.item}</strong>
                  <span className="block text-[12px] text-slate">from {source.from}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="rounded-md border border-chalk bg-mist/40 p-4">
        <p className="eyebrow-muted">WHAT TO CHECK IN YOUR BUSINESS</p>
        <p className="mt-2 text-[14px] leading-relaxed text-graphite">
          Look for missing owners, stale sources, unclear permissions, weak examples, or rules that
          live informally in messages. You only need to name the gaps now; the full operating
          blueprint comes next.
        </p>
      </div>
    </div>
  );
}

function LayerPreviewCard({
  num,
  title,
  description,
  sources,
}: {
  num: string;
  title: string;
  description: string;
  sources: readonly M02UseCaseSource[];
}) {
  return (
    <div className="rounded-md border border-chalk bg-white p-4">
      <span className="inline-flex items-center rounded-full border border-chalk bg-mist/60 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-slate">
        LAYER {num}
      </span>
      <h5 className="mt-3 font-display text-base text-navy">{title}</h5>
      <p className="mt-1 text-[12px] leading-relaxed text-slate">{description}</p>
      <ul className="mt-3 space-y-2">
        {sources.slice(0, 5).map((source) => (
          <li key={source.title} className="text-[13px] text-graphite">
            <strong className="text-navy">{source.title}</strong>
            <span className="block text-[12px] text-slate">{source.examples.join(", ")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChecklistSection({
  title,
  hint,
  items,
  selected,
  onToggle,
  footer,
}: {
  title: string;
  hint: string;
  items: readonly string[];
  selected: string[];
  onToggle: (item: string) => void;
  footer: string;
}) {
  return (
    <div className="border-t border-chalk pt-6 space-y-3">
      <div>
        <p className="text-sm font-medium text-navy">{title}</p>
        <p className="mt-1 text-[12px] italic text-slate">{hint}</p>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item}>
            <label className="flex cursor-pointer items-start gap-2 text-[14px] text-navy">
              <input
                type="checkbox"
                checked={selected.includes(item)}
                onChange={() => onToggle(item)}
                className="mt-1 h-4 w-4 accent-terracotta"
              />
              <span>{item}</span>
            </label>
          </li>
        ))}
      </ul>
      <p className="text-[12px] italic text-slate">{footer}</p>
    </div>
  );
}

export function M02WorkBackLink({ slug }: { slug: string }) {
  return (
    <Link
      to="/app/$workspaceSlug/assess/$moduleId"
      params={{ workspaceSlug: slug, moduleId: "m02" }}
      className="inline-block text-[13px] font-medium text-slate hover:text-navy"
    >
      ← Back to overview
    </Link>
  );
}
