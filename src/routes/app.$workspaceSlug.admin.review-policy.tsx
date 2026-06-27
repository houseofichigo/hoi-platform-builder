import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/$workspaceSlug/admin/review-policy")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/app/$workspaceSlug/admin/settings",
      params: { workspaceSlug: params.workspaceSlug },
    });
  },
});
