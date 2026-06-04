import { useState } from "react";
import type { Platform, PromptContract, SkillSpec } from "@/data/m03/m03Schema";
import { competitorPricingMonitorSkill } from "@/data/m03/skillTemplate";
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
  const [tab, setTab] = useState<"ai" | "manual">("ai");
  const platformConfig = platforms[platform];

  return (
    <section className="card space-y-5">
      <header className="space-y-2">
        <p className="eyebrow">Turn the Prompt Contract into a Skill</p>
        <p className="text-[14px] leading-relaxed text-graphite">
          A Skill is a packaged, reusable instruction set you install once and trigger many times.
          In {platformConfig.displayName}, it turns the method into something your team can reuse.
        </p>
      </header>

      {savedSkill && (
        <div className="rounded-md border border-success/30 bg-success/10 p-3 text-[13px] text-navy">
          Saved Skill: <span className="font-medium">{savedSkill.name}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`rounded-md border px-4 py-2 text-sm font-medium ${
            tab === "ai" ? "border-terracotta bg-terracotta text-white" : "border-chalk bg-white text-navy"
          }`}
          onClick={() => setTab("ai")}
        >
          AI-assisted (recommended)
        </button>
        <button
          type="button"
          className={`rounded-md border px-4 py-2 text-sm font-medium ${
            tab === "manual" ? "border-terracotta bg-terracotta text-white" : "border-chalk bg-white text-navy"
          }`}
          onClick={() => setTab("manual")}
        >
          Manual
        </button>
      </div>

      {tab === "ai" ? (
        <SkillBuilderAIAssisted platform={platform} promptContract={promptContract} onSave={onSave} />
      ) : (
        <SkillBuilderManual
          platform={platform}
          skill={competitorPricingMonitorSkill}
          onSave={onSave}
        />
      )}
    </section>
  );
}

