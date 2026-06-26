import { createFileRoute } from "@tanstack/react-router";
import { MappingScreen } from "@/components/build/pfs/process-platform";

export const Route = createFileRoute("/app/$workspaceSlug/build/map")({
  component: BuildMap,
});

function BuildMap() {
  return <MappingScreen />;
}
