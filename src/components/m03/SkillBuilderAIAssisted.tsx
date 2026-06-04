import { toast } from "sonner";
import type { Platform, PromptContract, SkillSpec } from "@/data/m03/m03Schema";
import { platforms } from "@/data/m03/platforms";
import { genericSkillCreationMetaPrompt, promptImproverSkill } from "@/data/m03/skillTemplate";
import { promptContractToMarkdown } from "./skillDownload";

interface SkillBuilderAIAssistedProps {
  platform: Platform;
  promptContract: PromptContract;
  onSave: (skill: SkillSpec) => void;
}

export function SkillBuilderAIAssisted({
  platform,
  promptContract,
  onSave,
}: SkillBuilderAIAssistedProps) {
  const platformConfig = platforms[platform];
  const promptContractMarkdown = promptContractToMarkdown(promptContract, "Prompt Contract");

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <p className="eyebrow-muted">AI-assisted path</p>
        <p className="text-[14px] text-graphite">
          Copy this meta-prompt into {platformConfig.displayName}. It will turn any strong Prompt
          Contract into a reusable Skill specification. Use the Prompt Contract above as your first
          example, then reuse the same meta-prompt for your own work.
        </p>
      </header>

      <div className="rounded-md border border-chalk bg-mist p-4">
        <p className="eyebrow-muted">Meta-prompt</p>
        <pre className="mt-3 max-h-[320px] overflow-auto whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-ink">
          {genericSkillCreationMetaPrompt}
        </pre>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-ichigo btn-ichigo-primary"
          onClick={async () => {
            await navigator.clipboard.writeText(genericSkillCreationMetaPrompt);
            toast.success("Meta-prompt copied.");
          }}
        >
          Copy meta-prompt
        </button>
        <a
          href={platformConfig.url}
          target="_blank"
          rel="noreferrer"
          className="btn-ichigo btn-ichigo-outline"
        >
          Open {platformConfig.shortName} ↗
        </a>
      </div>

      <details className="rounded-md border border-chalk bg-white p-4">
        <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.18em] text-terracotta">
          Prompt Contract example to paste into the meta-prompt
        </summary>
        <pre className="mt-3 max-h-[260px] overflow-auto whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-ink">
          {promptContractMarkdown}
        </pre>
      </details>

      <button type="button" className="btn-ichigo btn-ichigo-secondary" onClick={() => onSave(promptImproverSkill)}>
        I understand the meta-prompt →
      </button>
    </div>
  );
}
