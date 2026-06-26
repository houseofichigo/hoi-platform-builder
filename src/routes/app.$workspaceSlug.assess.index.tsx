import { useMemo, useState, type MouseEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowRight, Check, Circle, FileText, Flag, Lock, Play } from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import {
  ARTIFACTS,
  COURSES,
  DEFAULT_ASSESS_COURSE_ID,
  MODULES,
  PHASES,
  getCourse,
  getCourseModules,
  getModule,
  type AssessCourseMeta,
  type ModuleId,
  type ModuleMeta,
} from "@/lib/curriculum";
import {
  currentResumeModule,
  useAssessAllProgress,
  type AssessProgressRow,
} from "@/hooks/useAssess";
import { CourseMediaBlock } from "@/components/assess/CourseMediaBlock";

export const Route = createFileRoute("/app/$workspaceSlug/assess/")({
  component: AssessHome,
});

type CourseTab = "courses" | "curriculum" | "artifacts" | "gates" | "about";

function AssessHome() {
  const { workspace } = useWorkspace();
  const { data: progress } = useAssessAllProgress();
  const [tab, setTab] = useState<CourseTab>("courses");
  const course = getCourse(DEFAULT_ASSESS_COURSE_ID)!;
  const courseModules = useMemo(() => getCourseModules(course.id), [course.id]);

  const stats = useMemo(() => {
    const completed = courseModules.filter((m) => progress?.[m.id]?.status === "complete").length;
    const inProgress = courseModules.filter((m) => progress?.[m.id]?.status === "in_progress").length;
    const percent = Math.round((completed / courseModules.length) * 100);
    const resume = currentResumeModule(progress);
    const resumeProgress = progress?.[resume.module.id];
    const target: "/app/$workspaceSlug/assess/$moduleId" | "/app/$workspaceSlug/assess/$moduleId/work" =
      resumeProgress?.status === "in_progress" || resumeProgress?.studied
        ? "/app/$workspaceSlug/assess/$moduleId/work"
        : "/app/$workspaceSlug/assess/$moduleId";

    return { completed, inProgress, percent, resume, target };
  }, [courseModules, progress]);

  if (!workspace) return null;
  const slug = workspace.slug;
  const currentArtifact =
    ARTIFACTS.find((artifact) => artifact.modules.some((m) => progress?.[m]?.status !== "complete")) ??
    ARTIFACTS[ARTIFACTS.length - 1];

  return (
    <div className="space-y-12">
      <CourseHero
        course={course}
        workspaceName={workspace.name}
        slug={slug}
        percent={stats.percent}
        completed={stats.completed}
        inProgress={stats.inProgress}
        resumeModule={stats.resume.module}
        resumeStarted={stats.resume.started}
        resumeTarget={stats.target}
        currentArtifact={currentArtifact.title}
        totalModules={courseModules.length}
      />

      {progress?.m12?.status === "complete" && (
        <NoticeCard
          eyebrow="PROGRAM COMPLETION READY"
          title="Review your artifacts, gates, and certification readiness."
          body="The completion dashboard gathers the evidence trail from all twelve modules into one executive view."
          actionLabel="Open completion dashboard"
          to="/app/$workspaceSlug/assess/complete"
          slug={slug}
        />
      )}

      <section className="space-y-6">
        <nav className="flex gap-2 overflow-x-auto border-b border-chalk" aria-label="Assess course sections">
          {([
            ["courses", "Courses"],
            ["curriculum", "Current course"],
            ["artifacts", "Artifacts"],
            ["gates", "Gates"],
            ["about", "About"],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`border-b-2 px-4 py-3 text-[14px] font-medium transition-colors ${
                tab === id
                  ? "border-terracotta text-navy"
                  : "border-transparent text-slate hover:border-chalk hover:text-navy"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {tab === "courses" && (
          <CourseShelf
            course={course}
            slug={slug}
            progress={progress ?? {}}
            onOpenCourse={() => setTab("curriculum")}
          />
        )}
        {tab === "curriculum" && (
          <div className="space-y-6">
            <CourseMediaBlock media={course.primaryMedia} />
            <CurriculumPanel slug={slug} progress={progress ?? {}} />
          </div>
        )}
        {tab === "artifacts" && (
          <ArtifactsPanel slug={slug} progress={progress ?? {}} />
        )}
        {tab === "gates" && (
          <GatesPanel slug={slug} progress={progress ?? {}} />
        )}
        {tab === "about" && (
          <AboutPanel course={course} />
        )}
      </section>
    </div>
  );
}

function CourseHero({
  course,
  workspaceName,
  slug,
  percent,
  completed,
  inProgress,
  resumeModule,
  resumeStarted,
  resumeTarget,
  currentArtifact,
  totalModules,
}: {
  course: AssessCourseMeta;
  workspaceName: string;
  slug: string;
  percent: number;
  completed: number;
  inProgress: number;
  resumeModule: ModuleMeta;
  resumeStarted: boolean;
  resumeTarget: "/app/$workspaceSlug/assess/$moduleId" | "/app/$workspaceSlug/assess/$moduleId/work";
  currentArtifact: string;
  totalModules: number;
}) {
  return (
    <header className="rounded-md border border-chalk bg-white px-6 py-8 md:px-10 md:py-12">
      <p className="eyebrow">
        <Link to="/app/$workspaceSlug" params={{ workspaceSlug: slug }} className="hover:text-terracotta">
          {workspaceName.toUpperCase()}
        </Link>{" "}
        · ASSESS · COURSE
      </p>
      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
        <div>
          <h1 className="font-display text-[46px] font-medium leading-[1.02] tracking-[-0.015em] text-navy md:text-[64px]">
            Course Library.
            <br />
            <span className="accent-italic">Assess.</span>
          </h1>
          <p className="lead mt-5 max-w-[64ch]">
            Start with {course.title}: {course.framing}. Learn the universal method here;
            apply it later to a chosen capstone case for certification.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to={resumeTarget}
              params={{ workspaceSlug: slug, moduleId: resumeModule.id }}
              className="btn-ichigo btn-ichigo-primary"
            >
              {resumeStarted ? "Resume" : "Start Assess"} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/app/$workspaceSlug/assess/assignments"
              params={{ workspaceSlug: slug }}
              className="btn-ichigo btn-ichigo-outline"
            >
              View assignments
            </Link>
          </div>
        </div>

        <aside className="rounded-md border border-chalk bg-paper p-5">
          <p className="eyebrow-muted">YOUR PROGRESS</p>
          <div className="mt-4">
            <div className="flex items-end justify-between gap-4">
              <p className="font-display text-[44px] leading-none text-navy">{percent}%</p>
              <p className="text-right font-mono text-[10px] uppercase tracking-[0.16em] text-slate">
                {completed} of {totalModules}
                <br />
                modules complete
              </p>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-chalk">
              <div className="h-full rounded-full bg-terracotta" style={{ width: `${percent}%` }} />
            </div>
          </div>
          <dl className="mt-5 space-y-3 text-[13px]">
            <div className="flex justify-between gap-4">
              <dt className="text-slate">Current module</dt>
              <dd className="text-right font-medium text-navy">M{String(resumeModule.num).padStart(2, "0")} · {resumeModule.title}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate">Current artifact</dt>
              <dd className="text-right font-medium text-navy">{currentArtifact}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate">In progress</dt>
              <dd className="text-right font-medium text-navy">{inProgress}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate">Course</dt>
              <dd className="text-right font-medium text-navy">{course.level} · {course.duration}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </header>
  );
}

function CourseShelf({
  course,
  slug,
  progress,
  onOpenCourse,
}: {
  course: AssessCourseMeta;
  slug: string;
  progress: Record<string, AssessProgressRow>;
  onOpenCourse: () => void;
}) {
  const complete = course.modules.filter((moduleId) => progress[moduleId]?.status === "complete").length;
  const percent = Math.round((complete / course.modules.length) * 100);
  const next = course.modules.find((moduleId) => progress[moduleId]?.status !== "complete") ?? course.modules[course.modules.length - 1];

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow-muted">COURSE LIBRARY</p>
          <h2 className="font-display text-[30px] leading-tight text-navy">Featured course</h2>
        </div>
        <span className="rounded-full bg-mist px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-slate">
          {COURSES.length} course{COURSES.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="rounded-md border border-terracotta/25 bg-white p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
          <div>
            <p className="eyebrow text-terracotta">COURSE 01 · {course.level} · {course.duration}</p>
            <h3 className="mt-3 font-display text-[36px] leading-tight text-navy">{course.title}</h3>
            <p className="mt-3 max-w-[72ch] text-[15px] leading-relaxed text-graphite">{course.description}</p>
            <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-slate">{course.framing}</p>
            <div className="mt-5 grid gap-2 sm:grid-cols-4">
              <CourseMiniStat label="Modules" value={`${course.modules.length}`} />
              <CourseMiniStat label="Gates" value="3" />
              <CourseMiniStat label="Artifacts" value="4" />
              <CourseMiniStat label="Formats" value="4" />
            </div>
            <p className="mt-4 text-[13px] leading-relaxed text-slate">{course.audience}</p>
          </div>
          <div>
            <div className="flex items-center justify-between text-[12px] text-slate">
              <span>{complete}/{course.modules.length} complete</span>
              <span>{percent}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-chalk">
              <div className="h-full rounded-full bg-terracotta" style={{ width: `${percent}%` }} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onOpenCourse}
                className="btn-ichigo btn-ichigo-primary"
              >
                Open course <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <Link
                to="/app/$workspaceSlug/assess/$moduleId"
                params={{ workspaceSlug: slug, moduleId: next }}
                className="btn-ichigo btn-ichigo-outline"
              >
                Resume
              </Link>
              <Link
                to="/app/$workspaceSlug/assess/use-cases"
                params={{ workspaceSlug: slug }}
                className="btn-ichigo btn-ichigo-outline"
              >
                Use case tracks
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {course.artifacts.map((artifact) => (
            <div key={artifact} className="rounded-md border border-chalk bg-paper p-3 text-[13px] leading-relaxed text-navy">
              {artifact}
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-md border border-chalk bg-paper p-4">
          <p className="eyebrow-muted">CERTIFICATION</p>
          <p className="mt-2 text-[13px] leading-relaxed text-graphite">{course.certification.assessment}</p>
        </div>
      </div>
    </section>
  );
}

function CourseMiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-chalk bg-paper p-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate">{label}</p>
      <p className="mt-1 font-display text-[24px] leading-none text-navy">{value}</p>
    </div>
  );
}

function NoticeCard({
  eyebrow,
  title,
  body,
  actionLabel,
  to,
  slug,
  search,
}: {
  eyebrow: string;
  title: string;
  body: string;
  actionLabel: string;
  to: "/app/$workspaceSlug" | "/app/$workspaceSlug/onboarding/use-case-profile" | "/app/$workspaceSlug/assess/complete";
  slug: string;
  search?: Record<string, string>;
}) {
  return (
    <div className="rounded-md border border-terracotta/25 bg-terracotta/5 p-5">
      <p className="eyebrow text-terracotta">{eyebrow}</p>
      <h2 className="h-heading-md mt-2">{title}</h2>
      <p className="mt-3 max-w-[68ch] text-[14px] leading-relaxed text-graphite">{body}</p>
      <Link
        to={to}
        params={{ workspaceSlug: slug }}
        search={search}
        className="mt-4 inline-flex items-center gap-2 text-[13px] font-medium text-terracotta hover:opacity-80"
      >
        {actionLabel} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function CurriculumPanel({
  slug,
  progress,
}: {
  slug: string;
  progress: Record<string, AssessProgressRow>;
}) {
  return (
    <div className="space-y-5">
      {PHASES.map((phase, index) => {
        const phaseComplete = phase.modules.filter((m) => progress[m]?.status === "complete").length;
        return (
          <details
            key={phase.id}
            open={index === 0 || phase.modules.some((m) => progress[m]?.status === "in_progress")}
            className="rounded-md border border-chalk bg-white"
          >
            <summary className="cursor-pointer list-none px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="eyebrow-muted">PHASE {String(phase.num).padStart(2, "0")} · {phase.artifact}</p>
                  <h2 className="mt-1 font-display text-[26px] leading-tight text-navy">{phase.name}</h2>
                  <p className="mt-1 text-[13px] text-graphite">{phase.subtitle}</p>
                </div>
                <span className="rounded-full bg-mist px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-slate">
                  {phaseComplete}/{phase.modules.length} complete
                </span>
              </div>
            </summary>
            <div className="border-t border-chalk px-3 pb-3">
              {phase.modules.map((modId) => (
                <ModuleRow key={modId} modId={modId} slug={slug} progress={progress} />
              ))}
            </div>
          </details>
        );
      })}
    </div>
  );
}

function ModuleRow({
  modId,
  slug,
  progress,
}: {
  modId: ModuleId;
  slug: string;
  progress: Record<string, AssessProgressRow>;
}) {
  const m = getModule(modId)!;
  const row = progress[modId];
  const status = row?.status ?? "not_started";
  const locked = !!m.prereq && progress[m.prereq]?.status !== "complete";
  const target =
    status === "in_progress" || row?.studied
      ? "/app/$workspaceSlug/assess/$moduleId/work"
      : "/app/$workspaceSlug/assess/$moduleId";

  const onClick = (e: MouseEvent) => {
    if (!locked) return;
    e.preventDefault();
    const prereq = getModule(m.prereq!);
    toast.error(`Complete ${prereq?.title} first.`);
  };

  return (
    <Link
      to={target}
      params={{ workspaceSlug: slug, moduleId: m.id }}
      onClick={onClick}
      className={`group flex items-start gap-4 border-b border-chalk/80 px-3 py-4 last:border-b-0 ${
        locked ? "opacity-55" : "hover:bg-mist/40"
      }`}
    >
      <CompletionCircle status={status} locked={locked} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate">
            M{String(m.num).padStart(2, "0")} · {m.duration}
          </p>
          {m.gateNumber && (
            <span className="rounded-full bg-navy px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-white">
              Gate {m.gateNumber}
            </span>
          )}
          {m.assignmentAlignment && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-amber-800">
              Content pass needed
            </span>
          )}
        </div>
        <h3 className="mt-1 text-[16px] font-medium text-navy">{m.title}</h3>
        <p className="mt-1 line-clamp-2 text-[13px] text-graphite">{m.assignment}</p>
      </div>
      <div className="hidden shrink-0 items-center gap-2 text-[13px] font-medium text-terracotta sm:flex">
        {locked ? "Locked" : status === "complete" ? "Review" : status === "in_progress" ? "Resume" : "Open"}
        {locked ? <Lock className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
      </div>
    </Link>
  );
}

function CompletionCircle({
  status,
  locked,
}: {
  status: "not_started" | "in_progress" | "complete";
  locked: boolean;
}) {
  if (locked) {
    return (
      <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-chalk bg-mist text-slate">
        <Lock className="h-3 w-3" />
      </span>
    );
  }
  if (status === "complete") {
    return (
      <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-terracotta text-white">
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-terracotta bg-terracotta/10">
        <Play className="h-3 w-3 fill-terracotta text-terracotta" />
      </span>
    );
  }
  return (
    <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate/50 bg-white">
      <Circle className="h-3 w-3 text-slate" />
    </span>
  );
}

function ArtifactsPanel({
  slug,
  progress,
}: {
  slug: string;
  progress: Record<string, AssessProgressRow>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {ARTIFACTS.map((artifact) => {
        const complete = artifact.modules.filter((m) => progress[m]?.status === "complete").length;
        const next = artifact.modules.find((m) => progress[m]?.status !== "complete") ?? artifact.modules[artifact.modules.length - 1];
        return (
          <Link
            key={artifact.id}
            to="/app/$workspaceSlug/assess/$moduleId"
            params={{ workspaceSlug: slug, moduleId: next }}
            className="rounded-md border border-chalk bg-white p-5 transition-colors hover:border-terracotta/50"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mist text-terracotta">
                <FileText className="h-5 w-5" />
              </span>
              <div>
                <p className="eyebrow-muted">ARTIFACT {String(artifact.phase).padStart(2, "0")} · {artifact.phaseName}</p>
                <h3 className="mt-1 font-display text-[24px] text-navy">{artifact.title}</h3>
                <p className="mt-2 text-[13px] text-graphite">
                  {complete}/{artifact.modules.length} modules complete. Continue with {getModule(next)?.title}.
                </p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function GatesPanel({
  slug,
  progress,
}: {
  slug: string;
  progress: Record<string, AssessProgressRow>;
}) {
  const gates = MODULES.filter((m) => m.gateNumber);
  return (
    <div className="space-y-3">
      {gates.map((m) => {
        const unlocked = progress[m.id]?.status === "complete";
        return (
          <Link
            key={m.id}
            to={unlocked ? "/app/$workspaceSlug/assess/$moduleId/gate" : "/app/$workspaceSlug/assess/$moduleId"}
            params={{ workspaceSlug: slug, moduleId: m.id }}
            className="flex items-center justify-between gap-4 rounded-md border border-chalk bg-white p-5 transition-colors hover:border-terracotta/50"
          >
            <div className="flex items-start gap-3">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${unlocked ? "bg-terracotta text-white" : "bg-mist text-slate"}`}>
                {unlocked ? <Flag className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
              </span>
              <div>
                <p className="eyebrow-muted">GATE {m.gateNumber} · M{String(m.num).padStart(2, "0")}</p>
                <h3 className="mt-1 text-[16px] font-medium text-navy">{m.title}</h3>
                <p className="mt-1 text-[13px] text-graphite">
                  {m.gateNumber === 3 ? "Formal portfolio investment decision." : "Informal readiness decision."}
                </p>
              </div>
            </div>
            <span className="shrink-0 text-[13px] font-medium text-terracotta">
              {unlocked ? "Open gate →" : "Complete assignment first"}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function AboutPanel({ course }: { course: AssessCourseMeta }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="max-w-[72ch] space-y-5 text-[16px] leading-relaxed text-graphite">
        <h2 className="h-heading-md">About this course</h2>
        <p>{course.description}</p>
        <p>{course.methodology}</p>
        <p>{course.certification.assessment}</p>
        <div className="grid gap-3 md:grid-cols-2">
          {course.gates.map((gate) => (
            <div key={gate} className="rounded-md border border-chalk bg-white p-4 text-[14px] text-navy">
              {gate}
            </div>
          ))}
        </div>
      </div>
      <aside className="space-y-4">
      <div className="rounded-md border border-chalk bg-white p-5">
        <p className="eyebrow-muted">COURSE SHAPE</p>
        <dl className="mt-4 space-y-3 text-[13px]">
          <div className="flex justify-between gap-4">
            <dt className="text-slate">Modules</dt>
            <dd className="font-medium text-navy">{course.modules.length}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate">Phases</dt>
            <dd className="font-medium text-navy">4</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate">Gates</dt>
            <dd className="font-medium text-navy">3</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate">Primary mode</dt>
            <dd className="font-medium text-navy">Study + assignment</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate">Course level</dt>
            <dd className="font-medium text-navy">{course.level}</dd>
          </div>
        </dl>
      </div>
      <div className="rounded-md border border-chalk bg-white p-5">
        <p className="eyebrow-muted">FORMAT DEPTH GUIDE</p>
        <div className="mt-3 space-y-3">
          {course.formats.map((format) => (
            <div key={format.label} className="border-b border-chalk pb-3 last:border-b-0 last:pb-0">
              <p className="text-[14px] font-medium text-navy">{format.label}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-slate">{format.duration}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-graphite">{format.coverage}</p>
            </div>
          ))}
        </div>
      </div>
      </aside>
    </div>
  );
}
