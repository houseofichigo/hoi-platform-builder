// @ts-nocheck — Ported PFS module.
import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

// AppShell removed (outer build layout provides chrome)
import { RiskTierBadge } from "@/components/build/pfs/risk-tier-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useApproveProcess, useProcess, useValidateProcessData } from "@/lib/db/pfs/processes";
import { asRecord } from "@/lib/db/pfs/shared";
import { riskTierMeta } from "@/lib/risk-tier";

export const Route = createFileRoute("/app/$workspaceSlug/build/process/$id")({
  component: ProcessDetailRoute,
});

function ProcessDetailRoute() {
  const { id } = Route.useParams();
  const processQuery = useProcess(id);
  const data = processQuery.data;
  const validateData = useValidateProcessData(id);
  const approve = useApproveProcess(id);

  return (
    <>
      {processQuery.isLoading ? (
        <Card className="rounded-[var(--r-md)] border-[var(--chalk)] bg-white p-8 text-center">
          <p className="font-display text-[30px] text-[var(--ichigo-navy)]">Loading process</p>
          <p className="mt-2 font-sans text-[15px] text-[var(--slate)]">Fetching the live process record.</p>
        </Card>
      ) : processQuery.isError || !data ? (
        <Card className="rounded-[var(--r-md)] border-[var(--chalk)] bg-white p-8 text-center">
          <p className="font-display text-[30px] text-[var(--ichigo-navy)]">Process did not load</p>
          <p className="mt-2 font-sans text-[15px] text-[var(--slate)]">{processQuery.error?.message ?? "Process unavailable."}</p>
        </Card>
      ) : (
        <div className="space-y-5">
          <Card className="rounded-[var(--r-md)] border-[var(--chalk)] bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              {(() => {
                const tier = riskTierMeta(data.record.riskTier, data.record.riskReason);
                return (
                  <>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ichigo-orange)]">
                  Process detail
                </p>
                <h3 className="mt-2 font-display text-[38px] font-medium tracking-normal text-[var(--ichigo-navy)]">
                  {data.record.name}
                </h3>
                <p className="mt-2 font-sans text-[15px] text-[var(--slate)]">
                  {data.record.department} · {data.steps.length} steps
                </p>
                <p className="mt-2 font-sans text-[14px] text-[var(--graphite)]">{tier.reason}</p>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--slate)]">
                  Overlay: {tier.overlay} · Approvals: {tier.requiredApprovals.length ? tier.requiredApprovals.join(" + ").replaceAll("_", " ") : "existing low-risk rules"} · {tier.auditCadence}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <RiskTierBadge process={data.record} />
                <Badge className="rounded-full bg-[var(--ichigo-mist)] px-3 py-1 text-[var(--ichigo-navy)]">
                  {data.record.status}
                </Badge>
                {!["Approved"].includes(data.record.status) ? (
                  <Button
                    disabled={approve.isPending}
                    onClick={() => approve.mutate()}
                    className="rounded-[var(--r-md)] bg-[var(--ichigo-navy)] text-white hover:bg-[var(--ichigo-navy)]/90"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    {approve.isPending ? "Approving..." : "Approve & prioritize"}
                  </Button>
                ) : null}
              </div>
                  </>
                );
              })()}
            </div>
            {approve.error ? (
              <p className="mt-4 rounded-[var(--r-md)] bg-[var(--danger)]/10 p-3 font-sans text-[13px] text-[var(--danger)]">
                {approve.error.message}
              </p>
            ) : null}
          </Card>

          <Card className="rounded-[var(--r-md)] border-[var(--chalk)] bg-white p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--slate)]">
              Process steps
            </p>
            <div className="mt-5 space-y-3">
              {data.steps.map((step) => (
                <div key={step.id} className="rounded-[var(--r-md)] border border-[var(--chalk)] bg-[var(--paper)] p-4">
                  <p className="font-sans text-[15px] font-semibold text-[var(--ichigo-navy)]">{step.label}</p>
                  <p className="font-sans text-[13px] text-[var(--slate)]">
                    {step.kind ?? "step"} · L{step.automation_level ?? 0}
                  </p>
                </div>
              ))}
              {data.steps.length === 0 ? (
                <p className="font-sans text-[14px] text-[var(--slate)]">
                  No process_step rows yet.
                </p>
              ) : null}
            </div>
          </Card>
          {data.steps.length > 0 ? (
            <DataValidationPanel
              dataValidated={Boolean((data.row as any).data_validated)}
              steps={data.steps}
              pending={validateData.isPending}
              error={validateData.error?.message}
              onConfirm={(steps) => validateData.mutate(steps)}
            />
          ) : null}
        </div>
      )}
    </>
  );
}

