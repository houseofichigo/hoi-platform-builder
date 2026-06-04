import type { Platform, PromptContract, SkillSpec } from "@/data/m03/m03Schema";
import { promptImproverSkill } from "@/data/m03/skillTemplate";
import { platforms } from "@/data/m03/platforms";
import { SkillBuilderAIAssisted } from "./SkillBuilderAIAssisted";
import { SkillBuilderManual } from "./SkillBuilderManual";

interface SkillBuilderProps {
  platform: Platform;
  promptContract: PromptContract;
  savedSkill?: SkillSpec;
  onSave: (skill: SkillSpec) => void;
}

export function SkillBuilder({ platform, promptContract, savedSkill, onSave }: SkillBuilderProps) {
  const platformConfig = platforms[platform];

  return (
    <section className="card space-y-5">
      <header className="space-y-2">
        <p className="eyebrow">Turn the Prompt Contract into a Skill</p>
        <p className="text-[14px] leading-relaxed text-graphite">
          A Skill is a named, reusable instruction set the AI can load when a task matches. Instead
          of improving a prompt manually every time, install a Prompt Improver Skill once and use it
          whenever a rough prompt needs stronger structure, source rules, and quality checks.
        </p>
      </header>

      {savedSkill && (
        <div className="rounded-md border border-success/30 bg-success/10 p-3 text-[13px] text-navy">
          Saved Skill: <span className="font-medium">{savedSkill.name}</span>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        <SkillUseCard title="Use when" body="A prompt, checklist, recurring review, formatting task, or policy-bound workflow needs a repeatable method." />
        <SkillUseCard title="Do not use when" body="The task needs fresh research, unclear ownership, high-stakes action, or human approval before instructions are safe." />
        <SkillUseCard title={`In ${platformConfig.shortName}`} body="Copy the meta-prompt to create your own Skill, then compare it with the polished Prompt Improver example." />
      </div>

      <SkillBuilderAIAssisted platform={platform} promptContract={promptContract} onSave={onSave} />
      <SkillBuilderManual platform={platform} skill={promptImproverSkill} onSave={onSave} />
    </section>
  );
}

function SkillUseCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-chalk bg-paper/70 p-4">
      <p className="eyebrow-muted">{title}</p>
      <p className="mt-2 text-[13px] leading-relaxed text-graphite">{body}</p>
    </div>
  );
}
