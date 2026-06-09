import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAssessProgress, useAssessOutput } from "@/hooks/useAssess";
import { supabase } from "@/integrations/supabase/client";
import { Step } from "@/components/assess/Step";
import { M02Step3Guided } from "@/components/m02/step3/M02Step3Guided";
import { BlueprintDocument } from "@/components/m02/step3/BlueprintDocument";
import { BlueprintExportButton } from "@/components/m02/step3/BlueprintExportButton";
import {
  M02_DEFAULT_USE_CASE_ID,
  M02_COURSE_CONTENT,
  M02_USE_CASES,
  getM02UseCase,
} from "@/lib/assess/content/course1";
import type { M02UseCase } from "@/lib/assess/content/course1";
import { getM02Blueprint } from "@/data/m02/blueprints";
import {
  M02_BLUEPRINT_COMPONENTS,
  createDefaultM02Step3State,
  normalizeM02Step3State,
  type M02BlueprintData,
  type M02GeneratedBlueprint,
  type M02Step3State,
} from "@/data/m02/blueprintSchema";
import {
  M02_EXAMPLE_GATE_EXPLANATION,
  M02_EXAMPLE_GATE_STATUS,
  buildGeneratedM02Blueprint,
} from "@/components/m02/step3/BlueprintGenerator";

const CHAPTER_LABEL = "PHASE 01 · M02 · DATA READINESS & KNOWLEDGE BASE";
const TOTAL_STEPS = 3;
const REFERENCE_GAPS = [
  "Source owner must approve the entry before production",
  "Access rules must be checked against live systems",
  "Retrieval tests must be run and recorded before deployment",
] as const;

type StepNum = 1 | 2 | 3;
type GateStatus = "pass" | "partial" | "blocked" | "";
type M02QuizStepKey = "step3";
type M02QuizAnswer = string | string[];

interface M02QuizQuestion {
  id: string;
  type: "single" | "multi";
  question: string;
  options: readonly string[];
  correct?: string;
  explanation?: string;
}

interface GateReadinessShape {
  status: GateStatus;
  checks: string[];
  reasonCodes: string[];
  explanation?: string;
}

interface M02QuizStepState {
  answers: Record<string, M02QuizAnswer>;
  checked: boolean;
}

interface M02KnowledgeCheckState {
  step3: M02QuizStepState;
}

const DEFAULT_GATE_READINESS: GateReadinessShape = {
  status: M02_EXAMPLE_GATE_STATUS,
  checks: [...M02_BLUEPRINT_COMPONENTS],
  reasonCodes: [...REFERENCE_GAPS],
  explanation: M02_EXAMPLE_GATE_EXPLANATION,
};

const M02_STEP_QUIZZES: Record<M02QuizStepKey, readonly M02QuizQuestion[]> = {
  step3: [
    {
      id: "q1",
      type: "single",
      question: "Why is the refunds policy PDF data, but not yet an operating knowledge base?",
      options: [
        "Because PDFs cannot contain useful information",
        "Because it still lacks owner, metadata, rules, access boundaries, and retrieval tests",
        "Because the AI should ignore all documents",
        "Because the document must be converted into code first",
      ],
      correct: "Because it still lacks owner, metadata, rules, access boundaries, and retrieval tests",
      explanation:
        "The document has information. The operating KB adds the structure that makes the information retrievable, governable, and testable.",
    },
    {
      id: "q2",
      type: "single",
      question: "What does C1 Data Map add to the raw document?",
      options: [
        "Source, owner, metadata, sensitivity, and a retrievable KB entry ID",
        "A nicer file name only",
        "A model temperature setting",
        "A final customer answer",
      ],
      correct: "Source, owner, metadata, sensitivity, and a retrievable KB entry ID",
      explanation:
        "C1 turns raw material into source-backed, owned, classified knowledge.",
    },
    {
      id: "q3",
      type: "single",
      question: "What does C2 Trust + Safety control?",
      options: [
        "Which source wins, who may see the answer, what the AI may do, and when to escalate",
        "Which font the output uses",
        "How many examples appear on the page",
        "Whether the user likes the answer",
      ],
      correct: "Which source wins, who may see the answer, what the AI may do, and when to escalate",
      explanation:
        "C2 prevents the AI from using the right knowledge in the wrong channel, for the wrong person, or beyond its authority.",
    },
    {
      id: "q4",
      type: "single",
      question: "What makes C3 Verification useful?",
      options: [
        "It checks whether the AI sounds confident",
        "It defines the user question, expected entry, expected source, and expected behavior in advance",
        "It replaces human review",
        "It only runs after deployment",
      ],
      correct: "It defines the user question, expected entry, expected source, and expected behavior in advance",
      explanation:
        "A retrieval test is useful because the expected evidence and behavior are defined before the AI is trusted.",
    },
    {
      id: "q5",
      type: "multi",
      question: "Which components turn the document into an operating KB?",
      options: [
        "C1 - Data Map",
        "C2 - Trust + Safety",
        "C3 - Verification",
      ],
    },
  ],
};

