import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Platform, PromptContract, SkillSpec } from "@/data/m03/m03Schema";
import { platforms } from "@/data/m03/platforms";
import { skillCreationMetaPrompt } from "@/data/m03/skillTemplate";
import { promptContractToMarkdown } from "./skillDownload";
import { SkillQualityChecklist } from "./SkillQualityChecklist";

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
  const [output, setOutput] = useState("");
  const [showChecklist, setShowChecklist] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const platformConfig = platforms[platform];
  const metaPrompt = skillCreationMetaPrompt.replace(
    "{{PROMPT_CONTRACT}}",
    promptContractToMarkdown(promptContract, "Prompt Contract"),
  );

  return (
    <div ref={topRef} className="space-y-5">
      <header className="space-y-2">
        <p className="eyebrow-muted">AI-assisted path</p>
        <p className="text-[14px] text-graphite">
          Copy the meta-prompt into {platformConfig.displayName}. It will convert the Prompt
          Contract into a reusable Skill specification.
        </p>
      </header>

      <div className="rounded-md border border-chalk bg-mist p-4">
        <p className="eyebrow-muted">Meta-prompt</p>
        <pre className="mt-3 max-h-[320px] overflow-auto whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-ink">
          {metaPrompt}
        </pre>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-ichigo btn-ichigo-primary"
          onClick={async () => {
            await navigator.clipboard.writeText(metaPrompt);
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

      <label className="block space-y-2">
        <span className="text-sm font-medium text-navy">Paste the AI output below</span>
        <textarea
          value={output}
          rows={10}
          maxLength={8000}
          onChange={(e) => {
            setOutput(e.target.value);
            setShowChecklist(false);
          }}
          className="input-ichigo font-mono text-[12px]"
          placeholder="Paste the generated Skill here..."
        />
      </label>

      <button
        type="button"
        className="btn-ichigo btn-ichigo-secondary"
        disabled={output.trim().length < 200}
        onClick={() => setShowChecklist(true)}
      >
        Verify Skill quality →
      </button>

      {showChecklist && (
        <SkillQualityChecklist
          platform={platform}
          rawSkillText={output}
          onSave={onSave}
          onRegenerate={() => {
            setShowChecklist(false);
            topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        />
      )}
    </div>
  );
}

