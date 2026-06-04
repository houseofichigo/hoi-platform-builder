import { useEffect, useState } from "react";

export function PlaybookLoadingSequence({ rungCount }: { rungCount: number }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const lines = [
    "Use case & platform configuration",
    "Vague prompt test results",
    "Prompt Contract & Skill specification",
    `Ladder map (${rungCount} rungs)`,
    "Reflection answers & companion files",
  ];

  useEffect(() => {
    const timers = lines.map((_, index) =>
      window.setTimeout(() => setVisibleCount(index + 1), 450 + index * 520),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [lines.length]);

  return (
    <div
      className="mx-auto max-w-[520px] rounded-lg border border-chalk bg-mist/70 p-8 text-center"
      aria-live="polite"
    >
      <p className="font-display text-2xl text-navy">Assembling your Automation Playbook...</p>
      <ul className="mt-6 space-y-3 text-left font-mono text-[13px] text-slate">
        {lines.slice(0, visibleCount).map((line) => (
          <li key={line} className="animate-in fade-in duration-300">
            <span className="mr-2 text-terracotta">✓</span>
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}

