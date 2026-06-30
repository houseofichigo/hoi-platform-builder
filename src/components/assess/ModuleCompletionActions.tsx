import { Link } from "@tanstack/react-router";
import { getNextModule, type ModuleMeta } from "@/lib/curriculum";

interface ModuleCompletionActionsProps {
  module: ModuleMeta;
  workspaceSlug: string;
  onRetake?: () => void;
}

export function ModuleCompletionActions({ module, workspaceSlug, onRetake }: ModuleCompletionActionsProps) {
  const nextModule = getNextModule(module.id);

  return (
    <section className="rounded-md border border-chalk bg-white p-6 shadow-sm">
      <p className="eyebrow text-terracotta">Chapter complete</p>
      <h2 className="h-display-sm mt-3 max-w-[28ch]">
        {module.id.toUpperCase()} is complete.
      </h2>
      <p className="mt-3 max-w-[60ch] text-[14px] leading-relaxed text-graphite">
        Your progress has been saved. Choose whether to continue now or return to the
        course overview. You can also retake the assignment to review or update your saved work.
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
        {onRetake && (
          <button
            type="button"
            onClick={onRetake}
            className="btn-ichigo btn-ichigo-outline"
          >
            Retake assignment
          </button>
        )}
      </div>
    </section>
  );
}
