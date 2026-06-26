import { createFileRoute } from "@tanstack/react-router";
import { DashboardScreen } from "@/components/build/pfs/process-platform";

export const Route = createFileRoute("/app/$workspaceSlug/build/")({
  component: BuildIndex,
});

function BuildIndex() {
  return <DashboardScreen />;
}
