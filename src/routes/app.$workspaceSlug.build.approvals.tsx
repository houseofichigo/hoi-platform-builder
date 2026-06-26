import { createFileRoute } from "@tanstack/react-router";
import { ProcessApprovals } from "@/components/build/ProcessApprovals";

export const Route = createFileRoute("/app/$workspaceSlug/build/approvals")({
  component: BuildApprovals,
});

function BuildApprovals() {
  return <ProcessApprovals />;
}
