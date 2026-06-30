import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { CompanyOnboarding } from "@/components/build/pfs/company-onboarding";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/app/$workspaceSlug/admin/onboarding")({
  ssr: false,
  component: WorkspaceAdminOnboardingPage,
  errorComponent: OnboardingErrorComponent,
});

function WorkspaceAdminOnboardingPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <CompanyOnboarding mode="wizard" />
    </div>
  );
}

function OnboardingErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  // eslint-disable-next-line no-console
  console.error("[admin/onboarding] route error:", error);
  const router = useRouter();
  const { workspaceSlug } = Route.useParams();
  return (
    <div className="mx-auto max-w-6xl p-6">
      <Card className="rounded-[var(--r-md)] border-[var(--chalk)] bg-white p-8 text-center">
        <p className="font-display text-[28px] text-[var(--navy)]">Company setup didn’t load</p>
        <p className="mt-2 font-sans text-[14px] text-[var(--slate)]">
          {error?.message ?? "Something went wrong loading the onboarding workspace."}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button
            type="button"
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Try again
          </Button>
          <Button asChild type="button" variant="outline">
            <Link to="/app/$workspaceSlug/admin" params={{ workspaceSlug }}>
              Back to admin
            </Link>
          </Button>
        </div>
        {import.meta.env.DEV && error?.stack ? (
          <details className="mt-6 rounded-md border border-input bg-muted/30 p-3 text-left text-xs">
            <summary className="cursor-pointer font-medium">Error details (dev only)</summary>
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words font-mono text-[10px] text-muted-foreground">
              {error.stack}
            </pre>
          </details>
        ) : null}
      </Card>
    </div>
  );
}
