import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ProcessTemplate } from "@/lib/db/pfs/process-templates";

export function TemplateLibraryIntro() {
  return (
    <section className="rounded-md border border-chalk bg-white p-5">
      <p className="eyebrow-muted">Template library</p>
      <h2 className="mt-2 text-[24px] font-semibold text-navy">Reusable process starting points</h2>
      <p className="mt-2 max-w-2xl text-[13px] leading-6 text-graphite">
        Start from a known operating pattern, then adapt the map to this workspace.
      </p>
    </section>
  );
}

export function ProcessTemplateBrowser({
  templates,
  onApply,
  actionLabel = "Use template",
}: {
  templates: ProcessTemplate[];
  onApply?: (template: ProcessTemplate) => void | boolean | Promise<void | boolean>;
  actionLabel?: string;
}) {
  if (!templates.length) {
    return (
      <Card className="border-chalk bg-white p-6">
        <p className="text-[14px] font-medium text-navy">No templates yet</p>
        <p className="mt-1 text-[13px] text-graphite">You can still map a process manually.</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {templates.map((template) => (
        <Card key={template.id} className="border-chalk bg-white p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-mist text-terracotta">
              <ClipboardCheck className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-navy">{template.name}</p>
              <p className="mt-1 text-[12px] uppercase tracking-wide text-slate">{template.category}</p>
            </div>
          </div>
          <p className="mt-3 line-clamp-3 text-[13px] leading-6 text-graphite">{template.description || template.objective}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {template.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-paper px-2 py-1 text-[11px] text-slate">
                {tag}
              </span>
            ))}
          </div>
          {onApply ? (
            <Button type="button" variant="outline" className="mt-4 w-full border-chalk" onClick={() => void onApply(template)}>
              {actionLabel}
            </Button>
          ) : null}
        </Card>
      ))}
    </div>
  );
}