function createDefaultM02KnowledgeCheck(): M02KnowledgeCheckState {
  return {
    step3: { answers: {}, checked: false },
  };
}

function normalizeM02KnowledgeCheck(value: unknown): M02KnowledgeCheckState {
  const defaults = createDefaultM02KnowledgeCheck();
  if (!value || typeof value !== "object" || Array.isArray(value)) return defaults;
  const source = value as Partial<Record<M02QuizStepKey, Partial<M02QuizStepState>>>;
  return (["step3"] as const).reduce<M02KnowledgeCheckState>((acc, stepKey) => {
    const stepValue = source[stepKey];
    acc[stepKey] = {
      answers:
        stepValue?.answers && typeof stepValue.answers === "object" && !Array.isArray(stepValue.answers)
          ? stepValue.answers
          : {},
      checked: !!stepValue?.checked,
    };
    return acc;
  }, defaults);
}

function getM02QuizStatus(
  quiz: readonly M02QuizQuestion[],
  state: M02QuizStepState,
) {
  const answers = state.answers ?? {};
  const gradableQuestions = quiz.filter((question) => !!question.correct);
  const allAnswered = quiz.every((question) => {
    const value = answers[question.id];
    return question.type === "multi"
      ? Array.isArray(value) && value.length > 0
      : typeof value === "string" && value.length > 0;
  });
  const correctCount = gradableQuestions.reduce(
    (count, question) => (answers[question.id] === question.correct ? count + 1 : count),
    0,
  );
  const passThreshold = Math.min(3, gradableQuestions.length);
  const quizPassed = allAnswered && state.checked && correctCount >= passThreshold;
  return {
    allAnswered,
    correctCount,
    gradableCount: gradableQuestions.length,
    passThreshold,
    quizChecked: state.checked,
    quizPassed,
  };
}

function createReviewedM02State(useCaseId: string): M02Step3State {
  return {
    ...createDefaultM02Step3State(useCaseId),
    revealedPanels: Array.from({ length: M02_BLUEPRINT_COMPONENTS.length }, () => true),
    collapsedPanels: Array.from({ length: M02_BLUEPRINT_COMPONENTS.length }, () => true),
    hardestComponents: [...M02_BLUEPRINT_COMPONENTS],
    status: M02_EXAMPLE_GATE_STATUS,
    statusExplanation: M02_EXAMPLE_GATE_EXPLANATION,
    generated: true,
    generatedAt: new Date().toISOString(),
  };
}

function buildReferenceBlueprint(blueprint: M02BlueprintData, state: M02Step3State) {
  return buildGeneratedM02Blueprint({
    blueprint,
    state,
    namedGaps: [...REFERENCE_GAPS],
    selectedSources: {
      internal: [],
      contextual: [],
      taskSpecific: [],
    },
  });
}

