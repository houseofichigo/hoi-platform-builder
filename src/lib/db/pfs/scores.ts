// @ts-nocheck — Ported PFS module.
import { useQuery } from "@tanstack/react-query";

import { db, requireActiveOrg, type Row } from "@/lib/db/pfs/shared";

export type DepartmentScoreView = Row<"department_score"> & {
  department?: { name?: string | null } | null;
};

export function useDepartmentScores() {
  return useQuery({
    queryKey: ["department-scores"],
    queryFn: async () => {
      const gate = await requireActiveOrg();
      const { data, error } = await db
        .from("department_score")
        .select("*, department:department_id(name)")
        .eq("workspace_id", gate.workspaceId)
        .order("computed_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as DepartmentScoreView[];
    },
  });
}

export function useCompanyScore() {
  return useQuery({
    queryKey: ["company-score"],
    queryFn: async () => {
      const gate = await requireActiveOrg();
      const { data, error } = await db
        .from("company_score")
        .select("*")
        .eq("workspace_id", gate.workspaceId)
        .order("computed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as Row<"company_score"> | null;
    },
  });
}
