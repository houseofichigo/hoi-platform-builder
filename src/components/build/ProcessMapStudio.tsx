import { useMemo, useState } from "react";
import { Plus, Save, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { OrgChartCanvas } from "@/components/build/OrgChartCanvas";
import { useOrgChart } from "@/lib/db/org-chart";
import { useProcesses, useSaveProcess, useSubmitProcess, type ProcessStepInput } from "@/lib/db/process";
import { useWorkspace } from "@/hooks/useWorkspace";

type StepDraft = ProcessStepInput & { localId: string };

const emptyStep = (index: number): StepDraft => ({
  localId: crypto.randomUUID(),
  stepOrder: index + 1,
  title: "",
  description: "",
  actorType: "",
  toolName: "",
  inputData: "",
  outputData: "",
  riskNotes: "",
});

export function ProcessMapStudio() {
  const { role } = useWorkspace();
  const { data: chart, isLoading: chartLoading } = useOrgChart();
  const { data: processes = [] } = useProcesses();
  const saveProcess = useSaveProcess();
  const submitProcess = useSubmitProcess();
  const canMap = role !== "viewer";
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [steps, setSteps] = useState<StepDraft[]>([emptyStep(0), emptyStep(1)]);

  const draftProcesses = useMemo(() => processes.filter((process) => process.status === "draft" || process.status === "changes_requested"), [processes]);

  const updateStep = (localId: string, patch: Partial<StepDraft>) => {
    setSteps((current) => current.map((step) => (step.localId === localId ? { ...step, ...patch } : step)));
  };

  const addStep = () => setSteps((current) => [...current, emptyStep(current.length)]);
  const removeStep = (localId: string) => {
    setSteps((current) => current.filter((step) => step.localId !== localId).map((step, index) => ({ ...step, stepOrder: index + 1 })));
  };

  const save = async (status: "draft" | "submitted") => {
    if (!name.trim()) {
      toast.error("Name the process before saving.");
      return;
    }
    const cleanSteps = steps
      .filter((step) => step.title.trim())
      .map((step, index) => ({ ...step, stepOrder: index + 1 }));
    const process = await saveProcess.mutateAsync({
      name,
      description,
      departmentId: departmentId || null,
      status,
      steps: cleanSteps,
    });
    if (status === "submitted") await submitProcess.mutateAsync(process.id);
    toast.success(status === "submitted" ? "Process submitted for approval." : "Process saved.");
    setName("");
    setDescription("");
    setDepartmentId("");
    setSteps([emptyStep(0), emptyStep(1)]);
  };

  if (!canMap) {
    return (
      <div className="rounded-md border border-chalk bg-white p-6">
        <p className="eyebrow-muted">Build · Map</p>
        <h2 className="h-heading-md mt-3">Viewer access is read-only.</h2>
        <p className="mt-2 text-[14px] text-graphite">You can review the process library, but mapping requires member access or above.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-md border border-chalk bg-white p-5">
          <p className="eyebrow-muted">Process map</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-[13px] font-medium text-navy">Process name</span>
              <input className="mt-1 w-full rounded-md border border-chalk bg-white px-3 py-2 text-[14px]" value={name} onChange={(event) => setName(event.target.value)} placeholder="Customer refund approval" />
            </label>
            <label className="block">
              <span className="text-[13px] font-medium text-navy">Department</span>
              <select className="mt-1 w-full rounded-md border border-chalk bg-white px-3 py-2 text-[14px]" value={departmentId} onChange={(event) => setDepartmentId(event.target.value)}>
                <option value="">Unassigned</option>
                {chart?.departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="mt-4 block">
            <span className="text-[13px] font-medium text-navy">Description</span>
            <textarea className="mt-1 min-h-24 w-full rounded-md border border-chalk bg-white px-3 py-2 text-[14px]" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What work happens, who depends on it, and why it matters." />
          </label>

          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <p className="eyebrow-muted">Steps</p>
              <button type="button" onClick={addStep} className="btn-ichigo btn-ichigo-outline">
                <Plus className="h-4 w-4" /> Add step
              </button>
            </div>
            {steps.map((step, index) => (
              <div key={step.localId} className="rounded-md border border-chalk bg-paper p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy text-[12px] text-white">{index + 1}</span>
                  <div className="grid flex-1 gap-3 md:grid-cols-2">
                    <input className="rounded-md border border-chalk bg-white px-3 py-2 text-[14px]" value={step.title} onChange={(event) => updateStep(step.localId, { title: event.target.value })} placeholder="Step title" />
                    <input className="rounded-md border border-chalk bg-white px-3 py-2 text-[14px]" value={step.toolName ?? ""} onChange={(event) => updateStep(step.localId, { toolName: event.target.value })} placeholder="Tool or system" />
                    <input className="rounded-md border border-chalk bg-white px-3 py-2 text-[14px]" value={step.actorType ?? ""} onChange={(event) => updateStep(step.localId, { actorType: event.target.value })} placeholder="Actor" />
                    <input className="rounded-md border border-chalk bg-white px-3 py-2 text-[14px]" value={step.outputData ?? ""} onChange={(event) => updateStep(step.localId, { outputData: event.target.value })} placeholder="Output" />
                    <textarea className="min-h-20 rounded-md border border-chalk bg-white px-3 py-2 text-[14px] md:col-span-2" value={step.description ?? ""} onChange={(event) => updateStep(step.localId, { description: event.target.value })} placeholder="What happens in this step?" />
                  </div>
                  <button type="button" onClick={() => removeStep(step.localId)} className="rounded-md p-2 text-slate hover:bg-white hover:text-terracotta" aria-label="Remove step">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={() => save("draft")} className="btn-ichigo btn-ichigo-outline" disabled={saveProcess.isPending}>
              <Save className="h-4 w-4" /> Save draft
            </button>
            <button type="button" onClick={() => save("submitted")} className="btn-ichigo" disabled={saveProcess.isPending || submitProcess.isPending}>
              <Send className="h-4 w-4" /> Submit for approval
            </button>
          </div>
        </div>

        <aside className="rounded-md border border-chalk bg-white p-5">
          <p className="eyebrow-muted">Draft queue</p>
          <div className="mt-4 space-y-3">
            {draftProcesses.length === 0 ? (
              <p className="text-[13px] text-slate">No drafts yet.</p>
            ) : (
              draftProcesses.slice(0, 8).map((process) => (
                <div key={process.id} className="rounded-md bg-paper p-3">
                  <p className="text-[14px] font-medium text-navy">{process.name}</p>
                  <p className="mt-1 text-[12px] text-slate">{process.stepCount} steps · {process.departmentName ?? "Unassigned"}</p>
                </div>
              ))
            )}
          </div>
        </aside>
      </section>

      <section>
        <p className="eyebrow">Org chart</p>
        <div className="mt-4">
          {chartLoading ? <p className="text-[13px] text-slate">Loading org chart...</p> : chart ? <OrgChartCanvas data={chart} /> : null}
        </div>
      </section>
    </div>
  );
}
