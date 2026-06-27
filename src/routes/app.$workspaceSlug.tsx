import { Outlet, createFileRoute } from "@tanstack/react-router";
import { WorkspaceProvider } from "@/hooks/useWorkspace";
import { WorkspaceLayout } from "@/components/WorkspaceLayout";
import { TourProvider } from "@/contexts/TourContext";
import { GuidedTour } from "@/components/GuidedTour";

export const Route = createFileRoute("/app/$workspaceSlug")({
  component: WorkspaceRouteLayout,
});

function WorkspaceRouteLayout() {
  return (
    <WorkspaceProvider>
      <TourProvider>
        <WorkspaceLayout>
          <Outlet />
        </WorkspaceLayout>
        <GuidedTour />
      </TourProvider>
    </WorkspaceProvider>
  );
}
