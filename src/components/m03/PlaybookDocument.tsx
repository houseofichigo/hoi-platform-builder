import type { AutomationPlaybookData } from "@/data/m03/m03Schema";
import { getRungsForPlatform, isRungAvailable } from "@/data/m03/capabilityMatrix";
import { platforms } from "@/data/m03/platforms";
import { competitorPricingMonitor } from "@/data/m03/useCases/competitor-pricing-monitor";
import { promptContractOverlays, promptOptimizerChecklist, v0ToV6Prompts } from "@/data/m03/useCases/competitor-pricing-monitor";
import { contractClauseExtractorSkill, genericSkillCreationMetaPrompt, promptImproverSkill, skillToChatGPTFormat } from "@/data/m03/skillTemplate";
import { promptContractToMarkdown } from "./skillDownload";

export function PlaybookDocument({ data }: { data: AutomationPlaybookData }) {
  const platform = platforms[data.platform];
  const useCase = competitorPricingMonitor;
  const walkedRungs = useCase.rungs.filter((rung) => data.rungsCovered.includes(rung.rungNumber));
  const beyondRungs = useCase.rungs.filter((rung) => !data.rungsCovered.includes(rung.rungNumber));

  return (
    <article
      id="m03-library-document"
      className="mx-auto max-w-[780px] rounded-lg border border-chalk bg-white p-6 md:p-8 space-y-8"
    >
      <header className="space-y-2">
        <p className="eyebrow">M03 Prompt Contract + Automation Ladder Library</p>
        <h2 className="font-display text-3xl text-navy">Prompt Contract + Ladder Library</h2>
        <p className="text-[13px] text-slate">
          Generated {new Date(data.generatedAt).toLocaleString()} · {platform.displayName}
        </p>
      </header>

      <DocumentSection label="Section 1" title="How to use this library">
        <dl className="grid gap-3 text-[14px] md:grid-cols-2">
          <SpecItem label="Chapter" value="M03 Prompt-driven automation" />
          <SpecItem label="Platform" value={platform.displayName} />
          <SpecItem label="Available rungs" value={`${getRungsForPlatform(data.platform).length} of 10`} />
          <SpecItem label="Rungs walked" value={data.rungsCovered.join(", ")} />
        </dl>
        <div className="mt-5">
          <p className="eyebrow-muted">Vague baseline</p>
          <p className="mt-2 font-mono text-[13px] text-ink">"{useCase.vaguePrompt}"</p>
          <ul className="mt-3 grid gap-1 text-[13px] text-navy md:grid-cols-2">
            {Object.entries(data.vagueResults.observations).map(([key, value]) => (
              <li key={key}>{value ? "✓" : "✗"} {observationLabel(key)}</li>
            ))}
          </ul>
        </div>
      </DocumentSection>

      <DocumentSection label="Section 2" title="V0 to V6 prompt progression">
        <div className="space-y-3">
          {v0ToV6Prompts.map((version) => (
            <div key={version.versionLabel} className="rounded-md border border-chalk p-4">
              <p className="eyebrow-muted">{version.versionLabel} · {version.elementAdded}</p>
              <p className="mt-2 text-[13px] text-graphite">{version.whatImproves}</p>
              <pre className="mt-3 whitespace-pre-wrap rounded-md bg-mist p-3 font-mono text-[11px] leading-relaxed text-ink">
                {version.prompt}
              </pre>
            </div>
          ))}
        </div>
      </DocumentSection>

      <DocumentSection label="Section 3" title="The six-element Prompt Contract">
        <pre className="whitespace-pre-wrap rounded-md bg-mist p-4 font-mono text-[12px] leading-relaxed text-ink">
          {promptContractToMarkdown(data.promptContract, "Prompt Contract")}
        </pre>
      </DocumentSection>

      <DocumentSection label="Section 4" title="Overlays and optimizer checklist">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-md border border-chalk p-4">
            <p className="eyebrow-muted">{promptContractOverlays.style.label}</p>
            <p className="mt-2 text-[13px] text-graphite">{promptContractOverlays.style.description}</p>
            <p className="mt-3 font-mono text-[12px] text-navy">{promptContractOverlays.style.items.join(" · ")}</p>
          </div>
          <div className="rounded-md border border-chalk p-4">
            <p className="eyebrow-muted">{promptContractOverlays.operational.label}</p>
            <p className="mt-2 text-[13px] text-graphite">{promptContractOverlays.operational.description}</p>
            <p className="mt-3 font-mono text-[12px] text-navy">{promptContractOverlays.operational.items.join(" · ")}</p>
          </div>
        </div>
        <ol className="mt-5 grid gap-2 text-[13px] text-navy md:grid-cols-2">
          {promptOptimizerChecklist.map((item) => (
            <li key={item} className="rounded-md bg-paper/70 p-3">{item}</li>
          ))}
        </ol>
      </DocumentSection>

      <DocumentSection label="Section 5" title="Contract-clause Skill example">
        <h4 className="font-display text-lg text-navy">{contractClauseExtractorSkill.name}</h4>
        <p className="text-[14px] text-graphite">{contractClauseExtractorSkill.description}</p>
        <pre className="mt-4 whitespace-pre-wrap rounded-md bg-mist p-4 font-mono text-[12px] leading-relaxed text-ink">
          {skillToChatGPTFormat(contractClauseExtractorSkill)}
        </pre>
      </DocumentSection>

      <DocumentSection label="Section 6" title="Optional Skill-building meta-prompt">
        <p className="text-[14px] leading-relaxed text-graphite">
          Use this meta-prompt when you already have a good Prompt Contract and want the AI to turn
          it into a reusable Skill.
        </p>
        <pre className="mt-4 whitespace-pre-wrap rounded-md bg-mist p-4 font-mono text-[12px] leading-relaxed text-ink">
          {genericSkillCreationMetaPrompt}
        </pre>
      </DocumentSection>

      <DocumentSection label="Section 7" title="Optional Prompt Improver Skill example">
        {["chatgpt", "claude", "mistral"].includes(data.platform) ? (
          <>
            <h4 className="font-display text-lg text-navy">{promptImproverSkill.name}</h4>
            <p className="text-[14px] text-graphite">{promptImproverSkill.description}</p>
            <pre className="mt-4 whitespace-pre-wrap rounded-md bg-mist p-4 font-mono text-[12px] leading-relaxed text-ink">
              {skillToChatGPTFormat(promptImproverSkill)}
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
              In {platform.displayName}, use the meta-prompt and Prompt Contract as saved
              templates. M04 covers the platform's productised equivalents for Skill-like capability.
            </p>
            <pre className="mt-4 whitespace-pre-wrap font-mono text-[12px] text-ink">
              {skillToChatGPTFormat(promptImproverSkill)}
            </pre>
          </div>
        )}
      </DocumentSection>

      <DocumentSection label="Section 8" title="Prompt library by automation rung">
        <div className="space-y-5">
          {walkedRungs.map((rung) => {
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

      <DocumentSection label="Section 9" title="Completion note">
        <div className="mt-5 space-y-3 text-[14px] leading-relaxed text-graphite">
          <p>
            This library is designed for copying: choose the rung that matches the work, replace
            variables in braces, and keep the source, safety, and confirmation rules intact.
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
