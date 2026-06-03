import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { getModule, isValidModuleId, type ModuleId } from "@/lib/curriculum";
import { AssessRetakeProvider, useAssessProgress } from "@/hooks/useAssess";
import { ModuleCompletionActions } from "@/components/assess/ModuleCompletionActions";
import { getActiveUseCaseTrack, getUseCaseTrackStep } from "@/lib/assess/use-case-tracks";
import { M01Work } from "@/components/assess/modules/M01Work";
import { M02Work } from "@/components/assess/modules/M02Work";
import { M03Work } from "@/components/assess/modules/M03Work";
import { M04Work } from "@/components/assess/modules/M04Work";
import { M05Work } from "@/components/assess/modules/M05Work";
import { M06Work } from "@/components/assess/modules/M06Work";
import { M07Work } from "@/components/assess/modules/M07Work";
import { M08Work } from "@/components/assess/modules/M08Work";
import { M09Work } from "@/components/assess/modules/M09Work";
import { M10Work } from "@/components/assess/modules/M10Work";
import { M11Work } from "@/components/assess/modules/M11Work";
import { M12Work } from "@/components/assess/modules/M12Work";

export const Route = createFileRoute("/app/$workspaceSlug/assess/$moduleId/work")({
  component: ModuleWork,
});

function ModuleWork() {
  const { moduleId } = Route.useParams();
  const { workspace } = useWorkspace();
  if (!workspace || !isValidModuleId(moduleId)) return null;
  const m = getModule(moduleId as ModuleId)!;
  const slug = workspace.slug;
  const { data: progress } = useAssessProgress(m.id);
  const [retaking, setRetaking] = useState(false);
  const [retakeBaselineCompletedAt, setRetakeBaselineCompletedAt] = useState<string | null>(null);
  const studied = progress?.studied ?? false;
  const assignmentComplete = (progress?.status ?? "not_started") === "complete";
  const showingCompletion = assignmentComplete && !retaking;
  const appliedTrack = getActiveUseCaseTrack();
  const appliedStep = getUseCaseTrackStep(appliedTrack.slug, m.id);

  useEffect(() => {
    if (!retaking || !assignmentComplete) return;
    if (progress?.completed_at && progress.completed_at !== retakeBaselineCompletedAt) {
      setRetaking(false);
      setRetakeBaselineCompletedAt(null);
    }
  }, [assignmentComplete, progress?.completed_at, retakeBaselineCompletedAt, retaking]);

  return (
    <div className="space-y-8">
      {!showingCompletion && !studied && (
        <div className="rounded-md border border-chalk bg-mist/40 px-4 py-3 text-[13px] text-navy flex items-center justify-between gap-4">
          <span>Tip: review the slides before starting this assignment.</span>
          <Link
            to="/app/$workspaceSlug/assess/$moduleId/study"
            params={{ workspaceSlug: slug, moduleId: m.id }}
            className="font-medium text-terracotta hover:opacity-80 whitespace-nowrap"
          >
            Open Study →
          </Link>
        </div>
      )}

      {!showingCompletion && appliedStep && (
        <div className="rounded-md border border-terracotta/25 bg-terracotta/5 px-4 py-3 text-[13px] text-navy flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Want to see this method applied to Invoice OCR? Open the read-only applied track step.
          </span>
          <Link
            to="/app/$workspaceSlug/assess/use-cases/$trackId/$moduleId"
            params={{ workspaceSlug: slug, trackId: appliedTrack.slug, moduleId: m.id }}
            className="font-medium text-terracotta hover:opacity-80 whitespace-nowrap"
          >
            See OCR version →
          </Link>
        </div>
      )}

      {retaking && assignmentComplete && (
        <div className="rounded-md border border-terracotta/25 bg-terracotta/5 px-4 py-3 text-[13px] text-navy flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Retake mode is open. Your completed status stays saved while you review or update this assignment.
          </span>
          <button
            type="button"
            onClick={() => {
              setRetaking(false);
              setRetakeBaselineCompletedAt(null);
            }}
            className="font-medium text-terracotta hover:opacity-80 whitespace-nowrap"
          >
            Exit retake →
          </button>
        </div>
      )}

      {showingCompletion ? (
        <ModuleCompletionActions
          module={m}
          workspaceSlug={slug}
          onRetake={() => {
            setRetakeBaselineCompletedAt(progress?.completed_at ?? null);
            setRetaking(true);
          }}
        />
      ) : (
        <AssessRetakeProvider moduleId={m.id}>
          {(() => {
            switch (moduleId) {
              case "m01":
                return <M01Work />;
              case "m02":
                return <M02Work />;
              case "m03":
                return <M03Work />;
              case "m04":
                return <M04Work />;
              case "m05":
                return <M05Work />;
              case "m06":
                return <M06Work />;
              case "m07":
                return <M07Work />;
              case "m08":
                return <M08Work />;
              case "m09":
                return <M09Work />;
              case "m10":
                return <M10Work />;
              case "m11":
                return <M11Work />;
              case "m12":
                return <M12Work />;
              default:
                return (
                  <div className="card border-l-[3px] border-l-terracotta space-y-4">
                    <p className="text-[14px] text-navy">
                      Assignment content for <span className="font-medium">{m.id.toUpperCase()}</span> is being built. This shell will be
                      replaced with step-by-step assignment content in batch 3.{m.num}.
                    </p>
                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate">{m.steps} steps planned</p>
                    <div>
                      <p className="eyebrow-muted">ASSIGNMENT</p>
                      <p className="mt-1 text-[14px] text-navy">{m.assignment}</p>
                    </div>
                    <div>
                      <p className="eyebrow-muted">OUTCOME</p>
                      <p className="mt-1 text-[14px] text-navy">{m.outcome}</p>
                    </div>
                  </div>
                );
            }
          })()}

          <Link
            to="/app/$workspaceSlug/assess/$moduleId"
            params={{ workspaceSlug: slug, moduleId: m.id }}
            className="inline-block text-[13px] font-medium text-slate hover:text-navy"
          >
            ← Back to overview
          </Link>
        </AssessRetakeProvider>
      )}
    </div>
  );
}
