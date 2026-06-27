import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/$workspaceSlug/admin/invoices")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/app/$workspaceSlug/admin/billing",
      params: { workspaceSlug: params.workspaceSlug },
    });
  },
});
