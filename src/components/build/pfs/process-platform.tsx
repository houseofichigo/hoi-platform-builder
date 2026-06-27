import { Link } from "@tanstack/react-router";
import { CheckCircle2, Clock3, GitPullRequest, Library, Plus, ShieldCheck, Workflow } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useBuildOverview, useDecideProcess } from "@/lib/db/build-analytics";
import { useProcesses, type ProcessListItem } from "@/lib/db/process";
import { RiskTierBadge } from "@/components/build/pfs/risk-tier-badge";

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

function processRisk(process: ProcessListItem) {
  const capture = (process as any).capture ?? {};
  const risk = capture && typeof capture === "object" ? (capture as Record<string, any>).riskTier : null;
  return (process as any).riskTier ?? risk?.tier ?? "standard";
}

export function DashboardScreen() {
  const { workspace } = useWorkspace();
  const overview = useBuildOverview();
  const processes = useProcesses();
  if (!workspace) return null;

  const recent = (processes.data ?? []).slice(0, 5);
  return (
    <div className="space-y-5">
      <section className="grid gap-3 md:grid-cols-4">
        <Metric icon={Workflow} label="Mapped" value={overview.data?.total ?? 0} />
        <Metric icon={Clock3} label="Awaiting decision" value={overview.data?.awaiting_decision ?? 0} />
        <Metric icon={CheckCircle2} label="Approved" value={overview.data?.approved ?? 0} />
        <Metric icon={Library} label="Departments" value={overview.data?.departments ?? 0} />
      </section>

      <Card className="border-chalk bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow-muted">Build overview</p>
            <h2 className="mt-2 text-[24px] font-semibold text-navy">Processes ready for review</h2>
          </div>
          <Button asChild className="bg-terracotta text-white hover:bg-terracotta/90">
            <Link to="/app/$workspaceSlug/build/process/new" params={{ workspaceSlug: workspace.slug }}>
              <Plus className="h-4 w-4" />
              Map process
            </Link>
          </Button>
        </div>
        <div className="mt-5 divide-y divide-chalk">
          {recent.map((process) => (
            <ProcessRow key={process.id} process={process} workspaceSlug={workspace.slug} />
          ))}
          {!recent.length ? <p className="py-6 text-center text-[13px] text-slate">No mapped processes yet.</p> : null}
        </div>
      </Card>
    </div>
  );
}

export function ProcessLibrary() {
  const { workspace } = useWorkspace();
  const processes = useProcesses();
  if (!workspace) return null;

  const grouped = useMemo(() => {
    const rows = processes.data ?? [];
    return {
      draft: rows.filter((row) => ["draft", "changes_requested"].includes(row.status)),
      review: rows.filter((row) => ["submitted", "under_review"].includes(row.status)),
      approved: rows.filter((row) => ["approved", "merged"].includes(row.status)),
    };
  }, [processes.data]);

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <LibraryColumn title="Drafts" rows={grouped.draft} workspaceSlug={workspace.slug} />
      <LibraryColumn title="In review" rows={grouped.review} workspaceSlug={workspace.slug} />
      <LibraryColumn title="Approved" rows={grouped.approved} workspaceSlug={workspace.slug} />
    </div>
  );
}

export function PendingTasks() {
  const { workspace, isAdmin } = useWorkspace();
  const processes = useProcesses();
  const decide = useDecideProcess();
  const [notes, setNotes] = useState<Record<string, string>>({});
  if (!workspace) return null;

  const queue = (processes.data ?? []).filter((process) => ["submitted", "under_review"].includes(process.status));
  return (
    <div className="space-y-4">
      {queue.map((process) => (
        <Card key={process.id} className="border-chalk bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="eyebrow-muted">{process.departmentName ?? "Unassigned"}</p>
              <h3 className="mt-1 text-[20px] font-semibold text-navy">{process.name}</h3>
              <p className="mt-1 text-[13px] text-graphite">{process.stepCount} mapped steps</p>
            </div>
            <RiskTierBadge tier={processRisk(process)} />
          </div>
          {isAdmin ? (
            <div className="mt-4 space-y-3">
              <Textarea
                value={notes[process.id] ?? ""}
                onChange={(event) => setNotes((current) => ({ ...current, [process.id]: event.target.value }))}
                placeholder="Decision note"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={decide.isPending}
                  onClick={() => decide.mutate({ processId: process.id, decision: "approve", note: notes[process.id] })}
                  className="bg-terracotta text-white hover:bg-terracotta/90"
                >
                  Approve
                </Button>
                <Button
                  disabled={decide.isPending}
                  variant="outline"
                  onClick={() => decide.mutate({ processId: process.id, decision: "request_changes", note: notes[process.id] })}
                >
                  Request changes
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-4 rounded-md bg-mist p-3 text-[13px] text-slate">Admins and owners make approval decisions.</p>
          )}
        </Card>
      ))}
      {!queue.length ? <Card className="border-chalk bg-white p-8 text-center text-[13px] text-slate">No processes are awaiting approval.</Card> : null}
    </div>
  );
}

export function ReviewPolicy() {
  return (
    <Card className="border-chalk bg-white p-6">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-1 h-5 w-5 text-terracotta" />
        <div>
          <p className="eyebrow-muted">Review policy</p>
          <h2 className="mt-2 text-[24px] font-semibold text-navy">Workspace admins approve submitted process maps</h2>
          <p className="mt-2 max-w-2xl text-[13px] leading-6 text-graphite">
            Members can map and submit processes. Owners and admins can approve, request changes, or start review. Approved processes bridge into Scale.
          </p>
        </div>
      </div>
    </Card>
  );
}

function Metric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number }) {
  return (
    <Card className="border-chalk bg-white p-4">
      <Icon className="h-4 w-4 text-terracotta" />
      <p className="mt-3 text-[28px] font-semibold leading-none text-navy">{value}</p>
      <p className="mt-1 text-[12px] text-slate">{label}</p>
    </Card>
  );
}

function ProcessRow({ process, workspaceSlug }: { process: ProcessListItem; workspaceSlug: string }) {
  return (
    <Link
      to="/app/$workspaceSlug/build/process/$id"
      params={{ workspaceSlug, id: process.id }}
      className="flex flex-wrap items-center justify-between gap-3 py-3 hover:bg-mist/50"
    >
      <div>
        <p className="text-[14px] font-medium text-navy">{process.name}</p>
        <p className="mt-1 text-[12px] text-slate">
          {process.departmentName ?? "Unassigned"} · {process.stepCount} steps
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-paper px-2 py-1 text-[11px] capitalize text-slate">{statusLabel(process.status)}</span>
        <RiskTierBadge tier={processRisk(process)} />
      </div>
    </Link>
  );
}

function LibraryColumn({ title, rows, workspaceSlug }: { title: string; rows: ProcessListItem[]; workspaceSlug: string }) {
  return (
    <Card className="border-chalk bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-navy">{title}</h3>
        <span className="rounded-full bg-paper px-2 py-1 text-[11px] text-slate">{rows.length}</span>
      </div>
      <div className="space-y-2">
        {rows.map((row) => (
          <ProcessRow key={row.id} process={row} workspaceSlug={workspaceSlug} />
        ))}
        {!rows.length ? <p className="py-4 text-center text-[12px] text-slate">None</p> : null}
      </div>
    </Card>
  );
}