type ValidationStep = {
  id: string;
  label: string;
  dataSourceId: string | null;
  dataProfile: Record<string, unknown>;
  dataQuality: string;
  isDataCritical: boolean;
};

function DataValidationPanel({
  dataValidated,
  steps,
  pending,
  error,
  onConfirm,
}: {
  dataValidated: boolean;
  steps: Array<any>;
  pending: boolean;
  error?: string;
  onConfirm: (steps: ValidationStep[]) => void;
}) {
  const initialSteps = useMemo(
    () =>
      steps.map((step) => ({
        id: step.id,
        label: step.label,
        dataSourceId: step.data_source_id ?? null,
        dataProfile: {
          structure: "unstructured",
          accessibility: "manual",
          sensitivity: "internal",
          ownership: "Step owner",
          source: "inherited",
          ...asRecord(step.data_profile),
        },
        dataQuality: step.data_quality ?? "not_assessed",
        isDataCritical: Boolean(step.is_data_critical),
      })),
    [steps],
  );
  const [draftSteps, setDraftSteps] = useState<ValidationStep[]>(initialSteps);

  useEffect(() => {
    setDraftSteps(initialSteps);
  }, [initialSteps]);

  const derivedClassification = useMemo(() => {
    const rank: Record<string, number> = { public: 1, internal: 2, personal: 3, sensitive: 4 };
    return draftSteps
      .map((step) => String(step.dataProfile.sensitivity ?? "internal"))
      .reduce((current, value) => (rank[value] > rank[current] ? value : current), "internal");
  }, [draftSteps]);

  const updateProfile = (id: string, patch: Record<string, unknown>) => {
    setDraftSteps((current) =>
      current.map((step) =>
        step.id === id
          ? { ...step, dataProfile: { ...step.dataProfile, ...patch, source: "overridden" } }
          : step,
      ),
    );
  };

  return (
    <Card className="rounded-[var(--r-md)] border-[var(--chalk)] bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ichigo-orange)]">
            Data validation
          </p>
          <h3 className="mt-1 font-sans text-[22px] font-semibold text-[var(--ichigo-navy)]">
            Confirm sensitivity and ownership
          </h3>
          <p className="mt-2 font-sans text-[14px] text-[var(--slate)]">
            Derived classification: {derivedClassification.replaceAll("_", " ")}
          </p>
        </div>
        <Badge
          className={`rounded-full px-3 py-1 ${
            dataValidated ? "bg-[var(--success)] text-white" : "bg-[var(--ichigo-mist)] text-[var(--ichigo-navy)]"
          }`}
        >
          data_validated = {String(dataValidated)}
        </Badge>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {draftSteps.map((step) => (
          <div key={step.id} className="rounded-[var(--r-md)] border border-[var(--chalk)] bg-[var(--paper)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-sans text-[15px] font-semibold text-[var(--ichigo-navy)]">{step.label}</p>
                <p className="font-sans text-[13px] text-[var(--slate)]">
                  {step.isDataCritical ? "Data-critical" : "Not data-critical"} · {String(step.dataProfile.source)}
                </p>
              </div>
              <Badge className="rounded-full bg-white px-3 py-1 text-[var(--ichigo-navy)]">
                {step.dataQuality.replaceAll("_", " ")}
              </Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <CycleButton
                label="Sensitivity"
                value={String(step.dataProfile.sensitivity ?? "internal")}
                options={["public", "internal", "personal", "sensitive"]}
                onChange={(value) => updateProfile(step.id, { sensitivity: value })}
              />
              <CycleButton
                label="Owner"
                value={String(step.dataProfile.ownership ?? "Step owner")}
                options={["Step owner", "Operations", "Finance", "Data", "Legal", "System owner"]}
                onChange={(value) => updateProfile(step.id, { ownership: value })}
              />
            </div>
          </div>
        ))}
      </div>

      {error ? <p className="mt-4 rounded-[var(--r-md)] bg-[var(--danger)]/10 p-3 text-[var(--danger)]">{error}</p> : null}
      <Button
        disabled={pending}
        onClick={() => onConfirm(draftSteps)}
        className="mt-5 rounded-[var(--r-md)] bg-[var(--ichigo-orange)] text-white hover:bg-[var(--ichigo-orange)]/90"
      >
        <Check className="mr-2 h-4 w-4" />
        {pending ? "Saving..." : "Confirm data validation"}
      </Button>
    </Card>
  );
}

function CycleButton({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(options[(options.indexOf(value) + 1) % options.length])}
      className="rounded-full border border-[var(--chalk)] bg-white px-3 py-2 text-left font-sans text-[12px] text-[var(--ichigo-navy)]"
    >
      <span className="text-[var(--slate)]">{label}: </span>
      {value.replaceAll("_", " ")}
    </button>
  );
}
