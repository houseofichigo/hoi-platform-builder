import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, BookOpen, CheckCircle2, Clock, FileText, Flag, Layers, Play } from "lucide-react";
import type { ReactNode } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { getModule, getModuleCourse, isValidModuleId, type ModuleId } from "@/lib/curriculum";
import { useAssessProgress, useWorkedExample } from "@/hooks/useAssess";
import { CourseMediaBlock } from "@/components/assess/CourseMediaBlock";

export const Route = createFileRoute("/app/$workspaceSlug/assess/$moduleId/")({
  component: ModuleOverview,
});

function ModuleOverview() {
  const { moduleId } = Route.useParams();
  const { workspace } = useWorkspace();
  const navigate = useNavigate();
  const { data: worked } = useWorkedExample();

  if (!workspace || !isValidModuleId(moduleId)) return null;
  const m = getModule(moduleId as ModuleId)!;
  const course = getModuleCourse(m.id);
  const { data: progress } = useAssessProgress(m.id);
  const slug = workspace.slug;

  const status = progress?.status ?? "not_started";
  const studied = progress?.studied ?? false;

  const primaryAction = (() => {
    if (status === "complete") return { label: "Review →", to: "work" as const };
    if (status === "in_progress") return { label: "Continue assignment →", to: "work" as const };
    if (studied) return { label: "Begin assignment →", to: "work" as const };
    return { label: "Start studying →", to: "study" as const };
  })();

  return (
    <div className="space-y-10">
      <section className="rounded-md border border-chalk bg-white px-6 py-8 md:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
          <div>
            <p className="eyebrow-muted">{course ? `COURSE: ${course.title} · ` : ""}MODULE OVERVIEW</p>
            <h2 className="mt-3 font-display text-[38px] leading-tight text-navy md:text-[54px]">
              {m.title}
            </h2>
            <p className="lead mt-4 max-w-[66ch]">{m.description}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  navigate({
                    to:
                      primaryAction.to === "study"
                        ? "/app/$workspaceSlug/assess/$moduleId/study"
                        : "/app/$workspaceSlug/assess/$moduleId/work",
                    params: { workspaceSlug: slug, moduleId: m.id },
                  })
                }
                className="btn-ichigo btn-ichigo-primary"
              >
                {primaryAction.label.replace(" →", "")} <ArrowRight className="h-4 w-4" />
              </button>
              <Link
                to="/app/$workspaceSlug/assess/$moduleId/study"
                params={{ workspaceSlug: slug, moduleId: m.id }}
                className="btn-ichigo btn-ichigo-outline"
              >
                Read lesson
              </Link>
            </div>
          </div>
          <aside className="rounded-md border border-chalk bg-paper p-5">
            <p className="eyebrow-muted">MODULE STATUS</p>
            <dl className="mt-4 space-y-3 text-[13px]">
              <div className="flex justify-between gap-4">
                <dt className="text-slate">Progress</dt>
                <dd className="font-medium text-navy">
                  {status === "complete" ? "Complete" : status === "in_progress" ? "In progress" : "Not started"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate">Study</dt>
                <dd className="font-medium text-navy">{studied ? "Studied" : "Open"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate">Duration</dt>
                <dd className="font-medium text-navy">{m.duration}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate">Artifact</dt>
                <dd className="text-right font-medium text-navy">{m.deliverable}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <main className="space-y-10">
          <CourseSection icon={BookOpen} eyebrow="ABOUT THIS MODULE" title="Why this matters">
            <p>{m.description}</p>
            {worked && <p>{worked.contextBlurb}</p>}
          </CourseSection>

          <CourseSection icon={CheckCircle2} eyebrow="OBJECTIVES" title="What you will learn">
            <ul className="space-y-3">
              {m.objectives.map((objective) => (
                <li key={objective} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
                  <span>{objective}</span>
                </li>
              ))}
            </ul>
          </CourseSection>

          <CourseSection icon={Layers} eyebrow="CONCEPTS" title="Core ideas">
            <div className="divide-y divide-chalk border-y border-chalk">
              {m.concepts.map((concept) => (
                <div key={concept.term} className="py-4">
                  <h3 className="text-[16px] font-semibold text-navy">{concept.term}</h3>
                  <p className="mt-1 text-[14px] leading-relaxed text-graphite">{concept.definition}</p>
                </div>
              ))}
            </div>
          </CourseSection>

          <CourseSection icon={Play} eyebrow="LESSONS & ASSIGNMENT" title="How this module works">
            <div className="grid gap-3 md:grid-cols-2">
              <LessonCard
                label="Study"
                title="Read the lesson"
                body={`A guided reader built from the module concepts, the worked example, and the assignment preview.`}
                to="/app/$workspaceSlug/assess/$moduleId/study"
                slug={slug}
                moduleId={m.id}
              />
              <LessonCard
                label="Assignment"
                title="Complete the work"
                body={m.assignment}
                to="/app/$workspaceSlug/assess/$moduleId/work"
                slug={slug}
                moduleId={m.id}
              />
              {m.gateNumber && (
                <LessonCard
                  label={`Gate ${m.gateNumber}`}
                  title={m.gateNumber === 3 ? "Investment decision" : "Readiness decision"}
                  body={m.gateNumber === 3 ? "Use the completed module evidence for the formal portfolio decision." : "Use the assignment evidence to decide whether to continue, constrain, improve, or stop."}
                  to="/app/$workspaceSlug/assess/$moduleId/gate"
                  slug={slug}
                  moduleId={m.id}
                />
              )}
            </div>
          </CourseSection>
        </main>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {course && (
            <div className="rounded-md border border-chalk bg-white p-5">
              <p className="eyebrow-muted">COURSE</p>
              <p className="mt-3 text-[16px] font-semibold text-navy">{course.title}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-graphite">
                {course.level} · {course.duration} · {course.modules.length} modules
              </p>
            </div>
          )}
          <div className="rounded-md border border-chalk bg-white p-5">
            <p className="eyebrow-muted">WHAT YOU'LL BUILD</p>
            <p className="mt-3 text-[14px] leading-relaxed text-navy">{m.assignment}</p>
          </div>
          <div className="rounded-md border border-terracotta/25 bg-terracotta/5 p-5">
            <p className="eyebrow text-terracotta">PRODUCES</p>
            <p className="mt-3 text-[14px] leading-relaxed text-navy">{m.outcome}</p>
          </div>
          {worked && (
            <div className="rounded-md border border-chalk bg-white p-5">
              <p className="eyebrow-muted">WORKED EXAMPLE</p>
              <p className="mt-3 text-[14px] font-semibold text-navy">{worked.name}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-slate">{worked.industry}</p>
              <p className="mt-3 text-[13px] leading-relaxed text-graphite">{worked.contextBlurb}</p>
            </div>
          )}
          {m.prereq && (
            <div className="rounded-md border border-chalk bg-white p-5">
              <p className="eyebrow-muted">PREREQUISITE</p>
              <Link
                to="/app/$workspaceSlug/assess/$moduleId"
                params={{ workspaceSlug: slug, moduleId: m.prereq }}
                className="mt-3 inline-flex items-center gap-2 text-[14px] font-medium text-terracotta hover:opacity-80"
              >
                {getModule(m.prereq)?.title} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
          <div className="rounded-md border border-chalk bg-white p-5">
            <p className="eyebrow-muted">RESOURCES</p>
            <div className="mt-3 space-y-2 text-[13px] text-graphite">
              <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-slate" /> {m.duration} · ~{m.estimatedMinutes} min</p>
              <p className="flex items-center gap-2"><FileText className="h-4 w-4 text-slate" /> {m.deliverable}</p>
              {m.gateNumber && <p className="flex items-center gap-2"><Flag className="h-4 w-4 text-slate" /> Gate {m.gateNumber}</p>}
            </div>
          </div>
          {course && <CourseMediaBlock media={course.primaryMedia} compact />}
        </aside>
      </div>

      <footer className="sticky bottom-0 z-20 -mx-4 flex items-center justify-between gap-4 border-t border-chalk bg-paper/95 px-4 py-4 backdrop-blur sm:mx-0 sm:px-0">
        <Link
          to="/app/$workspaceSlug/assess"
          params={{ workspaceSlug: slug }}
          className="text-[13px] font-medium text-slate hover:text-navy"
        >
          ← Back to Assess
        </Link>
        <button
          type="button"
          onClick={() =>
            navigate({
              to:
                primaryAction.to === "study"
                  ? "/app/$workspaceSlug/assess/$moduleId/study"
                  : "/app/$workspaceSlug/assess/$moduleId/work",
              params: { workspaceSlug: slug, moduleId: m.id },
            })
          }
          className="btn-ichigo btn-ichigo-primary"
        >
          {primaryAction.label}
        </button>
      </footer>
    </div>
  );
}

function CourseSection({
  icon: Icon,
  eyebrow,
  title,
  children,
}: {
  icon: typeof BookOpen;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mist text-terracotta">
          <Icon className="h-4.5 w-4.5" />
        </span>
        <div>
          <p className="eyebrow-muted">{eyebrow}</p>
          <h2 className="mt-1 font-display text-[28px] leading-tight text-navy">{title}</h2>
        </div>
      </div>
      <div className="prose-ichigo pl-0 md:pl-12">{children}</div>
    </section>
  );
}

function LessonCard({
  label,
  title,
  body,
  to,
  slug,
  moduleId,
}: {
  label: string;
  title: string;
  body: string;
  to:
    | "/app/$workspaceSlug/assess/$moduleId/study"
    | "/app/$workspaceSlug/assess/$moduleId/work"
    | "/app/$workspaceSlug/assess/$moduleId/gate";
  slug: string;
  moduleId: ModuleId;
}) {
  return (
    <Link
      to={to}
      params={{ workspaceSlug: slug, moduleId }}
      className="rounded-md border border-chalk bg-white p-4 transition-colors hover:border-terracotta/50"
    >
      <p className="eyebrow-muted">{label}</p>
      <h3 className="mt-2 text-[16px] font-semibold text-navy">{title}</h3>
      <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-graphite">{body}</p>
      <span className="mt-4 inline-flex items-center gap-2 text-[13px] font-medium text-terracotta">
        Open <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}
