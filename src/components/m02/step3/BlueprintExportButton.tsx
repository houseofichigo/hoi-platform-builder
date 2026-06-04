import { useState } from "react";
import type { M02BlueprintData, M02GeneratedBlueprint } from "@/data/m02/blueprintSchema";

interface BlueprintExportButtonProps {
  blueprint: M02BlueprintData;
  generated: M02GeneratedBlueprint;
}

export function BlueprintExportButton({ blueprint, generated }: BlueprintExportButtonProps) {
  const [pdfState, setPdfState] = useState<"idle" | "working" | "error">("idle");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  const downloadPdf = async () => {
    try {
      setPdfState("working");
      const [{ pdf }, { BlueprintPdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./BlueprintPdfDocument"),
      ]);
      const blob = await pdf(
        <BlueprintPdfDocument blueprint={blueprint} generated={generated} />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${blueprint.useCaseId}-knowledge-base-blueprint.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
      setPdfState("idle");
    } catch {
      setPdfState("error");
    }
  };

  const copyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(generated.markdown);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1600);
    } catch {
      setCopyState("error");
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={downloadPdf}
        disabled={pdfState === "working"}
        className="rounded-md bg-terracotta px-3 py-2 text-[13px] font-medium text-white hover:bg-navy disabled:cursor-wait disabled:opacity-60"
      >
        {pdfState === "working" ? "Preparing PDF..." : "Download as PDF"}
      </button>
      <button
        type="button"
        onClick={copyMarkdown}
        className="rounded-md border border-chalk bg-white px-3 py-2 text-[13px] font-medium text-navy hover:bg-mist/50"
      >
        {copyState === "copied" ? "Markdown copied" : "Copy as Markdown"}
      </button>
      {pdfState === "error" && (
        <p className="basis-full text-[12px] text-danger">PDF export failed. Try again after refreshing.</p>
      )}
      {copyState === "error" && (
        <p className="basis-full text-[12px] text-danger">Could not copy Markdown in this browser.</p>
      )}
    </div>
  );
}
