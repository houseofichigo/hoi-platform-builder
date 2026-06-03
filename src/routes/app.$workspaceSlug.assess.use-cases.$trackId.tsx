import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Circle, Lock } from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { getModule } from "@/lib/curriculum";
import { getUseCaseTrack } from "@/lib/assess/use-case-tracks";

export const Route = createFileRoute("/app/$workspaceSlug/assess/use-cases/$trackId")({
  component: UseCaseTrackOverview,
});

function UseCaseTrackOverview() {
  const { workspace } = useWorkspace();
  const { trackId } = Route.useParams();
  if (!workspace) return null;
  const track = getUseCaseTrack(trackId);
  const slug = workspace.slug;

  if (!track) {
    return (
      <div className="rounded-md border border-chalk bg-white p-6">
        <p className="eyebrow-muted">CAPSTONE CASE</p>
        <h1 className="mt-2 font-display text-[34px] text-navy">Case not found.</h1>
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

  const active = track.status === "active";

  return (
    <div className="space-y-8">
      <header className="rounded-md border border-chalk bg-white px-6 py-8 md:px-8">
        <p className="eyebrow">
          <Link to="/app/$workspaceSlug/assess/use-cases" params={{ workspaceSlug: slug }} className="hover:text-terracotta">
            ← CAPSTONE LIBRARY
          </Link>{" "}
          · {track.function.toUpperCase()}
        </p>
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
          <div>
            <h1 className="font-display text-[44px] leading-tight text-navy md:text-[58px]">
              {track.title}
            </h1>
            <p className="lead mt-4 max-w-[74ch]">{track.workflow}</p>
          </div>
          <aside className="rounded-md border border-chalk bg-paper p-5">
            <p className="eyebrow-muted">CAPSTONE STATUS</p>
            <p className="mt-3 inline-flex items-center gap-2 text-[14px] font-semibold text-navy">
              {active ? <BadgeCheck className="h-4 w-4 text-terracotta" /> : <Lock className="h-4 w-4 text-slate" />}
              {active ? "Read-only preview" : "Coming soon"}
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-graphite">
              {active
                ? "Read-only for now. Formal capstone completion and Tier 02 persistence will be added after the core assignment rewrite."
                : "This case shows the future capstone model. Full content will be added later."}
            </p>
          </aside>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Fact label="Agent pattern" value={track.agentPattern} />
        <Fact label="Why it matters" value={track.why} />
        <Fact
          label="Certification"
          value={track.certificationEligible ? "Tier 02-ready after interactive persistence ships." : "Preview case."}
        />
      </section>

      <section className="rounded-md border border-chalk bg-white p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow-muted">CAPSTONE MAP</p>
            <h2 className="mt-1 font-display text-[30px] text-navy">Apply the course method to this case.</h2>
          </div>
          {active && (
            <Link
              to="/app/$workspaceSlug/assess/use-cases/$trackId/$moduleId"
              params={{ workspaceSlug: slug, trackId: track.slug, moduleId: "m01" }}
              className="btn-ichigo btn-ichigo-primary"
            >
              Open M01 preview <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
        <div className="mt-5 divide-y divide-chalk border-y border-chalk">
          {track.modules.map((moduleId) => {
            const module = getModule(moduleId);
            const step = track.stepsByModule[moduleId];
            return (
              <Link
                key={moduleId}
                to={active ? "/app/$workspaceSlug/assess/use-cases/$trackId/$moduleId" : "/app/$workspaceSlug/assess/use-cases/$trackId"}
                params={{ workspaceSlug: slug, trackId: track.slug, moduleId }}
                className={`flex items-start gap-4 py-4 ${active ? "hover:bg-mist/40" : "pointer-events-none opacity-60"}`}
              >
                <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate/40 bg-white">
                  <Circle className="h-3 w-3 text-slate" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate">
                    {module?.id.toUpperCase()} · {module?.title}
                  </p>
                  <h3 className="mt-1 text-[16px] font-semibold text-navy">{step?.title ?? "Capstone step coming soon"}</h3>
                  <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-graphite">
                    {step?.summary ?? "This applied step will be added in a later content batch."}
                  </p>
                </div>
                {active && <span className="shrink-0 text-[13px] font-medium text-terracotta">Open →</span>}
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-chalk bg-white p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate">{label}</p>
      <p className="mt-2 text-[14px] leading-relaxed text-navy">{value}</p>
    </div>
  );
}
