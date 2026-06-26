import { createFileRoute } from "@tanstack/react-router";
import { CompanyOnboarding } from "@/components/build/pfs/company-onboarding";

export const Route = createFileRoute("/app/$workspaceSlug/admin/onboarding")({
  ssr: false,
  component: WorkspaceAdminOnboardingPage,
});

function WorkspaceAdminOnboardingPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <p className="eyebrow">WORKSPACE · ADMIN</p>
      <h1 className="h-display-md mt-2">
        Company <span className="accent-italic">Setup.</span>
      </h1>
      <p className="lead mt-2 max-w-[68ch]">
        Walk through company profile, org chart, tool stack, and launch readiness. Each step saves as a draft.
      </p>
      <div className="mt-8">
        <CompanyOnboarding mode="wizard" />
      </div>
    </div>
  );
}
