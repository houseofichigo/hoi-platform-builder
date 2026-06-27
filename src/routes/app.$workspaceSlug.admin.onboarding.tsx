import { createFileRoute } from "@tanstack/react-router";
import { CompanyOnboarding } from "@/components/build/pfs/company-onboarding";

export const Route = createFileRoute("/app/$workspaceSlug/admin/onboarding")({
  ssr: false,
  component: WorkspaceAdminOnboardingPage,
});

function WorkspaceAdminOnboardingPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <CompanyOnboarding mode="wizard" />
    </div>
  );
}
