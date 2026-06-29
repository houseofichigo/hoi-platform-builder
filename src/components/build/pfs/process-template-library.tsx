import { useMemo, useState } from "react";
import { ClipboardCheck, Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ProcessTemplate } from "@/lib/db/pfs/process-templates";

/** Backwards-compat export. The new browser owns its own header. */
export function TemplateLibraryIntro() {
  return null;
}

type StepKind =
  | "trigger"
  | "task"
  | "decision"
  | "approval"
  | "handoff"
  | "output"
  | "merge"
  | "end";

type TemplateStep = {
  id: string;
  kind: StepKind;
  label: string;
  description: string;
  input: string;
  output: string;
  tool: string;
};

const KIND_ALIAS: Record<string, StepKind> = {
  start: "trigger",
  trigger: "trigger",
  task: "task",
  step: "task",
  action: "task",
  decision: "decision",
  gateway: "decision",
  approval: "approval",
  approve: "approval",
  handoff: "handoff",
  output: "output",
  result: "output",
  merge: "merge",
  join: "merge",
  end: "end",
  stop: "end",
  finish: "end",
};

function normalizeKind(raw: unknown): StepKind {
  if (typeof raw !== "string") return "task";
  return KIND_ALIAS[raw.toLowerCase()] ?? "task";
}

function getString(obj: unknown, key: string): string {
  if (!obj || typeof obj !== "object") return "";
  const v = (obj as Record<string, unknown>)[key];
  return typeof v === "string" ? v : "";
}

function extractSteps(template: ProcessTemplate): TemplateStep[] {
  const raw = Array.isArray(template.templateJson.nodes)
    ? (template.templateJson.nodes as unknown[])
    : [];
  return raw
    .map((node, i): TemplateStep | null => {
      if (!node || typeof node !== "object") return null;
      const data = (node as Record<string, unknown>).data as Record<string, unknown> | undefined;
      const kind = normalizeKind(data?.kind ?? (node as Record<string, unknown>).type ?? (node as Record<string, unknown>).kind);
      const label =
        getString(data, "label") ||
        getString(node, "label") ||
        getString(node, "name") ||
        `Step ${i + 1}`;
      return {
        id: String((node as Record<string, unknown>).id ?? i),
        kind,
        label,
        description: getString(data, "description") || getString(node, "description"),
        input: getString(data, "inputType") || getString(data, "input"),
        output: getString(data, "output"),
        tool: getString(data, "toolName") || getString(data, "tool"),
      };
    })
    .filter((s): s is TemplateStep => Boolean(s));
}

function edgeCount(template: ProcessTemplate): number {
  return Array.isArray(template.templateJson.edges)
    ? (template.templateJson.edges as unknown[]).length
    : 0;
}

function counts(steps: TemplateStep[]) {
  let stepCount = 0;
  let branches = 0;
  let approvals = 0;
  for (const s of steps) {
    if (s.kind === "decision") branches += 1;
    else if (s.kind === "approval") approvals += 1;
    else if (s.kind !== "trigger" && s.kind !== "end" && s.kind !== "merge") stepCount += 1;
  }
  return { steps: stepCount, branches, approvals };
}

function kindBadge(kind: StepKind) {
  const map: Record<StepKind, { label: string; cls: string }> = {
    trigger: { label: "TRIGGER", cls: "border-[var(--ichigo-navy)] text-[var(--ichigo-navy)]" },
    task: { label: "STEP", cls: "border-[var(--chalk)] text-[var(--slate)]" },
    decision: { label: "DECISION", cls: "border-[var(--ichigo-orange)] text-[var(--ichigo-orange)]" },
    approval: { label: "APPROVAL", cls: "border-[var(--ichigo-orange)] text-[var(--ichigo-orange)]" },
    handoff: { label: "HANDOFF", cls: "border-[var(--chalk)] text-[var(--slate)]" },
    output: { label: "OUTPUT", cls: "border-[var(--chalk)] text-[var(--slate)]" },
    merge: { label: "MERGE", cls: "border-[var(--chalk)] text-[var(--slate)]" },
    end: { label: "END", cls: "border-[var(--ichigo-navy)] text-[var(--ichigo-navy)]" },
  };
  const b = map[kind];
  return (
    <span
      className={`inline-flex items-center rounded-full border bg-white px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ${b.cls}`}
    >
      {b.label}
    </span>
  );
}

