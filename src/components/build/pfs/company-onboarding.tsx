// @ts-nocheck — Ported PFS module.
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { BadgeCheck, Building2, Check, ChevronDown, ChevronRight, Loader2, Mail, Pencil, Plus, ShieldAlert, Trash2, UserPlus, Users, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToolCatalogPicker } from "@/components/build/pfs/tool-catalog-picker";
import { OrgChartCanvas } from "@/components/build/pfs/org-chart-canvas";
import { useOrgChart } from "@/lib/db/org-chart";
import { computeReadiness } from "@/lib/org-chart/readiness";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  advanceOnboardingPhase,
  archiveDepartment,
  archiveInvitation,
  saveCampaign,
  saveCompanyProfile,
  saveDataSource,
  saveDepartment,
  saveInvitation,
  saveProduct,
  saveReadiness,
  saveRegulatoryPosture,
  sendPendingInvitations,
  saveStrategicPriority,
  saveTool,
  useOnboardingContext,
  useOnboardingMutation,
  type OnboardingPhase,
  type OnboardingStepId,
} from "@/lib/db/pfs/onboarding";
import { saveAudience, type AudienceInput } from "@/lib/db/pfs/audiences";
import { saveClient, type ClientInput } from "@/lib/db/pfs/clients";
import { loadMaisonAtlasDemo } from "@/lib/db/pfs/demo-loader";
import { saveKnowledgeSource } from "@/lib/db/pfs/knowledge-sources";
import type { ToolCatalogRow } from "@/lib/db/pfs/tool-catalog";

type Mode = "wizard" | "settings";

type PhaseStep = { id: OnboardingStepId; phase: OnboardingPhase; label: string; detail: string; why: string };
type AudienceFormState = { name: string; description: string; scope: NonNullable<AudienceInput["scope"]> };
type ClientFormState = {
  name: string;
  kind: NonNullable<ClientInput["kind"]>;
  sector: string;
  engagementType: string;
  underNda: boolean;
  reusableIp: boolean;
  dataResidency: string;
  internalAudience: string[];
  notes: string;
};

const phases: Array<{ id: OnboardingPhase; label: string; detail: string }> = [
  { id: "foundation", label: "Company basics", detail: "Identity and operating context" },
  { id: "knowledge", label: "Mapping setup", detail: "Teams, tools, and priorities" },
  { id: "activation", label: "Launch mapping", detail: "Invite people and open the workspace" },
];

const steps: PhaseStep[] = [
  { id: "profile", phase: "foundation", label: "Company basics", detail: "Identity, size, locations", why: "Gives process maps enough company context for dashboards, templates, and reporting." },
  { id: "orgChart", phase: "knowledge", label: "Org chart", detail: "Company root, departments, and people", why: "Add departments and invite people directly on the live company hierarchy. The company root appears as soon as company basics are saved." },
  { id: "tools", phase: "knowledge", label: "Tool stack", detail: "Tools, platforms, and integrations", why: "Captures which systems your teams already use so process maps can reference them and surface integration risks." },
  { id: "priorities", phase: "knowledge", label: "Mapping priorities", detail: "Goals and first teams", why: "Helps rank process opportunities and focus the first mapping wave." },
  { id: "sendInvitations", phase: "activation", label: "Send invitations", detail: "Add members and send pending invites", why: "Add invitees here, then explicitly send the pending emails." },
  { id: "campaign", phase: "activation", label: "Launch mapping workspace", detail: "Open the mapping wave", why: "Completes setup and opens process mapping for the invited team." },
];

const OTHER_VALUE = "__other__";

const companyIndustries = [
  "Professional services",
  "Retail/ecommerce",
  "Manufacturing",
  "Logistics",
  "Financial services",
  "Healthcare",
  "Education",
  "Real estate",
  "Hospitality",
  "Technology/SaaS",
  "Media",
  "Public sector",
  "Energy/utilities",
  "Construction",
  "Nonprofit",
];
const companySizes = ["1-10", "11-50", "51-250", "251-1,000", "1,001-5,000", "5,000+"];
const revenueRanges = ["Pre-revenue", "<€1M", "€1M-€5M", "€5M-€25M", "€25M-€100M", "€100M+"];
const growthStages = ["Idea", "Early", "Growth", "Scale-up", "Mature", "Transformation", "Turnaround"];
const businessModels = ["B2B", "B2C", "B2B2C", "Marketplace", "Subscription", "Transactional", "Services", "Hybrid"];
const customerTypes = ["Enterprise", "Mid-market", "SMB", "Consumers", "Government", "Internal users", "Partners"];
const locations = ["France", "United Kingdom", "Germany", "Spain", "Italy", "United States", "United Arab Emirates", "Saudi Arabia", "Morocco", "Europe", "Middle East", "North America", "Global"];
const languages = ["English", "French", "Arabic", "Spanish", "German", "Italian"];
const jurisdictions = ["EU", "KSA", "UAE", "UK", "US", "Global"];
const regulatoryRegimes = ["EU AI Act", "GDPR", "PDPL", "NDMO", "SDAIA", "ISO 27001", "SOC 2"];
const decisionAuthorityOptions: Array<[string, string]> = [
  ["none", "No clear owner"],
  ["bu_led", "Business-unit led"],
  ["central", "Central AI owner"],
  ["federated", "Federated model"],
];
const literacyCoverageOptions: Array<[string, string]> = [
  ["none", "No shared literacy"],
  ["some_leaders", "Some leaders trained"],
  ["broad", "Broad team literacy"],
  ["embedded", "Embedded in daily work"],
];
const deliveryPostureOptions: Array<[string, string]> = [
  ["fully_external", "Fully external"],
  ["mostly_external", "Mostly external"],
  ["balanced", "Balanced"],
  ["mostly_internal", "Mostly internal"],
];
const governanceBodyOptions: Array<[string, string]> = [
  ["none", "No governance body"],
  ["ad_hoc", "Ad hoc review"],
  ["standing", "Standing forum"],
  ["audit_ready", "Audit-ready cadence"],
];
const riskRegisterOptions: Array<[string, string]> = [
  ["no", "No register"],
  ["partial", "Partial register"],
  ["maintained", "Maintained register"],
];
const productCategories = ["Core product", "Service line", "Digital product", "Internal service", "Support service", "Compliance service", "Data product", "Platform"];
const targetCustomers = ["Enterprise", "Mid-market", "SMB", "Consumer", "Public sector", "Internal", "Partner/channel"];
const departmentNames = ["Sales", "Marketing", "Customer Success", "Operations", "Finance", "HR", "Legal", "IT", "Data/Analytics", "Product", "Engineering", "Procurement", "Supply Chain", "Compliance", "Executive Office"];
const responsibilities = ["Approvals", "Reporting", "Customer onboarding", "Billing", "Hiring", "Procurement", "Compliance checks", "Forecasting", "Service delivery", "Data entry", "Exception handling", "Vendor management"];
const goals = ["Reduce cycle time", "Reduce errors", "Improve customer experience", "Improve compliance", "Increase revenue", "Reduce cost", "Improve visibility", "Standardize work", "Automate handoffs", "Improve data quality"];
const painPoints = ["Manual re-entry", "Duplicate tools", "Unclear ownership", "Slow approvals", "Missing data", "Poor integrations", "Spreadsheet dependency", "Email handoffs", "Inconsistent process", "Compliance risk", "Reporting delays"];
const toolCategories = ["CRM", "ERP", "HRIS", "Finance/accounting", "Support/ticketing", "Project management", "Communication", "Document management", "BI/analytics", "Data warehouse", "Automation/iPaaS", "Custom/internal"];
const toolUseCases = ["Customer management", "Case handling", "Finance operations", "HR workflows", "Approvals", "Reporting", "Communication", "Document storage", "Data analysis", "Workflow automation"];
const dataStoredOptions = ["Customer data", "Employee data", "Financial data", "Operational data", "Contracts/documents", "Product data", "Support data", "Analytics data", "None/minimal"];
const criticalities = ["low", "medium", "high", "mission-critical"];
const dataTypes = ["structured", "semi-structured", "unstructured", "documents/files", "emails/messages", "logs/events"];
const accessibilityOptions = ["api_accessible", "export_only", "manual"];
const reliabilityOptions = ["trusted", "needs_checking", "unreliable"];
const sensitivityOptions = ["public", "internal", "personal", "sensitive"];
const updateFrequencies = ["real-time", "hourly", "daily", "weekly", "monthly", "ad hoc"];
const primaryReasons = ["AI readiness", "automation", "cost reduction", "growth", "customer experience", "compliance", "operating visibility", "data quality"];
const duplicateModes: Array<[string, string]> = [["review", "Review"], ["auto_suggest", "Auto-suggest only"], ["manual", "Manual only"]];
const audienceScopes = ["all_staff", "leadership", "learners", "client", "custom"];
const clientKinds = ["client", "partner", "supplier", "subcontractor"];
const engagementTypes = ["Strategic account", "Retainer", "Project", "Supplier agreement", "Partnership", "Subcontract"];
const sourceTypes = ["upload", "gdrive", "sharepoint", "notion", "url", "email", "wiki", "other"];

