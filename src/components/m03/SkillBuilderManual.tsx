import { toast } from "sonner";
import type { Platform, SkillSpec } from "@/data/m03/m03Schema";
import { platforms } from "@/data/m03/platforms";
import { skillToChatGPTFormat, skillToClaudeMarkdown } from "@/data/m03/skillTemplate";
import { SkillDownloadButton } from "./SkillDownloadButton";

interface SkillBuilderManualProps {
  platform: Platform;
  skill: SkillSpec;
  onSave: (skill: SkillSpec) => void;
}

export function SkillBuilderManual({ platform, skill, onSave }: SkillBuilderManualProps) {
  const platformConfig = platforms[platform];
  const markdown = platform === "claude" ? skillToClaudeMarkdown(skill) : skillToChatGPTFormat(skill);

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <p className="eyebrow-muted">Manual path</p>
        <p className="text-[14px] text-graphite">
          This is the canonical Competitor Pricing Monitor Skill, ready to install.
        </p>
      </header>

      <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-md border border-chalk bg-mist p-4 font-mono text-[12px] leading-relaxed text-ink">
        {markdown}
      </pre>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-ichigo btn-ichigo-primary"
          onClick={async () => {
            await navigator.clipboard.writeText(markdown);
            toast.success("Skill copied.");
          }}
        >
          Copy Skill
        </button>
        <SkillDownloadButton skill={skill} platform={platform} />
      </div>

      <div className="rounded-lg border border-chalk bg-white p-4">
        <p className="eyebrow-muted">Now install it in {platformConfig.displayName}</p>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-[13px] text-navy">
          {(platformConfig.skillInstallSteps ?? []).map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      <button type="button" className="btn-ichigo btn-ichigo-secondary" onClick={() => onSave(skill)}>
        I've installed the Skill →
      </button>
    </div>
  );
}

