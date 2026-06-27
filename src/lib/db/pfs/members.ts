// @ts-nocheck
import { useQuery } from "@tanstack/react-query";

import { db, requireActiveOrg } from "@/lib/db/pfs/shared";

export type MemberSuggestion = {
  id: string;
  name: string;
  role: string;
  department: string;
};

function titleFromRole(role: string | null | undefined) {
  return (role ?? "member")
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function listMembers(): Promise<MemberSuggestion[]> {
  const gate = await requireActiveOrg();
  const [{ data: memberships, error: membershipError }, { data: profiles, error: profileError }, { data: departments, error: departmentError }] =
    await Promise.all([
      db
        .from("workspace_members")
        .select("id, user_id, role, department_id")
        .eq("workspace_id", gate.workspaceId),
      db
        .from("member_profile")
        .select("membership_id, user_id, display_name, job_title")
        .eq("workspace_id", gate.workspaceId)
        .is("archived_at", null),
      db
        .from("department")
        .select("id, name")
        .eq("workspace_id", gate.workspaceId)
        .is("archived_at", null),
    ]);

  if (membershipError) throw membershipError;
  if (profileError) throw profileError;
  if (departmentError) throw departmentError;

  const profileByMembership = new Map<string, any>((profiles ?? []).map((profile: any) => [profile.membership_id, profile]));
  const departmentById = new Map((departments ?? []).map((department: any) => [department.id, department.name]));

  return (memberships ?? []).map((membership: any) => {
    const profile = profileByMembership.get(membership.id);
    const role = profile?.job_title || titleFromRole(membership.role);
    const shortUser = String(membership.user_id ?? "").slice(0, 8);
    return {
      id: membership.user_id,
      name: profile?.display_name || role || `Member ${shortUser}`,
      role,
      department: departmentById.get(membership.department_id) ?? "",
    };
  });
}

export function useMembers() {
  return useQuery({ queryKey: ["members"], queryFn: listMembers });
}
