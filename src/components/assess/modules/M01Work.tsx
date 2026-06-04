import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAssessProgress, useAssessOutput } from "@/hooks/useAssess";
import { supabase } from "@/integrations/supabase/client";
import { Step } from "@/components/assess/Step";
import { M01_COURSE_CONTENT, getM01DangerousTaskOptions } from "@/lib/assess/content/course1";
import { useWorkspaceProfile } from "@/hooks/useWorkspaceProfile";

const HoiTokenizer = lazy(() =>
  import("@/components/tokenizer/HoiTokenizer").then((module) => ({
    default: module.HoiTokenizer,
  })),
);

const TOKEN_QUIZ = [
  {
    id: "q1",
    type: "single",
    question: "A token is best described as:",
    options: [
      "A word in the model's vocabulary",
      "A character in the input text",
      "A fragment of text that may be a word, part of a word, punctuation, whitespace, or a number piece",
      "A sentence the model processes at once",
    ],
    correct: "A fragment of text that may be a word, part of a word, punctuation, whitespace, or a number piece",
    explanation:
      "Tokens are sub-word fragments produced by the tokenizer — not whole words, characters, or sentences.",
  },
  {
    id: "q2",
    type: "single",
    question: "Why can a model miscount letters in a word like Mississippi?",
    options: [
      "It was not paying attention",
      "It sees the word as one or a few tokens, not as individual letters",
      "It was trained on incorrect data",
      "It cannot count anything",
    ],
    correct: "It sees the word as one or a few tokens, not as individual letters",
    explanation:
      "The model never sees individual characters — only the token chunks the tokenizer produced.",
  },
  {
    id: "q3",
    type: "single",
    question: "What should you budget for when analysing French support tickets?",
    options: [
      "Words equal tokens, so 400 words equals 400 tokens",
      "French usually uses more tokens than English, and both input and output are billed",
      "Token count does not matter for short tickets",
      "Only output tokens are billed",
    ],
    correct: "French usually uses more tokens than English, and both input and output are billed",
    explanation:
      "Non-English text typically tokenizes into more pieces, and providers bill both input and output tokens.",
  },
  {
    id: "q4",
    type: "single",
    question: "Why is a model unreliable for checking long business identifiers digit by digit?",
    options: [
      "The numbers are too long to read",
      "It needs internet access",
      "Long numbers split into token chunks, so the model pattern-matches rather than verifies every digit",
      "Business identifiers are always absent from training data",
    ],
    correct:
      "Long numbers split into token chunks, so the model pattern-matches rather than verifies every digit",
    explanation:
      "Identifiers are tokenized into multi-digit chunks, so the model can't reliably reason character-by-character.",
  },
  {
    id: "q5",
    type: "single",
    question: "Which prompting habit reduces cost without sacrificing quality?",
    options: [
      "Always use the most advanced model available",
      "Write in the desired output language and ask for concise responses by default",
      "Send every document in full",
      "Use long, polite prompts",
    ],
    correct: "Write in the desired output language and ask for concise responses by default",
    explanation:
      "Matching prompt language to output language and asking for brevity directly trims input and output tokens.",
  },
  {
    id: "q6",
    type: "multi",
    question: "Which tasks in your work are most likely to be affected by tokenisation?",
    options: [
      "Validating identifiers or strict document references",
      "Summarising long client documents",
      "Translating between French and English",
      "Comparing exact numerical values",
      "Counting items, words, or letters",
      "Anonymising or redacting sensitive information",
    ],
  },
] as const;

const SCEPTICISM_QUIZ = [
  {
    id: "q1",
    type: "single",
    question: "What is the most accurate description of an AI hallucination?",
    options: [
      "Random or nonsensical output",
      "Plausible, confident information that is incorrect or fabricated",
      "Information from before the model's training cutoff",
      "An honest refusal to answer",
    ],
    correct: "Plausible, confident information that is incorrect or fabricated",
    explanation:
      "Hallucinations are confident, plausible-sounding fabrications — not random noise or honest refusals.",
  },
  {
    id: "q2",
    type: "single",
    question:
      "A teammate gets a precise market-size estimate from AI without sources. What is the safest assumption?",
    options: [
      "The AI accessed official market data",
      "The numbers are approximate but directionally correct",
      "The specific figures may be fabricated until verified",
      "Specific numbers are usually accurate",
    ],
    correct: "The specific figures may be fabricated until verified",
    explanation:
      "Precise numbers without sources are the classic hallucination signature — treat them as unverified.",
  },
  {
    id: "q3",
    type: "single",
    question:
      "You ask the same question three times in fresh chats and details shift. What does this signal?",
    options: [
      "The AI is offering creative perspectives",
      "The model may be inventing rather than retrieving a stable fact",
      "Your prompt must have changed each time",
      "The answer is probably becoming more accurate",
    ],
    correct: "The model may be inventing rather than retrieving a stable fact",
    explanation:
      "Drift across fresh chats signals generation, not retrieval of a stable fact.",
  },
  {
    id: "q4",
    type: "single",
    question: "Which response has the lowest hallucination risk?",
    options: [
      "Based on industry patterns, the company likely has around 200 employees",
      "The latest report found a specific adoption percentage",
      "I do not have specific information; share a source and I can help",
      "The company was founded in 2015 by a named person",
    ],
    correct: "I do not have specific information; share a source and I can help",
    explanation:
      "An honest abstain with a request for a source carries the lowest fabrication risk.",
  },
  {
    id: "q5",
    type: "single",
    question:
      "You receive an AI-generated client proposal draft. What should you do before sending?",
    options: [
      "Run the Hallucination Audit prompt on the draft",
      "Ask the AI if anything is wrong",
      "Trust it if it sounds professional",
      "Only check spelling and tone",
    ],
    correct: "Run the Hallucination Audit prompt on the draft",
    explanation:
      "A structured audit catches fabricated claims — asking the model to self-check or trusting tone does not.",
  },
  {
    id: "q6",
    type: "single",
    question:
      "Why do models often produce confident wrong answers instead of saying they do not know?",
    options: [
      "They believe their answers are correct",
      "They are trained and evaluated in ways that reward attempting answers over abstaining",
      "Engineers forgot to add an I do not know response",
      "Humans rarely admit uncertainty",
    ],
    correct: "They are trained and evaluated in ways that reward attempting answers over abstaining",
    explanation:
      "Training and evaluation incentives push models toward attempting answers rather than abstaining.",
  },
] as const;

