import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CheckCircle2, X } from "lucide-react";
import { useTour } from "@/contexts/TourContext";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useOnboardingMutations } from "@/hooks/useOnboardingChecklist";

type WorkspaceRoute =
  | "/app/$workspaceSlug"
  | "/app/$workspaceSlug/assess"
  | "/app/$workspaceSlug/discover"
  | "/app/$workspaceSlug/build"
  | "/app/$workspaceSlug/scale"
  | "/app/$workspaceSlug/admin";

interface TourStep {
  route: WorkspaceRoute;
  eyebrow: string;
  title: string;
  body: string;
}

const BASE_STEPS: TourStep[] = [
  {
    route: "/app/$workspaceSlug",
    eyebrow: "Step 1 · Home",
    title: "Your workspace home",
    body: "This is your command center. Resume where you left off, see team status, and track attention items across every phase of the journey.",
  },
  {
    route: "/app/$workspaceSlug/assess",
    eyebrow: "Step 2 · Assess",
    title: "Diagnose readiness",
    body: "Work through the curriculum to build a complete picture of your maturity, evidence confidence, and EU governance posture. Each module ends in a graded check.",
  },
  {
    route: "/app/$workspaceSlug/discover",
    eyebrow: "Step 3 · Discover",
    title: "Browse the library",
    body: "Search prompts, agents, blueprints, and case studies curated by House of Ichigo. Filters sharpen once your company profile is complete.",
  },
  {
    route: "/app/$workspaceSlug/build",
    eyebrow: "Step 4 · Build",
    title: "Map and prioritize",
    body: "Capture processes, score use cases, and surface blockers. Use the Priority Dashboard, Map Process, Process Library, and Template Library to plan delivery.",
  },
  {
    route: "/app/$workspaceSlug/scale",
    eyebrow: "Step 5 · Scale",
    title: "Govern and roll out",
    body: "Sequence the roadmap, review governance flags, and export evidence for stakeholders and auditors.",
  },
];

const ADMIN_STEP: TourStep = {
  route: "/app/$workspaceSlug/admin",
  eyebrow: "Step 6 · Admin",
  title: "Run the workspace",
  body: "Manage members, billing, review policy, and the Company Setup wizard. House of Ichigo controls owner and admin promotions.",
};

export function GuidedTour() {
  const { isOpen, closeTour } = useTour();
  const { workspace, isAdmin } = useWorkspace();
  const navigate = useNavigate();
  const { markTourCompleted } = useOnboardingMutations();
  const [index, setIndex] = useState(0);

  const steps = useMemo<TourStep[]>(
    () => (isAdmin ? [...BASE_STEPS, ADMIN_STEP] : BASE_STEPS),
    [isAdmin],
  );

  useEffect(() => {
    if (!isOpen) setIndex(0);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !workspace) return;
    const step = steps[index];
    if (!step) return;
    navigate({ to: step.route, params: { workspaceSlug: workspace.slug } });
  }, [isOpen, index, steps, workspace, navigate]);

  if (!isOpen || !workspace) return null;

  const step = steps[index];
  const isFirst = index === 0;
  const isLast = index === steps.length - 1;

  const goNext = () => {
    if (isLast) {
      markTourCompleted.mutate(undefined, {
        onSuccess: () => {
          toast.success("Tour complete — welcome aboard.");
        },
        onError: (e) => toast.error((e as Error).message),
      });
      navigate({ to: "/app/$workspaceSlug", params: { workspaceSlug: workspace.slug } });
      closeTour();
      return;
    }
    setIndex((i) => Math.min(i + 1, steps.length - 1));
  };

  const goBack = () => setIndex((i) => Math.max(i - 1, 0));

  const skip = () => {
    closeTour();
    navigate({ to: "/app/$workspaceSlug", params: { workspaceSlug: workspace.slug } });
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60] w-[min(420px,calc(100vw-2rem))]">
      <div className="rounded-lg border border-chalk bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-terracotta">
            {step.eyebrow}
          </p>
          <button
            type="button"
            onClick={skip}
            aria-label="Skip tour"
            className="text-slate transition-colors hover:text-navy"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <h3 className="mt-2 text-[20px] font-semibold leading-tight text-navy">{step.title}</h3>
        <p className="mt-2 text-[14px] leading-relaxed text-graphite">{step.body}</p>

        <div className="mt-4 flex items-center gap-1">
          {steps.map((s, i) => (
            <span
              key={s.route + i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= index ? "bg-terracotta" : "bg-mist"
              }`}
            />
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={skip}
            className="text-[12px] font-medium text-slate transition-colors hover:text-navy"
          >
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goBack}
              disabled={isFirst}
              className="btn-ichigo btn-ichigo-outline inline-flex items-center gap-1 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
            <button
              type="button"
              onClick={goNext}
              className="btn-ichigo btn-ichigo-primary inline-flex items-center gap-1"
            >
              {isLast ? (
                <>
                  Finish
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}