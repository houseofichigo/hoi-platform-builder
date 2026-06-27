// @ts-nocheck
import { createFileRoute, redirect } from "@tanstack/react-router";
import { PendingTasks } from "@/components/build/pfs/process-platform";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/$workspaceSlug/build/approvals")({
  ssr: false,
  beforeLoad: async ({ params }) => {
    // Members-only: admins/owners are redirected back to the Build dashboard.
    const { data: sess } = await supabase.auth.getSession();
    const userId = sess.session?.user?.id;
    if (!userId) return;
    const { data: ws } = await (supabase as any)
      .from("workspaces").select("id").eq("slug", params.workspaceSlug).maybeSingle();
    if (!ws?.id) return;
    const { data: m } = await (supabase as any)
      .from("workspace_members").select("role").eq("workspace_id", ws.id).eq("user_id", userId).maybeSingle();
    if (m?.role === "admin" || m?.role === "owner") {
      throw redirect({ to: "/app/$workspaceSlug/build", params: { workspaceSlug: params.workspaceSlug } });
    }
  },
  component: BuildApprovals,
});

function BuildApprovals() {
  return <PendingTasks />;
}
