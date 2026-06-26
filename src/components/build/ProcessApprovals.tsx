import { useMemo, useState } from "react";
import { CheckCircle2, RotateCcw, SearchCheck } from "lucide-react";
import { toast } from "sonner";
import { useDecideProcess } from "@/lib/db/build-analytics";
import { useProcesses } from "@/lib/db/process";
import { useWorkspace } from "@/hooks/useWorkspace";

export function ProcessApprovals() {
  const { isAdmin } = useWorkspace();
  const { data: processes = [], isLoading, error } = useProcesses();
  const decide = useDecideProcess();
  const [note, setNote] = useState("");
  const queue = useMemo(() => processes.filter((process) => ["submitted", "under_review"].includes(process.status)), [processes]);
  const decided = useMemo(() => processes.filter((process) => ["approved", "merged", "changes_requested"].includes(process.status)), [processes]);

  const act = async (processId: string, decision: "approve" | "request_changes" | "start_review") => {
    await decide.mutateAsync({ processId, decision, note });
    setNote("");
    toast.success(decision === "approve" ? "Process approved." : decision === "start_review" ? "Review started." : "Changes requested.");
  };

  if (isLoading) return <p className="text-[13px] text-slate">Loading approvals...</p>;
  if (error) return <p className="rounded-md border border-red-200 bg-red-50 p-4 text-[13px] text-red-700">{(error as Error).message}</p>;

  return (
    <div className="space-y-6">
      {!isAdmin ? (
        <div className="rounded-md border border-chalk bg-white p-5">
          <p className="eyebrow-muted">Read-only approvals</p>
          <p className="mt-2 text-[14px] text-graphite">Only workspace owners and admins can decide processes.</p>
        </div>
      ) : null}

      <section className="rounded-md border border-chalk bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow-muted">Awaiting decision</p>
            <h2 className="h-heading-md mt-2">{queue.length} process{queue.length === 1 ? "" : "es"}</h2>
          </div>
          <SearchCheck className="h-6 w-6 text-terracotta" />
        </div>
        {isAdmin ? (
          <textarea
            className="mt-5 min-h-20 w-full rounded-md border border-chalk bg-paper px-3 py-2 text-[14px]"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Decision note"
          />
        ) : null}
        <div className="mt-5 space-y-3">
          {queue.length === 0 ? (
            <p className="text-[13px] text-slate">Nothing is waiting for approval.</p>
          ) : (
            queue.map((process) => (
              <div key={process.id} className="rounded-md border border-chalk bg-paper p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[15px] font-medium text-navy">{process.name}</p>
                    <p className="mt-1 text-[12px] text-slate">{process.departmentName ?? "Unassigned"} · {process.stepCount} steps</p>
                  </div>
                  {isAdmin ? (
                    <div className="flex flex-wrap gap-2">
                      {process.status === "submitted" ? (
                        <button type="button" onClick={() => act(process.id, "start_review")} className="btn-ichigo btn-ichigo-outline">
                          Start review
                        </button>
                      ) : null}
                      <button type="button" onClick={() => act(process.id, "request_changes")} className="btn-ichigo btn-ichigo-outline">
                        <RotateCcw className="h-4 w-4" /> Request changes
                      </button>
                      <button type="button" onClick={() => act(process.id, "approve")} className="btn-ichigo">
                        <CheckCircle2 className="h-4 w-4" /> Approve
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <p className="eyebrow">Recent decisions</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {decided.slice(0, 8).map((process) => (
            <div key={process.id} className="rounded-md border border-chalk bg-white p-4">
              <p className="text-[14px] font-medium text-navy">{process.name}</p>
              <p className="mt-1 text-[12px] text-slate">{process.status.replaceAll("_", " ")}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
