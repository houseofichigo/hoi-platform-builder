import type { AutomationPlaybookData } from "@/data/m03/m03Schema";
import { getRungsForPlatform, isRungAvailable } from "@/data/m03/capabilityMatrix";
import { platforms } from "@/data/m03/platforms";
import { competitorPricingMonitor } from "@/data/m03/useCases/competitor-pricing-monitor";
import { GOVERNANCE_GAP_LABELS, formatPromptValue, RUNG_LABELS } from "./m03Display";
import { promptContractToMarkdown } from "./skillDownload";

export function PlaybookDocument({ data }: { data: AutomationPlaybookData }) {
  const platform = platforms[data.platform];
  const useCase = competitorPricingMonitor;
  const walkedRungs = useCase.rungs.filter((rung) => data.rungsCovered.includes(rung.rungNumber));
  const beyondRungs = useCase.rungs.filter((rung) => !data.rungsCovered.includes(rung.rungNumber));
  const current = useCase.rungs.find((rung) => rung.rungNumber === data.reflectionAnswers.currentRung);
  const target = useCase.rungs.find((rung) => rung.rungNumber === data.reflectionAnswers.targetRung);

  return (
    <article
      id="m03-playbook-document"
      className="mx-auto max-w-[780px] rounded-lg border border-chalk bg-white p-6 md:p-8 space-y-8"
    >
      <header className="space-y-2">
        <p className="eyebrow">M03 Automation Playbook</p>
        <h2 className="font-display text-3xl text-navy">{useCase.displayName}</h2>
        <p className="text-[13px] text-slate">
          Generated {new Date(data.generatedAt).toLocaleString()} · {platform.displayName}
        </p>
      </header>

      <DocumentSection label="Section 1" title="Setup">
        <dl className="grid gap-3 text-[14px] md:grid-cols-2">
          <SpecItem label="Use case" value={useCase.displayName} />
          <SpecItem label="Platform" value={platform.displayName} />
          <SpecItem label="Available rungs" value={`${getRungsForPlatform(data.platform).length} of 10`} />
          <SpecItem label="Rungs walked" value={data.rungsCovered.join(", ")} />
        </dl>
        <div className="mt-5">
          <p className="eyebrow-muted">Vague prompt test results</p>
          <p className="mt-2 font-mono text-[13px] text-ink">"{useCase.vaguePrompt}"</p>
          <ul className="mt-3 grid gap-1 text-[13px] text-navy md:grid-cols-2">
            {Object.entries(data.vagueResults.observations).map(([key, value]) => (
              <li key={key}>{value ? "✓" : "✗"} {observationLabel(key)}</li>
            ))}
          </ul>
          {data.vagueResults.pastedResult && (
            <pre className="mt-4 whitespace-pre-wrap rounded-md bg-mist p-4 font-mono text-[12px] text-ink">
              {data.vagueResults.pastedResult}
            </pre>
          )}
        </div>
      </DocumentSection>

      <DocumentSection label="Section 2" title="The Prompt Contract">
        <pre className="whitespace-pre-wrap rounded-md bg-mist p-4 font-mono text-[12px] leading-relaxed text-ink">
          {promptContractToMarkdown(data.promptContract, "Prompt Contract")}
        </pre>
      </DocumentSection>

      <DocumentSection label="Section 3" title="Your Skill">
        {["chatgpt", "claude", "mistral"].includes(data.platform) ? (
          <>
            <h4 className="font-display text-lg text-navy">{data.skillSpec.name}</h4>
            <p className="text-[14px] text-graphite">{data.skillSpec.description}</p>
            <pre className="mt-4 whitespace-pre-wrap rounded-md bg-mist p-4 font-mono text-[12px] leading-relaxed text-ink">
              {data.skillSpec.instructions}
            </pre>
            <ol className="mt-4 list-decimal space-y-1 pl-5 text-[13px] text-navy">
              {(platform.skillInstallSteps ?? []).map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </>
        ) : (
          <div className="rounded-md border border-chalk bg-mist/40 p-4">
            <p className="text-[14px] text-navy">
              In {platform.displayName}, use this Prompt Contract as a saved template. M04 covers
              the platform's productised equivalents for Skill-like capability.
            </p>
            <pre className="mt-4 whitespace-pre-wrap font-mono text-[12px] text-ink">
              {promptContractToMarkdown(data.promptContract, "Reusable Prompt Contract")}
            </pre>
          </div>
        )}
      </DocumentSection>

      <DocumentSection label="Section 4" title="The Ladder Map">
        <div className="space-y-5">
          {walkedRungs.map((rung) => {
            const result = data.rungWalkthrough[rung.rungNumber];
            return (
              <div key={rung.rungNumber} className="rounded-md border border-chalk p-4">
                <p className="eyebrow-muted">Rung {rung.rungNumber}</p>
                <h4 className="font-display text-lg text-navy">{rung.rungName}</h4>
                <p className="mt-2 text-[13px] text-graphite">{rung.conceptDefinition}</p>
                <p className="mt-2 font-mono text-[12px] text-terracotta">
                  Governance weight: {rung.governanceWeight}/5
                </p>
                <pre className="mt-3 whitespace-pre-wrap rounded-md bg-mist p-3 font-mono text-[11px] text-ink">
                  {rung.promptOrArtifact}
                </pre>
                <p className="mt-3 text-[12px] text-slate">
                  Tested: {formatPromptValue(result?.tested)} · Relevant for team:{" "}
                  {formatPromptValue(result?.relevantForTeam)}
                </p>
              </div>
            );
          })}

          {beyondRungs.length > 0 && (
            <div className="rounded-md border border-chalk bg-paper/70 p-4">
              <p className="eyebrow-muted">Beyond your platform</p>
              <p className="mt-2 text-[13px] text-graphite">
                The following rungs were not walked during M03. They are included for landscape
                awareness and future tooling decisions.
              </p>
              <ul className="mt-3 space-y-2 text-[13px] text-navy">
                {beyondRungs.map((rung) => {
                  const supported = (["chatgpt", "claude", "gemini", "mistral", "copilot"] as const)
                    .filter((p) => isRungAvailable(rung.rungNumber, p))
                    .map((p) => platforms[p].shortName)
                    .join(", ");
                  return (
                    <li key={rung.rungNumber}>
                      <span className="font-medium">Rung {rung.rungNumber} — {rung.rungName}:</span>{" "}
                      {rung.capability} Supported by: {supported || "none in the current matrix"}.
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </DocumentSection>

      <DocumentSection label="Section 5" title="Decisions and Governance Gaps">
        <div className="space-y-3 text-[14px] text-navy">
          <p><span className="font-medium">Current rung:</span> Rung {data.reflectionAnswers.currentRung} — {current?.rungName ?? RUNG_LABELS[data.reflectionAnswers.currentRung]}</p>
          <p><span className="font-medium">Target rung:</span> Rung {data.reflectionAnswers.targetRung} — {target?.rungName ?? RUNG_LABELS[data.reflectionAnswers.targetRung]}</p>
          <p><span className="font-medium">Gap:</span> {Math.abs(data.reflectionAnswers.targetRung - data.reflectionAnswers.currentRung)} rungs</p>
          <div>
            <p className="font-medium">Governance gaps to close:</p>
            <ul className="mt-1 list-disc pl-5">
              {data.reflectionAnswers.governanceGaps.map((gap) => (
                <li key={gap}>{GOVERNANCE_GAP_LABELS[gap] ?? gap}</li>
              ))}
            </ul>
          </div>
          <p><span className="font-medium">Automation readiness:</span> {data.readinessStatus}</p>
          <p><span className="font-medium">Reasoning:</span> {data.readinessExplanation}</p>
        </div>
        <div className="mt-5 space-y-3 text-[14px] leading-relaxed text-graphite">
          <p>
            This Playbook gives you a structured Prompt Contract, a reusable Skill or template, a
            platform-aware ladder map, and the governance controls needed before you climb higher.
            It is designed to be used directly with your AI platform, not stored as theory.
          </p>
          <p>
            M04 adds the productised assistant layer: Custom GPT-style builders, Gems, Mistral
            Agents, Copilot Studio, and RAG patterns that turn this playbook into a durable assistant.
          </p>
        </div>
      </DocumentSection>
    </article>
  );
}

function DocumentSection({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-chalk pt-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-terracotta">{label}</p>
      <h3 className="mt-1 font-display text-2xl text-navy">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SpecItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate">{label}</dt>
      <dd className="mt-1 text-navy">{value}</dd>
    </div>
  );
}

function observationLabel(key: string): string {
  const labels: Record<string, string> = {
    askedWhichCompetitors: "Asked which competitors to check",
    citedSources: "Cited specific sources",
    structuredOutput: "Returned structured output",
    specifiedCurrency: "Specified what was current vs outdated",
    inventedDetails: "Invented unverifiable details",
    couldDefend: "Defensible to the team",
  };
  return labels[key] ?? key;
}

