import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";

const db = supabase as any;

export type WorkspaceRole = "owner" | "admin" | "member" | "viewer";

export interface OrgDepartment {
  id: string;
  name: string;
  parentId: string | null;
  leadMemberId: string | null;
  headcount: number | null;
  description: string | null;
  holdsSensitiveData: boolean;
  distinctAudience: boolean;
  archivedAt: string | null;
  childrenCount: number;
}

export interface OrgPerson {
  id: string;
  userId: string;
  role: WorkspaceRole;
  departmentId: string | null;
  managerMemberId: string | null;
  displayName: string;
  jobTitle: string;
  avatarUrl: string | null;
  directReportsCount: number;
}

export interface OrgPendingInvite {
  id: string;
  email: string;
  role: Exclude<WorkspaceRole, "owner">;
  departmentId: string | null;
  managerMemberId: string | null;
  status: string;
}

export interface OrgChartPayload {
  workspace: { id: string; name: string; slug: string };
  departments: OrgDepartment[];
  people: OrgPerson[];
  pendingInvites: OrgPendingInvite[];
  structureAvailable: boolean;
}

export interface DepartmentInput {
  id?: string;
  name: string;
  parentId?: string | null;
  leadMemberId?: string | null;
  headcount?: number | null;
  description?: string | null;
  holdsSensitiveData?: boolean;
  distinctAudience?: boolean;
}

export interface InviteInput {
  email: string;
  role: Exclude<WorkspaceRole, "owner">;
  departmentId?: string | null;
  managerMemberId?: string | null;
}

