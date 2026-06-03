import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useUseCaseProfile } from "@/hooks/useUseCaseProfile";
import { ProfileForm } from "@/components/profile/ProfileForm";
import type { ProfileValues } from "@/lib/profile/schema";

const searchSchema = z.object({
  return_to: z.string().optional(),
});

export const Route = createFileRoute("/app/$workspaceSlug/onboarding/use-case-profile")({
  component: UseCaseProfileOnboarding,
  validateSearch: searchSchema,
});

function UseCaseProfileOnboarding() {
  const { workspace } = useWorkspace();
  const navigate = useNavigate();
  const search = useSearch({ from: "/app/$workspaceSlug/onboarding/use-case-profile" });
  const { data, isLoading, isComplete, schema, defaults, workedExample, save } = useUseCaseProfile();

  if (!workspace) return null;

  if (!workedExample) {
    return (
      <div className="mx-auto max-w-[640px] py-8">
        <p className="eyebrow-muted">USE-CASE PROFILE</p>
        <h1 className="h-display-md mt-3">
          Pick an applied track <span className="accent-italic">first.</span>
        </h1>
        <p className="lead mt-4 max-w-[60ch] text-[15px]">
          This optional profile depends on which applied track your team wants to personalize.
          Choose one from the onboarding checklist, then come back here.
        </p>
        <Link
          to="/app/$workspaceSlug"
          params={{ workspaceSlug: workspace.slug }}
          className="mt-6 inline-block text-[14px] font-medium text-terracotta hover:opacity-80"
        >
          Go to workspace home →
        </Link>
      </div>
    );
  }

  const initial: ProfileValues = {
    ...(defaults as ProfileValues),
    ...(data ?? {}),
  };

  const handleSubmit = async (values: ProfileValues) => {
    try {
      await save.mutateAsync(values);
      toast.success("Use-case profile saved.");
      const returnTo = search.return_to;
      if (returnTo && returnTo.startsWith("/")) {
        navigate({ to: returnTo });
      } else {
        navigate({
          to: "/app/$workspaceSlug/assess",
          params: { workspaceSlug: workspace.slug },
        });
      }
    } catch (err) {
      toast.error((err as Error).message ?? "Could not save profile.");
    }
  };

  return (
    <div className="mx-auto max-w-[640px] py-8">
      <p className="eyebrow-muted">
        <Link
          to="/app/$workspaceSlug/assess"
          params={{ workspaceSlug: workspace.slug }}
          className="hover:text-navy"
        >
          ← ASSESS
        </Link>{" "}
        · ONBOARDING · USE-CASE PROFILE
      </p>

      <div className="mt-4">
        <p className="eyebrow mt-2 text-terracotta">{workedExample.shortName.toUpperCase()}</p>
        <h1 className="h-display-md mt-2">
          {isComplete ? (
            <>Edit your <span className="accent-italic">{workedExample.entityName} profile.</span></>
          ) : (
            <>Personalize your <span className="accent-italic">{workedExample.entityName} track.</span></>
          )}
        </h1>
        <p className="lead mt-4 max-w-[60ch] text-[15px]">
          {isComplete
            ? "Update the details below. Applied track previews and generated examples can use the new values."
            : "A few specifics about how your team runs this workflow. The core course stays generic; this context only personalizes the applied track. Edit any time from settings."}
        </p>
      </div>

      <div className="card mt-10">
        {isLoading ? (
          <p className="text-[14px] text-slate">Loading…</p>
        ) : (
          <ProfileForm
            schema={schema}
            initialValues={initial}
            onSubmit={handleSubmit}
            submitting={save.isPending}
            submitLabel={isComplete ? "Save changes" : "Save and continue"}
          />
        )}
      </div>
    </div>
  );
}
