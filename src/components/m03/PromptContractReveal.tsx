import { useState } from "react";
import { toast } from "sonner";
import type { Platform, PromptContract } from "@/data/m03/m03Schema";
import { platforms } from "@/data/m03/platforms";
import { promptContractOverlays, promptOptimizerChecklist, v0ToV6Prompts } from "@/data/m03/useCases/competitor-pricing-monitor";
import { promptContractToMarkdown } from "./skillDownload";

interface PromptContractRevealProps {
  platform: Platform;
  promptContract: PromptContract;
  useCaseName: string;
  revealed: boolean;
  onReveal: () => void;
}

const changes = [
  "Goal names the action, object, and intended result",
  "Context names the source material, audience, and downstream review",
  "Rules include must-do, must-not-do, and injection defense",
  "Output Contract makes the answer structured and testable",
  "Quality Bar defines what good enough means",
  "Examples show edge-case behavior",
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
          and Examples. The chapter adds two overlay groups: Style overlays and Operational
          overlays. The six elements define the contract; overlays control voice and operating
          conditions.
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

          <div className="grid gap-4 md:grid-cols-2">
            <OverlayCard
              title={promptContractOverlays.style.label}
              description={promptContractOverlays.style.description}
              items={promptContractOverlays.style.items}
            />
            <OverlayCard
              title={promptContractOverlays.operational.label}
              description={promptContractOverlays.operational.description}
              items={promptContractOverlays.operational.items}
            />
          </div>

          <div className="rounded-lg border border-chalk bg-white p-5">
            <p className="eyebrow-muted">V0 to V6 - each element removes uncertainty</p>
            <div className="mt-4 space-y-3">
              {v0ToV6Prompts.map((version) => (
                <details key={version.versionLabel} className="rounded-md border border-chalk bg-paper/70 p-3">
                  <summary className="cursor-pointer text-[14px] font-medium text-navy">
                    {version.versionLabel} · {version.elementAdded}
                  </summary>
                  <p className="mt-2 text-[13px] text-graphite">{version.whatImproves}</p>
                  <pre className="mt-3 whitespace-pre-wrap rounded-md bg-mist p-3 font-mono text-[11px] leading-relaxed text-ink">
                    {version.prompt}
                  </pre>
                </details>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-chalk bg-white p-5">
            <p className="eyebrow-muted">10-item optimizer checklist</p>
            <ol className="mt-3 grid gap-2 text-[13px] text-navy md:grid-cols-2">
              {promptOptimizerChecklist.map((item) => (
                <li key={item} className="rounded-md bg-paper/70 p-3">
                  {item}
                </li>
              ))}
            </ol>
          </div>

          <div className="space-y-3">
            <p className="eyebrow-muted">Now test this prompt in your AI</p>
            <p className="text-[14px] text-graphite">
              Copy this Prompt Contract, paste it into {platformConfig.displayName}, add your actual
              email or inbox context, and run it.
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

function OverlayCard({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: string[];
}) {
  return (
    <section className="rounded-md border border-chalk bg-white p-4">
      <p className="eyebrow-muted">{title}</p>
      <p className="mt-2 text-[13px] leading-relaxed text-graphite">{description}</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item} className="rounded-md bg-mist px-2 py-1 font-mono text-[11px] text-navy">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
