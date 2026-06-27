import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/$workspaceSlug/admin/analytics")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/app/$workspaceSlug/admin",
      params: { workspaceSlug: params.workspaceSlug },
    });
  },
});
