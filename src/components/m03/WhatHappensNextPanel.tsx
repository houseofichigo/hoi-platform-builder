import type { AutomationPlaybookData } from "@/data/m03/m03Schema";
import { platforms } from "@/data/m03/platforms";
import { RUNG_LABELS } from "./m03Display";

export function WhatHappensNextPanel({ data }: { data: AutomationPlaybookData }) {
  const platform = platforms[data.platform];
  const currentRung = data.reflectionAnswers.currentRung;

  return (
    <section className="mx-auto max-w-[780px] rounded-lg border border-chalk bg-mist/70 p-6 space-y-4">
      <h3 className="font-display text-2xl text-navy">What happens to this Playbook next</h3>
      <ul className="space-y-2 text-[14px] leading-relaxed text-navy">
        <li>→ Install your Skill in {platform.displayName} if your platform supports Skills.</li>
        <li>→ Use the pricing tracker template as your starting file for Rung 5.</li>
        <li>→ M04 picks up where M03 leaves off: productised AI Assistants and RAG.</li>
      </ul>
      <p className="text-[14px] leading-relaxed text-graphite">
        This Playbook is your operational toolkit. Open it next Monday and run your first Rung{" "}
        {currentRung} ({RUNG_LABELS[currentRung]}) workflow on your actual data.
      </p>
    </section>
  );
}

