// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import DiagramStep from "@/components/build/MapProcessDiagram";

export const Route = createFileRoute("/app/$workspaceSlug/build/map-verify")({
  ssr: false,
  component: () => <DiagramStep />,
});
