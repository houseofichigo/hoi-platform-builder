import { useQuery } from "@tanstack/react-query";

import { db, requireActiveOrg, type Row } from "@/lib/db/pfs/shared";

export function useOpportunities() {
  return useQuery({
    queryKey: ["opportunities"],
    queryFn: async () => {
      const gate = await requireActiveOrg();
      const { data, error } = await db
        .from("opportunity")
        .select("*, department:department_id(name), process:process_id(name)")
        .eq("workspace_id", gate.workspaceId)
        .is("archived_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as Array<Row<"opportunity"> & { department?: { name?: string | null }; process?: { name?: string | null } }>;
    },
  });
}

export function useRoadmap() {
  return useQuery({
    queryKey: ["roadmap"],
    queryFn: async () => {
      const gate = await requireActiveOrg();
      const { data, error } = await db
        .from("roadmap_item")
        .select("*, opportunity:opportunity_id(problem, recommended_solution, type)")
        .eq("workspace_id", gate.workspaceId)
        .is("archived_at", null)
        .order("impact", { ascending: false });

      if (error) throw error;
      return (data ?? []) as Array<Row<"roadmap_item"> & { opportunity?: { problem?: string; recommended_solution?: string; type?: string } }>;
    },
  });
}
