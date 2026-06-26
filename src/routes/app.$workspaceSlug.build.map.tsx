import { createFileRoute } from "@tanstack/react-router";
import { ProcessMapStudio } from "@/components/build/ProcessMapStudio";

export const Route = createFileRoute("/app/$workspaceSlug/build/map")({
  component: BuildMap,
});

function BuildMap() {
  return <ProcessMapStudio />;
}
