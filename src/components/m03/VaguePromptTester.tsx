import { toast } from "sonner";
import type { Platform, VaguePromptTestResult } from "@/data/m03/m03Schema";
import { platforms } from "@/data/m03/platforms";

interface VaguePromptTesterProps {
  platform?: Platform;
  prompt: string;
  value?: VaguePromptTestResult;
  onChange: (value: VaguePromptTestResult) => void;
}

const observationLabels: Array<{
  key: keyof VaguePromptTestResult["observations"];
  label: string;
}> = [
  { key: "askedWhichCompetitors", label: "Did the AI ask which competitors to check?" },
  { key: "citedSources", label: "Did the AI cite specific sources (URLs)?" },
  { key: "structuredOutput", label: "Did the AI give you a structured output?" },
  { key: "specifiedCurrency", label: "Did the AI specify what was current vs outdated?" },
  { key: "inventedDetails", label: "Did the AI invent prices or details it could not verify?" },
  { key: "couldDefend", label: "Could you defend the output to your team?" },
];

const emptyResult: VaguePromptTestResult = {
  observations: {
    askedWhichCompetitors: false,
    citedSources: false,
    structuredOutput: false,
    specifiedCurrency: false,
    inventedDetails: false,
    couldDefend: false,
  },
};

export function VaguePromptTester({
  platform,
  prompt,
  value,
  onChange,
}: VaguePromptTesterProps) {
  if (!platform) {
    return (
      <section className="card bg-mist/40">
        <p className="text-[14px] text-slate">Choose your platform above to test the baseline.</p>
      </section>
    );
  }

  const result = value ?? emptyResult;
  const platformConfig = platforms[platform];

  const updateObservation = (key: keyof VaguePromptTestResult["observations"], checked: boolean) => {
    onChange({
      ...result,
      observations: { ...result.observations, [key]: checked },
    });
  };

  return (
    <section className="card space-y-5">
      <header className="space-y-2">
        <p className="eyebrow">Test the vague prompt in your AI</p>
        <p className="text-[14px] leading-relaxed text-graphite">
          Open {platformConfig.displayName} in a new tab. Copy this prompt, run it, then
          come back and mark what you observed.
        </p>
      </header>

      <div className="rounded-md border border-chalk bg-mist p-4">
        <p className="eyebrow-muted">Prompt to test</p>
        <pre className="mt-3 whitespace-pre-wrap font-mono text-[13px] text-ink">{prompt}</pre>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-ichigo btn-ichigo-primary"
          onClick={async () => {
            await navigator.clipboard.writeText(prompt);
            toast.success("Prompt copied.");
          }}
        >
          Copy prompt
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

      <div className="space-y-3">
        <p className="text-sm font-medium text-navy">After running it, tell us what you observed:</p>
        {observationLabels.map((item) => (
          <label key={item.key} className="flex cursor-pointer items-start gap-3 text-[14px] text-navy">
            <input
              type="checkbox"
              checked={result.observations[item.key]}
              onChange={(e) => updateObservation(item.key, e.target.checked)}
              className="mt-1 h-4 w-4 accent-terracotta"
            />
            <span>{item.label}</span>
          </label>
        ))}
      </div>

    </section>
  );
}