function list(value: unknown) {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function multiText(value: unknown) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean).join("; ");
  return String(value ?? "");
}

function nice(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--slate)]">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-[var(--r-md)] border-[var(--chalk)] bg-white"
      />
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2 md:col-span-2">
      <Label className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--slate)]">{label}</Label>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-24 rounded-[var(--r-md)] border-[var(--chalk)] bg-white"
      />
    </div>
  );
}

function ChoiceSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  const isKnown = options.includes(value);
  return (
    <div className="space-y-2">
      <Label className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--slate)]">{label}</Label>
      <Select value={isKnown ? value : OTHER_VALUE} onValueChange={(next) => onChange(next === OTHER_VALUE ? "" : next)}>
        <SelectTrigger className="h-11 rounded-[var(--r-md)] border-[var(--chalk)] bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {nice(option)}
            </SelectItem>
          ))}
          <SelectItem value={OTHER_VALUE}>Other</SelectItem>
        </SelectContent>
      </Select>
      {!isKnown ? (
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={`Enter custom ${label.toLowerCase()}`}
          className="h-10 rounded-[var(--r-md)] border-[var(--chalk)] bg-white"
        />
      ) : null}
    </div>
  );
}

function ChipMultiSelect({
  label,
  values,
  onChange,
  options,
  allowCustom = true,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  options: string[];
  allowCustom?: boolean;
}) {
  const [custom, setCustom] = useState("");
  const addCustom = () => {
    const next = custom.trim();
    if (!next) return;
    onChange(values.includes(next) ? values : [...values, next]);
    setCustom("");
  };

  return (
    <div className="space-y-3 md:col-span-2">
      <Label className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--slate)]">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = values.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(toggleValue(values, option))}
              className={`rounded-full border px-3 py-2 font-sans text-[12px] font-medium transition ${
                selected
                  ? "border-[var(--ichigo-orange)] bg-[var(--ichigo-orange)] text-white"
                  : "border-[var(--chalk)] bg-[var(--ichigo-mist)] text-[var(--ichigo-navy)] hover:border-[var(--ichigo-orange)]"
              }`}
            >
              {nice(option)}
            </button>
          );
        })}
      </div>
      {values.some((value) => !options.includes(value)) ? (
        <div className="flex flex-wrap gap-2">
          {values.filter((value) => !options.includes(value)).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange(values.filter((item) => item !== value))}
              className="rounded-full border border-[var(--ichigo-orange)] bg-white px-3 py-2 font-sans text-[12px] font-medium text-[var(--ichigo-orange)]"
            >
              {value} ×
            </button>
          ))}
        </div>
      ) : null}
      {allowCustom ? (
        <div className="flex gap-2">
          <Input
            value={custom}
            onChange={(event) => setCustom(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addCustom();
              }
            }}
            placeholder="Add other"
            className="h-10 rounded-[var(--r-md)] border-[var(--chalk)] bg-white"
          />
          <Button type="button" variant="outline" onClick={addCustom} className="h-10 rounded-[var(--r-md)]">
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function RatingSelect({
  label,
  value,
  onChange,
  labels = ["Very low", "Low", "Medium", "High", "Very high"],
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  labels?: string[];
}) {
  return (
    <div className="space-y-2">
      <Label className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--slate)]">{label}</Label>
      <div className="grid grid-cols-5 gap-1 rounded-[var(--r-md)] border border-[var(--chalk)] bg-[var(--paper)] p-1">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            title={labels[score - 1]}
            onClick={() => onChange(score)}
            className={`h-10 rounded-[var(--r-sm)] font-mono text-[12px] font-semibold ${
              value === score ? "bg-[var(--ichigo-navy)] text-white" : "text-[var(--slate)] hover:bg-white"
            }`}
          >
            {score}
          </button>
        ))}
      </div>
      <p className="font-sans text-[12px] text-[var(--slate)]">{labels[value - 1] ?? "Selected"}</p>
    </div>
  );
}

function BooleanSwitch({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-4 rounded-[var(--r-md)] border border-[var(--chalk)] bg-white px-3 py-2">
      <Label className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--slate)]">{label}</Label>
      <Switch checked={checked} onCheckedChange={onCheckedChange} className="data-[state=checked]:bg-[var(--ichigo-orange)]" />
    </div>
  );
}

function SaveButton({ pending, label = "Save and continue" }: { pending: boolean; label?: string }) {
  return (
    <Button
      type="submit"
      disabled={pending}
      className="rounded-[var(--r-md)] bg-[var(--ichigo-orange)] text-white hover:bg-[var(--ichigo-orange)]/90"
    >
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
      {label}
    </Button>
  );
}

function StatPill({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--chalk)] bg-[var(--paper)] px-3 py-1.5">
      <Icon className="h-4 w-4 text-[var(--ichigo-orange)]" />
      <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--slate)]">{label}</span>
      <span className="font-sans text-[13px] font-semibold text-[var(--ichigo-navy)]">{value}</span>
    </div>
  );
}

