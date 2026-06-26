import { createFileRoute } from "@tanstack/react-router";
import { ProcessLibrary } from "@/components/build/pfs/process-platform";

export const Route = createFileRoute("/app/$workspaceSlug/build/library")({
  component: BuildLibrary,
});

function BuildLibrary() {
  return <ProcessLibrary />;
}