function FlowStrip({ steps, max = 7 }: { steps: TemplateStep[]; max?: number }) {
  const shown = steps.slice(0, max);
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-dashed border-[var(--chalk)] bg-[var(--paper)] p-3">
      {shown.map((s, i) => {
        const accent =
          s.kind === "decision" || s.kind === "approval"
            ? "border-[var(--ichigo-orange)] text-[var(--ichigo-orange)]"
            : s.kind === "trigger" || s.kind === "end"
              ? "border-[var(--ichigo-navy)] text-[var(--ichigo-navy)]"
              : "border-[var(--chalk)] text-[var(--slate)]";
        return (
          <div key={`${s.id}-${i}`} className="flex items-center gap-1.5">
            <span
              className={`inline-flex max-w-[120px] items-center rounded border bg-white px-2 py-1 text-center font-sans text-[10px] leading-tight ${accent}`}
              title={s.label}
            >
              <span className="line-clamp-2">{s.label}</span>
            </span>
            {i < shown.length - 1 ? <span className="text-[10px] text-[var(--chalk)]">·</span> : null}
          </div>
        );
      })}
      {steps.length > max ? (
        <span className="ml-1 font-mono text-[10px] text-[var(--slate)]">+{steps.length - max}</span>
      ) : null}
    </div>
  );
}

function ChipRow({ items }: { items: string[] }) {
  if (!items.length) return <p className="text-[12px] text-[var(--slate)]">—</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((t) => (
        <span
          key={t}
          className="inline-flex items-center rounded-md border border-[var(--chalk)] bg-white px-2 py-1 font-sans text-[11px] text-[var(--graphite)]"
        >
          {t}
        </span>
      ))}
    </div>
  );
}

function MetaSection({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--slate)]">{label}</p>
      <div className="mt-1.5">
        <ChipRow items={items} />
      </div>
    </div>
  );
}

