import { createFileRoute } from "@tanstack/react-router";
import { WorkspaceBuildOnboarding } from "@/components/build/WorkspaceBuildOnboarding";

export const Route = createFileRoute("/app/$workspaceSlug/admin/onboarding")({
  component: WorkspaceAdminOnboardingPage,
});

function WorkspaceAdminOnboardingPage() {
  return <WorkspaceBuildOnboarding />;
}
