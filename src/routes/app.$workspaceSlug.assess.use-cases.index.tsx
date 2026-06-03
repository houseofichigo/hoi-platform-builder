import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Lock, Sparkles } from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { USE_CASE_TRACKS, type UseCaseTrack } from "@/lib/assess/use-case-tracks";

export const Route = createFileRoute("/app/$workspaceSlug/assess/use-cases/")({
  component: UseCaseTracksPage,
});

function UseCaseTracksPage() {
  const { workspace } = useWorkspace();
  if (!workspace) return null;
  const slug = workspace.slug;

  return (
    <div className="space-y-8">
      <header className="rounded-md border border-chalk bg-white px-6 py-8 md:px-8">
        <p className="eyebrow">
          <Link to="/app/$workspaceSlug/assess" params={{ workspaceSlug: slug }} className="hover:text-terracotta">
            ← ASSESS
          </Link>{" "}
          · CAPSTONE LIBRARY
        </p>
        <h1 className="mt-8 font-display text-[44px] leading-tight text-navy md:text-[58px]">
          Capstone cases.
          <br />
          <span className="accent-italic">One method, many cases.</span>
        </h1>
        <p className="lead mt-5 max-w-[74ch]">
          The core course teaches the universal method. Capstone cases apply that method end-to-end
          to a specific workflow for Tier 02 certification. Invoice OCR is the first preview; the others show the future case library.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        {USE_CASE_TRACKS.map((track) => (
          <TrackCard key={track.id} track={track} workspaceSlug={slug} />
        ))}
      </section>
    </div>
  );
}

function TrackCard({ track, workspaceSlug }: { track: UseCaseTrack; workspaceSlug: string }) {
  const active = track.status === "active";
  return (
    <article className={`rounded-md border bg-white p-5 ${active ? "border-terracotta/35" : "border-chalk"}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow-muted">{track.function}</p>
          <h2 className="mt-2 font-display text-[28px] leading-tight text-navy">{track.title}</h2>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] ${
            active ? "bg-terracotta/10 text-terracotta" : "bg-mist text-slate"
          }`}
        >
          {active ? <BadgeCheck className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
          {active ? "Preview" : "Coming soon"}
        </span>
      </div>
      <dl className="mt-5 space-y-3 text-[13px] leading-relaxed">
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate">Workflow</dt>
          <dd className="mt-1 text-graphite">{track.workflow}</dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate">Pattern</dt>
          <dd className="mt-1 text-graphite">{track.agentPattern}</dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate">Why it matters</dt>
          <dd className="mt-1 text-navy">{track.why}</dd>
        </div>
      </dl>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          to="/app/$workspaceSlug/assess/use-cases/$trackId"
          params={{ workspaceSlug, trackId: track.slug }}
          className={active ? "btn-ichigo btn-ichigo-primary" : "btn-ichigo btn-ichigo-outline"}
        >
          {active ? "Preview capstone" : "View case preview"} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        {active && (
          <Link
            to="/app/$workspaceSlug/assess/use-cases/$trackId/$moduleId"
            params={{ workspaceSlug, trackId: track.slug, moduleId: "m01" }}
            className="btn-ichigo btn-ichigo-outline"
          >
            Open OCR preview <Sparkles className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </article>
  );
}
