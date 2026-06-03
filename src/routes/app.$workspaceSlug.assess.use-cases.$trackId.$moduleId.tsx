import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, FileText, Lock } from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { getModule, isValidModuleId, type ModuleId } from "@/lib/curriculum";
import { getUseCaseTrack, getUseCaseTrackStep } from "@/lib/assess/use-case-tracks";

export const Route = createFileRoute("/app/$workspaceSlug/assess/use-cases/$trackId/$moduleId")({
  component: UseCaseTrackStepPage,
});

function UseCaseTrackStepPage() {
  const { workspace } = useWorkspace();
  const { trackId, moduleId } = Route.useParams();
  if (!workspace) return null;
  const slug = workspace.slug;
  const track = getUseCaseTrack(trackId);

  if (!track || !isValidModuleId(moduleId)) {
    return (
      <div className="rounded-md border border-chalk bg-white p-6">
        <p className="eyebrow-muted">CAPSTONE CASE</p>
        <h1 className="mt-2 font-display text-[34px] text-navy">Capstone step not found.</h1>
        <Link
          to="/app/$workspaceSlug/assess/use-cases"
          params={{ workspaceSlug: slug }}
          className="mt-4 inline-flex items-center gap-2 text-[13px] font-medium text-terracotta"
        >
          Back to capstone library <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  const module = getModule(moduleId as ModuleId)!;
  const step = getUseCaseTrackStep(track.slug, module.id);
  const active = track.status === "active";

  if (!step || !active) {
    return (
      <div className="space-y-6">
        <header className="rounded-md border border-chalk bg-white p-6">
          <p className="eyebrow">
            <Link
              to="/app/$workspaceSlug/assess/use-cases/$trackId"
              params={{ workspaceSlug: slug, trackId: track.slug }}
              className="hover:text-terracotta"
            >
              ← {track.title.toUpperCase()}
            </Link>
          </p>
          <h1 className="mt-6 font-display text-[40px] text-navy">{module.title}</h1>
          <p className="lead mt-3">This capstone step is coming soon.</p>
        </header>
      </div>
    );
  }

  const nextModule = track.modules[track.modules.indexOf(module.id) + 1] ?? null;

  return (
    <div className="space-y-8">
      <header className="rounded-md border border-chalk bg-white px-6 py-8 md:px-8">
        <p className="eyebrow">
          <Link
            to="/app/$workspaceSlug/assess/use-cases/$trackId"
            params={{ workspaceSlug: slug, trackId: track.slug }}
            className="hover:text-terracotta"
          >
            ← {track.title.toUpperCase()}
          </Link>{" "}
          · {module.id.toUpperCase()}
        </p>
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
          <div>
            <h1 className="font-display text-[40px] leading-tight text-navy md:text-[54px]">
              {step.title}
            </h1>
            <p className="lead mt-4 max-w-[74ch]">{step.summary}</p>
          </div>
          <aside className="rounded-md border border-terracotta/25 bg-terracotta/5 p-5">
            <p className="eyebrow text-terracotta">READ-ONLY APPLIED TRACK</p>
            <p className="mt-3 text-[13px] leading-relaxed text-navy">
              This OCR step is a reference layer. It does not complete your core assignment or write
              artifact outputs.
            </p>
          </aside>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <main className="space-y-6">
          <section className="rounded-md border border-chalk bg-white p-5">
            <p className="eyebrow-muted">CONCEPT APPLIED</p>
            <p className="mt-3 text-[16px] leading-relaxed text-navy">{step.conceptApplied}</p>
          </section>

          <section className="rounded-md border border-chalk bg-white p-5">
            <p className="eyebrow-muted">EXAMPLE ARTIFACT</p>
            <h2 className="mt-2 font-display text-[28px] leading-tight text-navy">{step.exampleArtifact}</h2>
            <ul className="mt-4 grid gap-3 md:grid-cols-2">
              {step.sourceOutputs.map((output) => (
                <li key={output} className="rounded-md border border-chalk bg-paper p-3 text-[13px] leading-relaxed text-graphite">
                  <CheckCircle2 className="mb-2 h-4 w-4 text-terracotta" />
                  {output}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-md border border-chalk bg-white p-5">
            <p className="eyebrow-muted">TRANSFER NOTE</p>
            <p className="mt-3 text-[15px] leading-relaxed text-graphite">{step.recommendedAction}</p>
          </section>
        </main>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-md border border-chalk bg-white p-5">
            <p className="eyebrow-muted">CORE MODULE</p>
            <h3 className="mt-2 text-[17px] font-semibold text-navy">{module.title}</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-graphite">{module.assignment}</p>
            <Link
              to="/app/$workspaceSlug/assess/$moduleId/work"
              params={{ workspaceSlug: slug, moduleId: module.id }}
              className="mt-4 inline-flex items-center gap-2 text-[13px] font-medium text-terracotta hover:opacity-80"
            >
              Open core assignment <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="rounded-md border border-chalk bg-paper p-5">
            <p className="eyebrow-muted">TRACK BOUNDARY</p>
            <p className="mt-2 flex gap-2 text-[13px] leading-relaxed text-graphite">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-slate" />
              Tier 02 completion tracking will be added later. For now, use this as a reference while
              completing the universal course assignment.
            </p>
          </div>
        </aside>
      </div>

      <footer className="sticky bottom-0 z-20 -mx-4 flex items-center justify-between gap-4 border-t border-chalk bg-paper/95 px-4 py-4 backdrop-blur sm:mx-0 sm:px-0">
        <Link
          to="/app/$workspaceSlug/assess/use-cases/$trackId"
          params={{ workspaceSlug: slug, trackId: track.slug }}
          className="text-[13px] font-medium text-slate hover:text-navy"
        >
          ← Back to OCR track
        </Link>
        {nextModule ? (
          <Link
            to="/app/$workspaceSlug/assess/use-cases/$trackId/$moduleId"
            params={{ workspaceSlug: slug, trackId: track.slug, moduleId: nextModule }}
            className="btn-ichigo btn-ichigo-primary"
          >
            Next OCR step <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <Link
            to="/app/$workspaceSlug/assess/complete"
            params={{ workspaceSlug: slug }}
            className="btn-ichigo btn-ichigo-primary"
          >
            Review course completion <FileText className="h-4 w-4" />
          </Link>
        )}
      </footer>
    </div>
  );
}
