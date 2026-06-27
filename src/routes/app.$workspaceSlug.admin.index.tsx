import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, BarChart3, CheckCircle2, CreditCard, GitPullRequest, ShieldAlert, UserCog, Users } from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { getWorkspaceAdminOverview } from "@/lib/workspace-admin.functions";
import { getBuildOverview } from "@/lib/db/build-analytics";
import { AdminOverview as PfsAdminOverview } from "@/components/build/pfs/admin-overview";

export const Route = createFileRoute("/app/$workspaceSlug/admin/")({
  component: WorkspaceAdminOverviewPage,
});

function WorkspaceAdminOverviewPage() {
  const { workspace } = useWorkspace();
  const getOverview = useServerFn(getWorkspaceAdminOverview);
  const { data, isLoading, error } = useQuery({
    enabled: !!workspace,
    queryKey: ["workspace-admin", "overview", workspace?.id],
    queryFn: () => getOverview({ data: { workspaceId: workspace!.id } }),
  });
  const { data: buildOverview } = useQuery({
    enabled: !!workspace,
    queryKey: ["build-overview", workspace?.id],
    queryFn: () => getBuildOverview(workspace!.id),
  });

  if (!workspace) return null;

  if (isLoading) return <p className="text-[13px] text-slate">Loading workspace admin...</p>;
  if (error) {
    return (
      <p className="rounded-md border border-red-200 bg-red-50 p-4 text-[13px] text-red-700">
        {(error as Error).message}
      </p>
    );
  }
  if (!data) return null;
  const seatDetail = data.billing.seatUsage.limit
    ? `${data.billing.seatUsage.used}/${data.billing.seatUsage.limit} licences used`
    : `${data.billing.seatUsage.used} active member(s)`;

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <AdminMetric
          label="Members"
          value={data.counts.members}
          detail={`${data.counts.pendingInvites} pending invite(s) · ${seatDetail}`}
          warning={data.billing.seatUsage.overLimit}
        />
        <AdminMetric label="Assess progress" value={`${data.counts.assessComplete}/${data.counts.assessTotal}`} detail="completed modules" />
        <AdminMetric
          label="Build portfolio"
          value={buildOverview?.total ?? data.counts.useCases}
          detail={`${buildOverview?.awaiting_decision ?? data.counts.pendingProcessApprovals} awaiting decision · ${buildOverview?.approved ?? data.counts.approvedProcesses} approved`}
        />
        <AdminMetric label="Scale attention" value={data.counts.openGovernanceFlags} detail={`${data.counts.pendingPilotReviews} pilot review(s) pending`} />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <QuickLink
          icon={GitPullRequest}
          title="Approval requests"
          body="Review submitted and in-review Build processes waiting on an admin decision."
          detail={`${buildOverview?.awaiting_decision ?? data.counts.pendingProcessApprovals} waiting`}
          to="/app/$workspaceSlug/build/approvals"
          slug={workspace.slug}
        />
        <QuickLink
          icon={UserCog}
          title="Company setup"
          body="Maintain the company profile, org chart, teams, tools, and priorities."
          detail={data.onboarding.companyProfileComplete ? "Profile started" : "Needs setup"}
          to="/app/$workspaceSlug/admin/onboarding"
          slug={workspace.slug}
        />
        <QuickLink
          icon={Users}
          title="Members"
          body="Invite members and viewers, monitor pending invites, and align people to the org chart."
          detail={`${data.counts.members} active`}
          to="/app/$workspaceSlug/admin/members"
          slug={workspace.slug}
        />
        <QuickLink
          icon={BarChart3}
          title="Governance attention"
          body="Track open governance flags, active roadmap work, and pilot reviews needing evidence."
          detail={`${data.counts.openGovernanceFlags} open flags`}
          to="/app/$workspaceSlug/scale/governance"
          slug={workspace.slug}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <AttentionRow
          icon={ShieldAlert}
          label="Open governance flags"
          value={data.counts.openGovernanceFlags}
          to="/app/$workspaceSlug/scale/governance"
          slug={workspace.slug}
        />
        <AttentionRow
          icon={CheckCircle2}
          label="Pending pilot reviews"
          value={data.counts.pendingPilotReviews}
          to="/app/$workspaceSlug/scale/reviews"
          slug={workspace.slug}
        />
        <QuickLink
          icon={CreditCard}
          title="Billing and invoices"
          body="Review plan, seat usage, subscription status, and invoice or billing events."
          detail={data.billing.status}
          to="/app/$workspaceSlug/admin/billing"
          slug={workspace.slug}
        />
      </section>

      <section className="rounded-md border border-chalk bg-white p-5">
        <p className="eyebrow-muted">Company setup status</p>
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          <SetupSignal label="Company profile" complete={data.onboarding.companyProfileComplete} />
          <SetupSignal label="Process context" complete={data.onboarding.processContextComplete} />
          <SetupSignal label="Training example" complete={data.onboarding.trainingExampleSelected} />
        </div>
      </section>

      <section className="rounded-md border border-chalk bg-white p-5">
        <p className="eyebrow-muted">Process platform analytics</p>
        <div className="mt-4">
          <PfsAdminOverview />
        </div>
      </section>
    </div>
  );
}

