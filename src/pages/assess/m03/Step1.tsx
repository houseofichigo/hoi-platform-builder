import type { Platform, VaguePromptTestResult } from "@/data/m03/m03Schema";
import { competitorPricingMonitor } from "@/data/m03/useCases/competitor-pricing-monitor";
import { CapabilityMatrixView } from "@/components/m03/CapabilityMatrixView";
import { PlatformPicker } from "@/components/m03/PlatformPicker";
import { UseCasePicker } from "@/components/m03/UseCasePicker";
import { VaguePromptTester } from "@/components/m03/VaguePromptTester";

interface Step1Props {
  platform?: Platform;
  useCaseId?: string;
  vaguePromptTest?: VaguePromptTestResult;
  hasLaterProgress?: boolean;
  m02BridgeLabel?: string;
  onPlatformChange: (platform: Platform) => void;
  onUseCaseChange: (useCaseId: string) => void;
  onVaguePromptChange: (value: VaguePromptTestResult) => void;
}

export function M03Step1({
  platform,
  useCaseId,
  vaguePromptTest,
  hasLaterProgress,
  m02BridgeLabel,
  onPlatformChange,
  onUseCaseChange,
  onVaguePromptChange,
}: Step1Props) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-chalk bg-mist/40 p-5">
        <p className="text-[14px] leading-relaxed text-graphite">
          In M02 you built a knowledge base blueprint: a governed source of truth for one business
          process. M03 picks up where M02 left off: now that you have the knowledge, how do you turn
          it into a reusable, automation-ready workflow you can actually use in your daily AI tool?
        </p>
        {m02BridgeLabel && (
          <p className="mt-3 text-[12px] text-slate">
            From your M02 selection: {m02BridgeLabel}. You can change the M03 use case below if needed.
          </p>
        )}
      </div>

      <PlatformPicker
        value={platform}
        onChange={onPlatformChange}
        hasLaterProgress={hasLaterProgress}
      />
      <CapabilityMatrixView highlightedPlatform={platform} />
      <UseCasePicker value={useCaseId} onChange={onUseCaseChange} />
      <VaguePromptTester
        platform={platform}
        useCaseSelected={useCaseId === competitorPricingMonitor.id}
        prompt={competitorPricingMonitor.vaguePrompt}
        value={vaguePromptTest}
        onChange={onVaguePromptChange}
      />
    </div>
  );
}