function OrgChartStep({ onSaved }: { onSaved: () => void }) {
  const { data: orgData } = useOrgChart();
  const readiness = useMemo(() => computeReadiness(orgData ?? null), [orgData]);
  const departments = (orgData?.departments ?? []).filter((d) => !d.archivedAt);
  const teams = departments.filter((d) => d.parentId).length;
  const blocked = readiness.blockers.length > 0;

  const cards: { label: string; value: string | number; tone?: "neutral" | "warn" }[] = [
    { label: "Departments", value: departments.length },
    { label: "Teams", value: teams },
    { label: "Named people", value: readiness.namedPeople },
    { label: "Pending invites", value: readiness.pendingInvites },
    {
      label: "Missing managers",
      value: readiness.missingManagers,
      tone: readiness.missingManagers > 0 ? "warn" : "neutral",
    },
    {
      label: "Without lead",
      value: readiness.departmentsWithoutLead,
      tone: readiness.departmentsWithoutLead > 0 ? "warn" : "neutral",
    },
    {
      label: "Headcount coverage",
      value: `${readiness.coveragePercent}%`,
      tone: readiness.declaredHeadcount > 0 && readiness.coveragePercent < 60 ? "warn" : "neutral",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-[var(--r-md)] border border-[var(--chalk)] bg-[var(--paper)] p-4">
        <p className="font-sans text-[15px] font-semibold text-[var(--ichigo-navy)]">
          Live company hierarchy
        </p>
        <p className="mt-1 font-sans text-[14px] text-[var(--slate)]">
          The company sits at the top. Departments without a parent attach to it automatically.
          Drag a person onto the company root to set them as CEO/owner, or onto a department to re-team them.
        </p>
      </div>

      {/* progress cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`rounded-[var(--r-md)] border bg-white p-3 ${
              c.tone === "warn"
                ? "border-[var(--ichigo-orange)]/50 bg-[var(--ichigo-orange)]/5"
                : "border-[var(--chalk)]"
            }`}
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--slate)]">
              {c.label}
            </div>
            <div className="mt-1 font-display text-[22px] font-medium text-[var(--ichigo-navy)]">
              {c.value}
            </div>
          </div>
        ))}
      </div>

      <OrgChartCanvas />

      {/* validation bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--r-md)] border border-[var(--chalk)] bg-white px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          {blocked ? (
            readiness.blockers.map((b) => (
              <span
                key={b}
                className="inline-flex items-center gap-1 rounded-full border border-[var(--danger,#b91c1c)]/40 bg-[var(--danger,#b91c1c)]/10 px-2.5 py-1 font-mono text-[11px] text-[var(--danger,#b91c1c)]"
              >
                <ShieldAlert className="h-3 w-3" /> {b}
              </span>
            ))
          ) : readiness.warnings.length > 0 ? (
            readiness.warnings.map((w) => (
              <span
                key={w}
                className="inline-flex items-center gap-1 rounded-full border border-[var(--ichigo-orange)]/40 bg-[var(--ichigo-orange)]/10 px-2.5 py-1 font-mono text-[11px] text-[var(--ichigo-navy)]"
              >
                {w}
              </span>
            ))
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 font-mono text-[11px] text-emerald-700">
              <Check className="h-3 w-3" /> Ready to continue
            </span>
          )}
        </div>
        <Button
          type="button"
          onClick={onSaved}
          disabled={blocked}
          className="rounded-[var(--r-md)] bg-[var(--ichigo-orange)] text-white hover:bg-[var(--ichigo-orange)]/90 disabled:opacity-50"
        >
          <Check className="mr-2 h-4 w-4" />
          Continue
        </Button>
      </div>
    </div>
  );
}

export function CompanyOnboarding({ mode }: { mode: Mode }) {
  const router = useRouter();
  const contextQuery = useOnboardingContext();
  const [activeIndex, setActiveIndex] = useState(0);
  const context = contextQuery.data;
  const activeStep = steps[activeIndex];
  const demoMutation = useOnboardingMutation<void>(async () => {
    await loadMaisonAtlasDemo();
  });

  useEffect(() => {
    if (mode === "wizard" && context?.onboardingPhase) {
      const nextIndex = steps.findIndex((step) => step.phase === context.onboardingPhase);
      setActiveIndex(nextIndex >= 0 ? nextIndex : 0);
    }
  }, [context?.onboardingPhase, mode]);

  const completed = useMemo<Partial<Record<OnboardingStepId, boolean>>>(
    () => ({
      profile: Boolean(context?.profile),
      tools: Boolean(context?.tools.length),
      priorities: Boolean(context?.priorities),
      orgChart: Boolean(context?.profile),
      sendInvitations: Boolean(context?.invitations.length && context.invitations.every((invite) => invite.status !== "pending")),
      campaign: Boolean(context?.campaign?.status === "active" || context?.campaign?.status === "completed"),
    }),
    [context],
  );

  const goNext = async () => {
    if (activeIndex < steps.length - 1) {
      const nextStep = steps[activeIndex + 1];
      if (nextStep.phase !== activeStep.phase) {
        await advanceOnboardingPhase(nextStep.phase);
        await contextQuery.refetch();
      }
      setActiveIndex(activeIndex + 1);
    } else if (mode === "wizard") {
      await router.invalidate();
      await router.navigate({ to: "/" });
    }
  };

  const goBack = () => {
    if (activeIndex > 0) setActiveIndex(activeIndex - 1);
  };

  const phaseSummary = (phase: OnboardingPhase) => {
    const phaseSteps = steps.filter((step) => step.phase === phase);
    const done = phaseSteps.filter((step) => completed[step.id]).length;
    return { done, total: phaseSteps.length };
  };

  if (contextQuery.isLoading) {
    return (
      <Card className="rounded-[var(--r-md)] border-[var(--chalk)] bg-white p-8 text-center">
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-[var(--ichigo-orange)]" />
        <p className="mt-3 font-sans text-[15px] text-[var(--slate)]">Loading company setup.</p>
      </Card>
    );
  }

  if (contextQuery.isError || !context || !activeStep) {
    return (
      <Card className="rounded-[var(--r-md)] border-[var(--chalk)] bg-white p-8 text-center">
        <p className="font-display text-[30px] text-[var(--ichigo-navy)]">Company setup did not load</p>
        <p className="mt-2 font-sans text-[15px] text-[var(--slate)]">
          {contextQuery.error?.message ?? "No onboarding context found."}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="rounded-[var(--r-md)] border-[var(--chalk)] bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ichigo-orange)]">
            {mode === "wizard" ? "Company onboarding" : "Company parameters"}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={demoMutation.isPending}
            onClick={async () => {
              const confirmed = window.confirm("Load the Maison Atlas demo into this company? This will add demo departments, members, tools, and mapping priorities. It will not launch the campaign.");
              if (!confirmed) return;
              await demoMutation.mutateAsync(undefined);
              await contextQuery.refetch();
            }}
            className="h-9 rounded-[var(--r-md)] border-[var(--ichigo-navy)] text-[var(--ichigo-navy)]"
          >
            {demoMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Load demo company
          </Button>
        </div>
        <nav
          aria-label="Company setup steps"
          className="mt-3 flex flex-nowrap items-center gap-2 overflow-x-auto border-t border-[var(--chalk)] pt-3"
        >
          {steps.map((step, index) => {
            const done = completed[step.id];
            const isActive = activeStep.id === step.id;
            const isLast = index === steps.length - 1;
            return (
              <div key={step.id} className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  title={step.detail}
                  aria-current={isActive ? "step" : undefined}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-sans text-[12px] font-medium transition ${
                    isActive
                      ? "border-[var(--ichigo-orange)] bg-[var(--ichigo-orange)] text-white shadow-sm"
                      : done
                        ? "border-[var(--ichigo-navy)] bg-white text-[var(--ichigo-navy)] hover:bg-[var(--ichigo-mist)]"
                        : "border-[var(--chalk)] bg-white text-[var(--slate)] hover:border-[var(--ichigo-orange)] hover:text-[var(--ichigo-navy)]"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full font-mono text-[10px] ${
                      isActive
                        ? "bg-white text-[var(--ichigo-orange)]"
                        : done
                          ? "bg-[var(--ichigo-navy)] text-white"
                          : "bg-[var(--chalk)] text-[var(--slate)]"
                    }`}
                  >
                    {done ? <Check className="h-3 w-3" /> : index + 1}
                  </span>
                  {step.label}
                </button>
                {isLast ? null : (
                  <span aria-hidden className="h-px w-6 bg-[var(--chalk)]" />
                )}
              </div>
            );
          })}
        </nav>
      </Card>

      <Card className="rounded-[var(--r-md)] border-[var(--chalk)] bg-white p-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ichigo-orange)]">
              Step {activeIndex + 1} of {steps.length}
            </p>
            <h2 className="mt-1 font-display text-[36px] font-medium tracking-normal text-[var(--ichigo-navy)]">
              {activeStep.label}
            </h2>
            <p className="mt-2 max-w-2xl font-sans text-[14px] text-[var(--slate)]">
              Why we ask this: {activeStep.why}
            </p>
          </div>
          <Badge className="rounded-full bg-[var(--ichigo-mist)] px-3 py-1 text-[var(--ichigo-navy)]">
            {completed[activeStep.id] ? "saved" : "draft"}
          </Badge>
        </div>
        {demoMutation.error ? (
          <p className="mb-4 rounded-[var(--r-md)] border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-3 font-sans text-[13px] text-[var(--danger)]">
            {demoMutation.error.message}
          </p>
        ) : null}

        {activeStep.id === "profile" ? <ProfileForm context={context} onSaved={goNext} /> : null}
        {activeStep.id === "orgChart" ? <OrgChartStep onSaved={goNext} /> : null}
        {activeStep.id === "tools" ? <ToolForm context={context} onSaved={goNext} /> : null}
        {activeStep.id === "priorities" ? <PriorityForm context={context} onSaved={goNext} /> : null}
        {activeStep.id === "sendInvitations" ? <SendInvitationsForm context={context} onSaved={goNext} /> : null}
        {activeStep.id === "campaign" ? <CampaignForm context={context} onSaved={goNext} mode={mode} /> : null}
        <div className="mt-6 flex items-center justify-between border-t border-[var(--chalk)] pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={goBack}
            disabled={activeIndex === 0}
            className="rounded-[var(--r-md)] border-[var(--chalk)] text-[var(--ichigo-navy)]"
          >
            Back
          </Button>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--slate)]">
            Step {activeIndex + 1} of {steps.length}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (activeIndex < steps.length - 1) setActiveIndex(activeIndex + 1);
            }}
            disabled={activeIndex === steps.length - 1}
            className="rounded-[var(--r-md)] border-[var(--chalk)] text-[var(--ichigo-navy)]"
          >
            Skip
          </Button>
        </div>
      </Card>
    </div>
  );
}

function ProfileForm({ context, onSaved }: { context: NonNullable<ReturnType<typeof useOnboardingContext>["data"]>; onSaved: () => void }) {
  const mutation = useOnboardingMutation(saveCompanyProfile);
  const profile = context.profile;
  const profileAny = profile as any;
  const [form, setForm] = useState({
    industry: profile?.industry ?? "Professional services",
    subIndustry: profile?.sub_industry ?? "",
    size: profile?.size ?? "50-250",
    revenueRange: profile?.revenue_range ?? "",
    growthStage: profile?.growth_stage ?? "Scale-up",
    businessModel: profile?.business_model ?? "B2B",
    customerType: profile?.customer_type ?? "Mid-market",
    locations: list(profile?.locations),
    overview: profileAny?.overview ?? "",
    mission: profileAny?.mission ?? "",
    valueProposition: profileAny?.value_proposition ?? "",
    languages: list(profileAny?.languages),
  });

  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={async (event) => {
        event.preventDefault();
        await mutation.mutateAsync(form);
        onSaved();
      }}
    >
      <ChoiceSelect label="Industry" value={form.industry} onChange={(industry) => setForm({ ...form, industry })} options={companyIndustries} />
      <Field label="Sub-industry" value={form.subIndustry} onChange={(subIndustry) => setForm({ ...form, subIndustry })} />
      <ChoiceSelect label="Company size" value={form.size} onChange={(size) => setForm({ ...form, size })} options={companySizes} />
      <ChoiceSelect label="Revenue range" value={form.revenueRange} onChange={(revenueRange) => setForm({ ...form, revenueRange })} options={revenueRanges} />
      <ChoiceSelect label="Growth stage" value={form.growthStage} onChange={(growthStage) => setForm({ ...form, growthStage })} options={growthStages} />
      <ChoiceSelect label="Business model" value={form.businessModel} onChange={(businessModel) => setForm({ ...form, businessModel })} options={businessModels} />
      <ChoiceSelect label="Customer type" value={form.customerType} onChange={(customerType) => setForm({ ...form, customerType })} options={customerTypes} />
      <ChipMultiSelect label="Locations" values={form.locations} onChange={(locations) => setForm({ ...form, locations })} options={locations} />
      <ChipMultiSelect label="Content languages" values={form.languages} onChange={(languages) => setForm({ ...form, languages })} options={languages} />
      <TextField label="Company overview" value={form.overview} onChange={(overview) => setForm({ ...form, overview })} />
      <TextField label="Mission" value={form.mission} onChange={(mission) => setForm({ ...form, mission })} />
      <TextField label="Value proposition" value={form.valueProposition} onChange={(valueProposition) => setForm({ ...form, valueProposition })} />
      <SaveButton pending={mutation.isPending} />
      {mutation.error ? <p className="font-sans text-[13px] text-[var(--danger)]">{mutation.error.message}</p> : null}
    </form>
  );
}

function RegulatoryForm({ context, onSaved }: { context: NonNullable<ReturnType<typeof useOnboardingContext>["data"]>; onSaved: () => void }) {
  const mutation = useOnboardingMutation(saveRegulatoryPosture);
  const profile = context.profile as any;
  const [form, setForm] = useState({
    primaryJurisdiction: profile?.primary_jurisdiction ?? "EU",
    dataResidency: list(profile?.data_residency),
    isRegulated: Boolean(profile?.is_regulated),
    regulatoryRegimes: list(profile?.regulatory_regimes),
    sellsTraining: Boolean(profile?.sells_training),
  });

  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={async (event) => {
        event.preventDefault();
        await mutation.mutateAsync(form);
        onSaved();
      }}
    >
      <ChoiceSelect label="Primary jurisdiction" value={form.primaryJurisdiction} onChange={(primaryJurisdiction) => setForm({ ...form, primaryJurisdiction })} options={jurisdictions} />
      <ChipMultiSelect label="Data residency" values={form.dataResidency} onChange={(dataResidency) => setForm({ ...form, dataResidency })} options={jurisdictions} />
      <BooleanSwitch label="Regulated company" checked={form.isRegulated} onCheckedChange={(isRegulated) => setForm({ ...form, isRegulated })} />
      <BooleanSwitch label="Sells training" checked={form.sellsTraining} onCheckedChange={(sellsTraining) => setForm({ ...form, sellsTraining })} />
      <ChipMultiSelect label="Regulatory regimes" values={form.regulatoryRegimes} onChange={(regulatoryRegimes) => setForm({ ...form, regulatoryRegimes })} options={regulatoryRegimes} />
      <SaveButton pending={mutation.isPending} />
      {mutation.error ? <p className="font-sans text-[13px] text-[var(--danger)]">{mutation.error.message}</p> : null}
    </form>
  );
}

function ReadinessForm({ context, onSaved }: { context: NonNullable<ReturnType<typeof useOnboardingContext>["data"]>; onSaved: () => void }) {
  const mutation = useOnboardingMutation(saveReadiness);
  const readiness = context.readiness;
  const ownerOptions: Array<[string, string]> = [
    ["__none__", "Not assigned yet"],
    ...context.members.map((member) => {
      const department = context.departments.find((item) => item.id === member.department_id)?.name;
      return [member.user_id, `${nice(member.role)}${department ? ` · ${department}` : ""}`] as [string, string];
    }),
  ];
  const [form, setForm] = useState({
    decisionAuthority: readiness?.decision_authority ?? "bu_led",
    hasAiOwner: Boolean(readiness?.has_ai_owner),
    literacyCoverage: readiness?.literacy_coverage ?? "some_leaders",
    deliveryPosture: readiness?.delivery_posture ?? "balanced",
    governanceBody: readiness?.governance_body ?? "ad_hoc",
    riskRegister: readiness?.risk_register ?? "partial",
    canonicalKnowledgeOwnerUserId: readiness?.canonical_knowledge_owner_user_id ?? "__none__",
  });

  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={async (event) => {
        event.preventDefault();
        await mutation.mutateAsync({
          ...form,
          canonicalKnowledgeOwnerUserId: form.canonicalKnowledgeOwnerUserId === "__none__" ? null : form.canonicalKnowledgeOwnerUserId,
        } as Parameters<typeof saveReadiness>[0]);
        onSaved();
      }}
    >
      <div className="md:col-span-2 rounded-[var(--r-md)] border border-[var(--chalk)] bg-[var(--paper)] p-4">
        <p className="font-sans text-[15px] font-semibold text-[var(--ichigo-navy)]">
          A two-minute readiness baseline — your dashboard's Organization and Culture dimensions go live.
        </p>
        <p className="mt-1 font-sans text-[14px] text-[var(--slate)]">
          These answers are self-reported and visibly marked that way on the dashboard.
        </p>
      </div>
      <SelectField
        label="Decision authority"
        value={form.decisionAuthority}
        onChange={(decisionAuthority) => setForm({ ...form, decisionAuthority })}
        options={decisionAuthorityOptions}
      />
      <BooleanSwitch label="Named AI owner" checked={form.hasAiOwner} onCheckedChange={(hasAiOwner) => setForm({ ...form, hasAiOwner })} />
      <SelectField
        label="AI literacy coverage"
        value={form.literacyCoverage}
        onChange={(literacyCoverage) => setForm({ ...form, literacyCoverage })}
        options={literacyCoverageOptions}
      />
      <SelectField
        label="Delivery posture"
        value={form.deliveryPosture}
        onChange={(deliveryPosture) => setForm({ ...form, deliveryPosture })}
        options={deliveryPostureOptions}
      />
      <SelectField
        label="Governance body"
        value={form.governanceBody}
        onChange={(governanceBody) => setForm({ ...form, governanceBody })}
        options={governanceBodyOptions}
      />
      <SelectField
        label="Risk register"
        value={form.riskRegister}
        onChange={(riskRegister) => setForm({ ...form, riskRegister })}
        options={riskRegisterOptions}
      />
      <SelectField
        label="Canonical knowledge owner"
        value={form.canonicalKnowledgeOwnerUserId}
        onChange={(canonicalKnowledgeOwnerUserId) => setForm({ ...form, canonicalKnowledgeOwnerUserId })}
        options={ownerOptions}
      />
      <div className="rounded-[var(--r-md)] border border-[var(--chalk)] bg-white p-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--slate)]">Computed outputs</p>
        <p className="mt-2 font-sans text-[13px] text-[var(--graphite)]">
          Saving stores deterministic Organization and Culture stages. Governance and owner answers seed Company Core only.
        </p>
      </div>
      <SaveButton pending={mutation.isPending} />
      {mutation.error ? <p className="font-sans text-[13px] text-[var(--danger)]">{mutation.error.message}</p> : null}
    </form>
  );
}

function ProductForm({ context, onSaved }: { context: NonNullable<ReturnType<typeof useOnboardingContext>["data"]>; onSaved: () => void }) {
  const mutation = useOnboardingMutation(saveProduct);
  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    targetCustomer: "",
    revenueContribution: 20,
    strategicImportance: 3,
    deliveryComplexity: 3,
  });

  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={async (event) => {
        event.preventDefault();
        await mutation.mutateAsync(form);
        setForm({ ...form, name: "", description: "" });
        onSaved();
      }}
    >
      <ExistingRows rows={context.products.map((item) => item.name)} empty="No products saved yet." />
      <Field label="Name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
      <ChoiceSelect label="Category" value={form.category} onChange={(category) => setForm({ ...form, category })} options={productCategories} />
      <ChoiceSelect label="Target customer" value={form.targetCustomer} onChange={(targetCustomer) => setForm({ ...form, targetCustomer })} options={targetCustomers} />
      <Field label="Revenue contribution %" type="number" value={form.revenueContribution} onChange={(value) => setForm({ ...form, revenueContribution: Number(value) })} />
      <RatingSelect label="Strategic importance" value={form.strategicImportance} onChange={(strategicImportance) => setForm({ ...form, strategicImportance })} />
      <RatingSelect label="Delivery complexity" value={form.deliveryComplexity} onChange={(deliveryComplexity) => setForm({ ...form, deliveryComplexity })} labels={["Very simple", "Simple", "Moderate", "Complex", "Very complex"]} />
      <TextField label="Description" value={form.description} onChange={(description) => setForm({ ...form, description })} />
      <SaveButton pending={mutation.isPending} label="Add product" />
    </form>
  );
}

function AudienceForm({ context, onSaved }: { context: NonNullable<ReturnType<typeof useOnboardingContext>["data"]>; onSaved: () => void }) {
  const mutation = useOnboardingMutation(saveAudience);
  const [form, setForm] = useState<AudienceFormState>({
    name: "",
    description: "",
    scope: "custom",
  });

  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={async (event) => {
        event.preventDefault();
        await mutation.mutateAsync(form);
        setForm({ ...form, name: "", description: "" });
        onSaved();
      }}
    >
      <ExistingRows rows={context.audiences.map((item) => `${item.name} · ${nice(item.scope ?? "custom")}`)} empty="No audiences defined yet." />
      <Field label="Audience name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
      <ChoiceSelect label="Scope" value={form.scope} onChange={(scope) => setForm({ ...form, scope: scope as AudienceFormState["scope"] })} options={audienceScopes} />
      <TextField label="Description" value={form.description} onChange={(description) => setForm({ ...form, description })} />
      <SaveButton pending={mutation.isPending} label="Add audience" />
    </form>
  );
}

function ClientForm({ context, onSaved }: { context: NonNullable<ReturnType<typeof useOnboardingContext>["data"]>; onSaved: () => void }) {
  const mutation = useOnboardingMutation(saveClient);
  const [form, setForm] = useState<ClientFormState>({
    name: "",
    kind: "client",
    sector: "",
    engagementType: "",
    underNda: true,
    reusableIp: true,
    dataResidency: "",
    internalAudience: [] as string[],
    notes: "",
  });

  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={async (event) => {
        event.preventDefault();
        await mutation.mutateAsync(form);
        setForm({ ...form, name: "", notes: "" });
        onSaved();
      }}
    >
      <ExistingRows rows={context.clients.map((item) => `${item.name} · ${nice(item.kind)}${item.kind === "client" ? " · vault-triggering" : ""}`)} empty="No clients or partners saved yet." />
      <Field label="Name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
      <ChoiceSelect label="Kind" value={form.kind} onChange={(kind) => setForm({ ...form, kind: kind as ClientFormState["kind"] })} options={clientKinds} />
      <Field label="Sector" value={form.sector} onChange={(sector) => setForm({ ...form, sector })} />
      <ChoiceSelect label="Engagement type" value={form.engagementType} onChange={(engagementType) => setForm({ ...form, engagementType })} options={engagementTypes} />
      <BooleanSwitch label="Under NDA" checked={form.underNda} onCheckedChange={(underNda) => setForm({ ...form, underNda })} />
      <BooleanSwitch label="Reusable IP" checked={form.reusableIp} onCheckedChange={(reusableIp) => setForm({ ...form, reusableIp })} />
      <ChoiceSelect label="Data residency" value={form.dataResidency} onChange={(dataResidency) => setForm({ ...form, dataResidency })} options={jurisdictions} />
      <ChipMultiSelect label="Internal audience" values={form.internalAudience} onChange={(internalAudience) => setForm({ ...form, internalAudience })} options={context.audiences.map((audience) => audience.name)} />
      <TextField label="Notes" value={form.notes} onChange={(notes) => setForm({ ...form, notes })} />
      <SaveButton pending={mutation.isPending} label="Add client or partner" />
    </form>
  );
}


function ToolForm({ context, onSaved }: { context: NonNullable<ReturnType<typeof useOnboardingContext>["data"]>; onSaved: () => void }) {
  const mutation = useOnboardingMutation(saveTool);
  const [form, setForm] = useState({
    name: "",
    category: "",
    mainUseCases: [] as string[],
    dataStored: [] as string[],
    integrationStatus: 3,
    apiAvailable: true,
    criticality: "medium",
  });
  const [customTool, setCustomTool] = useState(false);
  const [selectedCatalogTools, setSelectedCatalogTools] = useState<ToolCatalogRow[]>([]);
  const selectedCatalogIds = selectedCatalogTools.map((tool) => tool.id);
  const toggleCatalogTool = (tool: ToolCatalogRow) => {
    setCustomTool(false);
    setSelectedCatalogTools((current) =>
      current.some((item) => item.id === tool.id)
        ? current.filter((item) => item.id !== tool.id)
        : [...current, tool],
    );
  };
  const sensitiveSelection = selectedCatalogTools.filter((tool) => ["personal", "sensitive"].includes(tool.default_data_sensitivity ?? ""));

  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={async (event) => {
        event.preventDefault();
        const common = {
          mainUseCase: multiText(form.mainUseCases),
          dataStored: multiText(form.dataStored),
          integrationStatus: form.integrationStatus,
          criticality: form.criticality,
        };
        if (customTool) {
          await mutation.mutateAsync({
            name: form.name,
            catalogId: null,
            category: form.category,
            apiAvailable: form.apiAvailable,
            ...common,
          });
        } else {
          for (const tool of selectedCatalogTools) {
            await mutation.mutateAsync({
              name: tool.name,
              catalogId: tool.id,
              category: tool.category,
              apiAvailable: tool.default_api_available ?? true,
              ...common,
            });
          }
        }
        setForm({ ...form, name: "" });
        setSelectedCatalogTools([]);
        setCustomTool(false);
        onSaved();
      }}
    >
      <ExistingRows rows={context.tools.map((item) => [item.name, item.main_use_case, item.data_stored].filter(Boolean).join(" · "))} empty="No tools saved yet." />
      <div className="space-y-3 md:col-span-2">
        {!customTool ? (
          <ToolCatalogPicker
            values={selectedCatalogIds}
            multiSelect
            label="Tool / platform"
            placeholder="Search the tool catalog"
            includeCatalogFallback
            onToggleCatalog={toggleCatalogTool}
            onCustomTool={(name) => {
              setCustomTool(true);
              setSelectedCatalogTools([]);
              setForm({ ...form, name: name?.trim() ?? "" });
            }}
          />
        ) : (
          <Field label="Custom tool name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
        )}
        {sensitiveSelection.length ? (
          <p className="rounded-[var(--r-md)] border border-[var(--warning)]/40 bg-[var(--warning)]/10 p-3 font-sans text-[13px] text-[var(--ichigo-navy)]">
            Sensitive-data hint: {sensitiveSelection.map((tool) => tool.name).slice(0, 4).join(", ")} may handle personal or sensitive data. If a department relies on these tools, consider marking that department as holding sensitive data.
          </p>
        ) : null}
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setCustomTool((current) => !current);
            setForm({ ...form, name: "" });
            setSelectedCatalogTools([]);
          }}
          className="rounded-[var(--r-md)] border-[var(--chalk)]"
        >
          {customTool ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {customTool ? "Use catalog picker" : "Add a custom tool"}
        </Button>
      </div>
      <ChoiceSelect label="Category" value={form.category} onChange={(category) => setForm({ ...form, category })} options={toolCategories} />
      <ChipMultiSelect label="Main use cases" values={form.mainUseCases} onChange={(mainUseCases) => setForm({ ...form, mainUseCases })} options={toolUseCases} />
      <ChipMultiSelect label="Data stored" values={form.dataStored} onChange={(dataStored) => setForm({ ...form, dataStored })} options={dataStoredOptions} />
      <RatingSelect label="Integration status" value={form.integrationStatus} onChange={(integrationStatus) => setForm({ ...form, integrationStatus })} labels={["Isolated", "Manual export", "Partial sync", "Integrated", "Fully integrated"]} />
      <ChoiceSelect label="Criticality" value={form.criticality} onChange={(criticality) => setForm({ ...form, criticality })} options={criticalities} />
      <BooleanSwitch label="API available" checked={form.apiAvailable} onCheckedChange={(apiAvailable) => setForm({ ...form, apiAvailable })} />
      <SaveButton pending={mutation.isPending} label="Add tool" />
    </form>
  );
}

function DataSourceForm({ context, onSaved }: { context: NonNullable<ReturnType<typeof useOnboardingContext>["data"]>; onSaved: () => void }) {
  const mutation = useOnboardingMutation(saveDataSource);
  const [form, setForm] = useState({
    name: "",
    toolId: "none",
    departmentOwnerId: "none",
    dataType: "structured",
    accessibility: "api_accessible",
    reliability: "trusted",
    sensitivityLevel: "internal",
    updateFrequency: "daily",
  });

  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={async (event) => {
        event.preventDefault();
        await mutation.mutateAsync({
          ...form,
          toolId: form.toolId === "none" ? null : form.toolId,
          departmentOwnerId: form.departmentOwnerId === "none" ? null : form.departmentOwnerId,
        });
        setForm({ ...form, name: "" });
        onSaved();
      }}
    >
      <ExistingRows rows={context.dataSources.map((item) => item.name)} empty="No data sources saved yet." />
      <Field label="Source name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
      <SelectField label="Tool" value={form.toolId} onChange={(toolId) => setForm({ ...form, toolId })} options={[["none", "No tool"], ...context.tools.map((tool) => [tool.id, tool.name] as [string, string])]} />
      <SelectField label="Owner department" value={form.departmentOwnerId} onChange={(departmentOwnerId) => setForm({ ...form, departmentOwnerId })} options={[["none", "No owner"], ...context.departments.map((department) => [department.id, department.name] as [string, string])]} />
      <ChoiceSelect label="Data type" value={form.dataType} onChange={(dataType) => setForm({ ...form, dataType })} options={dataTypes} />
      <ChoiceSelect label="Accessibility" value={form.accessibility} onChange={(accessibility) => setForm({ ...form, accessibility })} options={accessibilityOptions} />
      <ChoiceSelect label="Reliability" value={form.reliability} onChange={(reliability) => setForm({ ...form, reliability })} options={reliabilityOptions} />
      <ChoiceSelect label="Sensitivity" value={form.sensitivityLevel} onChange={(sensitivityLevel) => setForm({ ...form, sensitivityLevel })} options={sensitivityOptions} />
      <ChoiceSelect label="Update frequency" value={form.updateFrequency} onChange={(updateFrequency) => setForm({ ...form, updateFrequency })} options={updateFrequencies} />
      <SaveButton pending={mutation.isPending} label="Add data source" />
    </form>
  );
}

function KnowledgeSourceForm({ context, onSaved }: { context: NonNullable<ReturnType<typeof useOnboardingContext>["data"]>; onSaved: () => void }) {
  const mutation = useOnboardingMutation(saveKnowledgeSource);
  const [form, setForm] = useState({
    name: "",
    sourceType: "url",
    locationUri: "",
    ownerDepartmentId: "none",
    ownerClientId: "none",
    sensitivityLevel: "internal",
    dataResidency: "",
  });

  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={async (event) => {
        event.preventDefault();
        await mutation.mutateAsync({
          ...form,
          ownerDepartmentId: form.ownerDepartmentId === "none" ? null : form.ownerDepartmentId,
          ownerClientId: form.ownerClientId === "none" ? null : form.ownerClientId,
        } as any);
        setForm({ ...form, name: "", locationUri: "" });
        onSaved();
      }}
    >
      <ExistingRows rows={context.knowledgeSources.map((item) => `${item.name} · ${nice(item.source_type ?? "other")} · ${nice(item.sensitivity_level ?? "internal")}`)} empty="No knowledge sources saved yet." />
      <Field label="Source name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
      <ChoiceSelect label="Source type" value={form.sourceType} onChange={(sourceType) => setForm({ ...form, sourceType })} options={sourceTypes} />
      <Field label="Location URI" value={form.locationUri} onChange={(locationUri) => setForm({ ...form, locationUri })} />
      <SelectField label="Owner department" value={form.ownerDepartmentId} onChange={(ownerDepartmentId) => setForm({ ...form, ownerDepartmentId })} options={[["none", "No department"], ...context.departments.map((department) => [department.id, department.name] as [string, string])]} />
      <SelectField label="Owner client" value={form.ownerClientId} onChange={(ownerClientId) => setForm({ ...form, ownerClientId })} options={[["none", "No client"], ...context.clients.map((client) => [client.id, client.name] as [string, string])]} />
      <ChoiceSelect label="Sensitivity" value={form.sensitivityLevel} onChange={(sensitivityLevel) => setForm({ ...form, sensitivityLevel })} options={sensitivityOptions} />
      <ChoiceSelect label="Data residency" value={form.dataResidency} onChange={(dataResidency) => setForm({ ...form, dataResidency })} options={jurisdictions} />
      <SaveButton pending={mutation.isPending} label="Add knowledge source" />
    </form>
  );
}

function PriorityForm({ context, onSaved }: { context: NonNullable<ReturnType<typeof useOnboardingContext>["data"]>; onSaved: () => void }) {
  const mutation = useOnboardingMutation(saveStrategicPriority);
  const priority = context.priorities;
  const governance = ((priority?.weights as any)?.governance ?? {}) as Record<string, any>;
  const maturityBands = (governance.maturityBands ?? {}) as Record<string, number>;
  const [form, setForm] = useState({
    primaryReason: priority?.primary_reason ?? "operating visibility",
    priorities: list(priority?.priorities),
    topGoals: list(priority?.top_goals),
    priorityDepartments: list(priority?.priority_departments),
    tier1AutomationThreshold: governance.tier1AutomationThreshold ?? 3,
    tier2AutomationThreshold: governance.tier2AutomationThreshold ?? 2,
    maturityInitialMax: maturityBands.initialMax ?? 39,
    maturityDevelopingMax: maturityBands.developingMax ?? 59,
    maturityAdvancedMax: maturityBands.advancedMax ?? 79,
  });

  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={async (event) => {
        event.preventDefault();
        await mutation.mutateAsync(form);
        onSaved();
      }}
    >
      <ChoiceSelect label="Primary reason" value={form.primaryReason} onChange={(primaryReason) => setForm({ ...form, primaryReason })} options={primaryReasons} />
      <ChipMultiSelect label="Priorities" values={form.priorities} onChange={(priorities) => setForm({ ...form, priorities })} options={goals} />
      <ChipMultiSelect label="Top goals" values={form.topGoals} onChange={(topGoals) => setForm({ ...form, topGoals })} options={goals} />
      <ChipMultiSelect label="Priority departments" values={form.priorityDepartments} onChange={(priorityDepartments) => setForm({ ...form, priorityDepartments })} options={context.departments.map((department) => department.name)} allowCustom={false} />
      <div className="md:col-span-2 rounded-[var(--r-md)] border border-[var(--chalk)] bg-[var(--paper)] p-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ichigo-orange)]">Review policy</p>
        <p className="mt-1 font-sans text-[14px] text-[var(--slate)]">
          Risk is calculated automatically for each mapped process. Customer-facing, financial, legal or compliance, sensitive-data, high-automation, or hard-to-reverse processes may need extra review.
        </p>
      </div>
      <SaveButton pending={mutation.isPending} label="Save mapping priorities" />
    </form>
  );
}

function SendInvitationsForm({ context, onSaved }: { context: NonNullable<ReturnType<typeof useOnboardingContext>["data"]>; onSaved: () => void }) {
  const sendMutation = useOnboardingMutation(async () => {
    await sendPendingInvitations();
  });
  const addMutation = useOnboardingMutation(saveInvitation);
  const pending = context.invitations.filter((invite) => invite.status === "pending");
  const [form, setForm] = useState({
    email: "",
    role: "employee" as Parameters<typeof saveInvitation>[0]["role"],
    departmentId: "none",
  });

  return (
    <div className="space-y-6">
      <ExistingRows rows={context.invitations.map((item) => `${item.email} · ${item.status}`)} empty="No invitations yet — add members below." />

      <form
        className="grid gap-4 rounded-[var(--r-md)] border border-[var(--chalk)] bg-white p-4 md:grid-cols-2"
        onSubmit={async (event) => {
          event.preventDefault();
          await addMutation.mutateAsync({
            ...form,
            departmentId: form.departmentId === "none" ? null : form.departmentId,
          });
          setForm({ ...form, email: "" });
        }}
      >
        <div className="md:col-span-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--slate)]">Add member</p>
        </div>
        <Field label="Email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
        <div className="space-y-2">
          <Label className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--slate)]">Role</Label>
          <Select value={form.role} onValueChange={(role: typeof form.role) => setForm({ ...form, role })}>
            <SelectTrigger className="h-11 rounded-[var(--r-md)] border-[var(--chalk)] bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="employee">Employee</SelectItem>
              <SelectItem value="department_lead">Department lead</SelectItem>
              <SelectItem value="reviewer">Reviewer</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--slate)]">Department</Label>
          <Select value={form.departmentId} onValueChange={(departmentId) => setForm({ ...form, departmentId })}>
            <SelectTrigger className="h-11 rounded-[var(--r-md)] border-[var(--chalk)] bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No department</SelectItem>
              {context.departments.map((department) => (
                <SelectItem key={department.id} value={department.id}>
                  {department.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <SaveButton pending={addMutation.isPending} label="Add to pending invites" />
        {addMutation.error ? <p className="md:col-span-2 font-sans text-[13px] text-[var(--danger)]">{addMutation.error.message}</p> : null}
      </form>

      <div className="rounded-[var(--r-md)] border border-[var(--chalk)] bg-[var(--paper)] p-4">
        <p className="font-sans text-[15px] font-semibold text-[var(--ichigo-navy)]">
          {pending.length} pending invitation{pending.length === 1 ? "" : "s"} ready to send.
        </p>
        <p className="mt-1 font-sans text-[14px] text-[var(--slate)]">
          Emails are sent only when you click the button below.
        </p>
      </div>
      {sendMutation.error ? <p className="font-sans text-[13px] text-[var(--danger)]">{sendMutation.error.message}</p> : null}
      <Button
        type="button"
        disabled={sendMutation.isPending || pending.length === 0}
        onClick={async () => {
          await sendMutation.mutateAsync(undefined);
          onSaved();
        }}
        className="rounded-[var(--r-md)] bg-[var(--ichigo-orange)] text-white hover:bg-[var(--ichigo-orange)]/90"
      >
        {sendMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
        Send pending invitations
      </Button>
    </div>
  );
}

function CampaignForm({ context, onSaved, mode }: { context: NonNullable<ReturnType<typeof useOnboardingContext>["data"]>; onSaved: () => void; mode: Mode }) {
  const mutation = useOnboardingMutation(saveCampaign);
  const campaign = context.campaign;
  const [form, setForm] = useState({
    deadline: campaign?.deadline ?? "",
    workflowsPerEmployee: campaign?.workflows_per_employee ?? 2,
    requireLeadReview: campaign?.require_lead_review ?? true,
    mergeDuplicatesMode: campaign?.merge_duplicates_mode ?? "review",
  });

  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={async (event) => {
        event.preventDefault();
        await mutation.mutateAsync(form);
        onSaved();
      }}
    >
      <Field label="Deadline" type="date" value={form.deadline} onChange={(deadline) => setForm({ ...form, deadline })} />
      <SelectField label="Workflows per employee" value={String(form.workflowsPerEmployee)} onChange={(value) => setForm({ ...form, workflowsPerEmployee: Number(value) })} options={[["1", "1"], ["2", "2"], ["3", "3"], ["5", "5"]]} />
      <SelectField label="Duplicate merge mode" value={form.mergeDuplicatesMode} onChange={(mergeDuplicatesMode) => setForm({ ...form, mergeDuplicatesMode })} options={duplicateModes} />
      <BooleanSwitch label="Lead review required" checked={form.requireLeadReview} onCheckedChange={(requireLeadReview) => setForm({ ...form, requireLeadReview })} />
      <div className="md:col-span-2 rounded-[var(--r-md)] bg-[var(--paper)] p-4">
        <p className="font-sans text-[14px] text-[var(--slate)]">
          Saving this step launches the campaign and completes the company onboarding gate.
        </p>
      </div>
      <SaveButton pending={mutation.isPending} label={mode === "wizard" ? "Launch campaign" : "Save campaign"} />
    </form>
  );
}

function ExistingRows({ rows, empty }: { rows: string[]; empty: string }) {
  return (
    <div className="md:col-span-2 rounded-[var(--r-md)] border border-[var(--chalk)] bg-[var(--paper)] p-4">
      <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--slate)]">Saved rows</p>
      {rows.length ? (
        <div className="flex flex-wrap gap-2">
          {rows.map((row) => (
            <Badge key={row} className="rounded-full bg-white px-3 py-1 text-[var(--ichigo-navy)]">
              {row}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="font-sans text-[14px] text-[var(--slate)]">{empty}</p>
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <div className="space-y-2">
      <Label className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--slate)]">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-11 rounded-[var(--r-md)] border-[var(--chalk)] bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([optionValue, label]) => (
            <SelectItem key={optionValue} value={optionValue}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
