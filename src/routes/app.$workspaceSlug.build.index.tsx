// @ts-nocheck — Ported PFS module.
import { createFileRoute } from "@tanstack/react-router";
import { DashboardScreen } from "@/components/build/pfs/process-platform";

export const Route = createFileRoute("/app/$workspaceSlug/build/")({
  ssr: false,
  component: BuildIndex,
});

function BuildIndex() {
  return <DashboardScreen />;
}
