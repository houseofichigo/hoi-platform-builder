import { Archive, CheckCircle2, Clock3, FileText } from "lucide-react";
import { toast } from "sonner";
import { useArchiveProcess, useProcesses } from "@/lib/db/process";
import { useWorkspace } from "@/hooks/useWorkspace";

const statusLabel: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under review",
  changes_requested: "Changes requested",
  approved: "Approved",
  merged: "Merged",
  archived: "Archived",
};

export function ProcessLibrary() {
  const { role } = useWorkspace();
  const { data: processes = [], isLoading, error } = useProcesses();
  const archiveProcess = useArchiveProcess();
  const canWrite = role !== "viewer";

  const archive = async (id: string) => {
    await archiveProcess.mutateAsync(id);
    toast.success("Process archived.");
  };

  if (isLoading) return <p className="text-[13px] text-slate">Loading process library...</p>;
  if (error) return <p className="rounded-md border border-red-200 bg-red-50 p-4 text-[13px] text-red-700">{(error as Error).message}</p>;

  return (
    <div className="space-y-4">
      {processes.length === 0 ? (
        <div className="rounded-md border border-chalk bg-white p-8 text-center">
          <FileText className="mx-auto h-8 w-8 text-terracotta" />
          <h2 className="h-heading-md mt-4">No processes mapped yet.</h2>
          <p className="mt-2 text-[14px] text-graphite">Mapped processes will appear here with their approval state and department.</p>
        </div>
      ) : (
        processes.map((process) => (
          <article key={process.id} className="rounded-md border border-chalk bg-white p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="eyebrow-muted">{process.departmentName ?? "Unassigned department"}</p>
                <h2 className="mt-2 text-[20px] font-semibold text-navy">{process.name}</h2>
                {process.description ? <p className="mt-2 max-w-[72ch] text-[14px] leading-6 text-graphite">{process.description}</p> : null}
                <div className="mt-4 flex flex-wrap gap-2 text-[12px] text-slate">
                  <span className="rounded-full bg-mist px-2.5 py-1">{process.stepCount} steps</span>
                  <span className="rounded-full bg-mist px-2.5 py-1">Updated {new Date(process.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <StatusPill status={process.status} />
                {canWrite ? (
                  <button type="button" onClick={() => archive(process.id)} className="rounded-md border border-chalk p-2 text-slate hover:text-terracotta" aria-label="Archive process">
                    <Archive className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>
          </article>
        ))
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const Icon = status === "approved" || status === "merged" ? CheckCircle2 : Clock3;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-paper px-3 py-1 text-[12px] text-navy">
      <Icon className="h-3.5 w-3.5 text-terracotta" />
      {statusLabel[status] ?? status}
    </span>
  );
}
