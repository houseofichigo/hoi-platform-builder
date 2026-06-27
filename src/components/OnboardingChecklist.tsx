import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWorkspace } from "@/hooks/useWorkspace";
import {
  useOnboardingChecklist,
  useOnboardingMutations,
  type ChecklistItem,
  type ChecklistItemId,
} from "@/hooks/useOnboardingChecklist";

export function OnboardingChecklist() {
  const { workspace } = useWorkspace();
  const { data, isLoading } = useOnboardingChecklist();
  const { markTourCompleted, markLibraryVisited, dismissChecklist } = useOnboardingMutations();
  const navigate = useNavigate();

  const [tourOpen, setTourOpen] = useState(false);

  if (isLoading || !data || !workspace) return null;
  if (!data.shouldRender) return null;

  const handleAction = (item: ChecklistItem) => {
    if (item.actionDisabled) return;
    const slug = workspace.slug;
    switch (item.id as ChecklistItemId) {
      case "workspace_profile":
        navigate({
          to: "/app/$workspaceSlug/admin/onboarding",
          params: { workspaceSlug: slug },
        });
        break;
      case "invite":
        navigate({
          to: "/app/$workspaceSlug/invite",
          params: { workspaceSlug: slug },
        });
        break;
      case "tour":
        setTourOpen(true);
        break;
      case "library":
        markLibraryVisited.mutate(undefined, {
          onError: () => {
            toast.error("We could not mark the library step complete yet.");
          },
        });
        navigate({
          to: "/app/$workspaceSlug/discover",
          params: { workspaceSlug: slug },
        });
        break;
    }
  };

  const pct = data.totalCount > 0 ? Math.round((data.completedCount / data.totalCount) * 100) : 100;
  const greetingName = data.firstName ?? "there";
  const nextRequiredItem = data.items.find((i) => !i.optional && !i.complete);
  const nextOptionalItem = data.items.find((i) => i.optional && !i.complete);

  return (
    <>
      <section className="card border-t-[3px] border-t-terracotta">
        <div className="flex items-start justify-between gap-4">
          <p className="eyebrow">GET STARTED · WORKSPACE SETUP</p>
          <button
            type="button"
            onClick={() => {
              dismissChecklist.mutate(undefined, {
                onSuccess: () => toast.success("Checklist dismissed"),
                onError: (e) => toast.error((e as Error).message),
              });
            }}
            className="text-[12px] font-medium text-slate transition-colors hover:text-terracotta"
          >
            Hide checklist
          </button>
        </div>

        <h2 className="h-display-sm mt-3 max-w-[36ch]">
          Welcome to your workspace, {greetingName}. Here's how to get{" "}
          <span className="accent-italic">started.</span>
        </h2>

        <div className="mt-5">
          <div className="flex items-end justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-slate">
                {data.completedCount} of {data.totalCount} complete
              </p>
              <p className="mt-1 text-[12px] text-graphite">
                {data.completedCount === data.totalCount
                  ? nextOptionalItem
                    ? `You're set for the core course. Optional: ${nextOptionalItem.title}`
                    : "You're all set — happy building!"
                  : `Next: ${nextRequiredItem?.title ?? "Keep going"}`}
              </p>
            </div>
            <p className="text-[28px] font-semibold leading-none text-terracotta tabular-nums">
              {pct}%
            </p>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-mist">
            <div
              className="h-full rounded-full bg-terracotta transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <ul className="mt-6 divide-y divide-chalk">
          {data.items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  item.complete
                    ? "border-terracotta bg-terracotta text-white"
                    : "border-slate/60 bg-transparent"
                }`}
                aria-hidden
              >
                {item.complete && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[15px] font-medium text-navy">{item.title}</p>
                  {item.optional && !item.complete && (
                    <span className="rounded-full bg-mist px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.16em] text-slate">
                      Optional
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-graphite">{item.description}</p>
              </div>
              <div className="shrink-0">
                {item.complete ? (
                  <span className="rounded-full bg-mist px-3 py-1 text-[11px] font-mono uppercase tracking-[0.18em] text-slate">
                    Done
                  </span>
                ) : item.actionDisabled ? (
                  <div className="flex items-center gap-2">
                    <span
                      className="cursor-not-allowed text-[13px] font-medium text-slate/60"
                      aria-disabled
                    >
                      {item.actionLabel} →
                    </span>
                    <span className="rounded-full bg-mist px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.16em] text-slate">
                      Coming soon
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleAction(item)}
                    className="text-[13px] font-medium text-terracotta transition-opacity hover:opacity-80"
                  >
                    {item.actionLabel} →
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Methodology Tour modal */}
      <Dialog open={tourOpen} onOpenChange={setTourOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Methodology tour</DialogTitle>
            <DialogDescription>
              A short orientation to the client journey from readiness through governed deployment.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 text-[13px] text-graphite sm:grid-cols-2">
            {[
              {
                title: "Assess",
                body: "Diagnose readiness, maturity, evidence confidence, and EU governance posture.",
              },
              {
                title: "Discover",
                body: "Find examples, templates, and resources relevant to your sector and maturity.",
              },
              {
                title: "Build",
                body: "Map processes, score use cases, prioritize work, and surface blockers.",
              },
              {
                title: "Deploy",
                body: "Sequence the roadmap, review governance flags, and export evidence.",
              },
            ].map((step) => (
              <div key={step.title} className="rounded-md border border-chalk bg-mist/50 p-3">
                <p className="text-[13px] font-medium text-navy">{step.title}</p>
                <p className="mt-1">{step.body}</p>
              </div>
            ))}
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => completeTourAndNavigate("/app/$workspaceSlug/assess")}
              className="btn-ichigo btn-ichigo-outline"
            >
              Start Assess
            </button>
            <button
              type="button"
              onClick={() => completeTourAndNavigate("/app/$workspaceSlug/discover")}
              className="btn-ichigo btn-ichigo-outline"
            >
              Open Discover
            </button>
            <button
              type="button"
              onClick={() => completeTourAndNavigate("/app/$workspaceSlug/build/process/new")}
              className="btn-ichigo btn-ichigo-outline"
            >
              Capture use case
            </button>
            <button
              type="button"
              onClick={() => completeTourAndNavigate("/app/$workspaceSlug/scale")}
              className="btn-ichigo btn-ichigo-outline"
            >
              View Deploy
            </button>
            <button
              type="button"
              onClick={() => setTourOpen(false)}
              className="text-[13px] font-medium text-slate hover:text-navy px-3 py-2"
            >
              Close
            </button>
            <button
              type="button"
              disabled={markTourCompleted.isPending}
              onClick={() => {
                markTourCompleted.mutate(undefined, {
                  onSuccess: () => {
                    toast.success("Marked as seen");
                    setTourOpen(false);
                  },
                  onError: (e) => toast.error((e as Error).message),
                });
              }}
              className="btn-ichigo btn-ichigo-primary"
            >
              Mark as seen
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  function completeTourAndNavigate(
    to:
      | "/app/$workspaceSlug/assess"
      | "/app/$workspaceSlug/discover"
      | "/app/$workspaceSlug/build/process/new"
      | "/app/$workspaceSlug/scale",
  ) {
    markTourCompleted.mutate(undefined, {
      onSuccess: () => {
        setTourOpen(false);
        navigate({ to, params: { workspaceSlug: workspace?.slug ?? "" } });
      },
      onError: (e) => toast.error((e as Error).message),
    });
  }
}
