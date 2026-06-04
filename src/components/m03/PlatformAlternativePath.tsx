import { toast } from "sonner";
import type { Platform, PromptContract, SkillSpec } from "@/data/m03/m03Schema";
import { platforms } from "@/data/m03/platforms";
import { promptImproverSkill } from "@/data/m03/skillTemplate";
import { PLATFORM_EQUIVALENTS } from "./m03Display";
import {
  downloadPromptContractAsMarkdown,
  promptContractToMarkdown,
} from "./skillDownload";

interface PlatformAlternativePathProps {
  platform: Platform;
  promptContract: PromptContract;
  onSave: (skill: SkillSpec) => void;
}

export function PlatformAlternativePath({
  platform,
  promptContract,
  onSave,
}: PlatformAlternativePathProps) {
  const platformConfig = platforms[platform];
  const equivalent = PLATFORM_EQUIVALENTS[platform] ?? "productised assistants";
  const markdown = promptContractToMarkdown(promptContract, "Reusable Prompt Contract");

  return (
    <section className="card space-y-5">
      <header className="space-y-2">
        <p className="eyebrow">Skills are not yet available in {platformConfig.displayName} chat</p>
        <p className="text-[14px] leading-relaxed text-graphite">
          {platformConfig.displayName} does not expose the generic Skill concept in this module's
          scope. The closest productised equivalent is {equivalent}, which we cover in M04.
        </p>
      </header>

      <p className="text-[14px] text-navy">
        For now, save the Prompt Contract as a reusable template you can paste into{" "}
        {platformConfig.displayName} when needed.
      </p>

      <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap rounded-md border border-chalk bg-mist p-4 font-mono text-[12px] leading-relaxed text-ink">
        {markdown}
      </pre>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-ichigo btn-ichigo-primary"
          onClick={async () => {
            await navigator.clipboard.writeText(markdown);
            toast.success("Prompt Contract copied.");
          }}
        >
          Copy Prompt Contract
        </button>
        <button
          type="button"
          className="btn-ichigo btn-ichigo-outline"
          onClick={() =>
            downloadPromptContractAsMarkdown(promptContract, "m03-reusable-prompt-contract")
          }
        >
          Download as .md
        </button>
        <button
          type="button"
          className="btn-ichigo btn-ichigo-secondary"
          onClick={() => onSave(promptImproverSkill)}
        >
          I've saved the contract →
        </button>
      </div>
    </section>
  );
}
