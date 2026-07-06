import { createFileRoute } from "@tanstack/react-router";
import DiagramStep from "@/components/build/MapProcessDiagram";

export const Route = createFileRoute("/app/$workspaceSlug/build/map-verify")({
  component: MapVerify,
});

function MapVerify() {
  const ok = typeof DiagramStep === "function";
  return (
    <div style={{ padding: 24 }} data-testid="map-verify-status">
      MapProcessDiagram import: {ok ? "OK" : "FAIL"}
    </div>
  );
}