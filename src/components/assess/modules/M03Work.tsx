import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Step } from "@/components/assess/Step";
import { LadderProgressIndicator } from "@/components/m03/LadderProgressIndicator";
import { LadderRungPanel } from "@/components/m03/LadderRungPanel";
import { PlaybookGenerator } from "@/components/m03/PlaybookGenerator";
import type {
  AutomationPlaybookData,
  LadderRungResult,
  Platform,
  PromptContract,
  ReflectionAnswers,
  SkillSpec,
  VaguePromptTestResult,
} from "@/data/m03/m03Schema";
import { competitorPricingMonitor } from "@/data/m03/useCases/competitor-pricing-monitor";
import { useAssessOutput, useAssessProgress } from "@/hooks/useAssess";
import { useWorkspace } from "@/hooks/useWorkspace";
import { M03Step1 } from "@/pages/assess/m03/Step1";
import { M03Step2 } from "@/pages/assess/m03/Step2";

const CHAPTER_LABEL = "PHASE 01 · M03 · PROMPT-DRIVEN AUTOMATION";
const TOTAL_STEPS = 3;

type StepNum = 1 | 2 | 3;
type LadderWalkthroughOutput = Record<number, LadderRungResult>;

function hasAnyObservation(value?: VaguePromptTestResult): boolean {
  if (!value) return false;
  return Object.values(value.observations).some(Boolean);
}

const DEFAULT_REFLECTION: ReflectionAnswers = {
  currentRung: 2,
  targetRung: 6,
  governanceGaps: ["source_controls", "access_governance", "audit_trails", "exception_handling"],
};

const DEFAULT_READINESS_STATUS: "PASS" | "PARTIAL" | "BLOCKED" = "PARTIAL";
const DEFAULT_READINESS_EXPLANATION =
  "Reference library is ready to use, but connector, agent, and scheduled rungs still require source ownership, access rules, and confirmation gates.";

