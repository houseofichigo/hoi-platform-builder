import { useQuery } from "@tanstack/react-query";

import { db, requireActiveOrg, type Row } from "@/lib/db/pfs/shared";

async function byOrg<T extends "department" | "tool" | "data_source" | "invitation">(table: T, orderColumn = "name") {
  const gate = await requireActiveOrg();
  const { data, error } = await db
    .from(table)
    .select("*")
    .eq("workspace_id", gate.workspaceId)
    .is("archived_at", null)
    .order(orderColumn);

  if (error) throw error;
  return (data ?? []) as Array<Row<T>>;
}

export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: () => byOrg("department"),
  });
}

export function useTools() {
  return useQuery({
    queryKey: ["tools"],
    queryFn: () => byOrg("tool"),
  });
}

export function useDataSources() {
  return useQuery({
    queryKey: ["data-sources"],
    queryFn: () => byOrg("data_source"),
  });
}

export function useInvitations() {
  return useQuery({
    queryKey: ["invitations"],
    queryFn: () => byOrg("invitation", "created_at"),
  });
}
