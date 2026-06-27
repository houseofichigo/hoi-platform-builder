// @ts-nocheck — Ported PFS module.
import { createFileRoute } from "@tanstack/react-router";

import { ProcessTemplateBrowser, TemplateLibraryIntro } from "@/components/build/pfs/process-template-library";
import { Card } from "@/components/ui/card";
import { useProcessTemplates } from "@/lib/db/pfs/process-templates";

export const Route = createFileRoute("/app/$workspaceSlug/build/templates")({
  ssr: false,
  component: TemplateLibraryScreen,
  errorComponent: ({ error }) => (
    <TemplateState title="Template library did not load" detail={error.message} />
  ),
});

function TemplateLibraryScreen() {
  const templatesQuery = useProcessTemplates();
  return (
    <div className="space-y-5">
      <TemplateLibraryIntro />
      {templatesQuery.isLoading ? (
        <TemplateState title="Loading template library" detail="Fetching reusable process blueprints." />
      ) : templatesQuery.isError ? (
        <TemplateState title="Template library did not load" detail={templatesQuery.error.message} />
      ) : (
        <ProcessTemplateBrowser templates={templatesQuery.data ?? []} />
      )}
    </div>
  );
}

function TemplateState({ title, detail }: { title: string; detail: string }) {
  return (
    <Card className="rounded-[var(--r-md)] border-[var(--chalk)] bg-white p-8 text-center">
      <p className="font-display text-[30px] font-medium tracking-normal text-[var(--ichigo-navy)]">{title}</p>
      <p className="mx-auto mt-2 max-w-xl font-sans text-[15px] text-[var(--slate)]">{detail}</p>
    </Card>
  );
}