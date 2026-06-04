import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAssessProgress, useAssessOutput } from "@/hooks/useAssess";
import { supabase } from "@/integrations/supabase/client";
import { Step } from "@/components/assess/Step";
import { PromptBlock } from "@/components/assess/PromptBlock";
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

interface TokenAwareness {
  observations: string[];
  strategies: string[];
  acknowledged: boolean;
  exerciseChecks?: string[];
  quizAnswers?: Record<string, string | string[]>;
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
  const [hydratedReflection, setHydratedReflection] = useState(false);
  const [hydratedNote, setHydratedNote] = useState(false);
  const [hydratedToken, setHydratedToken] = useState(false);
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
      });
    }
    setHydratedToken(true);
  }, [hydratedToken, tokenAwarenessOut.isLoading, tokenAwarenessOut.value]);

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
    const quizComplete = TOKEN_QUIZ.every((question) => {
      const value = quizAnswers[question.id];
      return question.type === "multi"
        ? Array.isArray(value) && value.length > 0
        : typeof value === "string" && value.length > 0;
    });
    const exercisesComplete = requiredExerciseIds.every((id) => checkedExercises.includes(id));
    const stepComplete = exercisesComplete && quizComplete && tokenAwareness.acknowledged;

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
                                name={`m01-token-${question.id}`}
                                checked={checked}
                                onChange={() => setQuizAnswer(question.id, option, multi)}
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
        disabledReason="Complete the exercises, answer the quiz, and confirm the token lesson."
        nextLabel={s.nextLabel}
        onContinue={() => goToStep(2)}
      />
    );
  }

  // ============ STEP 2 ============
  if (step === 2) {
    const s = M01_COURSE_CONTENT.step2;
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
          <div className="space-y-6">
            <PromptBlock label="Prompt 1 — Without web search" text={s.prompts.withoutSearch} />
            <PromptBlock label="Prompt 2 — With source grounding" text={s.prompts.withSearch} />
            <p className="rounded-md border border-chalk bg-paper p-4 text-[13px] leading-relaxed text-slate">
              Run both prompts in your LLM of choice. Compare confidence, source use,
              uncertainty, and whether the answer becomes easier to audit.
            </p>
          </div>
        }
        produces={<p className="text-[14px] text-navy">{s.produces}</p>}
        canContinue
        nextLabel={s.nextLabel}
        onBack={() => goToStep(1)}
        onContinue={() => goToStep(3)}
      />
    );
  }

  // ============ STEP 3 ============
  const s = M01_COURSE_CONTENT.step3;
  const m = M01_COURSE_CONTENT.methodNote;
  const exps = s.experiments;
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
          <details open className="rounded border border-chalk bg-white p-4">
            <summary className="cursor-pointer text-sm font-medium text-navy">
              {exps.temperature.label}
            </summary>
            <div className="mt-4 space-y-4">
              <PromptBlock label={exps.temperature.low.label} text={exps.temperature.low.prompt} />
              <PromptBlock label={exps.temperature.high.label} text={exps.temperature.high.prompt} />
            </div>
          </details>
          <details className="rounded border border-chalk bg-white p-4">
            <summary className="cursor-pointer text-sm font-medium text-navy">
              {exps.topK.label}
            </summary>
            <div className="mt-4 space-y-4">
              <PromptBlock label={exps.topK.low.label} text={exps.topK.low.prompt} />
              <PromptBlock label={exps.topK.high.label} text={exps.topK.high.prompt} />
            </div>
          </details>
          <details className="rounded border border-chalk bg-white p-4">
            <summary className="cursor-pointer text-sm font-medium text-navy">
              {exps.topP.label}
            </summary>
            <div className="mt-4 space-y-4">
              <PromptBlock label={exps.topP.low.label} text={exps.topP.low.prompt} />
              <PromptBlock label={exps.topP.high.label} text={exps.topP.high.prompt} />
            </div>
          </details>

          <div className="border-t border-chalk pt-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-navy">
                Reflection — pick the takeaways that match what you observed
              </p>
              {reflection.seeded && !reflection.touched && (
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate">
                  Seeded
                </span>
              )}
            </div>
            <ul className="mt-3 space-y-2">
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
            <p className="mt-3 text-[12px] italic text-slate">
              {reflectionSel.length} selected — pick at least one.
            </p>
          </div>

          <div className="space-y-3">
            <p className="eyebrow-muted">{m.title}</p>
            <p className="text-sm font-medium text-navy">
              Tasks at {workspace.name} where confidently-wrong AI would be dangerous (pick all that apply)
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
          </div>
        </div>
      }
      produces={<p className="text-[14px] text-navy">{s.produces}<br />{m.produces}</p>}
      canContinue={reflectionSel.length > 0 && noteSel.length > 0}
      disabledReason="Pick at least one parameter reflection and one dangerous-task method note."
      nextLabel="Complete M01"
      onBack={() => goToStep(2)}
      onContinue={completeM01}
    />
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
