import { useEffect, useMemo, useRef, useState } from "react";
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
type M02QuizStepKey = "step1" | "step2" | "step3";
type M02QuizAnswer = string | string[];

interface M02QuizQuestion {
  id: string;
  type: "single" | "multi";
  question: string;
  options: readonly string[];
  correct?: string;
  explanation?: string;
}

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

interface M02QuizStepState {
  answers: Record<string, M02QuizAnswer>;
  checked: boolean;
}

interface M02KnowledgeCheckState {
  step1: M02QuizStepState;
  step2: M02QuizStepState;
  step3: M02QuizStepState;
}

const DEFAULT_TEST_SET: TestSetShape = { clean: 5, edge: 5, adversarial: 5 };
const DEFAULT_GATE_READINESS: GateReadinessShape = {
  status: "",
  checks: [],
  reasonCodes: [],
};

const M02_STEP_QUIZZES: Record<M02QuizStepKey, readonly M02QuizQuestion[]> = {
  step1: [
    {
      id: "q1",
      type: "single",
      question: "What is the purpose of choosing a business use case first?",
      options: [
        "To make data readiness concrete around one process",
        "To choose the final capstone project",
        "To skip source mapping",
        "To decide which AI model to buy",
      ],
      correct: "To make data readiness concrete around one process",
      explanation:
        "The use case gives the learner a practical lens for identifying the knowledge AI would need.",
    },
    {
      id: "q2",
      type: "single",
      question: "Which source belongs most clearly in the internal knowledge layer?",
      options: [
        "A refund policy",
        "A product brochure, FAQ, or customer record",
        "An escalation rule",
        "A risky edge-case ticket",
      ],
      correct: "A product brochure, FAQ, or customer record",
      explanation:
        "Internal knowledge is what the business knows about itself: products, records, documents, and operational facts.",
    },
    {
      id: "q3",
      type: "single",
      question: "Which source belongs most clearly in the contextual knowledge layer?",
      options: [
        "A resolved ticket example",
        "A product catalog",
        "An approval, privacy, refund, or escalation rule",
        "A list of customer complaints",
      ],
      correct: "An approval, privacy, refund, or escalation rule",
      explanation:
        "Contextual knowledge sets boundaries: policies, procedures, permissions, approvals, and escalation rules.",
    },
    {
      id: "q4",
      type: "single",
      question: "Why does the task-specific layer matter?",
      options: [
        "It replaces policies with examples",
        "It shows what good, ambiguous, risky, and incomplete work looks like",
        "It stores the AI's chat history",
        "It removes the need for retrieval tests",
      ],
      correct: "It shows what good, ambiguous, risky, and incomplete work looks like",
      explanation:
        "Task-specific examples help the future assistant learn how the work behaves in real operating cases.",
    },
    {
      id: "q5",
      type: "multi",
      question: "Which layers feel most fragile in your business today?",
      options: ["Internal knowledge", "Contextual rules", "Task-specific examples"],
    },
  ],
  step2: [
    {
      id: "q1",
      type: "single",
      question: "What is the main job of Step 2?",
      options: [
        "Build the full knowledge base",
        "Spot what would be missing, stale, ownerless, or risky before Build",
        "Choose a model provider",
        "Write final AI prompts",
      ],
      correct: "Spot what would be missing, stale, ownerless, or risky before Build",
      explanation:
        "Step 2 is diagnosis. The learner names gaps before HOI shows the complete blueprint in Step 3.",
    },
    {
      id: "q2",
      type: "single",
      question: "A policy exists, but nobody owns review or updates. What is that?",
      options: [
        "Not a problem because the document exists",
        "A readiness gap",
        "A retrieval test",
        "A task-specific example",
      ],
      correct: "A readiness gap",
      explanation:
        "AI-ready knowledge needs an accountable owner. A document without ownership can become stale or disputed.",
    },
    {
      id: "q3",
      type: "single",
      question: "Which issue is a readiness gap for customer support AI?",
      options: [
        "The FAQ has a clear owner and review date",
        "Escalation rules live only in messages and informal memory",
        "The product catalog is current",
        "Resolved tickets are labelled by outcome",
      ],
      correct: "Escalation rules live only in messages and informal memory",
      explanation:
        "Informal rules are hard to retrieve, audit, and enforce. They need to become governed knowledge.",
    },
    {
      id: "q4",
      type: "single",
      question: "What happens to the gaps selected in Step 2?",
      options: [
        "They disappear after the quiz",
        "They become open items in the Step 3 Governance Register",
        "They replace the generated blueprint",
        "They automatically block M02 completion",
      ],
      correct: "They become open items in the Step 3 Governance Register",
      explanation:
        "Step 2 gaps carry forward as practical governance actions before the process moves into Build.",
    },
    {
      id: "q5",
      type: "multi",
      question: "Which readiness gaps are most likely in your business?",
      options: [
        "Missing owner",
        "Stale source",
        "Unclear access",
        "Weak examples",
        "Informal escalation rule",
      ],
    },
  ],
  step3: [
    {
      id: "q1",
      type: "single",
      question: "What is an operating knowledge base blueprint?",
      options: [
        "A folder of documents for the AI to read",
        "A structured spec showing entries, rules, tests, governance, and AI-facing retrieval instructions",
        "A list of model parameters",
        "A final production database",
      ],
      correct:
        "A structured spec showing entries, rules, tests, governance, and AI-facing retrieval instructions",
      explanation:
        "The M02 deliverable is an operational blueprint your team can use before building a real assistant.",
    },
    {
      id: "q2",
      type: "single",
      question: "Why do knowledge entries need metadata?",
      options: [
        "To make the document look more complete",
        "To identify source, owner, layer, and allowed use",
        "To reduce token costs",
        "To replace human review",
      ],
      correct: "To identify source, owner, layer, and allowed use",
      explanation:
        "Metadata makes each entry governable and auditable instead of just another loose paragraph.",
    },
    {
      id: "q3",
      type: "single",
      question: "What do lineage and source precedence control?",
      options: [
        "Which source supports an answer and which source wins when sources conflict",
        "How creative the model should be",
        "Which employee writes the prompt",
        "How many documents fit in the context window",
      ],
      correct: "Which source supports an answer and which source wins when sources conflict",
      explanation:
        "Lineage creates traceability. Precedence prevents source conflicts from turning into confident contradictions.",
    },
    {
      id: "q4",
      type: "single",
      question: "What makes a retrieval test useful?",
      options: [
        "It is a broad question the AI can answer however it wants",
        "It includes a question, expected entry, expected source, and expected behavior",
        "It checks whether the AI sounds confident",
        "It is only run after deployment",
      ],
      correct: "It includes a question, expected entry, expected source, and expected behavior",
      explanation:
        "A retrieval test is provable because the expected evidence and behavior are defined in advance.",
    },
    {
      id: "q5",
      type: "multi",
      question: "Which blueprint components would you want reviewed before Build?",
      options: [
        "Data map",
        "Knowledge entries",
        "Metadata",
        "Lineage and precedence",
        "Access and sensitivity",
        "Retrieval tests",
      ],
    },
  ],
};

