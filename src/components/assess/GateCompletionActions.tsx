import { Link } from "@tanstack/react-router";
import { getNextModule, type ModuleMeta } from "@/lib/curriculum";

interface GateCompletionActionsProps {
  module: ModuleMeta;
  workspaceSlug: string;
}

export function GateCompletionActions({ module, workspaceSlug }: GateCompletionActionsProps) {
  const nextModule = getNextModule(module.id);

  return (
    <section className="rounded-md border border-chalk bg-white p-6 shadow-sm">
      <p className="eyebrow text-terracotta">Gate recorded</p>
      <h2 className="h-display-sm mt-3 max-w-[28ch]">
        Gate {module.gateNumber} decision is saved.
      </h2>
      <p className="mt-3 max-w-[60ch] text-[14px] leading-relaxed text-graphite">
        Your decision record has been saved to the course evidence trail. Choose the next step
        when you are ready.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        {nextModule ? (
          <Link
            to="/app/$workspaceSlug/assess/$moduleId"
            params={{ workspaceSlug, moduleId: nextModule.id }}
            className="btn-ichigo btn-ichigo-primary"
          >
            Continue to Chapter {nextModule.num} →
          </Link>
        ) : (
          <Link
            to="/app/$workspaceSlug/assess/complete"
            params={{ workspaceSlug }}
            className="btn-ichigo btn-ichigo-primary"
          >
            View Course Completion →
          </Link>
        )}

        <Link
          to="/app/$workspaceSlug/assess"
          params={{ workspaceSlug }}
          className="btn-ichigo btn-ichigo-outline"
        >
          Back to Course Overview
        </Link>
      </div>
    </section>
  );
}
