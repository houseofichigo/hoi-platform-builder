import { createFileRoute } from "@tanstack/react-router";
import { PendingTasks } from "@/components/build/pfs/process-platform";

export const Route = createFileRoute("/app/$workspaceSlug/build/approvals")({
  component: BuildApprovals,
});

function BuildApprovals() {
  return <PendingTasks />;
}
