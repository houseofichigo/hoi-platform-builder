import { createFileRoute } from "@tanstack/react-router";

import { ReviewPolicy } from "@/components/build/pfs/process-platform";
import { useWorkspace } from "@/hooks/useWorkspace";

export const Route = createFileRoute("/app/$workspaceSlug/admin/review-policy")({
  component: WorkspaceAdminReviewPolicyPage,
});

function WorkspaceAdminReviewPolicyPage() {
  const { workspace } = useWorkspace();
  if (!workspace) return null;
  return <ReviewPolicy />;
}