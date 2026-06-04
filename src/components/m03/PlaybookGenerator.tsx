import { useEffect, useRef, useState } from "react";
import type { AutomationPlaybookData } from "@/data/m03/m03Schema";
import { BundleExportButton } from "./BundleExportButton";
import { CompleteM03Cta } from "./CompleteM03Cta";
import { PlaybookDocument } from "./PlaybookDocument";
import { PlaybookLoadingSequence } from "./PlaybookLoadingSequence";
import { WhatHappensNextPanel } from "./WhatHappensNextPanel";

interface PlaybookGeneratorProps {
  canGenerate: boolean;
  disabledReason: string;
  existingPlaybook?: AutomationPlaybookData;
  rungCount: number;
  onGenerate: () => Promise<AutomationPlaybookData>;
  onComplete: () => void;
  completePending?: boolean;
}

export function PlaybookGenerator({
  canGenerate,
  disabledReason,
  existingPlaybook,
  rungCount,
  onGenerate,
  onComplete,
  completePending,
}: PlaybookGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [playbook, setPlaybook] = useState<AutomationPlaybookData | undefined>(existingPlaybook);
  const documentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPlaybook(existingPlaybook);
  }, [existingPlaybook]);

  const generate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    const [next] = await Promise.all([
      onGenerate(),
      new Promise((resolve) => window.setTimeout(resolve, 3200)),
    ]);
    setPlaybook(next);
    setLoading(false);
    window.setTimeout(() => documentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  if (loading) return <PlaybookLoadingSequence rungCount={rungCount} />;

  if (playbook) {
    return (
      <div ref={documentRef} className="space-y-6">
        <BundleExportButton data={playbook} />
        <PlaybookDocument data={playbook} />
        <div className="mx-auto max-w-[780px]">
          <button type="button" className="text-[13px] font-medium text-terracotta hover:text-navy" onClick={generate}>
            Regenerate Playbook
          </button>
        </div>
        <WhatHappensNextPanel data={playbook} />
        <CompleteM03Cta enabled={Boolean(playbook)} onComplete={onComplete} pending={completePending} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        className="btn-ichigo btn-ichigo-primary w-full justify-center py-4"
        disabled={!canGenerate}
        onClick={generate}
      >
        Generate the M03 Prompt Automation Playbook →
      </button>
      {!canGenerate && <p className="text-center text-[12px] italic text-slate">{disabledReason}</p>}
    </div>
  );
}