export function ProcessTemplateBrowser({
  templates,
  onApply,
  onBuildManually,
  actionLabel = "Start with this template",
  showHeader = true,
}: {
  templates: ProcessTemplate[];
  onApply?: (template: ProcessTemplate) => void | boolean | Promise<void | boolean>;
  onBuildManually?: () => void;
  actionLabel?: string;
  showHeader?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [openTemplate, setOpenTemplate] = useState<ProcessTemplate | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const t of templates) if (t.category) set.add(t.category);
    return ["All", ...Array.from(set).sort()];
  }, [templates]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return templates.filter((t) => {
      if (category !== "All" && t.category !== category) return false;
      if (!q) return true;
      const hay = [
        t.name,
        t.description,
        t.category,
        t.departmentHint,
        t.processFamily,
        ...t.tags,
        ...t.recommendedTools,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [templates, query, category]);

  const triggerApply = (template: ProcessTemplate) => {
    setOpenTemplate(null);
    if (onApply) void onApply(template);
  };

  return (
    <div className="space-y-4">
      {showHeader ? (
        <Card className="rounded-[var(--r-md)] border-[var(--chalk)] bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ichigo-orange)]">
                Process templates
              </p>
              <h2 className="mt-1 flex items-center gap-2 font-display text-[30px] font-medium text-[var(--ichigo-navy)]">
                <ClipboardCheck className="h-7 w-7 text-[var(--ichigo-orange)]" />
                Template Library
              </h2>
              <p className="mt-2 max-w-3xl font-sans text-[13px] leading-6 text-[var(--graphite)]">
                Templates are starting points. Adapt owners, tools, outputs, volume, data reliability, and criticality before submitting.
              </p>
            </div>
            {onBuildManually ? (
              <Button type="button" variant="outline" className="border-[var(--chalk)]" onClick={onBuildManually}>
                Build manually
              </Button>
            ) : null}
          </div>
        </Card>
      ) : null}

      <Card className="rounded-[var(--r-md)] border-[var(--chalk)] bg-white p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--slate)]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates, departments, tools"
            className="border-[var(--chalk)] pl-9"
          />
        </div>
        {categories.length > 1 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {categories.map((c) => {
              const active = c === category;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`rounded-full border px-3 py-1 font-sans text-[12px] transition-colors ${
                    active
                      ? "border-transparent bg-[var(--ichigo-orange)] text-white"
                      : "border-[var(--chalk)] bg-white text-[var(--graphite)] hover:border-[var(--ichigo-orange)] hover:text-[var(--ichigo-orange)]"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        ) : null}
      </Card>

      {filtered.length === 0 ? (
        <Card className="border-[var(--chalk)] bg-white p-6">
          <p className="text-[14px] font-medium text-[var(--ichigo-navy)]">No templates match this search.</p>
          <p className="mt-1 text-[13px] text-[var(--graphite)]">Try a different category or clear the search.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              actionLabel={actionLabel}
              onOpen={() => setOpenTemplate(template)}
              onApply={() => triggerApply(template)}
            />
          ))}
        </div>
      )}

      <TemplateDetailDialog
        template={openTemplate}
        actionLabel={actionLabel}
        onClose={() => setOpenTemplate(null)}
        onApply={triggerApply}
      />
    </div>
  );
}

function TemplateCard({
  template,
  actionLabel,
  onOpen,
  onApply,
}: {
  template: ProcessTemplate;
  actionLabel: string;
  onOpen: () => void;
  onApply: () => void;
}) {
  const steps = useMemo(() => extractSteps(template), [template]);
  const c = counts(steps);
  const scopeLabel = template.scope === "company" ? "Company template" : "Global template";

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="cursor-pointer rounded-[var(--r-md)] border-[var(--chalk)] bg-white p-5 transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ichigo-orange)]"
    >
      <FlowStrip steps={steps} max={7} />

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center rounded-md border border-[var(--ichigo-navy)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ichigo-navy)]">
            {template.category}
          </span>
          <span className="inline-flex items-center rounded-md border border-[var(--chalk)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--slate)]">
            {scopeLabel}
          </span>
          {template.internalExternal ? (
            <span className="inline-flex items-center rounded-md border border-[var(--chalk)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--slate)]">
              {template.internalExternal}
            </span>
          ) : null}
        </div>
        <Button
          type="button"
          className="bg-[var(--ichigo-orange)] text-white hover:bg-[var(--ichigo-orange)]/90"
          onClick={(e) => {
            e.stopPropagation();
            onApply();
          }}
        >
          {actionLabel}
        </Button>
      </div>

      <div className="mt-3">
        <p className="font-display text-[22px] font-medium leading-tight text-[var(--ichigo-navy)]">
          {template.name}
        </p>
        {template.departmentHint || template.processFamily ? (
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--slate)]">
            {template.departmentHint || template.processFamily}
          </p>
        ) : null}
        {template.description ? (
          <p className="mt-2 line-clamp-3 font-sans text-[13px] leading-6 text-[var(--graphite)]">
            {template.description}
          </p>
        ) : null}
      </div>

      <p className="mt-3 rounded-md bg-[var(--paper)] px-3 py-2 font-sans text-[12px] leading-5 text-[var(--graphite)]">
        Adapt this {c.steps + c.branches + c.approvals || steps.length}-step map to clarify handoffs, outputs, and decision points.
      </p>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <CountTile label="Steps" value={c.steps} />
        <CountTile label="Branches" value={c.branches} />
        <CountTile label="Approvals" value={c.approvals} />
      </div>

      {steps.length ? (
        <ol className="mt-3 space-y-1.5">
          {steps.slice(0, 5).map((s, i) => (
            <li
              key={`${s.id}-${i}`}
              className="flex items-start gap-3 rounded-md bg-[var(--paper)] px-3 py-2"
            >
              <span className="mt-0.5 w-4 shrink-0 text-right font-mono text-[11px] text-[var(--slate)]">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="font-sans text-[13px] font-medium text-[var(--ichigo-navy)]">{s.label}</p>
                {s.description ? (
                  <p className="line-clamp-1 font-sans text-[12px] text-[var(--graphite)]">{s.description}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {template.recommendedTools.slice(0, 5).map((tool) => (
          <span
            key={tool}
            className="inline-flex items-center rounded-md border border-[var(--chalk)] bg-white px-2 py-1 font-sans text-[11px] text-[var(--graphite)]"
          >
            {tool}
          </span>
        ))}
        {template.complexity ? (
          <span className="inline-flex items-center rounded-md border border-[var(--chalk)] bg-white px-2 py-1 font-sans text-[11px] text-[var(--graphite)]">
            {template.complexity}
          </span>
        ) : null}
        <span className="inline-flex items-center rounded-md border border-[var(--chalk)] bg-white px-2 py-1 font-sans text-[11px] text-[var(--graphite)]">
          confidence {template.confidenceScore}/5
        </span>
      </div>

      {template.kpis.length ? (
        <p className="mt-2 font-sans text-[12px] text-[var(--graphite)]">
          <span className="font-semibold text-[var(--ichigo-navy)]">KPIs:</span> {template.kpis.join(", ")}
        </p>
      ) : null}
      {template.aiAgentOpportunities.length ? (
        <p className="mt-1 font-sans text-[12px] text-[var(--graphite)]">
          <span className="font-semibold text-[var(--ichigo-navy)]">AI:</span> {template.aiAgentOpportunities.join(", ")}
        </p>
      ) : null}
    </Card>
  );
}

function CountTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-[var(--chalk)] bg-white px-3 py-2">
      <p className="font-display text-[20px] font-medium leading-none text-[var(--ichigo-navy)]">{value}</p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--slate)]">{label}</p>
    </div>
  );
}

function TemplateDetailDialog({
  template,
  actionLabel,
  onClose,
  onApply,
}: {
  template: ProcessTemplate | null;
  actionLabel: string;
  onClose: () => void;
  onApply: (t: ProcessTemplate) => void;
}) {
  const steps = useMemo(() => (template ? extractSteps(template) : []), [template]);
  const edges = template ? edgeCount(template) : 0;

  return (
    <Dialog open={!!template} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto border-[var(--chalk)] bg-white">
        {template ? (
          <>
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center rounded-md border border-[var(--ichigo-navy)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ichigo-navy)]">
                  {template.category}
                </span>
                <span className="inline-flex items-center rounded-md border border-[var(--chalk)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--slate)]">
                  {template.scope === "company" ? "Company template" : "Global template"}
                </span>
                {template.internalExternal ? (
                  <span className="inline-flex items-center rounded-md border border-[var(--chalk)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--slate)]">
                    {template.internalExternal}
                  </span>
                ) : null}
                {template.complexity ? (
                  <span className="inline-flex items-center rounded-md border border-[var(--chalk)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--slate)]">
                    {template.complexity}
                  </span>
                ) : null}
                <span className="inline-flex items-center rounded-md border border-[var(--chalk)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--slate)]">
                  confidence {template.confidenceScore}/5
                </span>
              </div>
              {template.departmentHint || template.processFamily ? (
                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ichigo-orange)]">
                  {template.departmentHint || template.processFamily}
                </p>
              ) : null}
              <DialogTitle className="font-display text-[28px] font-medium text-[var(--ichigo-navy)]">
                {template.name}
              </DialogTitle>
              {template.description ? (
                <p className="font-sans text-[13px] leading-6 text-[var(--graphite)]">
                  {template.description}
                </p>
              ) : null}
            </DialogHeader>

            {steps.length ? <FlowStrip steps={steps} max={steps.length} /> : null}

            <section>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--slate)]">Process steps</p>
              <p className="mt-1 font-sans text-[12px] text-[var(--graphite)]">
                {steps.length} steps · {edges} connections
              </p>
              <ol className="mt-3 space-y-2">
                {steps.map((s, i) => (
                  <li
                    key={`${s.id}-${i}`}
                    className="grid grid-cols-[24px_auto_1fr] items-start gap-3 rounded-md border border-[var(--chalk)] bg-white px-3 py-2.5"
                  >
                    <span className="pt-0.5 text-right font-mono text-[11px] text-[var(--slate)]">{i + 1}</span>
                    <div className="pt-0.5">{kindBadge(s.kind)}</div>
                    <div className="min-w-0">
                      <p className="font-sans text-[14px] font-semibold text-[var(--ichigo-navy)]">{s.label}</p>
                      {s.description ? (
                        <p className="mt-0.5 font-sans text-[12px] leading-5 text-[var(--graphite)]">{s.description}</p>
                      ) : null}
                      {s.input || s.output || s.tool ? (
                        <p className="mt-1 font-sans text-[11px] text-[var(--slate)]">
                          {s.tool ? <>{s.tool} · </> : null}
                          {s.input ? <>Input: {s.input}</> : null}
                          {s.input && s.output ? " · " : null}
                          {s.output ? <>Output: {s.output}</> : null}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            {template.objective ? (
              <section>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--slate)]">Objective</p>
                <p className="mt-1 font-sans text-[13px] leading-6 text-[var(--graphite)]">{template.objective}</p>
              </section>
            ) : null}

            <section className="grid gap-4 md:grid-cols-2">
              {template.departmentHint ? (
                <MetaSection label="Department" items={[template.departmentHint]} />
              ) : null}
              <MetaSection label="Tags" items={template.tags} />
              <MetaSection label="Recommended tools" items={template.recommendedTools} />
              <MetaSection label="KPIs" items={template.kpis} />
              <MetaSection label="Risks" items={template.risks} />
              <MetaSection label="Automation opportunities" items={template.automationOpportunities} />
              <MetaSection label="AI agent opportunities" items={template.aiAgentOpportunities} />
              <MetaSection label="Variations" items={template.variations} />
              <MetaSection label="Compliance" items={template.complianceTags} />
            </section>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button type="button" variant="outline" className="border-[var(--chalk)]" onClick={onClose}>
                Close
              </Button>
              <Button
                type="button"
                className="bg-[var(--ichigo-orange)] text-white hover:bg-[var(--ichigo-orange)]/90"
                onClick={() => onApply(template)}
              >
                {actionLabel}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