export function M03Work() {
  const { workspace } = useWorkspace();
  const navigate = useNavigate();
  const progress = useAssessProgress("m03");

  const platformOut = useAssessOutput<Platform>("m03.platform");
  const useCaseOut = useAssessOutput<string>("m03.use_case");
  const vagueOut = useAssessOutput<VaguePromptTestResult>("m03.vague_prompt_test");
  const structuredOut = useAssessOutput<PromptContract>("m03.structured_prompt");
  const skillOut = useAssessOutput<SkillSpec>("m03.skill_spec");
  const ladderOut = useAssessOutput<LadderWalkthroughOutput>("m03.ladder_walkthrough");
  const reflectionOut = useAssessOutput<ReflectionAnswers>("m03.reflection_answers");
  const readinessStatusOut = useAssessOutput<"PASS" | "PARTIAL" | "BLOCKED">("m03.readiness_status");
  const readinessExplanationOut = useAssessOutput<string>("m03.readiness_explanation");
  const playbookOut = useAssessOutput<AutomationPlaybookData>("m03.automation_playbook");
  const completeOut = useAssessOutput<{ complete: boolean; completedAt: string }>("m03.complete");
  const m02UseCaseOut = useAssessOutput<string>("m02.use_case");

  const [step, setStep] = useState<StepNum>(1);
  const [platform, setPlatform] = useState<Platform | undefined>();
  const [vaguePromptTest, setVaguePromptTest] = useState<VaguePromptTestResult | undefined>();
  const [structuredPrompt, setStructuredPrompt] = useState<PromptContract | undefined>();
  const [skillSpec, setSkillSpec] = useState<SkillSpec | undefined>();
  const [ladderWalkthrough, setLadderWalkthrough] = useState<Record<number, LadderRungResult>>({});
  const [reflectionAnswers, setReflectionAnswers] = useState<ReflectionAnswers | undefined>();
  const [readinessStatus, setReadinessStatus] = useState<"PASS" | "PARTIAL" | "BLOCKED" | undefined>();
  const [readinessExplanation, setReadinessExplanation] = useState("");
  const [automationPlaybook, setAutomationPlaybook] = useState<AutomationPlaybookData | undefined>();
  const [hydrated, setHydrated] = useState(false);

  const step3Rungs = useMemo(
    () => competitorPricingMonitor.rungs,
    [],
  );

  useEffect(() => {
    if (hydrated) return;
    if (
      progress.isLoading ||
      platformOut.isLoading ||
      useCaseOut.isLoading ||
      vagueOut.isLoading ||
      structuredOut.isLoading ||
      skillOut.isLoading ||
      ladderOut.isLoading ||
      reflectionOut.isLoading ||
      readinessStatusOut.isLoading ||
      readinessExplanationOut.isLoading ||
      playbookOut.isLoading
    ) {
      return;
    }

    setPlatform(platformOut.value);
    setVaguePromptTest(vagueOut.value);
    setStructuredPrompt(structuredOut.value);
    setSkillSpec(skillOut.value);
    setLadderWalkthrough(ladderOut.value ?? {});
    setReflectionAnswers(reflectionOut.value);
    setReadinessStatus(readinessStatusOut.value);
    setReadinessExplanation(readinessExplanationOut.value ?? "");
    setAutomationPlaybook(playbookOut.value);

    const status = progress.data?.status;
    if (status === "complete") setStep(3);
    else if (progress.data?.current_step && progress.data.current_step >= 1 && progress.data.current_step <= 3) {
      setStep(progress.data.current_step as StepNum);
    }
    setHydrated(true);
  }, [
    hydrated,
    progress.isLoading,
    progress.data?.status,
    progress.data?.current_step,
    platformOut.isLoading,
    platformOut.value,
    useCaseOut.isLoading,
    useCaseOut.value,
    vagueOut.isLoading,
    vagueOut.value,
    structuredOut.isLoading,
    structuredOut.value,
    skillOut.isLoading,
    skillOut.value,
    ladderOut.isLoading,
    ladderOut.value,
    reflectionOut.isLoading,
    reflectionOut.value,
    readinessStatusOut.isLoading,
    readinessStatusOut.value,
    readinessExplanationOut.isLoading,
    readinessExplanationOut.value,
    playbookOut.isLoading,
    playbookOut.value,
  ]);

  useEffect(() => {
    if (progress.isLoading) return;
    const status = progress.data?.status;
    if (!status || status === "not_started") {
      progress.setStep.mutate(progress.data?.current_step ?? 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress.isLoading]);

  const goToStep = async (next: StepNum) => {
    setStep(next);
    await progress.setStep.mutateAsync(next);
  };

  const updatePlatform = (next: Platform) => {
    setPlatform(next);
    platformOut.setValue.mutate(next);
    useCaseOut.setValue.mutate(competitorPricingMonitor.id);
    setLadderWalkthrough({});
    ladderOut.setValue.mutate({});
    setAutomationPlaybook(undefined);
  };

  const updateLadder = (rungNumber: number, result: LadderRungResult) => {
    const next = { ...ladderWalkthrough, [rungNumber]: result };
    setLadderWalkthrough(next);
    ladderOut.setValue.mutate(next);
  };

  const allStep3RungsRevealed = step3Rungs.every(
    (rung) => ladderWalkthrough[rung.rungNumber]?.revealed,
  );

  const buildPlaybook = async (): Promise<AutomationPlaybookData> => {
    if (!platform || !vaguePromptTest) {
      throw new Error("M03 playbook prerequisites are incomplete.");
    }

    const rungsCovered = competitorPricingMonitor.rungs.map((rung) => rung.rungNumber);
    const finalReflection = reflectionAnswers ?? DEFAULT_REFLECTION;
    const finalReadinessStatus = readinessStatus ?? DEFAULT_READINESS_STATUS;
    const finalReadinessExplanation = readinessExplanation || DEFAULT_READINESS_EXPLANATION;
    const finalSkill = skillSpec ?? competitorPricingMonitor.skillSpec;
    const finalPromptContract = structuredPrompt ?? competitorPricingMonitor.promptContract;
    const finalWalkthrough = Object.fromEntries(
      competitorPricingMonitor.rungs.map((rung) => [
        rung.rungNumber,
        ladderWalkthrough[rung.rungNumber] ?? { revealed: true },
      ]),
    ) as Record<number, LadderRungResult>;

    const next: AutomationPlaybookData = {
      generatedAt: new Date().toISOString(),
      platform,
      useCase: competitorPricingMonitor.id,
      rungsCovered,
      vagueResults: vaguePromptTest,
      promptContract: finalPromptContract,
      skillSpec: finalSkill,
      rungWalkthrough: finalWalkthrough,
      reflectionAnswers: finalReflection,
      readinessStatus: finalReadinessStatus,
      readinessExplanation: finalReadinessExplanation,
    };

    setAutomationPlaybook(next);
    setSkillSpec(finalSkill);
    setStructuredPrompt(finalPromptContract);
    setLadderWalkthrough(finalWalkthrough);
    setReflectionAnswers(finalReflection);
    setReadinessStatus(finalReadinessStatus);
    setReadinessExplanation(finalReadinessExplanation);
    await useCaseOut.setValue.mutateAsync(competitorPricingMonitor.id);
    await structuredOut.setValue.mutateAsync(finalPromptContract);
    await skillOut.setValue.mutateAsync(finalSkill);
    await ladderOut.setValue.mutateAsync(finalWalkthrough);
    await reflectionOut.setValue.mutateAsync(finalReflection);
    await readinessStatusOut.setValue.mutateAsync(finalReadinessStatus);
    await readinessExplanationOut.setValue.mutateAsync(finalReadinessExplanation);
    await playbookOut.setValue.mutateAsync(next);
    return next;
  };

  const completeM03 = async () => {
    if (!automationPlaybook && !playbookOut.value) return;
    await completeOut.setValue.mutateAsync({ complete: true, completedAt: new Date().toISOString() });
    await progress.markComplete.mutateAsync();
    toast.success("M03 complete. M04 AI Assistants & RAG is unlocked.");
    if (workspace?.slug) {
      navigate({
        to: "/app/$workspaceSlug/assess/$moduleId",
        params: { workspaceSlug: workspace.slug, moduleId: "m04" },
      });
    }
  };

  if (!workspace || !hydrated) return null;

  if (step === 1) {
    return (
      <Step
        chapterLabel={CHAPTER_LABEL}
        stepLabel="STEP 1 of 3"
        title="From vague to structured"
        why={<p>Prompt-driven automation starts by making prompt quality visible.</p>}
        example={<p className="text-[14px] text-navy">Run the vague prompt: Sort my inbox.</p>}
        whatToNotice={<p>Vague intent creates vague output. A Prompt Contract fixes that.</p>}
        yourVersion={
          <M03Step1
            platform={platform}
            vaguePromptTest={vaguePromptTest}
            hasLaterProgress={Boolean(structuredPrompt || Object.keys(ladderWalkthrough).length)}
            m02BridgeLabel={m02UseCaseOut.value}
            onPlatformChange={updatePlatform}
            onVaguePromptChange={(value) => {
              setVaguePromptTest(value);
              vagueOut.setValue.mutate(value);
            }}
          />
        }
        produces={<p className="text-[14px] text-navy">m03.platform and m03.vague_prompt_test</p>}
        canContinue={Boolean(platform && hasAnyObservation(vaguePromptTest))}
        disabledReason="Choose your platform and test the vague prompt to continue."
        nextLabel="Continue to Step 2"
        onContinue={() => goToStep(2)}
      />
    );
  }

  if (step === 2) {
    if (!platform) {
      goToStep(1);
      return null;
    }

    return (
      <Step
        chapterLabel={CHAPTER_LABEL}
        stepLabel="STEP 2 of 3"
        title="Understand the Prompt Contract"
        why={<p>A Prompt Contract makes goal, context, rules, output shape, quality checks, and examples explicit.</p>}
        example={<p className="text-[14px] text-navy">The chapter uses six core elements plus Style and Operational overlays.</p>}
        whatToNotice={<p>The six elements define the contract. Overlays shape how it is used.</p>}
        yourVersion={
          <M03Step2
            platform={platform}
            structuredPrompt={structuredPrompt}
            skillSpec={skillSpec}
            onPromptContractReveal={() => {
              const next = competitorPricingMonitor.promptContract;
              setStructuredPrompt(next);
              structuredOut.setValue.mutate(next);
            }}
            onSkillSave={(skill) => {
              setSkillSpec(skill);
              skillOut.setValue.mutate(skill);
            }}
          />
        }
        produces={<p className="text-[14px] text-navy">m03.structured_prompt and m03.skill_spec</p>}
        canContinue={Boolean(structuredPrompt)}
        disabledReason="Reveal the Prompt Contract before continuing."
        nextLabel="Continue to Step 3"
        onBack={() => goToStep(1)}
        onContinue={() => goToStep(3)}
      />
    );
  }

  if (!platform) {
    goToStep(1);
    return null;
  }

  const firstLockedIndex = step3Rungs.findIndex(
    (rung, index) => index > 0 && !ladderWalkthrough[step3Rungs[index - 1].rungNumber]?.revealed,
  );
  const canGenerate = allStep3RungsRevealed;

  return (
    <Step
      chapterLabel={CHAPTER_LABEL}
      stepLabel="STEP 3 of 3"
      title="Copy the automation ladder"
      why={<p>The right automation layer depends on repeatability, source needs, cost, latency, and risk.</p>}
      example={<p className="text-[14px] text-navy">Review all 10 rungs and copy the prompt artifact that matches the work.</p>}
      whatToNotice={<p>Most business work lives between rungs 2 and 6. Do not jump to agents.</p>}
      yourVersion={
        <div className="space-y-6">
          <div className="card bg-mist/40">
            <p className="text-[14px] leading-relaxed text-graphite">
              You have a Prompt Contract and a reusable asset. Now walk the rungs available in your
              platform as a copy-ready library. Each rung adds capability and a new governance
              obligation.
            </p>
            <LadderProgressIndicator rungs={step3Rungs} walkthrough={ladderWalkthrough} />
          </div>

          {step3Rungs.map((rung, index) => {
            const previousRevealed =
              index === 0 || ladderWalkthrough[step3Rungs[index - 1].rungNumber]?.revealed;
            const locked = !previousRevealed || (firstLockedIndex !== -1 && index > firstLockedIndex);
            return (
              <LadderRungPanel
                key={rung.rungNumber}
                rung={rung}
                platform={platform}
                locked={locked}
                result={ladderWalkthrough[rung.rungNumber]}
                onReveal={() => updateLadder(rung.rungNumber, { ...ladderWalkthrough[rung.rungNumber], revealed: true })}
                onContinue={() => {
                  const next = step3Rungs[index + 1];
                  if (next) {
                    window.setTimeout(() => {
                      document.getElementById(`m03-rung-${next.rungNumber}`)?.scrollIntoView({ behavior: "smooth" });
                    }, 50);
                  }
                }}
                isLast={index === step3Rungs.length - 1}
              />
            );
          })}

          {allStep3RungsRevealed && (
            <section className="card space-y-5">
              <header className="space-y-2">
                <p className="eyebrow">Ladder reviewed</p>
                <p className="text-[14px] leading-relaxed text-graphite">
                  You have reviewed the 10 automation rungs. Generate the shareable library to keep
                  the Prompt Contract, overlays, optimizer checklist, and copy-ready ladder prompts
                  together.
                </p>
              </header>
              <PlaybookGenerator
                canGenerate={canGenerate}
                disabledReason="Review every rung to generate your library."
                existingPlaybook={automationPlaybook}
                rungCount={step3Rungs.length}
                onGenerate={buildPlaybook}
                onComplete={completeM03}
                completePending={progress.markComplete.isPending || completeOut.setValue.isPending}
              />
            </section>
          )}
        </div>
      }
      produces={<p className="text-[14px] text-navy">m03.ladder_walkthrough and m03.automation_playbook</p>}
      canContinue={Boolean(automationPlaybook)}
      disabledReason="Generate the Prompt Contract + Ladder Library to complete M03."
      nextLabel="Complete M03"
      onBack={() => goToStep(2)}
      onContinue={completeM03}
    />
  );
}

export function M03WorkBackLink({ slug }: { slug: string }) {
  return (
    <Link
      to="/app/$workspaceSlug/assess/$moduleId"
      params={{ workspaceSlug: slug, moduleId: "m03" }}
      className="inline-block text-[13px] font-medium text-slate hover:text-navy"
    >
      ← Back to overview
    </Link>
  );
}