const PARAMETER_QUIZ = [
  {
    id: "q1",
    type: "single",
    question: "What does temperature mainly control?",
    options: [
      "The model's processing speed",
      "The cost per token",
      "How predictable or varied the next-token selection is",
      "Which documents the model can access",
    ],
    correct: "How predictable or varied the next-token selection is",
    explanation:
      "Temperature scales the probabilities — low values stay predictable, high values open the field to more varied next-token picks.",
  },
  {
    id: "q2",
    type: "single",
    question: "What does top-p do?",
    options: [
      "It limits the model to the top P percent of training data",
      "It narrows or widens the probability pool of candidate next tokens",
      "It controls the total number of output tokens",
      "It gives the model access to more sources",
    ],
    correct: "It narrows or widens the probability pool of candidate next tokens",
    explanation:
      "Top-p (nucleus sampling) sets the cumulative probability cutoff for the candidate pool — it has nothing to do with training data or output length.",
  },
  {
    id: "q3",
    type: "single",
    question: "For repeated extraction, classification, or compliance workflows, what matters most?",
    options: [
      "Creative variation",
      "Consistent output, strict structure, validation, and review rules",
      "Higher randomness",
      "Longer answers",
    ],
    correct: "Consistent output, strict structure, validation, and review rules",
    explanation:
      "Repeatable workflows need determinism, structure, and review — creativity is the wrong target.",
  },
  {
    id: "q4",
    type: "single",
    question: "In everyday chat tools like ChatGPT or Claude.ai, what control do most users have?",
    options: [
      "Full control over temperature, top-p, and top-k",
      "No direct sampling controls; the main lever is the prompt",
      "Only top-k through settings",
      "Control only if they pay for a team plan",
    ],
    correct: "No direct sampling controls; the main lever is the prompt",
    explanation:
      "Most chat UIs do not expose sampling knobs — your real control surface is the prompt itself.",
  },
  {
    id: "q5",
    type: "single",
    question: "What is the strongest control pattern for an AI agent?",
    options: [
      "Raise temperature so it can improvise",
      "Give it all available tools so it can solve anything",
      "Define allowed tools, trusted sources, human review, forbidden actions, and logs",
      "Ask it to be careful",
    ],
    correct: "Define allowed tools, trusted sources, human review, forbidden actions, and logs",
    explanation:
      "Agent control is an operating model — scoped tools, sources, review, forbidden actions, and logs — not a creativity dial.",
  },
  {
    id: "q6",
    type: "single",
    question: "What is the main business takeaway from this step?",
    options: [
      "Managers should learn to tune every sampling parameter",
      "Prompting, evidence, and guardrails are the durable control surface",
      "High temperature is always better for business writing",
      "Top-k is the most important AI setting",
    ],
    correct: "Prompting, evidence, and guardrails are the durable control surface",
    explanation:
      "Sampling knobs change between vendors; prompting, evidence, and guardrails are the controls that travel with you.",
  },
] as const;

interface TokenAwareness {
  observations: string[];
  strategies: string[];
  acknowledged: boolean;
  exerciseChecks?: string[];
  quizAnswers?: Record<string, string | string[]>;
  quizChecked?: boolean;
}

interface ScepticismLog {
  exerciseChecks: string[];
  quizAnswers: Record<string, string | string[]>;
  riskSelections: string[];
  acknowledged: boolean;
  quizChecked?: boolean;
}

interface ParameterNotes {
  exerciseChecks: string[];
  quizAnswers: Record<string, string | string[]>;
  controlMatches: Record<string, string>;
  workSelections: string[];
  acknowledged: boolean;
  quizChecked?: boolean;
}

const CHAPTER_LABEL = "PHASE 01 · M01 · LLM FUNDAMENTALS";

