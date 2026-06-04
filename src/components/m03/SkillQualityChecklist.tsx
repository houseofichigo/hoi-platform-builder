import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { Platform, SkillSpec } from "@/data/m03/m03Schema";
import { competitorPricingMonitorSkill } from "@/data/m03/skillTemplate";
import { platforms } from "@/data/m03/platforms";
import { SkillDownloadButton } from "./SkillDownloadButton";

interface SkillQualityChecklistProps {
  platform: Platform;
  rawSkillText: string;
  onSave: (skill: SkillSpec) => void;
  onRegenerate: () => void;
}

const checklist = [
  "Has a clear, specific name",
  "Description explains when to use it",
  "Has 3+ trigger phrases",
  "Instructions are direct and complete",
  "Quality bar is verifiable",
  "Safety constraints name specific things to avoid",
  "Names when NOT to use it",
];

export function SkillQualityChecklist({
  platform,
  rawSkillText,
  onSave,
  onRegenerate,
}: SkillQualityChecklistProps) {
  const [checked, setChecked] = useState<string[]>([]);
  const [editedText, setEditedText] = useState(rawSkillText);
  const [savedSkill, setSavedSkill] = useState<SkillSpec | null>(null);
  const allChecked = checklist.every((item) => checked.includes(item));
  const platformConfig = platforms[platform];

  const parsedPreview = useMemo(() => parseSkillText(editedText), [editedText]);

  const save = () => {
    const parsed = parseSkillText(editedText);
    setSavedSkill(parsed);
    onSave(parsed);
    toast.success("Skill saved.");
  };

  return (
    <section className="rounded-lg border border-chalk bg-white p-5 space-y-5">
      <header className="space-y-2">
        <p className="eyebrow">Skill quality check</p>
        <p className="text-[14px] text-graphite">
          Before installing this Skill, verify it has the six Prompt Contract elements and a clear
          “when not to use” boundary.
        </p>
      </header>

      <div className="space-y-2">
        {checklist.map((item) => (
          <label key={item} className="flex cursor-pointer items-start gap-3 text-[14px] text-navy">
            <input
              type="checkbox"
              checked={checked.includes(item)}
              onChange={() =>
                setChecked((current) =>
                  current.includes(item)
                    ? current.filter((value) => value !== item)
                    : [...current, item],
                )
              }
              className="mt-1 h-4 w-4 accent-terracotta"
            />
            <span>{item}</span>
          </label>
        ))}
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-navy">Editable Skill content</span>
        <textarea
          value={editedText}
          rows={14}
          onChange={(e) => setEditedText(e.target.value)}
          className="input-ichigo font-mono text-[12px]"
        />
      </label>

      <div className="rounded-md border border-chalk bg-mist/40 p-3 text-[12px] text-slate">
        Parsed preview: <span className="font-medium text-navy">{parsedPreview.name}</span> ·{" "}
        {parsedPreview.triggers.length} triggers · {parsedPreview.qualityBar.length} checks
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-ichigo btn-ichigo-outline" onClick={onRegenerate}>
          Regenerate meta-prompt
        </button>
        <button
          type="button"
          className="btn-ichigo btn-ichigo-primary"
          disabled={!allChecked}
          onClick={save}
        >
          Save and continue
        </button>
      </div>

      {savedSkill && (
        <div className="rounded-lg border border-terracotta/30 bg-terracotta/5 p-4 space-y-3">
          <p className="eyebrow-muted">Install this Skill in {platformConfig.displayName}</p>
          <ol className="list-decimal space-y-1 pl-5 text-[13px] text-navy">
            {(platformConfig.skillInstallSteps ?? []).map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <SkillDownloadButton skill={savedSkill} platform={platform} />
        </div>
      )}
    </section>
  );
}

function parseSkillText(text: string): SkillSpec {
  const sections = extractSections(text);
  const defaults = competitorPricingMonitorSkill;
  return {
    name: firstLine(sections["skill name"]) || firstMarkdownHeading(text) || defaults.name,
    description: cleanBody(sections.description) || defaults.description,
    triggers: parseList(sections.triggers).length ? parseList(sections.triggers) : defaults.triggers,
    instructions: cleanBody(sections.instructions) || text || defaults.instructions,
    qualityBar: parseList(sections["quality bar"]).length
      ? parseList(sections["quality bar"])
      : defaults.qualityBar,
    safetyConstraints: parseList(sections["safety constraints"]).length
      ? parseList(sections["safety constraints"])
      : defaults.safetyConstraints,
    whenNotToUse: parseList(sections["when not to use"]).length
      ? parseList(sections["when not to use"])
      : defaults.whenNotToUse,
  };
}

function extractSections(text: string): Record<string, string> {
  const headings = [
    "skill name",
    "description",
    "triggers",
    "instructions",
    "quality bar",
    "safety constraints",
    "when not to use",
  ];
  const result: Record<string, string> = {};
  const lines = text.split("\n");
  let current = "";

  for (const line of lines) {
    const normalized = line
      .replace(/^#+\s*/, "")
      .replace(/^\d+\.\s*/, "")
      .replace(/[:*]/g, "")
      .trim()
      .toLowerCase();
    const matched = headings.find((heading) => normalized.startsWith(heading));
    if (matched) {
      current = matched;
      const rest = line.split(":").slice(1).join(":").trim();
      result[current] = rest ? `${rest}\n` : "";
    } else if (current) {
      result[current] = `${result[current] ?? ""}${line}\n`;
    }
  }
  return result;
}

function parseList(value = ""): string[] {
  return value
    .split("\n")
    .map((line) => line.replace(/^[-*]\s*/, "").replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);
}

function cleanBody(value = ""): string {
  return value.trim();
}

function firstLine(value = ""): string {
  return value.split("\n").map((line) => line.trim()).find(Boolean) ?? "";
}

function firstMarkdownHeading(text: string): string {
  return text
    .split("\n")
    .find((line) => line.startsWith("# "))
    ?.replace(/^#\s*/, "")
    .trim() ?? "";
}