export function M02Work() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const qc = useQueryClient();

  const progress = useAssessProgress("m02");

  const selectedCaseOut = useAssessOutput<string>("m02.selected_case");
  const gapsOut = useAssessOutput<string[]>("m02.gaps");
  const gateReadinessOut = useAssessOutput<GateReadinessShape>("m02.gate1_readiness");
  const step3StateOut = useAssessOutput<M02Step3State>("m02.step3_state");
  const kbBlueprintOut = useAssessOutput<M02GeneratedBlueprint | null>("m02.kb_blueprint");
  const knowledgeCheckOut = useAssessOutput<M02KnowledgeCheckState>("m02.knowledge_check");

  const [step, setStep] = useState<StepNum>(1);
  const [selectedCaseId, setSelectedCaseId] = useState(M02_DEFAULT_USE_CASE_ID);
  const [gateReadiness, setGateReadiness] =
    useState<GateReadinessShape>(DEFAULT_GATE_READINESS);
  const [knowledgeCheck, setKnowledgeCheck] =
    useState<M02KnowledgeCheckState>(() => createDefaultM02KnowledgeCheck());
  const [step3DraftState, setStep3DraftState] =
    useState<M02Step3State>(() => createDefaultM02Step3State(M02_DEFAULT_USE_CASE_ID));
  const [kbBlueprintDraft, setKbBlueprintDraft] =
    useState<M02GeneratedBlueprint | null>(null);
  const step3SaveTimerRef = useRef<number | null>(null);

  const [hydrated, setHydrated] = useState({
    step: false,
    selectedCase: false,
    gateReadiness: false,
    knowledgeCheck: false,
    step3State: false,
    kbBlueprint: false,
  });

  const selectedUseCase = useMemo(
    () => getM02UseCase(selectedCaseId),
    [selectedCaseId],
  );
  const selectedBlueprint = getM02Blueprint(selectedCaseId);
  const defaultBlueprint = getM02Blueprint(M02_DEFAULT_USE_CASE_ID);
  const step3QuizStatus = getM02QuizStatus(M02_STEP_QUIZZES.step3, knowledgeCheck.step3);

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

  useEffect(() => {
    if (progress.isLoading) return;
    const status = progress.data?.status;
    if (!status || status === "not_started") {
      const nextStep = Math.min(Math.max(progress.data?.current_step ?? 1, 1), TOTAL_STEPS) as StepNum;
      progress.setStep.mutate(nextStep);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress.isLoading]);

  useEffect(() => {
    if (hydrated.selectedCase || selectedCaseOut.isLoading) return;
    const saved = selectedCaseOut.value;
    if (typeof saved === "string" && M02_USE_CASES.some((useCase) => useCase.id === saved)) {
      setSelectedCaseId(saved);
    } else {
      selectedCaseOut.setValue.mutate(M02_DEFAULT_USE_CASE_ID);
    }
    setHydrated((h) => ({ ...h, selectedCase: true }));
  }, [hydrated.selectedCase, selectedCaseOut]);

  useEffect(() => {
    if (hydrated.gateReadiness || gateReadinessOut.isLoading) return;
    if (gateReadinessOut.value && typeof gateReadinessOut.value === "object") {
      const v = gateReadinessOut.value as Partial<GateReadinessShape>;
      setGateReadiness({
        status: v.status ?? DEFAULT_GATE_READINESS.status,
        checks: Array.isArray(v.checks) ? v.checks : DEFAULT_GATE_READINESS.checks,
        reasonCodes: Array.isArray(v.reasonCodes) ? v.reasonCodes : DEFAULT_GATE_READINESS.reasonCodes,
        explanation: typeof v.explanation === "string" ? v.explanation : DEFAULT_GATE_READINESS.explanation,
      });
    }
    setHydrated((h) => ({ ...h, gateReadiness: true }));
  }, [hydrated.gateReadiness, gateReadinessOut.isLoading, gateReadinessOut.value]);

  useEffect(() => {
    if (hydrated.knowledgeCheck || knowledgeCheckOut.isLoading) return;
    setKnowledgeCheck(normalizeM02KnowledgeCheck(knowledgeCheckOut.value));
    setHydrated((h) => ({ ...h, knowledgeCheck: true }));
  }, [hydrated.knowledgeCheck, knowledgeCheckOut.isLoading, knowledgeCheckOut.value]);

  useEffect(() => {
    if (hydrated.step3State || !hydrated.selectedCase || step3StateOut.isLoading) return;
    const saved = step3StateOut.value;
    if (saved?.useCaseId === selectedCaseId) {
      setStep3DraftState(normalizeM02Step3State(saved, selectedCaseId));
    } else {
      setStep3DraftState(createDefaultM02Step3State(selectedCaseId));
    }
    setHydrated((h) => ({ ...h, step3State: true }));
  }, [
    hydrated.step3State,
    hydrated.selectedCase,
    selectedCaseId,
    step3StateOut.isLoading,
    step3StateOut.value,
  ]);

  useEffect(() => {
    if (hydrated.kbBlueprint || !hydrated.selectedCase || kbBlueprintOut.isLoading) return;
    const saved = kbBlueprintOut.value;
    setKbBlueprintDraft(
      saved?.useCaseId === selectedCaseId && saved.markdown.includes("## C1 - Data Map")
        ? saved
        : null,
    );
    setHydrated((h) => ({ ...h, kbBlueprint: true }));
  }, [
    hydrated.kbBlueprint,
    hydrated.selectedCase,
    selectedCaseId,
    kbBlueprintOut.isLoading,
    kbBlueprintOut.value,
  ]);

  useEffect(() => {
    return () => {
      if (step3SaveTimerRef.current) window.clearTimeout(step3SaveTimerRef.current);
    };
  }, []);

  const toggle = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  const persistKnowledgeCheck = (next: M02KnowledgeCheckState) => {
    setKnowledgeCheck(next);
    knowledgeCheckOut.setValue.mutate(next);
  };

  const setQuizAnswer = (stepKey: M02QuizStepKey, questionId: string, option: string, multi: boolean) => {
    const stepState = knowledgeCheck[stepKey] ?? { answers: {}, checked: false };
    const currentValue = stepState.answers[questionId];
    const nextValue = multi
      ? toggle(Array.isArray(currentValue) ? currentValue : [], option)
      : option;
    persistKnowledgeCheck({
      ...knowledgeCheck,
      [stepKey]: {
        answers: {
          ...stepState.answers,
          [questionId]: nextValue,
        },
        checked: false,
      },
    });
  };

  const checkQuiz = (stepKey: M02QuizStepKey) => {
    persistKnowledgeCheck({
      ...knowledgeCheck,
      [stepKey]: {
        ...knowledgeCheck[stepKey],
        checked: true,
      },
    });
  };

  const retryQuiz = (stepKey: M02QuizStepKey) => {
    persistKnowledgeCheck({
      ...knowledgeCheck,
      [stepKey]: {
        ...knowledgeCheck[stepKey],
        checked: false,
      },
    });
  };

  const persistStep3DraftState = (
    next: M02Step3State,
    options: { immediate?: boolean } = {},
  ) => {
    setStep3DraftState(next);
    if (step3SaveTimerRef.current) {
      window.clearTimeout(step3SaveTimerRef.current);
      step3SaveTimerRef.current = null;
    }
    if (options.immediate) {
      step3StateOut.setValue.mutate(next);
      return;
    }
    step3SaveTimerRef.current = window.setTimeout(() => {
      step3StateOut.setValue.mutate(next);
      step3SaveTimerRef.current = null;
    }, 700);
  };

  const selectReferenceExample = (caseId: string) => {
    const blueprint = getM02Blueprint(caseId);
    if (!blueprint) return;
    const reviewedState = createReviewedM02State(caseId);
    const generated = buildReferenceBlueprint(blueprint, reviewedState);
    setSelectedCaseId(caseId);
    selectedCaseOut.setValue.mutate(caseId);
    persistStep3DraftState(reviewedState, { immediate: true });
    setKbBlueprintDraft(generated);
    kbBlueprintOut.setValue.mutate(generated);
  };

  const goToStep = async (next: StepNum) => {
    setStep(next);
    await progress.setStep.mutateAsync(next);
  };

  const completeM02 = async () => {
    if (!user || !workspace || !selectedBlueprint) return;
    const reviewedState = step3DraftState.generated
      ? step3DraftState
      : createReviewedM02State(selectedCaseId);
    const generated = kbBlueprintDraft?.useCaseId === selectedCaseId
      ? kbBlueprintDraft
      : buildReferenceBlueprint(selectedBlueprint, reviewedState);
    await selectedCaseOut.setValue.mutateAsync(selectedCaseId);
    await gapsOut.setValue.mutateAsync([...REFERENCE_GAPS]);
    await gateReadinessOut.setValue.mutateAsync(DEFAULT_GATE_READINESS);
    await knowledgeCheckOut.setValue.mutateAsync(knowledgeCheck);
    await step3StateOut.setValue.mutateAsync(reviewedState);
    await kbBlueprintOut.setValue.mutateAsync(generated);
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

  if (!workspace || !defaultBlueprint) return null;

  const defaultC1 = defaultBlueprint.components.c1;

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
          <div className="space-y-6">
            <div className="card bg-mist/40 space-y-2">
              <p className="eyebrow-muted">CHAPTER IDEA</p>
              <p className="text-[14px] leading-relaxed text-graphite">
                A document is data. It is not always decision-ready knowledge. The refunds policy
                PDF contains useful information, but the AI still needs meaning, rules, and proof
                before it can use that information safely.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-lg border border-chalk bg-white p-5">
                <p className="eyebrow">RAW DOCUMENT</p>
                <h4 className="mt-2 font-display text-2xl text-navy">{defaultC1.rawSource.name}</h4>
                <div className="mt-4 space-y-3">
                  <Fact label="Format" value={defaultC1.rawSource.format} />
                  <Fact label="What it contains" value="Policy text, refund window, usage boundary, and exception language." />
                  <Fact label="Starting state" value={defaultC1.rawSource.startingState} />
                </div>
              </div>
              <div className="rounded-lg border border-chalk bg-paper p-5">
                <p className="eyebrow">WHAT IT LACKS</p>
                <h4 className="mt-2 font-display text-2xl text-navy">
                  Useful data, not yet an operating KB
                </h4>
                <ul className="mt-4 space-y-2 text-[14px] leading-relaxed text-graphite">
                  <li>· No clear source owner, version, review date, or sensitivity label.</li>
                  <li>· No entry ID the AI can retrieve and cite.</li>
                  <li>· No allowed AI behavior or escalation boundary.</li>
                  <li>· No source precedence rule if FAQ, macro, and policy disagree.</li>
                  <li>· No retrieval test proving the AI finds the right source and behaves safely.</li>
                </ul>
              </div>
            </div>
          </div>
        }
        produces={<p className="text-[14px] text-navy">{s.produces}</p>}
        canContinue
        nextLabel={s.nextLabel}
        onContinue={async () => {
          await selectedCaseOut.setValue.mutateAsync(M02_DEFAULT_USE_CASE_ID);
          await goToStep(2);
        }}
      />
    );
  }

  if (step === 2) {
    const s = M02_COURSE_CONTENT.step2;
    const allPanelsRevealed = step3DraftState.revealedPanels.every(Boolean);
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
          <M02Step3Guided
            selectedUseCase={selectedUseCase}
            step3State={step3DraftState}
            onStep3StateChange={persistStep3DraftState}
          />
        }
        produces={<p className="text-[14px] text-navy">{s.produces}</p>}
        canContinue={allPanelsRevealed}
        disabledReason={!allPanelsRevealed ? "Reveal C1, C2, and C3 to continue." : undefined}
        nextLabel={s.nextLabel}
        onBack={() => goToStep(1)}
        onContinue={async () => {
          if (selectedBlueprint) {
            const reviewedState = createReviewedM02State(selectedCaseId);
            const generated = buildReferenceBlueprint(selectedBlueprint, reviewedState);
            persistStep3DraftState(reviewedState, { immediate: true });
            setGateReadiness(DEFAULT_GATE_READINESS);
            gateReadinessOut.setValue.mutate(DEFAULT_GATE_READINESS);
            setKbBlueprintDraft(generated);
            kbBlueprintOut.setValue.mutate(generated);
          }
          await goToStep(3);
        }}
      />
    );
  }

  const s = M02_COURSE_CONTENT.step3;
  const activeBlueprint = selectedBlueprint ?? defaultBlueprint;
  const activeGenerated = kbBlueprintDraft?.useCaseId === selectedCaseId
    ? kbBlueprintDraft
    : buildReferenceBlueprint(activeBlueprint, createReviewedM02State(selectedCaseId));

  return (
    <Step
      chapterLabel={CHAPTER_LABEL}
      stepLabel="STEP 3 of 3 · RECAP + REFERENCE BLUEPRINT"
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
          <section className="rounded-lg border border-chalk bg-mist/40 p-5">
            <p className="eyebrow-muted">REFERENCE BLUEPRINT READY</p>
            <h4 className="mt-2 font-display text-2xl text-navy">
              {activeBlueprint.useCaseName}
            </h4>
            <p className="mt-2 text-[14px] leading-relaxed text-graphite">
              This is an example output, not a personalized worksheet. It shows what the operating
              KB blueprint contains once the raw document has passed through C1, C2, and C3.
            </p>
            <div className="mt-4">
              <BlueprintExportButton blueprint={activeBlueprint} generated={activeGenerated} />
            </div>
          </section>

          <BlueprintDocument blueprint={activeBlueprint} generated={activeGenerated} />

          <ReferenceExamples
            selectedCaseId={selectedCaseId}
            onSelect={selectReferenceExample}
          />

          <QuizSection
            eyebrow="FINAL CHECK · UNDERSTANDING"
            title="Confirm the difference"
            quiz={M02_STEP_QUIZZES.step3}
            state={knowledgeCheck.step3}
            status={step3QuizStatus}
            namePrefix="m02-step3"
            onAnswer={(questionId, option, multi) => setQuizAnswer("step3", questionId, option, multi)}
            onCheck={() => checkQuiz("step3")}
            onRetry={() => retryQuiz("step3")}
          />
        </div>
      }
      produces={<p className="text-[14px] text-navy">{s.produces}</p>}
      canContinue={step3QuizStatus.quizPassed}
      disabledReason={
        !step3QuizStatus.allAnswered
          ? "Answer all five checks before completing M02."
          : !step3QuizStatus.quizChecked
            ? "Click Check answers before completing M02."
            : "You need at least 3 correct answers before completing M02."
      }
      nextLabel="Complete M02"
      onBack={() => goToStep(2)}
      onContinue={completeM02}
    />
  );
}

