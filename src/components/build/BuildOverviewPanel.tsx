import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Clock3, GitBranch, Workflow } from "lucide-react";
import { useBuildOverview } from "@/lib/db/build-analytics";
import { useWorkspace } from "@/hooks/useWorkspace";

export function BuildOverviewPanel() {
  const { workspace, role, isAdmin } = useWorkspace();
  const { data, isLoading, error } = useBuildOverview();
  if (!workspace) return null;

  const canMap = role !== "viewer";

  if (isLoading) return <p className="text-[13px] text-slate">Loading Build overview...</p>;
  if (error) return <p className="rounded-md border border-red-200 bg-red-50 p-4 text-[13px] text-red-700">{(error as Error).message}</p>;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        <Metric title="Processes mapped" value={data?.total ?? 0} icon={Workflow} />
        <Metric title="Awaiting decision" value={data?.awaiting_decision ?? 0} icon={Clock3} />
        <Metric title="Approved" value={data?.approved ?? 0} icon={CheckCircle2} />
        <Metric title="Departments" value={data?.departments ?? 0} icon={GitBranch} />
      </section>

      <section className="rounded-md border border-chalk bg-white p-6">
        <p className="eyebrow-muted">Build next step</p>
        <h2 className="h-heading-md mt-3">
          {canMap ? "Map operational work into process intelligence." : "Review mapped processes."}
        </h2>
        <p className="mt-2 max-w-[64ch] text-[14px] leading-6 text-graphite">
          Build now uses workspace-scoped Process Flow Studio data: departments, people, process maps, and approval decisions all share the same tenancy model.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {canMap ? (
            <Link to="/app/$workspaceSlug/build/map" params={{ workspaceSlug: workspace.slug }} className="btn-ichigo">
              Map a process <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
          {isAdmin ? (
            <Link to="/app/$workspaceSlug/admin/onboarding" params={{ workspaceSlug: workspace.slug }} className="btn-ichigo btn-ichigo-outline">
              Finish setup
            </Link>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function Metric({ title, value, icon: Icon }: { title: string; value: number; icon: typeof Workflow }) {
  return (
    <div className="rounded-md border border-chalk bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="eyebrow-muted">{title}</p>
        <Icon className="h-4 w-4 text-terracotta" />
      </div>
      <p className="mt-4 text-[34px] font-semibold leading-none text-navy">{value}</p>
    </div>
  );
}
