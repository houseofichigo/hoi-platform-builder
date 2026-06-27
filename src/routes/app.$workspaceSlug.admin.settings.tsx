import { createFileRoute, Link } from "@tanstack/react-router";
import { ReviewPolicy } from "@/components/build/pfs/process-platform";
import { useWorkspace } from "@/hooks/useWorkspace";

export const Route = createFileRoute("/app/$workspaceSlug/admin/settings")({
  component: WorkspaceAdminSettingsPage,
});

function WorkspaceAdminSettingsPage() {
  const { workspace } = useWorkspace();
  if (!workspace) return null;

  return (
    <div className="space-y-6">
      <section className="rounded-md border border-chalk bg-white p-5">
        <p className="eyebrow-muted">Workspace</p>
        <div className="mt-3 flex items-start justify-between gap-4">
          <div>
            <p className="text-[16px] font-semibold text-navy">{workspace.name}</p>
            <p className="mt-1 font-mono text-[12px] tracking-[0.1em] text-slate">{workspace.slug}</p>
          </div>
          <span className="rounded-full border border-chalk bg-mist px-3 py-1 text-[12px] text-slate">
            Contact House of Ichigo to rename
          </span>
        </div>
        <p className="mt-4 text-[13px] text-graphite">
          Company profile, org chart, tool stack, clients, audiences, knowledge sources, strategic
          priorities, and launch readiness are managed in the{" "}
          <Link
            to="/app/$workspaceSlug/admin/onboarding"
            params={{ workspaceSlug: workspace.slug }}
            className="text-terracotta underline-offset-2 hover:underline"
          >
            Company Setup wizard
          </Link>
          .
        </p>
      </section>

      <section className="rounded-md border border-chalk bg-white p-5">
        <p className="eyebrow-muted">Personal preferences</p>
        <p className="mt-3 text-[13px] text-graphite">
          Default workspace, notification preferences, and your personal profile live in personal{" "}
          <Link
            to="/app/$workspaceSlug/settings"
            params={{ workspaceSlug: workspace.slug }}
            className="text-terracotta underline-offset-2 hover:underline"
          >
            workspace settings
          </Link>
          .
        </p>
      </section>

      <section className="rounded-md border border-chalk bg-white p-5">
        <p className="eyebrow-muted">Build review policy</p>
        <div className="mt-4">
          <ReviewPolicy />
        </div>
      </section>

      <section className="rounded-md border border-amber-200 bg-amber-50/40 p-5">
        <p className="eyebrow-muted text-amber-900">Danger zone</p>
        <p className="mt-3 text-[13px] text-amber-900/80">
          Archiving a workspace removes admin access and pauses billing. This action is reserved
          for workspace owners and is performed by House of Ichigo on request.
        </p>
        <button
          type="button"
          disabled
          className="btn-ichigo btn-ichigo-outline mt-4 cursor-not-allowed text-[13px] opacity-60"
        >
          Request archive
        </button>
      </section>
    </div>
  );
}
