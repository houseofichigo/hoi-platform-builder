import type { Platform, VaguePromptTestResult } from "@/data/m03/m03Schema";
import { competitorPricingMonitor } from "@/data/m03/useCases/competitor-pricing-monitor";
import { CapabilityMatrixView } from "@/components/m03/CapabilityMatrixView";
import { PlatformPicker } from "@/components/m03/PlatformPicker";
import { VaguePromptTester } from "@/components/m03/VaguePromptTester";

interface Step1Props {
  platform?: Platform;
  vaguePromptTest?: VaguePromptTestResult;
  hasLaterProgress?: boolean;
  m02BridgeLabel?: string;
  onPlatformChange: (platform: Platform) => void;
  onVaguePromptChange: (value: VaguePromptTestResult) => void;
}

export function M03Step1({
  platform,
  vaguePromptTest,
  hasLaterProgress,
  m02BridgeLabel,
  onPlatformChange,
  onVaguePromptChange,
}: Step1Props) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-chalk bg-mist/40 p-5">
        <p className="text-[14px] leading-relaxed text-graphite">
          M03 starts with one simple lesson: AI is not reading your mind. You will run a weak fact
          prompt, notice what the model has to guess, then compare it with a Prompt Contract that is
          ready to reuse.
        </p>
        {m02BridgeLabel && (
          <p className="mt-3 text-[12px] text-slate">
            From your M02 selection: {m02BridgeLabel}. M03 now focuses on prompt quality: structure,
            reuse, grounding, evaluation, and safety.
          </p>
        )}
      </div>

      <PlatformPicker
        value={platform}
        onChange={onPlatformChange}
        hasLaterProgress={hasLaterProgress}
      />
      <CapabilityMatrixView highlightedPlatform={platform} />
      <VaguePromptTester
        platform={platform}
        prompt={competitorPricingMonitor.vaguePrompt}
        value={vaguePromptTest}
        onChange={onVaguePromptChange}
      />
    </div>
  );
}