function token() {
  const random = new Uint8Array(24);
  crypto.getRandomValues(random);
  return Array.from(random, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function roleTitle(role: string | null | undefined) {
  return (role ?? "member").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function platformRole(role: string): Exclude<WorkspaceRole, "owner"> {
  if (role === "admin" || role === "reviewer") return "admin";
  if (role === "viewer") return "viewer";
  return "member";
}

export async function fetchOrgChart(workspaceId: string): Promise<OrgChartPayload> {
  const [workspaceRes, departmentsRes, membersRes, invitesRes] = await Promise.all([
    db.from("workspaces").select("id, name, slug").eq("id", workspaceId).maybeSingle(),
    db
      .from("department")
      .select("id, name, parent_id, lead_member_id, headcount, description, holds_sensitive_data, distinct_audience, archived_at")
      .eq("workspace_id", workspaceId)
      .is("archived_at", null)
      .order("name"),
    db
      .from("workspace_members")
      .select("id, user_id, role, department_id, manager_member_id")
      .eq("workspace_id", workspaceId),
    db
      .from("workspace_invitations")
      .select("id, email, role, status, department_id, manager_member_id")
      .eq("workspace_id", workspaceId)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ]);

  if (workspaceRes.error) throw workspaceRes.error;
  if (departmentsRes.error) throw departmentsRes.error;
  if (membersRes.error) throw membersRes.error;
  if (invitesRes.error) throw invitesRes.error;

  const members = membersRes.data ?? [];
  const userIds = members.map((m: any) => m.user_id).filter(Boolean);
  const { data: profiles, error: profilesError } = userIds.length
    ? await db.from("profiles").select("user_id, full_name, avatar_url, job_role").in("user_id", userIds)
    : { data: [], error: null };
  if (profilesError) throw profilesError;

  const profileByUser = new Map<string, { full_name?: string | null; avatar_url?: string | null; job_role?: string | null }>(
    (profiles ?? []).map((profile: any) => [profile.user_id, profile])
  );
  const directReports = new Map<string, number>();
  for (const member of members) {
    if (member.manager_member_id) {
      directReports.set(member.manager_member_id, (directReports.get(member.manager_member_id) ?? 0) + 1);
    }
  }

  const departmentChildren = new Map<string, number>();
  for (const department of departmentsRes.data ?? []) {
    if (department.parent_id) {
      departmentChildren.set(department.parent_id, (departmentChildren.get(department.parent_id) ?? 0) + 1);
    }
  }

  return {
    workspace: workspaceRes.data,
    departments: (departmentsRes.data ?? []).map((department: any) => ({
      id: department.id,
      name: department.name,
      parentId: department.parent_id ?? null,
      leadMemberId: department.lead_member_id ?? null,
      headcount: department.headcount ?? null,
      description: department.description ?? null,
      holdsSensitiveData: Boolean(department.holds_sensitive_data),
      distinctAudience: Boolean(department.distinct_audience),
      archivedAt: department.archived_at ?? null,
      childrenCount: departmentChildren.get(department.id) ?? 0,
    })),
    people: members.map((member: any) => {
      const profile = profileByUser.get(member.user_id);
      return {
        id: member.id,
        userId: member.user_id,
        role: member.role,
        departmentId: member.department_id ?? null,
        managerMemberId: member.manager_member_id ?? null,
        displayName: profile?.full_name || `Member ${String(member.user_id).slice(0, 8)}`,
        jobTitle: profile?.job_role || roleTitle(member.role),
        avatarUrl: profile?.avatar_url ?? null,
        directReportsCount: directReports.get(member.id) ?? 0,
      };
    }),
    pendingInvites: (invitesRes.data ?? []).map((invite: any) => ({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      departmentId: invite.department_id ?? null,
      managerMemberId: invite.manager_member_id ?? null,
      status: invite.status,
    })),
    structureAvailable: true,
  };
}

export async function saveDepartment(workspaceId: string, input: DepartmentInput) {
  const payload = {
    workspace_id: workspaceId,
    name: input.name.trim(),
    parent_id: input.parentId ?? null,
    lead_member_id: input.leadMemberId ?? null,
    headcount: input.headcount ?? 0,
    description: input.description?.trim() || null,
    holds_sensitive_data: Boolean(input.holdsSensitiveData),
    distinct_audience: Boolean(input.distinctAudience),
  };

  const result = input.id
    ? await db.from("department").update(payload).eq("id", input.id).eq("workspace_id", workspaceId).select("*").single()
    : await db.from("department").insert(payload).select("*").single();
  if (result.error) throw result.error;
  return result.data;
}

export async function archiveDepartment(workspaceId: string, departmentId: string) {
  const { count, error: processError } = await db
    .from("process")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .eq("department_id", departmentId)
    .is("archived_at", null);
  if (processError) throw processError;
  if ((count ?? 0) > 0) {
    throw new Error("Reassign or archive this department's processes before archiving the department.");
  }

  const { error } = await db
    .from("department")
    .update({ archived_at: new Date().toISOString() })
    .eq("workspace_id", workspaceId)
    .eq("id", departmentId);
  if (error) throw error;
}

export async function assignMemberStructure(workspaceId: string, memberId: string, input: { departmentId?: string | null; managerMemberId?: string | null }) {
  const { error } = await db
    .from("workspace_members")
    .update({
      department_id: input.departmentId ?? null,
      manager_member_id: input.managerMemberId ?? null,
    })
    .eq("workspace_id", workspaceId)
    .eq("id", memberId);
  if (error) throw error;
}

export async function setDepartmentLead(workspaceId: string, departmentId: string, leadMemberId: string | null) {
  const { error } = await db
    .from("department")
    .update({ lead_member_id: leadMemberId })
    .eq("workspace_id", workspaceId)
    .eq("id", departmentId);
  if (error) throw error;
}

export async function inviteWorkspacePerson(workspaceId: string, invitedBy: string, input: InviteInput) {
  const { error } = await db.from("workspace_invitations").insert({
    workspace_id: workspaceId,
    email: input.email.trim().toLowerCase(),
    role: platformRole(input.role),
    invited_by: invitedBy,
    token: token(),
    department_id: input.departmentId ?? null,
    manager_member_id: input.managerMemberId ?? null,
  });
  if (error) throw error;
}

export function useOrgChart() {
  const { workspace } = useWorkspace();
  return useQuery({
    enabled: !!workspace,
    queryKey: ["org-chart", workspace?.id],
    queryFn: () => fetchOrgChart(workspace!.id),
  });
}

function useOrgChartMutation<TInput>(mutationFn: (workspaceId: string, input: TInput) => Promise<unknown>) {
  const { workspace } = useWorkspace();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TInput) => mutationFn(workspace!.id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["org-chart", workspace?.id] }),
  });
}

export function useSaveDepartment() {
  return useOrgChartMutation<DepartmentInput>((workspaceId, input) => saveDepartment(workspaceId, input));
}

export function useArchiveDepartment() {
  return useOrgChartMutation<string>((workspaceId, departmentId) => archiveDepartment(workspaceId, departmentId));
}

export function useAssignMemberStructure() {
  return useOrgChartMutation<{ memberId: string; departmentId?: string | null; managerMemberId?: string | null }>(
    (workspaceId, input) => assignMemberStructure(workspaceId, input.memberId, input),
  );
}

export function useSetDepartmentLead() {
  return useOrgChartMutation<{ departmentId: string; leadMemberId: string | null }>(
    (workspaceId, input) => setDepartmentLead(workspaceId, input.departmentId, input.leadMemberId),
  );
}

export function useInviteWorkspacePerson() {
  const { workspace } = useWorkspace();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: InviteInput) => inviteWorkspacePerson(workspace!.id, user!.id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["org-chart", workspace?.id] }),
  });
}
