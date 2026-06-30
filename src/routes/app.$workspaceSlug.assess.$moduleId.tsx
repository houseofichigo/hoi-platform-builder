import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { CheckCircle2, Clock, Circle, PlayCircle } from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { getModule, getModuleCourse, isValidModuleId, type ModuleId } from "@/lib/curriculum";
import { useAssessProgress } from "@/hooks/useAssess";
import { ModuleTabs } from "@/components/assess/ModuleTabs";

export const Route = createFileRoute("/app/$workspaceSlug/assess/$moduleId")({
  component: ModuleLayout,
});

function ModuleLayout() {
  const { moduleId } = Route.useParams();
  const { workspace } = useWorkspace();

  if (!workspace) return null;
  if (!isValidModuleId(moduleId)) {
    return <p className="text-slate">Unknown module.</p>;
  }
  const m = getModule(moduleId as ModuleId)!;
  const course = getModuleCourse(m.id);
  const { data: progress, isLoading } = useAssessProgress(m.id);
  const slug = workspace.slug;
  const status = progress?.status ?? "not_started";
  const statusLabel =
    status === "complete" ? "Complete" : status === "in_progress" ? "In progress" : "Not started";
  const StatusIcon =
    status === "complete" ? CheckCircle2 : status === "in_progress" ? PlayCircle : Circle;

  return (
    <div className="space-y-7">
      <p className="eyebrow">
        <Link to="/app/$workspaceSlug/assess" params={{ workspaceSlug: slug }} className="hover:text-terracotta">
          ← ASSESS
        </Link>{" "}
        · {course ? `COURSE: ${course.title.toUpperCase()} · ` : ""}M{String(m.num).padStart(2, "0")}
      </p>

      <header className="rounded-md border border-chalk bg-white px-5 py-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="eyebrow-muted">
              {course ? `COURSE: ${course.title} · ` : ""}MODULE {String(m.num).padStart(2, "0")} · {m.phaseName}
            </p>
            <h1 className="mt-1 font-display text-[30px] leading-tight text-navy md:text-[38px]">
              {m.title}
            </h1>
            <p className="mt-2 max-w-[72ch] text-[15px] leading-relaxed text-graphite">{m.subtitle}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 md:justify-end">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-mist px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-slate">
              <Clock className="h-3.5 w-3.5" /> {m.duration}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-terracotta/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-terracotta">
              <StatusIcon className="h-3.5 w-3.5" /> {statusLabel}
            </span>
          </div>
        </div>
      </header>

      <ModuleTabs
        workspaceSlug={slug}
        moduleId={m.id}
        progress={progress ?? undefined}
        isLoading={isLoading}
      />

      <Outlet />
    </div>
  );
}