export function M01Work() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const qc = useQueryClient();

  const workspaceProfile = useWorkspaceProfile();

  const progress = useAssessProgress("m01");
  const reflection = useAssessOutput<string[]>("m01.reflection");
  const methodNote = useAssessOutput<string[]>("m01.method_note");
  const tokenAwarenessOut = useAssessOutput<TokenAwareness>("m01.token_awareness");
  const scepticismLogOut = useAssessOutput<ScepticismLog>("m01.scepticism_log");
  const parameterNotesOut = useAssessOutput<ParameterNotes>("m01.parameter_notes");

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [reflectionSel, setReflectionSel] = useState<string[]>([]);
  const [noteSel, setNoteSel] = useState<string[]>([]);
  const [tokenAwareness, setTokenAwareness] = useState<TokenAwareness>({
    observations: [],
    strategies: [],
    acknowledged: false,
    exerciseChecks: [],
    quizAnswers: {},
  });
  const [scepticismLog, setScepticismLog] = useState<ScepticismLog>({
    exerciseChecks: [],
    quizAnswers: {},
    riskSelections: [],
    acknowledged: false,
  });
  const [parameterNotes, setParameterNotes] = useState<ParameterNotes>({
    exerciseChecks: [],
    quizAnswers: {},
    controlMatches: {},
    workSelections: [],
    acknowledged: false,
  });
  const [hydratedReflection, setHydratedReflection] = useState(false);
  const [hydratedNote, setHydratedNote] = useState(false);
  const [hydratedToken, setHydratedToken] = useState(false);
  const [hydratedScepticism, setHydratedScepticism] = useState(false);
  const [hydratedParameter, setHydratedParameter] = useState(false);
  const [hydratedStep, setHydratedStep] = useState(false);

  // Hydrate current step from progress
  useEffect(() => {
    if (hydratedStep || progress.isLoading) return;
    const status = progress.data?.status;
    if (status === "complete") {
      setStep(3);
    } else {
      const cs = progress.data?.current_step;
      if (cs === 2 || cs === 3) setStep(cs as 2 | 3);
    }
    setHydratedStep(true);
  }, [hydratedStep, progress.isLoading, progress.data?.current_step, progress.data?.status]);

  // Mark in_progress on mount
  useEffect(() => {
    if (progress.isLoading) return;
    const status = progress.data?.status;
    if (!status || status === "not_started") {
      progress.setStep.mutate(progress.data?.current_step ?? 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress.isLoading]);

  // Seed m01.reflection defaults once if missing
  useEffect(() => {
    if (!user || !workspace) return;
    if (reflection.isLoading) return;
    if (reflection.value !== undefined) return;
    (async () => {
      const seeds = M01_COURSE_CONTENT.seeds["m01.reflection"];
      const { error } = await supabase.from("assess_outputs").upsert(
        {
          workspace_id: workspace.id,
          user_id: user.id,
          output_key: "m01.reflection",
          value: seeds as never,
          seeded: true,
          touched: false,
        },
        { onConflict: "workspace_id,user_id,output_key" },
      );
      if (!error) {
        qc.invalidateQueries({
          queryKey: ["assess-output", workspace.id, user.id, "m01.reflection"],
        });
      }
    })();
  }, [user, workspace, reflection.isLoading, reflection.value, qc]);

  // Hydrate local selection state from persisted values
  useEffect(() => {
    if (hydratedReflection || reflection.isLoading) return;
    if (Array.isArray(reflection.value)) {
      setReflectionSel(reflection.value);
      setHydratedReflection(true);
    }
  }, [hydratedReflection, reflection.isLoading, reflection.value]);

  useEffect(() => {
    if (hydratedNote || methodNote.isLoading) return;
    if (Array.isArray(methodNote.value)) {
      setNoteSel(methodNote.value);
    }
    setHydratedNote(true);
  }, [hydratedNote, methodNote.isLoading, methodNote.value]);

  useEffect(() => {
    if (hydratedToken || tokenAwarenessOut.isLoading) return;
    const v = tokenAwarenessOut.value;
    if (v && typeof v === "object") {
      setTokenAwareness({
        observations: Array.isArray(v.observations) ? v.observations : [],
        strategies: Array.isArray(v.strategies) ? v.strategies : [],
        acknowledged: !!v.acknowledged,
        exerciseChecks: Array.isArray(v.exerciseChecks) ? v.exerciseChecks : [],
        quizAnswers:
          v.quizAnswers && typeof v.quizAnswers === "object" && !Array.isArray(v.quizAnswers)
            ? v.quizAnswers
            : {},
        quizChecked: !!v.quizChecked,
      });
    }
    setHydratedToken(true);
  }, [hydratedToken, tokenAwarenessOut.isLoading, tokenAwarenessOut.value]);

  useEffect(() => {
    if (hydratedScepticism || scepticismLogOut.isLoading) return;
    const v = scepticismLogOut.value;
    if (v && typeof v === "object") {
      setScepticismLog({
        exerciseChecks: Array.isArray(v.exerciseChecks) ? v.exerciseChecks : [],
        quizAnswers:
          v.quizAnswers && typeof v.quizAnswers === "object" && !Array.isArray(v.quizAnswers)
            ? v.quizAnswers
            : {},
        riskSelections: Array.isArray(v.riskSelections) ? v.riskSelections : [],
        acknowledged: !!v.acknowledged,
        quizChecked: !!v.quizChecked,
      });
    }
    setHydratedScepticism(true);
  }, [hydratedScepticism, scepticismLogOut.isLoading, scepticismLogOut.value]);

  useEffect(() => {
    if (hydratedParameter || parameterNotesOut.isLoading) return;
    const v = parameterNotesOut.value;
    if (v && typeof v === "object") {
      setParameterNotes({
        exerciseChecks: Array.isArray(v.exerciseChecks) ? v.exerciseChecks : [],
        quizAnswers:
          v.quizAnswers && typeof v.quizAnswers === "object" && !Array.isArray(v.quizAnswers)
            ? v.quizAnswers
            : {},
        controlMatches:
          v.controlMatches && typeof v.controlMatches === "object" && !Array.isArray(v.controlMatches)
            ? v.controlMatches
            : {},
        workSelections: Array.isArray(v.workSelections) ? v.workSelections : [],
        acknowledged: !!v.acknowledged,
      });
    }
    setHydratedParameter(true);
  }, [hydratedParameter, parameterNotesOut.isLoading, parameterNotesOut.value]);

  const dangerousTaskOptions = useMemo(
    () =>
      getM01DangerousTaskOptions({
        companyName: workspace?.name,
        country: workspaceProfile.data?.country as string | undefined,
      }),
    [
      workspace?.name,
      workspaceProfile.data,
    ],
  );

  const toggle = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  const updateTokenAwareness = (next: TokenAwareness) => {
    setTokenAwareness(next);
    tokenAwarenessOut.setValue.mutate(next);
  };

  const updateScepticismLog = (next: ScepticismLog) => {
    setScepticismLog(next);
    scepticismLogOut.setValue.mutate(next);
  };

  const updateParameterNotes = (next: ParameterNotes) => {
    setParameterNotes(next);
    parameterNotesOut.setValue.mutate(next);
  };

  const setQuizAnswer = (questionId: string, value: string, multi: boolean) => {
    const current = tokenAwareness.quizAnswers ?? {};
    const currentValue = current[questionId];
    const nextValue = multi
      ? toggle(Array.isArray(currentValue) ? currentValue : [], value)
      : value;
    updateTokenAwareness({
      ...tokenAwareness,
      quizAnswers: {
        ...current,
        [questionId]: nextValue,
      },
      // Editing answers re-opens the quiz so the learner has to confirm again.
      quizChecked: false,
    });
  };

  const setScepticismQuizAnswer = (questionId: string, value: string) => {
    const current = scepticismLog.quizAnswers;
    updateScepticismLog({
      ...scepticismLog,
      quizAnswers: {
        ...current,
        [questionId]: value,
      },
      // Editing answers re-opens the quiz so the learner has to confirm again.
      quizChecked: false,
    });
  };

  const setParameterQuizAnswer = (questionId: string, value: string, multi: boolean) => {
    const current = parameterNotes.quizAnswers;
    const currentValue = current[questionId];
    const nextValue = multi
      ? toggle(Array.isArray(currentValue) ? currentValue : [], value)
      : value;
    updateParameterNotes({
      ...parameterNotes,
      quizAnswers: {
        ...current,
        [questionId]: nextValue,
      },
    });
  };

  const goToStep = async (next: 1 | 2 | 3) => {
    setStep(next);
    await progress.setStep.mutateAsync(next);
  };

  const completeM01 = async () => {
    if (!user || !workspace) return;
    await reflection.setValue.mutateAsync(reflectionSel);
    await methodNote.setValue.mutateAsync(noteSel);
    await tokenAwarenessOut.setValue.mutateAsync(tokenAwareness);
    await scepticismLogOut.setValue.mutateAsync(scepticismLog);
    await parameterNotesOut.setValue.mutateAsync(parameterNotes);
    // Upsert progress as complete with current_step cleared
    const { error } = await supabase.from("assess_progress").upsert(
      {
        workspace_id: workspace.id,
        user_id: user.id,
        module_id: "m01",
        status: "complete",
        studied: progress.data?.studied ?? false,
        current_step: null,
        max_step_reached: Math.max(progress.data?.max_step_reached ?? 0, 3),
        started_at: progress.data?.started_at ?? new Date().toISOString(),
        completed_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id,user_id,module_id" },
    );
    if (error) {
      toast.error("Could not complete M01. Try again.");
      return;
    }
    qc.invalidateQueries({ queryKey: ["assess-progress", workspace.id, user.id, "m01"] });
    qc.invalidateQueries({ queryKey: ["assess-progress-all", workspace.id, user.id] });
    qc.invalidateQueries({ queryKey: ["resume", workspace.id] });
    qc.invalidateQueries({ queryKey: ["team-status", workspace.id] });
    toast.success("M01 complete. M02 Data Readiness is unlocked.");
  };

  if (!workspace) return null;

  // ============ STEP 1 ============
  if (step === 1) {
    const s = M01_COURSE_CONTENT.step1;
    const requiredExerciseIds = s.exercises.map((exercise) => exercise.id);
    const checkedExercises = tokenAwareness.exerciseChecks ?? [];
    const quizAnswers = tokenAwareness.quizAnswers ?? {};
    const allAnswered = TOKEN_QUIZ.every((question) => {
      const value = quizAnswers[question.id];
      return question.type === "multi"
        ? Array.isArray(value) && value.length > 0
        : typeof value === "string" && value.length > 0;
    });
    const gradableQuestions = TOKEN_QUIZ.filter(
      (q): q is typeof q & { correct: string } => q.type === "single" && "correct" in q,
    );
    const correctCount = gradableQuestions.reduce(
      (acc, q) => (quizAnswers[q.id] === q.correct ? acc + 1 : acc),
      0,
    );
    const passThreshold = 4;
    const quizChecked = !!tokenAwareness.quizChecked;
    const quizPassed = quizChecked && correctCount >= passThreshold;
    const exercisesComplete = requiredExerciseIds.every((id) => checkedExercises.includes(id));
    const stepComplete = exercisesComplete && quizPassed && tokenAwareness.acknowledged;

    const handleCheckAnswers = () => {
      updateTokenAwareness({ ...tokenAwareness, quizChecked: true });
    };
    const handleRetryQuiz = () => {
      updateTokenAwareness({ ...tokenAwareness, quizChecked: false });
    };

    const disabledReason = !exercisesComplete
      ? "Complete the exercises, answer the quiz, and confirm the token lesson."
      : !allAnswered
        ? "Answer all six questions, then check your answers."
        : !quizChecked
          ? "Click Check answers to confirm your quiz responses."
          : !quizPassed
            ? "Review the highlighted answers and try again."
            : !tokenAwareness.acknowledged
              ? "Confirm the token lesson acknowledgement to continue."
              : "Complete the exercises, answer the quiz, and confirm the token lesson.";

    return (
      <Step
        storyHeader={M01_COURSE_CONTENT.storyHeader}
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
            <section className="space-y-3">
              <p className="text-[17px] leading-relaxed text-graphite">
                Use the embedded HOI Tokenizer for the exercises below. Type your own examples,
                switch encodings, and open the Language Tax tab to compare English, French, and Arabic.
              </p>
              <Suspense
                fallback={
                  <div className="rounded-lg border border-chalk bg-white p-5 text-[14px] text-slate">
                    Loading the HOI Tokenizer...
                  </div>
                }
              >
                <HoiTokenizer />
              </Suspense>
            </section>

            <section className="space-y-4">
              <div>
                <p className="eyebrow-muted">PART A · SEE HOW THE MODEL SEES</p>
                <h3 className="mt-2 font-display text-[28px] leading-tight text-navy">
                  Complete the tokenizer exercises
                </h3>
              </div>
              <div className="grid gap-3">
                {s.exercises.map((exercise) => {
                  const isChecked = checkedExercises.includes(exercise.id);
                  return (
                    <label
                      key={exercise.id}
                      className="flex cursor-pointer gap-3 rounded-md border border-chalk bg-paper p-4 text-[14px] leading-relaxed text-navy"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          updateTokenAwareness({
                            ...tokenAwareness,
                            exerciseChecks: toggle(checkedExercises, exercise.id),
                          });
                        }}
                        className="mt-1 h-4 w-4 accent-terracotta"
                      />
                      <span>
                        <strong className="block text-[15px]">{exercise.title}</strong>
                        <span className="text-graphite">{exercise.instruction}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <p className="eyebrow-muted">EXAMPLES IN THE WILD</p>
                <h3 className="mt-2 font-display text-[28px] leading-tight text-navy">
                  Three failures that tokens explain
                </h3>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <InsightCard
                  title="The strawberry problem"
                  body="The model often sees a word as one or two tokens, not as individual letters. Letter counting needs explicit help."
                />
                <InsightCard
                  title="9.11 vs 9.9"
                  body="Decimals and version-like strings tokenize differently, so the model may compare shapes instead of values."
                />
                <InsightCard
                  title="The brand-name problem"
                  body="Familiar terms often tokenize cleanly. Niche names split into fragments, and fluency can look shakier."
                />
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <p className="eyebrow-muted">PART B · WHAT THIS MEANS AT WORK</p>
                <h3 className="mt-2 font-display text-[28px] leading-tight text-navy">
                  Practical lessons
                </h3>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <InsightCard
                  title="Money and memory"
                  body="Pricing and context windows are measured in tokens, not pages or words. Output tokens are usually more expensive."
                />
                <InsightCard
                  title="Fragile exact tasks"
                  body="Counting letters, validating identifiers, comparing decimals, and character-level redaction need tools or step-by-step handling."
                />
                <InsightCard
                  title="Multilingual strategy"
                  body="Non-English work often uses more tokens. Match prompt language to output language and budget for the language tax."
                />
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <p className="eyebrow-muted">PART C · CHECK YOUR UNDERSTANDING</p>
                <h3 className="mt-2 font-display text-[28px] leading-tight text-navy">
                  Six quick checks
                </h3>
              </div>
              <div className="space-y-4">
                {TOKEN_QUIZ.map((question, index) => {
                  const current = quizAnswers[question.id];
                  const multi = question.type === "multi";
                  const gradable = !multi && "correct" in question;
                  const correctAnswer = gradable ? (question as { correct: string }).correct : null;
                  const explanation = gradable
                    ? (question as { explanation?: string }).explanation
                    : null;
                  const isAnswered = multi
                    ? Array.isArray(current) && current.length > 0
                    : typeof current === "string" && current.length > 0;
                  const showGrading = quizChecked && gradable && isAnswered;
                  const isCorrect = showGrading && current === correctAnswer;
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
                            {isCorrect ? "✓ Correct" : "✗ Incorrect"}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 space-y-2">
                        {question.options.map((option) => {
                          const checked = multi
                            ? Array.isArray(current) && current.includes(option)
                            : current === option;
                          const isOptionCorrect = gradable && option === correctAnswer;
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
                                quizChecked ? "cursor-default" : "cursor-pointer"
                              } ${rowClass}`}
                            >
                              <input
                                type={multi ? "checkbox" : "radio"}
                                name={`m01-token-${question.id}`}
                                checked={checked}
                                onChange={() => setQuizAnswer(question.id, option, multi)}
                                disabled={quizChecked}
                                className="mt-1 h-4 w-4 accent-terracotta"
                              />
                              <span>{option}</span>
                            </label>
                          );
                        })}
                      </div>
                      {showGrading && explanation && (
                        <p className="mt-3 text-[12px] leading-relaxed text-slate">
                          <span className="font-semibold text-navy">Why: </span>
                          {explanation}
                        </p>
                      )}
                      {quizChecked && multi && (
                        <p className="mt-3 text-[12px] leading-relaxed text-slate">
                          This is a reflection question — there is no single right answer.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col gap-3 rounded-md border border-chalk bg-paper p-4 sm:flex-row sm:items-center sm:justify-between">
                {quizChecked ? (
                  <>
                    <p className="text-[14px] text-navy">
                      You got <span className="font-semibold">{correctCount} of {gradableQuestions.length}</span>{" "}
                      correct.{" "}
                      {quizPassed
                        ? "Nice — you can continue."
                        : `You need at least ${passThreshold} correct. Adjust your answers and check again.`}
                    </p>
                    <button
                      type="button"
                      onClick={handleRetryQuiz}
                      className="rounded-md border border-chalk bg-white px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-navy transition-colors hover:border-terracotta hover:text-terracotta"
                    >
                      Try again
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-[13px] text-slate">
                      Answer all six, then confirm to see which are correct before moving on.
                    </p>
                    <button
                      type="button"
                      onClick={handleCheckAnswers}
                      disabled={!allAnswered}
                      className="rounded-md bg-terracotta px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-white transition-colors hover:bg-terracotta/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Check answers
                    </button>
                  </>
                )}
              </div>
            </section>

            <label className="flex cursor-pointer items-start gap-3 rounded-md border border-terracotta/25 bg-terracotta/5 p-4 text-[14px] text-navy">
              <input
                type="checkbox"
                checked={tokenAwareness.acknowledged}
                onChange={(event) => {
                  updateTokenAwareness({
                    ...tokenAwareness,
                    acknowledged: event.target.checked,
                  });
                }}
                className="mt-1 h-4 w-4 accent-terracotta"
              />
              <span>
                I understand that models process text as tokens, and that token volume affects
                cost, context limits, and some precision failures.
              </span>
            </label>
          </div>
        }
        produces={<p className="text-[14px] text-navy">{s.produces}</p>}
        canContinue={stepComplete}
        disabledReason={disabledReason}
        nextLabel={s.nextLabel}
        onContinue={() => goToStep(2)}
      />
    );
  }

  // ============ STEP 2 ============
  if (step === 2) {
    const s = M01_COURSE_CONTENT.step2;
    const checkedExercises = scepticismLog.exerciseChecks;
    const quizAnswers = scepticismLog.quizAnswers;
    const exercisesComplete = s.exercises.every((exercise) =>
      checkedExercises.includes(exercise.id),
    );
    const allAnswered = SCEPTICISM_QUIZ.every((question) => {
      const value = quizAnswers[question.id];
      return typeof value === "string" && value.length > 0;
    });
    const correctCount = SCEPTICISM_QUIZ.reduce(
      (acc, q) => (quizAnswers[q.id] === q.correct ? acc + 1 : acc),
      0,
    );
    const passThreshold = 5;
    const quizChecked = !!scepticismLog.quizChecked;
    const quizPassed = quizChecked && correctCount >= passThreshold;
    const stepComplete =
      exercisesComplete &&
      quizPassed &&
      scepticismLog.riskSelections.length > 0 &&
      scepticismLog.acknowledged;

    const handleCheckScepticism = () => {
      updateScepticismLog({ ...scepticismLog, quizChecked: true });
    };
    const handleRetryScepticism = () => {
      updateScepticismLog({ ...scepticismLog, quizChecked: false });
    };

    const scepticismDisabledReason = !exercisesComplete
      ? "Complete Part A, answer the checks, pick one work-risk task, and confirm the verification habit."
      : !allAnswered
        ? "Answer all six questions, then check your answers."
        : !quizChecked
          ? "Click Check answers to confirm your quiz responses."
          : !quizPassed
            ? "Review the highlighted answers and try again."
            : scepticismLog.riskSelections.length === 0
              ? "Pick at least one work-risk task."
              : !scepticismLog.acknowledged
                ? "Confirm the verification habit to continue."
                : "Complete Part A, answer the checks, pick one work-risk task, and confirm the verification habit.";

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
            <section className="rounded-md border border-chalk bg-paper p-5">
              <p className="eyebrow-muted">WHERE THIS IS HEADING</p>
              <p className="mt-3 text-[15px] leading-relaxed text-graphite">{s.intro}</p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {s.headingPoints.map((point) => (
                  <div key={point} className="rounded-md border border-chalk bg-white p-3">
                    <p className="text-[13px] font-semibold leading-relaxed text-navy">{point}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <p className="eyebrow-muted">PART A · FEEL THE PROBLEM</p>
                <h3 className="mt-2 font-display text-[28px] leading-tight text-navy">
                  Three ways hallucinations show up
                </h3>
              </div>
              <div className="space-y-4">
                {s.exercises.map((exercise) => {
                  const checked = checkedExercises.includes(exercise.id);
                  return (
                    <div key={exercise.id} className="rounded-md border border-chalk bg-white p-5">
                      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                        <div>
                          <h4 className="text-[17px] font-semibold text-navy">{exercise.title}</h4>
                          <p className="mt-2 text-[14px] leading-relaxed text-graphite">
                            {exercise.description}
                          </p>
                        </div>
                        <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-full border border-chalk bg-paper px-3 py-1.5 text-[12px] font-medium text-navy">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              updateScepticismLog({
                                ...scepticismLog,
                                exerciseChecks: toggle(checkedExercises, exercise.id),
                              });
                            }}
                            className="h-4 w-4 accent-terracotta"
                          />
                          Done
                        </label>
                      </div>

                      <div className="mt-4 space-y-3">
                        {exercise.prompts.map((prompt) => (
                          <CopyPromptCard
                            key={prompt.label}
                            label={prompt.label}
                            text={prompt.text}
                          />
                        ))}
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_220px]">
                        <div>
                          <p className="eyebrow-muted">WHAT TO LOOK FOR</p>
                          <ul className="mt-2 space-y-2">
                            {exercise.lookFor.map((item) => (
                              <li key={item} className="flex gap-2 text-[13px] leading-relaxed text-graphite">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-terracotta" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        {(exercise.sourceUrl || exercise.note) && (
                          <div className="rounded-md border border-chalk bg-paper p-3">
                            {exercise.sourceUrl && (
                              <a
                                href={exercise.sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[12px] font-semibold text-terracotta hover:underline"
                              >
                                {exercise.sourceLabel ?? "Open source"} →
                              </a>
                            )}
                            {exercise.note && (
                              <p className="mt-2 text-[12px] leading-relaxed text-slate">
                                {exercise.note}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <p className="eyebrow-muted">EXAMPLES IN THE WILD</p>
                <h3 className="mt-2 font-display text-[28px] leading-tight text-navy">
                  Verified patterns beyond your exercise
                </h3>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {s.examples.map((example) => (
                  <div key={example.title} className="rounded-md border border-chalk bg-paper p-4">
                    <h4 className="text-[15px] font-semibold text-navy">{example.title}</h4>
                    <p className="mt-2 text-[13px] leading-relaxed text-graphite">{example.body}</p>
                    <p className="mt-3 text-[12px] leading-relaxed text-slate">{example.why}</p>
                    <a
                      href={example.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-block text-[12px] font-semibold text-terracotta hover:underline"
                    >
                      {example.sourceLabel} →
                    </a>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <p className="eyebrow-muted">PART B · FIX THE PROBLEM</p>
                <h3 className="mt-2 font-display text-[28px] leading-tight text-navy">
                  Two prompts to use this week
                </h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {s.promptTechniques.map((technique) => (
                  <div key={technique.title} className="rounded-md border border-chalk bg-white p-5">
                    <h4 className="text-[16px] font-semibold text-navy">{technique.title}</h4>
                    <p className="mt-2 text-[13px] leading-relaxed text-graphite">
                      {technique.useWhen}
                    </p>
                    <CopyPromptCard label="Prompt glimpse" text={technique.glimpse} compact />
                  </div>
                ))}
              </div>
              <div className="rounded-md border border-chalk bg-paper p-4">
                <p className="eyebrow-muted">MORE IN THE PROMPT LIBRARY</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {s.libraryPrompts.map((prompt) => (
                    <div key={prompt.title} className="rounded-md border border-chalk bg-white p-3">
                      <p className="text-[14px] font-semibold text-navy">{prompt.title}</p>
                      <p className="mt-1 text-[12px] leading-relaxed text-slate">{prompt.useWhen}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <p className="eyebrow-muted">PART C · CHECK YOUR UNDERSTANDING</p>
                <h3 className="mt-2 font-display text-[28px] leading-tight text-navy">
                  Six checks and one work-risk reflection
                </h3>
              </div>
              <div className="space-y-4">
                {SCEPTICISM_QUIZ.map((question, index) => {
                  const current = quizAnswers[question.id];
                  const isAnswered = typeof current === "string" && current.length > 0;
                  const showGrading = quizChecked && isAnswered;
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
                            {isCorrect ? "✓ Correct" : "✗ Incorrect"}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 space-y-2">
                        {question.options.map((option) => {
                          const checked = current === option;
                          const isOptionCorrect = option === question.correct;
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
                                quizChecked ? "cursor-default" : "cursor-pointer"
                              } ${rowClass}`}
                            >
                              <input
                                type="radio"
                                name={`m01-scepticism-${question.id}`}
                                checked={checked}
                                onChange={() => setScepticismQuizAnswer(question.id, option)}
                                disabled={quizChecked}
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
                    </div>
                  );
                })}

                <div className="flex flex-col gap-3 rounded-md border border-chalk bg-paper p-4 sm:flex-row sm:items-center sm:justify-between">
                  {quizChecked ? (
                    <>
                      <p className="text-[14px] text-navy">
                        You got <span className="font-semibold">{correctCount} of {SCEPTICISM_QUIZ.length}</span>{" "}
                        correct.{" "}
                        {quizPassed
                          ? "Nice — you can continue."
                          : `You need at least ${passThreshold} correct. Adjust your answers and check again.`}
                      </p>
                      <button
                        type="button"
                        onClick={handleRetryScepticism}
                        className="rounded-md border border-chalk bg-white px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-navy transition-colors hover:border-terracotta hover:text-terracotta"
                      >
                        Try again
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-[13px] text-slate">
                        Answer all six, then confirm to see which are correct before moving on.
                      </p>
                      <button
                        type="button"
                        onClick={handleCheckScepticism}
                        disabled={!allAnswered}
                        className="rounded-md bg-terracotta px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-white transition-colors hover:bg-terracotta/90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Check answers
                      </button>
                    </>
                  )}
                </div>

                <div className="rounded-md border border-chalk bg-paper p-4">
                  <p className="text-[14px] font-semibold text-navy">
                    Q7. Which tasks in your work have the highest risk if AI hallucinates?
                  </p>
                  <div className="mt-3 space-y-2">
                    {s.riskTasks.map((task) => (
                      <label
                        key={task}
                        className="flex cursor-pointer items-start gap-2 text-[14px] text-graphite"
                      >
                        <input
                          type="checkbox"
                          checked={scepticismLog.riskSelections.includes(task)}
                          onChange={() => {
                            updateScepticismLog({
                              ...scepticismLog,
                              riskSelections: toggle(scepticismLog.riskSelections, task),
                            });
                          }}
                          className="mt-1 h-4 w-4 accent-terracotta"
                        />
                        <span>{task}</span>
                      </label>
                    ))}
                  </div>
                  <p className="mt-3 text-[12px] italic text-slate">
                    Pick at least one. Accuracy risk is highest when verification is slow and consequences are real.
                  </p>
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-md border border-chalk bg-paper p-4">
                <p className="eyebrow-muted">WHY THIS MATTERS</p>
                <p className="mt-3 text-[14px] leading-relaxed text-graphite">
                  Step 1 showed the mechanism: likely tokens. Step 2 adds the operating habit:
                  verified sources, consistency checks, and audit prompts before AI output reaches work.
                </p>
              </div>
              <label className="flex cursor-pointer items-start gap-3 rounded-md border border-terracotta/25 bg-terracotta/5 p-4 text-[14px] text-navy">
                <input
                  type="checkbox"
                  checked={scepticismLog.acknowledged}
                  onChange={(event) => {
                    updateScepticismLog({
                      ...scepticismLog,
                      acknowledged: event.target.checked,
                    });
                  }}
                  className="mt-1 h-4 w-4 accent-terracotta"
                />
                <span>
                  I understand that I am the verification layer: confidence is not evidence,
                  grounding helps, and high-stakes outputs need audit habits.
                </span>
              </label>
            </section>
          </div>
        }
        produces={<p className="text-[14px] text-navy">{s.produces}</p>}
        canContinue={stepComplete}
        disabledReason={scepticismDisabledReason}
        nextLabel={s.nextLabel}
        onBack={() => goToStep(1)}
        onContinue={() => goToStep(3)}
      />
    );
  }

  // ============ STEP 3 ============
  const s = M01_COURSE_CONTENT.step3;
  const m = M01_COURSE_CONTENT.methodNote;
  const parameterQuizAnswers = parameterNotes.quizAnswers;
  const parameterQuizComplete = PARAMETER_QUIZ.every((question) => {
    const value = parameterQuizAnswers[question.id];
    return question.type === "multi"
      ? Array.isArray(value) && value.length > 0
      : typeof value === "string" && value.length > 0;
  });
  const parameterChecksComplete = s.checks.every((check) =>
    parameterNotes.exerciseChecks.includes(check.id),
  );
  const controlMatchesComplete = s.controlExercise.every((item) =>
    Boolean(parameterNotes.controlMatches[item.id]),
  );
  const parameterStepComplete =
    parameterChecksComplete &&
    controlMatchesComplete &&
    parameterQuizComplete &&
    parameterNotes.workSelections.length > 0 &&
    parameterNotes.acknowledged;
  const canCompleteM01 =
    parameterStepComplete && reflectionSel.length > 0 && noteSel.length > 0;

  return (
    <Step
      chapterLabel={CHAPTER_LABEL}
      stepLabel="STEP 3 of 3"
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
          <section className="rounded-md border border-chalk bg-paper p-5">
            <p className="eyebrow-muted">WHERE THIS IS HEADING</p>
            <p className="mt-3 text-[15px] leading-relaxed text-graphite">{s.intro}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {s.headingPoints.map((point) => (
                <div key={point} className="rounded-md border border-chalk bg-white p-3">
                  <p className="text-[13px] font-semibold leading-relaxed text-navy">{point}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <p className="eyebrow-muted">PART A · SEE THE DIALS</p>
              <h3 className="mt-2 font-display text-[28px] leading-tight text-navy">
                Three settings, one business lesson
              </h3>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {s.dials.map((dial) => (
                <article key={dial.id} className="rounded-md border border-chalk bg-white p-5">
                  <h4 className="text-[17px] font-semibold text-navy">{dial.title}</h4>
                  <p className="mt-2 text-[14px] font-medium text-terracotta">{dial.plain}</p>
                  <p className="mt-3 text-[13px] leading-relaxed text-graphite">
                    {dial.businessUse}
                  </p>
                  <p className="mt-3 text-[12px] leading-relaxed text-slate">
                    <strong className="text-navy">Watch out:</strong> {dial.watchOut}
                  </p>
                  <p className="mt-3 rounded-md bg-paper p-3 text-[12px] leading-relaxed text-slate">
                    {dial.example}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <div>
                <p className="eyebrow-muted">OPTIONAL · TRY IT LIVE</p>
                <h3 className="mt-2 font-display text-[28px] leading-tight text-navy">
                  Playground prompts
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed text-graphite">{s.studio.note}</p>
              </div>
              <a
                href={s.studio.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit rounded-full border border-terracotta px-4 py-2 text-[13px] font-semibold text-terracotta hover:bg-terracotta hover:text-white"
              >
                {s.studio.label} →
              </a>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {s.tryPrompts.map((prompt) => (
                <div key={prompt.label} className="rounded-md border border-chalk bg-white p-4">
                  <p className="text-[14px] font-semibold text-navy">{prompt.label}</p>
                  <p className="mt-2 text-[12px] leading-relaxed text-slate">{prompt.settings}</p>
                  <CopyPromptCard label="Prompt" text={prompt.text} compact />
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <p className="eyebrow-muted">PART B · HOW TO APPLY THIS</p>
              <h3 className="mt-2 font-display text-[28px] leading-tight text-navy">
                Business settings guide
              </h3>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {s.taskGuide.map((item) => (
                <div key={item.task} className="rounded-md border border-chalk bg-paper p-4">
                  <p className="text-[14px] font-semibold text-navy">{item.task}</p>
                  <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-terracotta">
                    {item.setting}
                  </p>
                  <p className="mt-2 text-[13px] leading-relaxed text-graphite">{item.control}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <p className="eyebrow-muted">PROMPTING &gt; PARAMETERS</p>
              <h3 className="mt-2 font-display text-[28px] leading-tight text-navy">
                The controls your team actually uses
              </h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {s.promptControls.map((control) => (
                <div key={control.title} className="rounded-md border border-chalk bg-white p-4">
                  <p className="text-[15px] font-semibold text-navy">{control.title}</p>
                  <p className="mt-2 text-[13px] leading-relaxed text-graphite">
                    {control.promptMove}
                  </p>
                </div>
              ))}
            </div>
            <div className="rounded-md border border-terracotta/25 bg-terracotta/5 p-5">
              <p className="eyebrow-muted">AGENT CONTROL BRIDGE</p>
              <p className="mt-2 text-[15px] font-semibold text-navy">
                For agents, control is an operating model, not a creativity dial.
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {s.agentControls.map((control) => (
                  <div key={control} className="rounded-md border border-terracotta/20 bg-white p-3">
                    <p className="text-[13px] leading-relaxed text-graphite">{control}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <p className="eyebrow-muted">MATCH THE CONTROL</p>
              <h3 className="mt-2 font-display text-[28px] leading-tight text-navy">
                Choose the best control pattern
              </h3>
            </div>
            <div className="space-y-4">
              {s.controlExercise.map((item) => (
                <div key={item.id} className="rounded-md border border-chalk bg-paper p-4">
                  <p className="text-[14px] font-semibold text-navy">{item.task}</p>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {s.controlOptions.map((option) => (
                      <label
                        key={option}
                        className="flex cursor-pointer items-start gap-2 rounded-md border border-chalk bg-white p-3 text-[13px] leading-relaxed text-graphite"
                      >
                        <input
                          type="radio"
                          name={`m01-parameter-control-${item.id}`}
                          checked={parameterNotes.controlMatches[item.id] === option}
                          onChange={() => {
                            updateParameterNotes({
                              ...parameterNotes,
                              controlMatches: {
                                ...parameterNotes.controlMatches,
                                [item.id]: option,
                              },
                            });
                          }}
                          className="mt-1 h-4 w-4 accent-terracotta"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <p className="eyebrow-muted">PART C · CHECK YOUR UNDERSTANDING</p>
              <h3 className="mt-2 font-display text-[28px] leading-tight text-navy">
                Six checks and one control reflection
              </h3>
            </div>
            <div className="space-y-4">
              {PARAMETER_QUIZ.map((question, index) => {
                const current = parameterQuizAnswers[question.id];
                const multi = question.type === "multi";
                return (
                  <div key={question.id} className="rounded-md border border-chalk bg-paper p-4">
                    <p className="text-[14px] font-semibold text-navy">
                      Q{index + 1}. {question.question}
                    </p>
                    <div className="mt-3 space-y-2">
                      {question.options.map((option) => {
                        const checked = multi
                          ? Array.isArray(current) && current.includes(option)
                          : current === option;
                        return (
                          <label
                            key={option}
                            className="flex cursor-pointer items-start gap-2 text-[14px] text-graphite"
                          >
                            <input
                              type={multi ? "checkbox" : "radio"}
                              name={`m01-parameter-${question.id}`}
                              checked={checked}
                              onChange={() => setParameterQuizAnswer(question.id, option, multi)}
                              className="mt-1 h-4 w-4 accent-terracotta"
                            />
                            <span>{option}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div className="rounded-md border border-chalk bg-paper p-4">
                <p className="text-[14px] font-semibold text-navy">
                  Q7. Which control needs matter most in your work?
                </p>
                <div className="mt-3 space-y-2">
                  {s.workReflections.map((option) => (
                    <label
                      key={option}
                      className="flex cursor-pointer items-start gap-2 text-[14px] text-graphite"
                    >
                      <input
                        type="checkbox"
                        checked={parameterNotes.workSelections.includes(option)}
                        onChange={() => {
                          updateParameterNotes({
                            ...parameterNotes,
                            workSelections: toggle(parameterNotes.workSelections, option),
                          });
                        }}
                        className="mt-1 h-4 w-4 accent-terracotta"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <p className="eyebrow-muted">PARAMETER NOTES</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-navy">
                  Pick the takeaways that should go into your Foundation artifact.
                </p>
                {reflection.seeded && !reflection.touched && (
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate">
                    Seeded
                  </span>
                )}
              </div>
            </div>
            <ul className="space-y-2">
              {s.reflectionOptions.map((opt) => (
                <li key={opt}>
                  <label className="flex cursor-pointer items-start gap-2 text-[14px] text-navy">
                    <input
                      type="checkbox"
                      checked={reflectionSel.includes(opt)}
                      onChange={() => {
                        const next = toggle(reflectionSel, opt);
                        setReflectionSel(next);
                        reflection.setValue.mutate(next);
                      }}
                      className="mt-1 h-4 w-4 accent-terracotta"
                    />
                    <span>{opt}</span>
                  </label>
                </li>
              ))}
            </ul>
            <p className="text-[12px] italic text-slate">
              {reflectionSel.length} selected — pick at least one.
            </p>
          </section>

          <section className="space-y-3">
            <p className="eyebrow-muted">{m.title}</p>
            <p className="text-sm font-medium text-navy">
              Tasks at {workspace.name} where AI needs stricter control (pick all that apply)
            </p>
            <ul className="space-y-2">
              {dangerousTaskOptions.map((opt) => (
                <li key={opt}>
                  <label className="flex cursor-pointer items-start gap-2 text-[14px] text-navy">
                    <input
                      type="checkbox"
                      checked={noteSel.includes(opt)}
                      onChange={() => {
                        const next = toggle(noteSel, opt);
                        setNoteSel(next);
                        methodNote.setValue.mutate(next);
                      }}
                      className="mt-1 h-4 w-4 accent-terracotta"
                    />
                    <span>{opt}</span>
                  </label>
                </li>
              ))}
            </ul>
            <p className="text-[12px] italic text-slate">
              {noteSel.length} selected — pick at least one to complete M01.
            </p>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-md border border-chalk bg-paper p-4">
              <p className="eyebrow-muted">SOURCE-BACKED NOTE</p>
              <p className="mt-3 text-[13px] leading-relaxed text-graphite">
                Providers expose different controls. Some newer frontier models restrict sampling
                parameters entirely, while OpenAI and Gemini still document temperature and top-p
                style settings in API surfaces.
              </p>
              <div className="mt-3 space-y-1">
                {s.sources.map((source) => (
                  <a
                    key={source.url}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-[12px] font-semibold text-terracotta hover:underline"
                  >
                    {source.label} →
                  </a>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {s.checks.map((check) => (
                <label
                  key={check.id}
                  className="flex cursor-pointer items-start gap-3 rounded-md border border-chalk bg-white p-3 text-[14px] text-navy"
                >
                  <input
                    type="checkbox"
                    checked={parameterNotes.exerciseChecks.includes(check.id)}
                    onChange={() => {
                      updateParameterNotes({
                        ...parameterNotes,
                        exerciseChecks: toggle(parameterNotes.exerciseChecks, check.id),
                      });
                    }}
                    className="mt-1 h-4 w-4 accent-terracotta"
                  />
                  <span>{check.label}</span>
                </label>
              ))}
              <label className="flex cursor-pointer items-start gap-3 rounded-md border border-terracotta/25 bg-terracotta/5 p-4 text-[14px] text-navy">
                <input
                  type="checkbox"
                  checked={parameterNotes.acknowledged}
                  onChange={(event) => {
                    updateParameterNotes({
                      ...parameterNotes,
                      acknowledged: event.target.checked,
                    });
                  }}
                  className="mt-1 h-4 w-4 accent-terracotta"
                />
                <span>
                  I understand that the durable control surface is prompts, evidence, tools,
                  review rules, and logs — not only parameter tuning.
                </span>
              </label>
            </div>
          </section>
        </div>
      }
      produces={<p className="text-[14px] text-navy">{s.produces}<br />{m.produces}</p>}
      canContinue={canCompleteM01}
      disabledReason="Complete the Step 3 checks, answer the quiz, match the control patterns, and pick your parameter notes and method note."
      nextLabel={s.nextLabel}
      onBack={() => goToStep(2)}
      onContinue={completeM01}
    />
  );
}

function CopyPromptCard({
  label,
  text,
  compact,
}: {
  label: string;
  text: string;
  compact?: boolean;
}) {
  const copy = () => {
    if (!navigator.clipboard) {
      toast.error("Copy is not available in this browser.");
      return;
    }
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success("Prompt copied."))
      .catch(() => toast.error("Could not copy the prompt."));
  };

  return (
    <div className={`rounded-md border border-chalk bg-paper ${compact ? "mt-4 p-3" : "p-4"}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate">{label}</p>
        <button
          type="button"
          onClick={copy}
          className="rounded-full border border-chalk bg-white px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-slate hover:border-terracotta hover:text-terracotta"
        >
          Copy
        </button>
      </div>
      <pre className="mt-3 whitespace-pre-wrap rounded-md bg-white p-3 font-mono text-[12px] leading-relaxed text-navy">
        {text}
      </pre>
    </div>
  );
}

function InsightCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-chalk bg-paper p-4">
      <h4 className="text-[15px] font-semibold text-navy">{title}</h4>
      <p className="mt-2 text-[13px] leading-relaxed text-graphite">{body}</p>
    </div>
  );
}

export function M01WorkBackLink({ slug }: { slug: string }) {
  return (
    <Link
      to="/app/$workspaceSlug/assess/$moduleId"
      params={{ workspaceSlug: slug, moduleId: "m01" }}
      className="inline-block text-[13px] font-medium text-slate hover:text-navy"
    >
      ← Back to overview
    </Link>
  );
}
