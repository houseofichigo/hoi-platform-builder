import { useState } from "react";
import { toast } from "sonner";
import type { Platform, PromptContract } from "@/data/m03/m03Schema";
import { platforms } from "@/data/m03/platforms";
import { promptContractToMarkdown } from "./skillDownload";

interface PromptContractRevealProps {
  platform: Platform;
  promptContract: PromptContract;
  useCaseName: string;
  revealed: boolean;
  onReveal: () => void;
}

const changes = [
  "Output is structured (table format)",
  "Sources are cited",
  "Missing data is flagged, not invented",
  "Confidence levels appear",
  "You could defend this output to your team",
];

export function PromptContractReveal({
  platform,
  promptContract,
  useCaseName,
  revealed,
  onReveal,
}: PromptContractRevealProps) {
  const [checked, setChecked] = useState<string[]>([]);
  const platformConfig = platforms[platform];
  const markdown = promptContractToMarkdown(promptContract, `Prompt Contract: ${useCaseName}`);

  return (
    <section className="card space-y-5">
      <header className="space-y-2">
        <p className="eyebrow">The Prompt Contract</p>
        <p className="text-[14px] leading-relaxed text-graphite">
          A structured prompt has six elements: Goal, Context, Rules, Output Contract, Quality Bar,
          and Examples. Each element constrains the AI response in a specific way.
        </p>
      </header>

      {!revealed ? (
        <button type="button" className="btn-ichigo btn-ichigo-primary" onClick={onReveal}>
          Show me the Prompt Contract for {useCaseName} →
        </button>
      ) : (
        <div className="space-y-5">
          <div className="rounded-lg border border-chalk bg-mist p-5">
            <ContractSection label="Goal">{promptContract.goal}</ContractSection>
            <ContractSection label="Context">{promptContract.context}</ContractSection>
            <ContractSection label="Rules">
              <ul className="list-disc pl-5">
                {promptContract.rules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </ContractSection>
            <ContractSection label="Output Contract">
              <p>{promptContract.outputContract.description}</p>
              {promptContract.outputContract.columns?.length ? (
                <ul className="mt-2 list-disc pl-5">
                  {promptContract.outputContract.columns.map((column) => (
                    <li key={column}>{column}</li>
                  ))}
                </ul>
              ) : null}
            </ContractSection>
            <ContractSection label="Quality Bar">
              <ul className="list-disc pl-5">
                {promptContract.qualityBar.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </ContractSection>
            <ContractSection label="Examples">{promptContract.examples}</ContractSection>
          </div>

          <div className="space-y-3">
            <p className="eyebrow-muted">Now test this prompt in your AI</p>
            <p className="text-[14px] text-graphite">
              Copy this Prompt Contract, paste it into {platformConfig.displayName}, add your actual
              competitor list at the top, and run it.
            </p>
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
              <a
                href={platformConfig.url}
                target="_blank"
                rel="noreferrer"
                className="btn-ichigo btn-ichigo-outline"
              >
                Open {platformConfig.shortName} ↗
              </a>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-navy">What changed?</p>
            {changes.map((change) => (
              <label key={change} className="flex cursor-pointer items-start gap-3 text-[14px] text-navy">
                <input
                  type="checkbox"
                  checked={checked.includes(change)}
                  onChange={() =>
                    setChecked((current) =>
                      current.includes(change)
                        ? current.filter((item) => item !== change)
                        : [...current, change],
                    )
                  }
                  className="mt-1 h-4 w-4 accent-terracotta"
                />
                <span>{change}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ContractSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="mb-5 last:mb-0">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-terracotta">{label}</p>
      <div className="mt-2 text-[14px] leading-relaxed text-navy">{children}</div>
    </section>
  );
}