function AdminMetric({ label, value, detail, warning = false }: { label: string; value: string | number; detail: string; warning?: boolean }) {
  return (
    <div className={["rounded-md border bg-white p-4", warning ? "border-amber-300" : "border-chalk"].join(" ")}>
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate">{label}</p>
      <p className="mt-2 text-[28px] font-semibold leading-none text-navy">{value}</p>
      <p className="mt-2 text-[12px] text-graphite">{detail}</p>
      {warning && <p className="mt-2 text-[12px] text-amber-700">Seat usage is above the current licence limit.</p>}
    </div>
  );
}

function QuickLink({
  icon: Icon,
  title,
  body,
  detail,
  to,
  slug,
}: {
  icon: typeof Users;
  title: string;
  body: string;
  detail?: string | number;
  to:
    | "/app/$workspaceSlug/admin/members"
    | "/app/$workspaceSlug/admin/onboarding"
    | "/app/$workspaceSlug/admin/billing"
    | "/app/$workspaceSlug/build/approvals"
    | "/app/$workspaceSlug/scale/governance";
  slug: string;
}) {
  return (
    <Link to={to} params={{ workspaceSlug: slug }} className="rounded-md border border-chalk bg-white p-5 hover:border-terracotta">
      <Icon className="h-5 w-5 text-terracotta" />
      <p className="mt-4 text-[15px] font-semibold text-navy">{title}</p>
      <p className="mt-2 text-[13px] text-graphite">{body}</p>
      {detail !== undefined && <p className="mt-3 text-[12px] font-medium text-slate">{detail}</p>}
      <span className="mt-4 inline-flex items-center gap-1 text-[12px] text-terracotta">
        Open <ArrowRight className="h-3 w-3" />
      </span>
    </Link>
  );
}

function AttentionRow({
  icon: Icon,
  label,
  value,
  to,
  slug,
}: {
  icon: typeof ShieldAlert;
  label: string;
  value: number;
  to: "/app/$workspaceSlug/scale/reviews" | "/app/$workspaceSlug/scale/governance";
  slug: string;
}) {
  return (
    <Link to={to} params={{ workspaceSlug: slug }} className="rounded-md border border-chalk bg-white p-5 hover:border-terracotta">
      <Icon className="h-5 w-5 text-terracotta" />
      <p className="mt-4 text-[15px] font-semibold text-navy">{label}</p>
      <p className="mt-2 text-[30px] font-semibold leading-none text-navy">{value}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-[12px] text-terracotta">
        Open <ArrowRight className="h-3 w-3" />
      </span>
    </Link>
  );
}

function SetupSignal({ label, complete }: { label: string; complete: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-mist px-3 py-2">
      <span className="text-[13px] text-navy">{label}</span>
      <span className={complete ? "text-[12px] text-emerald-700" : "text-[12px] text-amber-700"}>
        {complete ? "Complete" : "Missing"}
      </span>
    </div>
  );
}
