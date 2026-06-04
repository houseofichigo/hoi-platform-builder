import { useState } from "react";
import { toast } from "sonner";
import type { AutomationPlaybookData } from "@/data/m03/m03Schema";
import { formatDateForFilename } from "./m03Display";

export function BundleExportButton({ data }: { data: AutomationPlaybookData }) {
  const [busy, setBusy] = useState<"pdf" | "zip" | null>(null);

  const downloadPdf = async () => {
    try {
      setBusy("pdf");
      const { saveAs } = await import("file-saver");
      const { generatePlaybookPDF } = await import("./PlaybookPDFRenderer");
      const blob = await generatePlaybookPDF(data);
      saveAs(blob, `m03-playbook-${data.platform}-${formatDateForFilename()}.pdf`);
    } catch (error) {
      console.error(error);
      toast.error("PDF export failed. Try the companion bundle or regenerate the playbook.");
    } finally {
      setBusy(null);
    }
  };

  const downloadZip = async () => {
    try {
      setBusy("zip");
      const { saveAs } = await import("file-saver");
      const JSZip = (await import("jszip")).default;
      const {
        getCrossPlatformReferencePDF,
        getPromptsLibraryMarkdown,
        getSetupGuidePDF,
        getSkillMarkdown,
      } = await import("./CompanionFiles");

      const zip = new JSZip();
      const skillName = ["chatgpt", "claude", "mistral"].includes(data.platform)
        ? "skill.md"
        : "prompt-contract-template.md";
      zip.file(skillName, getSkillMarkdown(data));
      zip.file("prompts-library.md", getPromptsLibraryMarkdown(data));

      const setupGuide = await getSetupGuidePDF(data);
      if (setupGuide) zip.file("setup-guide.pdf", setupGuide);

      zip.file("cross-platform-reference.pdf", await getCrossPlatformReferencePDF());
      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, `m03-playbook-${data.platform}-${formatDateForFilename()}.zip`);
    } catch (error) {
      console.error(error);
      toast.error("Bundle export failed. The in-page playbook is still available.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto flex max-w-[780px] flex-wrap gap-3">
      <button type="button" className="btn-ichigo btn-ichigo-secondary" onClick={downloadPdf} disabled={busy !== null}>
        {busy === "pdf" ? "Preparing PDF..." : "Download Playbook (PDF)"}
      </button>
      <button type="button" className="btn-ichigo btn-ichigo-primary" onClick={downloadZip} disabled={busy !== null}>
        {busy === "zip" ? "Building bundle..." : "Download Companion Bundle (.zip)"}
      </button>
    </div>
  );
}
