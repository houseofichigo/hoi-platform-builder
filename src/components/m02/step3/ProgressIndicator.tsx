interface ProgressIndicatorProps {
  labels: readonly string[];
  revealedPanels: boolean[];
}

export function ProgressIndicator({ labels, revealedPanels }: ProgressIndicatorProps) {
  return (
    <div className="overflow-x-auto pb-1" aria-label="Blueprint component progress">
      <div className="flex min-w-max items-center gap-2">
        {labels.map((label, index) => {
          const revealed = !!revealedPanels[index];
          return (
            <div key={label} className="flex items-center gap-2">
              <span
                title={label}
                className={`h-3 w-3 rounded-full border transition-colors ${
                  revealed ? "border-terracotta bg-terracotta" : "border-chalk bg-mist"
                }`}
                aria-label={`${label}: ${revealed ? "revealed" : "locked"}`}
              />
              {index < labels.length - 1 && (
                <span
                  className={`h-px w-8 ${revealed ? "bg-terracotta/60" : "bg-chalk"}`}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
