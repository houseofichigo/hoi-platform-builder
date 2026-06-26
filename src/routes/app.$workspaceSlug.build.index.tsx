import { createFileRoute } from "@tanstack/react-router";
import { BuildOverviewPanel } from "@/components/build/BuildOverviewPanel";

export const Route = createFileRoute("/app/$workspaceSlug/build/")({
  component: BuildIndex,
});

function BuildIndex() {
  return <BuildOverviewPanel />;
}
