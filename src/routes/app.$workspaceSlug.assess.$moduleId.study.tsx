import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowRight, BookOpen, Check, FileText, Lightbulb, PlayCircle, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { getModule, getModuleCourse, isValidModuleId, type ModuleId } from "@/lib/curriculum";
import { useAssessProgress, useWorkedExample } from "@/hooks/useAssess";
import { TokenizerLab } from "@/components/assess/TokenizerLab";

export const Route = createFileRoute("/app/$workspaceSlug/assess/$moduleId/study")({
  component: ModuleStudy,
});

function ModuleStudy() {
  const { moduleId } = Route.useParams();
  const { workspace } = useWorkspace();
  const navigate = useNavigate();
  const { data: worked } = useWorkedExample();
  if (!workspace || !isValidModuleId(moduleId)) return null;
  const m = getModule(moduleId as ModuleId)!;
  const course = getModuleCourse(m.id);
  const { data: progress, setStudied } = useAssessProgress(m.id);
  const slug = workspace.slug;
  const studied = progress?.studied ?? false;

  const markStudied = async (shouldNavigate = false) => {
    try {
      await setStudied.mutateAsync(true);
      toast.success("Marked as studied");
      if (shouldNavigate) {
        navigate({
          to: "/app/$workspaceSlug/assess/$moduleId/work",
          params: { workspaceSlug: slug, moduleId: m.id },
        });
      }
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-10">
      <header className="max-w-[78ch] space-y-4">
        <p className="eyebrow-muted">
          {course ? `COURSE: ${course.title} · ` : ""}LESSON · M{String(m.num).padStart(2, "0")} · ~{m.estimatedMinutes} MIN
        </p>
        <h2 className="font-display text-[40px] leading-tight text-navy md:text-[58px]">
          {m.title}
        </h2>
        <p className="lead">{m.subtitle}</p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <main className="max-w-[78ch] space-y-12">
          <ReaderSection icon={BookOpen} title="What this lesson is about">
            <p>{m.description}</p>
            <p>
              Read this as the framing layer for the assignment. The aim is to make
              the concept usable: enough language to discuss it with your team, enough
              structure to apply it, and enough caution to know where it can fail.
            </p>
          </ReaderSection>

          <ReaderSection icon={Lightbulb} title="Core ideas">
            <div className="divide-y divide-chalk border-y border-chalk">
              {m.concepts.map((concept) => (
                <div key={concept.term} className="py-5">
                  <h3 className="text-[18px] font-semibold text-navy">{concept.term}</h3>
                  <p className="mt-2 text-[16px] leading-relaxed text-graphite">{concept.definition}</p>
                </div>
              ))}
            </div>
          </ReaderSection>

          <ReaderSection icon={Sparkles} title="What to pay attention to">
            <ul className="space-y-3">
              {m.objectives.map((objective) => (
                <li key={objective} className="flex gap-3">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-terracotta" />
                  <span>{objective}</span>
                </li>
              ))}
            </ul>
          </ReaderSection>

          {worked && (
            <ReaderSection icon={PlayCircle} title={`Apply it to ${worked.shortName}`}>
              <p>{worked.contextBlurb}</p>
              <p>
                In this module, use the worked example as a controlled practice case:
                keep the business context stable, notice which decisions are repeatable,
                and capture the evidence that future Build and Scale work will need.
              </p>
            </ReaderSection>
          )}

          {m.id === "m01" && (
            <section className="rounded-md border border-chalk bg-white p-5">
              <div className="mb-4 max-w-[68ch]">
                <p className="eyebrow-muted">TRY IT · TOKENIZER LAB</p>
                <h3 className="mt-2 font-display text-[28px] leading-tight text-navy">Tokens, length, and cost</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-graphite">
                  LLMs charge by tokens, not words. Paste text or pick a preset to see how volume
                  drives estimated cost and why context size matters.
                </p>
              </div>
              <TokenizerLab />
            </section>
          )}

          <ReaderSection icon={FileText} title="Assignment preview">
            <p>{m.assignment}</p>
            <div className="rounded-md border border-terracotta/25 bg-terracotta/5 p-4">
              <p className="eyebrow text-terracotta">PRODUCES</p>
              <p className="mt-2 text-[14px] leading-relaxed text-navy">{m.outcome}</p>
            </div>
          </ReaderSection>
        </main>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {course && (
            <div className="rounded-md border border-chalk bg-white p-5">
              <p className="eyebrow-muted">COURSE</p>
              <p className="mt-3 text-[16px] font-semibold text-navy">{course.title}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-graphite">
                {course.level} · {course.duration}
              </p>
            </div>
          )}
          <div className="rounded-md border border-chalk bg-white p-5">
            <p className="eyebrow-muted">LESSON STATUS</p>
            <div className="mt-4 flex items-center gap-3">
              <span className={`flex h-9 w-9 items-center justify-center rounded-full ${studied ? "bg-terracotta text-white" : "bg-mist text-slate"}`}>
                <Check className="h-4 w-4" strokeWidth={3} />
              </span>
              <div>
                <p className="text-[14px] font-semibold text-navy">{studied ? "Studied" : "Not marked yet"}</p>
                <p className="text-[12px] text-slate">Marking this saves your study progress.</p>
              </div>
            </div>
            <button
              type="button"
              disabled={setStudied.isPending}
              onClick={() =>
                studied
                  ? setStudied.mutate(false, {
                      onSuccess: () => toast.success("Marked as not studied"),
                      onError: (e) => toast.error((e as Error).message),
                    })
                  : markStudied()
              }
              className="mt-4 w-full rounded-md border border-chalk px-3 py-2 text-[13px] font-medium text-navy transition-colors hover:border-terracotta disabled:opacity-50"
            >
              {studied ? "Mark as not studied" : "Mark as studied"}
            </button>
          </div>

          <div className="rounded-md border border-chalk bg-paper p-5">
            <p className="eyebrow-muted">NEXT</p>
            <p className="mt-3 text-[14px] leading-relaxed text-navy">{m.assignment}</p>
          </div>
        </aside>
      </div>

      <footer className="sticky bottom-0 z-20 -mx-4 flex items-center justify-between gap-4 border-t border-chalk bg-paper/95 px-4 py-4 backdrop-blur sm:mx-0 sm:px-0">
        <Link
          to="/app/$workspaceSlug/assess/$moduleId"
          params={{ workspaceSlug: slug, moduleId: m.id }}
          className="text-[13px] font-medium text-slate hover:text-navy"
        >
          ← Back to overview
        </Link>
        <button
          type="button"
          disabled={setStudied.isPending}
          onClick={() => {
            if (!studied) {
              markStudied(true);
              return;
            }
            navigate({
              to: "/app/$workspaceSlug/assess/$moduleId/work",
              params: { workspaceSlug: slug, moduleId: m.id },
            });
          }}
          className="btn-ichigo btn-ichigo-primary"
        >
          Continue to assignment <ArrowRight className="h-4 w-4" />
        </button>
      </footer>
    </div>
  );
}

function ReaderSection({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof BookOpen;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mist text-terracotta">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="font-display text-[30px] leading-tight text-navy">{title}</h3>
      </div>
      <div className="prose-ichigo text-[17px] leading-relaxed md:pl-[52px]">{children}</div>
    </section>
  );
}
