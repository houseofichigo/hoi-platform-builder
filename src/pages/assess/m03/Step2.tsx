import type { Platform, PromptContract, SkillSpec } from "@/data/m03/m03Schema";
import { isRungAvailable } from "@/data/m03/capabilityMatrix";
import { platforms } from "@/data/m03/platforms";
import { competitorPricingMonitor } from "@/data/m03/useCases/competitor-pricing-monitor";
import { PlatformAlternativePath } from "@/components/m03/PlatformAlternativePath";
import { PromptContractReveal } from "@/components/m03/PromptContractReveal";
import { SkillBuilder } from "@/components/m03/SkillBuilder";

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
  const platformConfig = platforms[platform];
  const skillAvailable = isRungAvailable(4, platform) && Boolean(platformConfig.skillInstallSteps);
  const promptContract = competitorPricingMonitor.promptContract;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-chalk bg-mist/40 p-5">
        <p className="text-[14px] leading-relaxed text-graphite">
          You just saw what a vague prompt produces. Now we will build the structured version: the
          Prompt Contract, then convert it into a reusable asset for {platformConfig.displayName}.
        </p>
      </div>

      <PromptContractReveal
        platform={platform}
        promptContract={promptContract}
        useCaseName={competitorPricingMonitor.displayName}
        revealed={Boolean(structuredPrompt)}
        onReveal={onPromptContractReveal}
      />

      {structuredPrompt ? (
        skillAvailable ? (
          <SkillBuilder
            platform={platform}
            promptContract={promptContract}
            savedSkill={skillSpec}
            onSave={onSkillSave}
          />
        ) : (
          <PlatformAlternativePath
            platform={platform}
            promptContract={promptContract}
            onSave={onSkillSave}
          />
        )
      ) : null}
    </div>
  );
}

