import type { Platform, SkillSpec } from "@/data/m03/m03Schema";
import { downloadSkillAsMarkdown } from "./skillDownload";

export function SkillDownloadButton({ skill, platform }: { skill: SkillSpec; platform: Platform }) {
  return (
    <button
      type="button"
      className="btn-ichigo btn-ichigo-outline"
      onClick={() => downloadSkillAsMarkdown(skill, platform)}
    >
      Download as .md
    </button>
  );
}