function ReferenceExamples({
  selectedCaseId,
  onSelect,
}: {
  selectedCaseId: string;
  onSelect: (caseId: string) => void;
}) {
  return (
    <section className="space-y-3">
      <p className="eyebrow-muted">OPTIONAL REFERENCE EXAMPLES</p>
      <div className="grid gap-3 md:grid-cols-2">
        {M02_USE_CASES.map((useCase) => {
          const blueprint = getM02Blueprint(useCase.id);
          if (!blueprint) return null;
          const selected = selectedCaseId === useCase.id;
          return (
            <button
              key={useCase.id}
              type="button"
              onClick={() => onSelect(useCase.id)}
              className={`rounded-md border p-4 text-left transition-colors ${
                selected
                  ? "border-terracotta bg-terracotta/5"
                  : "border-chalk bg-white hover:bg-mist/40"
              }`}
            >
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-terracotta">
                {useCase.shortLabel}
                {useCase.id === M02_DEFAULT_USE_CASE_ID ? " · default" : ""}
              </span>
              <span className="mt-2 block font-display text-base text-navy">
                {useCase.title}
              </span>
              <span className="mt-1 block text-[13px] leading-relaxed text-graphite">
                {blueprint.components.c1.rawSource.name} becomes {blueprint.components.c1.kbEntry.id}.
              </span>
            </button>
          );
        })}
      </div>
    </section>
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

function QuizSection({
  eyebrow,
  title,
  quiz,
  state,
  status,
  namePrefix,
  onAnswer,
  onCheck,
  onRetry,
}: {
  eyebrow: string;
  title: string;
  quiz: readonly M02QuizQuestion[];
  state: M02QuizStepState;
  status: ReturnType<typeof getM02QuizStatus>;
  namePrefix: string;
  onAnswer: (questionId: string, option: string, multi: boolean) => void;
  onCheck: () => void;
  onRetry: () => void;
}) {
  const answers = state.answers ?? {};
  return (
    <section className="rounded-lg border border-chalk bg-white p-6 shadow-sm">
      <p className="eyebrow">{eyebrow}</p>
      <h4 className="mt-2 font-display text-2xl text-navy">{title}</h4>
      <div className="mt-5 space-y-5">
        {quiz.map((question, index) => {
          const value = answers[question.id];
          const answered = question.type === "multi"
            ? Array.isArray(value) && value.length > 0
            : typeof value === "string" && value.length > 0;
          const gradable = !!question.correct;
          const isCorrect = gradable && value === question.correct;
          const showGrading = status.quizChecked && gradable && answered;
          return (
            <div key={question.id} className="rounded-md border border-chalk bg-paper p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate">
                    Check {index + 1}
                  </p>
                  <h5 className="mt-1 font-display text-base text-navy">{question.question}</h5>
                </div>
                {showGrading && (
                  <span className={`rounded-full px-2 py-1 text-[11px] ${
                    isCorrect ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                  }`}>
                    {isCorrect ? "Correct" : "Review"}
                  </span>
                )}
              </div>
              <div className="mt-3 grid gap-2">
                {question.options.map((option) => {
                  const checked = question.type === "multi"
                    ? Array.isArray(value) && value.includes(option)
                    : value === option;
                  return (
                    <label
                      key={option}
                      className={`flex items-start gap-2 text-[14px] text-graphite ${
                        status.quizChecked ? "cursor-default" : "cursor-pointer"
                      }`}
                    >
                      <input
                        type={question.type === "multi" ? "checkbox" : "radio"}
                        name={`${namePrefix}-${question.id}`}
                        checked={checked}
                        disabled={status.quizChecked}
                        onChange={() => onAnswer(question.id, option, question.type === "multi")}
                        className="mt-1 h-4 w-4 accent-terracotta"
                      />
                      <span>{option}</span>
                    </label>
                  );
                })}
              </div>
              {status.quizChecked && question.explanation && (
                <p className="mt-3 rounded-md bg-mist/60 p-3 text-[13px] leading-relaxed text-graphite">
                  {question.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-5 flex flex-col gap-3 rounded-md border border-chalk bg-paper p-4 sm:flex-row sm:items-center sm:justify-between">
        {status.quizChecked ? (
          <p className="text-[13px] text-graphite">
            {status.quizPassed
              ? `Passed: ${status.correctCount}/${status.gradableCount} scored checks correct.`
              : `Score: ${status.correctCount}/${status.gradableCount}. Review and try again.`}
          </p>
        ) : (
          <p className="text-[13px] text-graphite">
            Answer all checks, then confirm your understanding.
          </p>
        )}
        <button
          type="button"
          onClick={status.quizChecked ? onRetry : onCheck}
          disabled={!status.allAnswered}
          className="rounded-md bg-terracotta px-4 py-2 text-sm font-medium text-white hover:bg-navy disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status.quizChecked ? "Try again" : "Check answers"}
        </button>
      </div>
    </section>
  );
}
