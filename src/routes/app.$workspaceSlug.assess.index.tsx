import { useMemo, useState, type MouseEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowRight, Check, Circle, FileText, Lock, Play } from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import {
  ARTIFACTS,
  COURSES,
  COURSE_AT_SCALE_ID,
  COURSE_FOUNDATIONS_ID,
  getCourse,
  getCourseModules,
  getModule,
  isCourseUnlocked,
  type AssessCourseMeta,
  type ModuleId,
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

type TabId = "courses" | "current" | "artifacts" | "about";

function AssessHome() {
  const { workspace } = useWorkspace();
  const { data: progress } = useAssessAllProgress();
  const [tab, setTab] = useState<TabId>("courses");
  const [activeCourseId, setActiveCourseId] = useState<string>(COURSE_FOUNDATIONS_ID);

  const activeCourse = getCourse(activeCourseId) ?? COURSES[0];
  const activeModules = useMemo(() => getCourseModules(activeCourse.id), [activeCourse.id]);

  const overallStats = useMemo(() => {
    const completed = activeModules.filter((m) => progress?.[m.id]?.status === "complete").length;
    const inProgress = activeModules.filter((m) => progress?.[m.id]?.status === "in_progress").length;
    const percent = Math.round((completed / activeModules.length) * 100);
    const resume = currentResumeModule(progress);
    const resumeProgress = progress?.[resume.module.id];
    const target: "/app/$workspaceSlug/assess/$moduleId" | "/app/$workspaceSlug/assess/$moduleId/work" =
      resumeProgress?.status === "in_progress" || resumeProgress?.studied
        ? "/app/$workspaceSlug/assess/$moduleId/work"
        : "/app/$workspaceSlug/assess/$moduleId";
    return { completed, inProgress, percent, resume, target };
  }, [activeModules, progress]);

  if (!workspace) return null;
  const slug = workspace.slug;

  const currentArtifact =
    ARTIFACTS.find((artifact) => artifact.modules.some((m) => progress?.[m]?.status !== "complete")) ??
    ARTIFACTS[ARTIFACTS.length - 1];

  return (
    <div className="space-y-12">
      <header className="rounded-md border border-chalk bg-white px-6 py-8 md:px-10 md:py-12">
        <p className="eyebrow">
          <Link to="/app/$workspaceSlug" params={{ workspaceSlug: slug }} className="hover:text-terracotta">
            {workspace.name.toUpperCase()}
          </Link>{" "}
          · ASSESS · COURSE LIBRARY
        </p>
        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div>
            <h1 className="font-display text-[46px] font-medium leading-[1.02] tracking-[-0.015em] text-navy md:text-[64px]">
              Course Library.
              <br />
              <span className="accent-italic">Assess.</span>
            </h1>
            <p className="lead mt-5 max-w-[64ch]">
              Two courses: AI Foundations (Part 1) and AI at Scale (Part 2). Start with Foundations, then
              continue into the advanced track when you're ready.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                to={overallStats.target}
                params={{ workspaceSlug: slug, moduleId: overallStats.resume.module.id }}
                className="btn-ichigo btn-ichigo-primary"
              >
                {overallStats.resume.started ? "Resume" : "Start Assess"}{" "}
                <ArrowRight className="h-4 w-4" />
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
            <p className="eyebrow-muted">CURRENT COURSE</p>
            <div className="mt-4">
              <div className="flex items-end justify-between gap-4">
                <p className="font-display text-[44px] leading-none text-navy">{overallStats.percent}%</p>
                <p className="text-right font-mono text-[10px] uppercase tracking-[0.16em] text-slate">
                  {overallStats.completed} of {activeModules.length}
                  <br />
                  modules complete
                </p>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-chalk">
                <div className="h-full rounded-full bg-terracotta" style={{ width: `${overallStats.percent}%` }} />
              </div>
            </div>
            <dl className="mt-5 space-y-3 text-[13px]">
              <div className="flex justify-between gap-4">
                <dt className="text-slate">Course</dt>
                <dd className="text-right font-medium text-navy">{activeCourse.title}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate">Current module</dt>
                <dd className="text-right font-medium text-navy">
                  M{String(overallStats.resume.module.num).padStart(2, "0")} · {overallStats.resume.module.title}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate">Current artifact</dt>
                <dd className="text-right font-medium text-navy">{currentArtifact.title}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate">In progress</dt>
                <dd className="text-right font-medium text-navy">{overallStats.inProgress}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </header>

      {progress?.m12?.status === "complete" && (
        <NoticeCard
          eyebrow="PROGRAM COMPLETION READY"
          title="Review your artifacts and certification readiness."
          body="The completion dashboard gathers the evidence trail from all twelve modules into one executive view."
          actionLabel="Open completion dashboard"
          to="/app/$workspaceSlug/assess/complete"
          slug={slug}
        />
      )}

      <section className="space-y-6">
        <nav className="flex gap-2 overflow-x-auto border-b border-chalk" aria-label="Assess sections">
          {([
            ["courses", "Courses"],
            ["current", "Current course"],
            ["artifacts", "Artifacts"],
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
          <CourseLibrary
            slug={slug}
            progress={progress ?? {}}
            activeCourseId={activeCourse.id}
            onSelectCourse={(courseId) => {
              setActiveCourseId(courseId);
              setTab("current");
            }}
          />
        )}
        {tab === "current" && (
          <div className="space-y-6">
            <CourseMediaBlock media={activeCourse.primaryMedia} />
            <CurriculumPanel course={activeCourse} slug={slug} progress={progress ?? {}} />
          </div>
        )}
        {tab === "artifacts" && <ArtifactsPanel slug={slug} progress={progress ?? {}} />}
        {tab === "about" && <AboutPanel course={activeCourse} />}
      </section>
    </div>
  );
}

function CourseLibrary({
  slug,
  progress,
  activeCourseId,
  onSelectCourse,
}: {
  slug: string;
  progress: Record<string, AssessProgressRow>;
  activeCourseId: string;
  onSelectCourse: (courseId: string) => void;
}) {
  return (
    <section className="space-y-4">
      <div className="grid gap-5 lg:grid-cols-2">
        {COURSES.map((course, index) => (
          <CourseCard
            key={course.id}
            course={course}
            index={index}
            slug={slug}
            progress={progress}
            isActive={activeCourseId === course.id}
            onSelect={() => onSelectCourse(course.id)}
          />
        ))}
      </div>
    </section>
  );
}

function CourseCard({
  course,
  index,
  slug,
  progress,
  isActive,
  onSelect,
}: {
  course: AssessCourseMeta;
  index: number;
  slug: string;
  progress: Record<string, AssessProgressRow>;
  isActive: boolean;
  onSelect: () => void;
}) {
  const complete = course.modules.filter((m) => progress[m]?.status === "complete").length;
  const percent = Math.round((complete / course.modules.length) * 100);
  const next =
    course.modules.find((m) => progress[m]?.status !== "complete") ??
    course.modules[course.modules.length - 1];
  const unlocked = isCourseUnlocked(course.id, progress);

  return (
    <article
      className={`rounded-md border bg-white p-6 shadow-sm transition-colors ${
        isActive ? "border-terracotta/60" : "border-chalk"
      } ${unlocked ? "" : "opacity-80"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="eyebrow text-terracotta">
          COURSE 0{index + 1} · {course.level}
        </p>
        {!unlocked && (
          <span className="inline-flex items-center gap-1 rounded-full bg-mist px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-slate">
            <Lock className="h-3 w-3" /> Locked
          </span>
        )}
      </div>
      <h3 className="mt-3 font-display text-[28px] leading-tight text-navy">{course.title}</h3>
      <p className="mt-3 text-[14px] leading-relaxed text-graphite">{course.description}</p>
      <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-slate">{course.framing}</p>

      <div className="mt-5 flex items-center justify-between gap-3 text-[12px] text-slate">
        <span>
          {complete}/{course.modules.length} complete
        </span>
        <span>{percent}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-chalk">
        <div className="h-full rounded-full bg-terracotta" style={{ width: `${percent}%` }} />
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {course.artifacts.map((artifact) => (
          <div
            key={artifact}
            className="rounded-md border border-chalk bg-paper p-3 text-[12.5px] leading-relaxed text-navy"
          >
            {artifact}
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button type="button" onClick={onSelect} className="btn-ichigo btn-ichigo-primary">
          Open course <ArrowRight className="h-3.5 w-3.5" />
        </button>
        {unlocked ? (
          <Link
            to="/app/$workspaceSlug/assess/$moduleId"
            params={{ workspaceSlug: slug, moduleId: next }}
            className="btn-ichigo btn-ichigo-outline"
          >
            {complete > 0 ? "Resume" : "Start"}
          </Link>
        ) : (
          <span className="text-[12px] text-slate self-center">
            Complete AI Foundations to unlock.
          </span>
        )}
      </div>
    </article>
  );
}

function NoticeCard({
  eyebrow,
  title,
  body,
  actionLabel,
  to,
  slug,
}: {
  eyebrow: string;
  title: string;
  body: string;
  actionLabel: string;
  to: "/app/$workspaceSlug" | "/app/$workspaceSlug/assess/complete";
  slug: string;
}) {
  return (
    <div className="rounded-md border border-terracotta/25 bg-terracotta/5 p-5">
      <p className="eyebrow text-terracotta">{eyebrow}</p>
      <h2 className="h-heading-md mt-2">{title}</h2>
      <p className="mt-3 max-w-[68ch] text-[14px] leading-relaxed text-graphite">{body}</p>
      <Link
        to={to}
        params={{ workspaceSlug: slug }}
        className="mt-4 inline-flex items-center gap-2 text-[13px] font-medium text-terracotta hover:opacity-80"
      >
        {actionLabel} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function CurriculumPanel({
  course,
  slug,
  progress,
}: {
  course: AssessCourseMeta;
  slug: string;
  progress: Record<string, AssessProgressRow>;
}) {
  const unlocked = isCourseUnlocked(course.id, progress);
  return (
    <div className="space-y-5">
      {!unlocked && (
        <div className="rounded-md border border-chalk bg-mist/40 p-4 text-[14px] text-navy">
          This course is locked until you complete AI Foundations.
        </div>
      )}
      <div className="rounded-md border border-chalk bg-white">
        <div className="border-b border-chalk px-5 py-4">
          <p className="eyebrow-muted">
            {course.level.toUpperCase()} · {course.modules.length} MODULES
          </p>
          <h2 className="mt-1 font-display text-[26px] leading-tight text-navy">{course.title}</h2>
          <p className="mt-1 text-[13px] text-graphite">{course.subtitle}</p>
        </div>
        <div className="px-3 pb-3">
          {course.modules.map((modId) => (
            <ModuleRow
              key={modId}
              modId={modId}
              slug={slug}
              progress={progress}
              courseUnlocked={unlocked}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ModuleRow({
  modId,
  slug,
  progress,
  courseUnlocked,
}: {
  modId: ModuleId;
  slug: string;
  progress: Record<string, AssessProgressRow>;
  courseUnlocked: boolean;
}) {
  const m = getModule(modId)!;
  const row = progress[modId];
  const status = row?.status ?? "not_started";
  const prereqMissing = !!m.prereq && progress[m.prereq]?.status !== "complete";
  const locked = !courseUnlocked || prereqMissing;
  const target =
    status === "in_progress" || row?.studied
      ? "/app/$workspaceSlug/assess/$moduleId/work"
      : "/app/$workspaceSlug/assess/$moduleId";

  const onClick = (e: MouseEvent) => {
    if (!locked) return;
    e.preventDefault();
    if (!courseUnlocked) {
      toast.error("Complete AI Foundations to unlock this course.");
      return;
    }
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
        const next =
          artifact.modules.find((m) => progress[m]?.status !== "complete") ??
          artifact.modules[artifact.modules.length - 1];
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
                <p className="eyebrow-muted">
                  ARTIFACT {String(artifact.phase).padStart(2, "0")} · {artifact.phaseName}
                </p>
                <h3 className="mt-1 font-display text-[24px] text-navy">{artifact.title}</h3>
                <p className="mt-2 text-[13px] text-graphite">
                  {complete}/{artifact.modules.length} modules complete. Continue with{" "}
                  {getModule(next)?.title}.
                </p>
              </div>
            </div>
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
          {course.artifacts.map((artifact) => (
            <div key={artifact} className="rounded-md border border-chalk bg-white p-4 text-[14px] text-navy">
              {artifact}
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
              <dd className="font-medium text-navy">2</dd>
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

// reference unused import to satisfy tree-shaker; remove if not needed
void COURSE_AT_SCALE_ID;