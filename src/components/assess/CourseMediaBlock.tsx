import { ExternalLink, PlayCircle, Presentation } from "lucide-react";
import type { CoursePrimaryMedia } from "@/lib/curriculum";

interface CourseMediaBlockProps {
  media: CoursePrimaryMedia;
  compact?: boolean;
  label?: string;
}

export function CourseMediaBlock({ media, compact = false, label }: CourseMediaBlockProps) {
  if (media.type === "youtube") {
    const embedUrl = media.embedUrl || toYouTubeEmbedUrl(media.url);

    return (
      <section className="rounded-md border border-chalk bg-white p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
            <PlayCircle className="h-4 w-4" />
          </span>
          <div>
            <p className="eyebrow-muted">{label ?? "COURSE VIDEO"}</p>
            <h2 className="text-[16px] font-semibold text-navy">{media.title}</h2>
          </div>
        </div>
        {embedUrl ? (
          <div className="mt-4 aspect-video overflow-hidden rounded-md border border-chalk bg-navy">
            <iframe
              src={embedUrl}
              title={media.title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        ) : (
          <MediaFallback label="Video URL needs a valid YouTube link before it can be embedded." />
        )}
      </section>
    );
  }

  return (
    <section className="rounded-md border border-chalk bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mist text-terracotta">
          <Presentation className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="eyebrow-muted">{label ?? "COURSE SLIDES"}</p>
          <h2 className="text-[16px] font-semibold text-navy">{media.title}</h2>
          {!compact && (
            <p className="mt-2 text-[13px] leading-relaxed text-graphite">
              Attach a PDF, PowerPoint, or Google Slides deck here when the course media is ready.
            </p>
          )}
        </div>
      </div>
      {media.url ? (
        <a
          href={media.url}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-md border border-chalk px-3 py-2 text-[13px] font-medium text-navy transition-colors hover:border-terracotta"
        >
          Open slides <ExternalLink className="h-3.5 w-3.5" />
        </a>
      ) : (
        <MediaFallback label="Slides coming soon." />
      )}
    </section>
  );
}

function MediaFallback({ label }: { label: string }) {
  return (
    <div className="mt-4 rounded-md border border-dashed border-chalk bg-paper px-3 py-2 text-[13px] text-slate">
      {label}
    </div>
  );
}

function toYouTubeEmbedUrl(url: string) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (u.pathname.startsWith("/embed/")) return url;
    }
    if (u.hostname === "youtu.be") {
      const id = u.pathname.replace(/^\//, "");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch {
    return null;
  }
  return null;
}
