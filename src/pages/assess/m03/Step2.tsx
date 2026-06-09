import type { Platform, PromptContract, SkillSpec } from "@/data/m03/m03Schema";
import { competitorPricingMonitor } from "@/data/m03/useCases/competitor-pricing-monitor";
import { PromptContractReveal } from "@/components/m03/PromptContractReveal";

interface Step2Props {
  platform: Platform;
  structuredPrompt?: PromptContract;
  skillSpec?: SkillSpec;
  onPromptContractReveal: () => void;
  onSkillSave: (skill: SkillSpec) => void;
}

export function M03Step2({
  platform,
  structuredPrompt,
  skillSpec,
  onPromptContractReveal,
  onSkillSave,
}: Step2Props) {
  const promptContract = competitorPricingMonitor.promptContract;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-chalk bg-mist/40 p-5">
        <p className="text-[14px] leading-relaxed text-graphite">
          You just saw what a vague prompt produces. Now compare it with the six-element Prompt
          Contract: Goal, Context, Rules, Output Contract, Quality Bar, and Examples. Style and
          Operational overlays sit on top of that contract.
        </p>
      </div>

      <PromptContractReveal
        platform={platform}
        promptContract={promptContract}
        useCaseName={competitorPricingMonitor.displayName}
        revealed={Boolean(structuredPrompt)}
        onReveal={() => {
          onPromptContractReveal();
          onSkillSave(competitorPricingMonitor.skillSpec);
        }}
      />

      {structuredPrompt && (
        <section className="card bg-paper/70">
          <p className="eyebrow">What happens next</p>
          <p className="mt-2 text-[14px] leading-relaxed text-graphite">
            Step 3 turns this contract into a copy-ready automation ladder. Rung 4 includes the
            chapter's Skill example for a contract-clause extractor; it is a reusable method, not a
            required install step for this assignment.
          </p>
          {skillSpec && (
            <p className="mt-3 text-[13px] text-slate">
              Reference Skill saved for the library: {skillSpec.name}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
