import type { Platform } from "@/data/m03/m03Schema";
import { getRungsForPlatform } from "@/data/m03/capabilityMatrix";
import { platforms } from "@/data/m03/platforms";
import { formatRungList } from "./m03Display";

interface PlatformPickerProps {
  value?: Platform;
  onChange: (platform: Platform) => void;
  hasLaterProgress?: boolean;
}

function subtitleFor(platform: Platform): string {
  const rungs = getRungsForPlatform(platform);
  if (rungs.length === 10) return "Full ladder · all 10 rungs available";
  return `${formatRungList(rungs)} · ${rungs.length} rungs available in the verified matrix`;
}

export function PlatformPicker({ value, onChange, hasLaterProgress }: PlatformPickerProps) {
  const handleChange = (platform: Platform) => {
    if (platform === value) return;
    if (
      value &&
      hasLaterProgress &&
      !window.confirm(
        "Changing platform will reset Step 3 (the ladder content adapts to your platform). Your Step 1 and Step 2 work is preserved. Continue?",
      )
    ) {
      return;
    }
    onChange(platform);
  };

  return (
    <section className="card space-y-5">
      <header className="space-y-2">
        <p className="eyebrow">Which AI platform do you use most often?</p>
        <p className="text-[14px] leading-relaxed text-graphite">
          The exercises adapt to your platform: specific clicks, specific terms, and the rungs of
          the automation ladder that work in your current tool.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        {(Object.keys(platforms) as Platform[]).map((platformId) => {
          const platform = platforms[platformId];
          const selected = value === platformId;
          return (
            <button
              key={platformId}
              type="button"
              aria-pressed={selected}
              onClick={() => handleChange(platformId)}
              className={`rounded-lg border p-4 text-left transition-colors ${
                selected
                  ? "border-terracotta bg-mist/70"
                  : "border-chalk bg-white hover:border-terracotta/60"
              }`}
            >
              <span className="block font-display text-lg text-navy">{platform.displayName}</span>
              <span className="mt-1 block text-[12px] text-slate">{platform.url}</span>
              <span className="mt-3 block text-[13px] font-medium text-graphite">
                {subtitleFor(platformId)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