function createDefaultM02KnowledgeCheck(): M02KnowledgeCheckState {
  return {
    step1: { answers: {}, checked: false },
    step2: { answers: {}, checked: false },
    step3: { answers: {}, checked: false },
  };
}

function normalizeM02KnowledgeCheck(value: unknown): M02KnowledgeCheckState {
  const defaults = createDefaultM02KnowledgeCheck();
  if (!value || typeof value !== "object" || Array.isArray(value)) return defaults;
  const source = value as Partial<Record<M02QuizStepKey, Partial<M02QuizStepState>>>;
  return (["step1", "step2", "step3"] as const).reduce<M02KnowledgeCheckState>((acc, stepKey) => {
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
  const knowledgeCheckOut = useAssessOutput<M02KnowledgeCheckState>("m02.knowledge_check");

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
  const [knowledgeCheck, setKnowledgeCheck] =
    useState<M02KnowledgeCheckState>(() => createDefaultM02KnowledgeCheck());
  const [step3DraftState, setStep3DraftState] =
    useState<M02Step3State>(() => createDefaultM02Step3State(M02_DEFAULT_USE_CASE_ID));
  const [kbBlueprintDraft, setKbBlueprintDraft] =
    useState<M02GeneratedBlueprint | null>(null);
  const [customGap, setCustomGap] = useState("");
  const step3SaveTimerRef = useRef<number | null>(null);

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
    knowledgeCheck: false,
    step3State: false,
    kbBlueprint: false,
  });

  const selectedUseCase = useMemo(
    () => getM02UseCase(selectedCaseId),
    [selectedCaseId],
  );
  const selectedBlueprint = getM02Blueprint(selectedCaseId);
  const step1QuizStatus = getM02QuizStatus(M02_STEP_QUIZZES.step1, knowledgeCheck.step1);
  const step2QuizStatus = getM02QuizStatus(M02_STEP_QUIZZES.step2, knowledgeCheck.step2);
  const step3QuizStatus = getM02QuizStatus(M02_STEP_QUIZZES.step3, knowledgeCheck.step3);

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

  useEffect(() => {
    if (hydrated.knowledgeCheck || knowledgeCheckOut.isLoading) return;
    setKnowledgeCheck(normalizeM02KnowledgeCheck(knowledgeCheckOut.value));
    setHydrated((h) => ({ ...h, knowledgeCheck: true }));
  }, [hydrated.knowledgeCheck, knowledgeCheckOut.isLoading, knowledgeCheckOut.value]);

  useEffect(() => {
    if (hydrated.step3State || !hydrated.selectedCase || step3StateOut.isLoading) return;
    const saved = step3StateOut.value;
    if (saved?.useCaseId === selectedCaseId) {
      setStep3DraftState(saved);
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
    setKbBlueprintDraft(saved?.useCaseId === selectedCaseId ? saved : null);
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

  const persistGeneratedBlueprint = (next: M02GeneratedBlueprint | null) => {
    setKbBlueprintDraft(next);
    if (next) kbBlueprintOut.setValue.mutate(next);
  };

  const selectUseCase = (caseId: string) => {
    if (caseId !== selectedCaseId) {
      const hasStep3Work =
        !!kbBlueprintDraft ||
        !!step3DraftState.generated ||
        !!step3DraftState.revealedPanels?.some(Boolean);
      if (hasStep3Work && !window.confirm("Changing use case will reset Step 3. Continue?")) {
        return;
      }
      const resetState = createDefaultM02Step3State(caseId);
      persistStep3DraftState(resetState, { immediate: true });
      setKbBlueprintDraft(null);
      setGateReadiness(DEFAULT_GATE_READINESS);
      gateReadinessOut.setValue.mutate(DEFAULT_GATE_READINESS);
      setGapsSel([]);
      gapsOut.setValue.mutate([]);
      persistKnowledgeCheck({
        ...knowledgeCheck,
        step2: { answers: {}, checked: false },
        step3: { answers: {}, checked: false },
      });
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
    await knowledgeCheckOut.setValue.mutateAsync(knowledgeCheck);
    await step3StateOut.setValue.mutateAsync(step3DraftState);
    if (kbBlueprintDraft) await kbBlueprintOut.setValue.mutateAsync(kbBlueprintDraft);
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

            <QuizSection
              eyebrow="PART C · CHECK YOUR UNDERSTANDING"
              title="Five quick checks"
              quiz={M02_STEP_QUIZZES.step1}
              state={knowledgeCheck.step1}
              status={step1QuizStatus}
              namePrefix="m02-step1"
              onAnswer={(questionId, option, multi) => setQuizAnswer("step1", questionId, option, multi)}
              onCheck={() => checkQuiz("step1")}
              onRetry={() => retryQuiz("step1")}
            />
          </div>
        }
        produces={<p className="text-[14px] text-navy">{s.produces}</p>}
        canContinue={!!selectedUseCase && step1QuizStatus.quizPassed}
        disabledReason={
          !selectedUseCase
            ? "Choose one business use case."
            : !step1QuizStatus.allAnswered
              ? "Answer all five checks before continuing."
              : !step1QuizStatus.quizChecked
                ? "Click Check answers before continuing."
                : "You need at least 3 correct answers before continuing."
        }
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

            <QuizSection
              eyebrow="PART C · CHECK YOUR UNDERSTANDING"
              title="Five quick checks"
              quiz={M02_STEP_QUIZZES.step2}
              state={knowledgeCheck.step2}
              status={step2QuizStatus}
              namePrefix="m02-step2"
              onAnswer={(questionId, option, multi) => setQuizAnswer("step2", questionId, option, multi)}
              onCheck={() => checkQuiz("step2")}
              onRetry={() => retryQuiz("step2")}
            />
          </div>
        }
        produces={<p className="text-[14px] text-navy">{s.produces}</p>}
        canContinue={!!selectedUseCase && gapsSel.length > 0 && step2QuizStatus.quizPassed}
        disabledReason={
          gapsSel.length === 0
            ? "Name at least one readiness gap before moving to the blueprint."
            : !step2QuizStatus.allAnswered
              ? "Answer all five checks before continuing."
              : !step2QuizStatus.quizChecked
                ? "Click Check answers before continuing."
                : "You need at least 3 correct answers before continuing."
        }
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
  const canCompleteM02 = !!kbBlueprintDraft && kbBlueprintDraft.useCaseId === selectedCaseId && step3DraftState.generated;

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
        <div className="space-y-8">
          <M02Step3Guided
            selectedUseCase={selectedUseCase}
            namedGaps={gapsSel}
            step3State={step3DraftState}
            generatedBlueprint={kbBlueprintDraft?.useCaseId === selectedCaseId ? kbBlueprintDraft : null}
            gateReadiness={gateReadiness}
            onStep3StateChange={persistStep3DraftState}
            onGeneratedBlueprintChange={persistGeneratedBlueprint}
            onGateReadinessChange={updateGateReadiness}
            onChangeUseCase={() => goToStep(1)}
          />

          <QuizSection
            eyebrow="PART C · CHECK YOUR UNDERSTANDING"
            title="Five quick checks"
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
      canContinue={canCompleteM02 && step3QuizStatus.quizPassed}
      disabledReason={
        !canCompleteM02
          ? "Reveal all seven components, answer both reflections, and generate the blueprint."
          : !step3QuizStatus.allAnswered
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
    <section className="border-t border-chalk pt-6 space-y-4">
      <div>
        <p className="eyebrow-muted">{eyebrow}</p>
        <h4 className="mt-2 font-display text-xl text-navy">{title}</h4>
        <p className="mt-1 text-[13px] leading-relaxed text-slate">
          Four questions are checked. The final reflection has no single right answer.
        </p>
      </div>

      <div className="space-y-4">
        {quiz.map((question, index) => {
          const current = answers[question.id];
          const multi = question.type === "multi";
          const gradable = !!question.correct;
          const isAnswered = multi
            ? Array.isArray(current) && current.length > 0
            : typeof current === "string" && current.length > 0;
          const showGrading = status.quizChecked && gradable && isAnswered;
          const isCorrect = showGrading && current === question.correct;

          return (
            <div
              key={question.id}
              className={`rounded-md border bg-paper p-4 ${
                showGrading
                  ? isCorrect
                    ? "border-emerald-500/60 bg-emerald-500/5"
                    : "border-danger/40 bg-danger/5"
                  : "border-chalk"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[14px] font-semibold text-navy">
                  Q{index + 1}. {question.question}
                </p>
                {showGrading && (
                  <span
                    className={`shrink-0 font-mono text-[11px] uppercase tracking-[0.14em] ${
                      isCorrect ? "text-emerald-700" : "text-danger"
                    }`}
                  >
                    {isCorrect ? "Correct" : "Incorrect"}
                  </span>
                )}
              </div>

              <div className="mt-3 space-y-2">
                {question.options.map((option) => {
                  const checked = multi
                    ? Array.isArray(current) && current.includes(option)
                    : current === option;
                  const isOptionCorrect = gradable && option === question.correct;
                  const isOptionWrongPick = showGrading && checked && !isCorrect;
                  const rowClass = showGrading
                    ? isOptionCorrect
                      ? "rounded-md border border-emerald-500/60 bg-emerald-500/5 px-2 py-1"
                      : isOptionWrongPick
                        ? "rounded-md border border-danger/40 bg-danger/5 px-2 py-1"
                        : "rounded-md border border-transparent px-2 py-1"
                    : "";
                  return (
                    <label
                      key={option}
                      className={`flex items-start gap-2 text-[14px] text-graphite ${
                        status.quizChecked ? "cursor-default" : "cursor-pointer"
                      } ${rowClass}`}
                    >
                      <input
                        type={multi ? "checkbox" : "radio"}
                        name={`${namePrefix}-${question.id}`}
                        checked={checked}
                        onChange={() => onAnswer(question.id, option, multi)}
                        disabled={status.quizChecked}
                        className="mt-1 h-4 w-4 accent-terracotta"
                      />
                      <span>{option}</span>
                    </label>
                  );
                })}
              </div>

              {showGrading && question.explanation && (
                <p className="mt-3 text-[12px] leading-relaxed text-slate">
                  <span className="font-semibold text-navy">Why: </span>
                  {question.explanation}
                </p>
              )}
              {status.quizChecked && multi && (
                <p className="mt-3 text-[12px] leading-relaxed text-slate">
                  This is a reflection question. There is no single right answer.
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 rounded-md border border-chalk bg-paper p-4 sm:flex-row sm:items-center sm:justify-between">
        {status.quizChecked ? (
          <>
            <p className="text-[14px] text-navy">
              You got <span className="font-semibold">{status.correctCount} of {status.gradableCount}</span>{" "}
              checked questions correct.{" "}
              {status.quizPassed
                ? "You can continue."
                : `You need at least ${status.passThreshold} correct. Adjust your answers and check again.`}
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="rounded-md border border-chalk bg-white px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-navy transition-colors hover:border-terracotta hover:text-terracotta"
            >
              Try again
            </button>
          </>
        ) : (
          <>
            <p className="text-[13px] text-slate">
              Answer all five, then check your answers before moving on.
            </p>
            <button
              type="button"
              onClick={onCheck}
              disabled={!status.allAnswered}
              className="rounded-md bg-terracotta px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-white transition-colors hover:bg-navy disabled:cursor-not-allowed disabled:bg-slate/40"
            >
              Check answers
            </button>
          </>
        )}
      </div>
    </section>
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
