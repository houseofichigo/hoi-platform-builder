import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { Database } from "@/integrations/supabase/types";
import { db, requireActiveOrg } from "@/lib/db/pfs/shared";

type Role = Database["public"]["Enums"]["membership_role"];

export type OrgDepartment = {
  id: string;
  name: string;
  parentId: string | null;
  headcount: number | null;
  holdsSensitiveData: boolean;
  distinctAudience: boolean;
  audienceId: string | null;
  archivedAt: string | null;
  childrenCount: number;
  description: string | null;
  leadMembershipId: string | null;
  departmentLeadId: string | null;
};

export type OrgPerson = {
  id: string;
  userId: string;
  role: Role;
  departmentId: string | null;
  managerId: string | null;
  displayName: string;
  jobTitle: string;
  archivedAt: string | null;
  directReportsCount: number;
  email: string | null;
};

export type OrgPendingInvite = {
  id: string;
  email: string;
  role: Role;
  departmentId: string | null;
  managerId: string | null;
  status: string;
  firstName: string | null;
  lastName: string | null;
  position: string | null;
};

export type OrgChartPayload = {
  departments: OrgDepartment[];
  people: OrgPerson[];
  pendingInvites: OrgPendingInvite[];
  structureAvailable: boolean;
  company: { id: string; name: string; ownerMembershipId: string | null };
};

export type DepartmentWriteInput = {
  id?: string;
  name: string;
  parentId?: string | null;
  headcount?: number | null;
  holdsSensitiveData?: boolean;
  distinctAudience?: boolean;
  audienceId?: string | null;
  description?: string | null;
  leadMembershipId?: string | null;
};

export type InvitePersonInput = {
  email: string;
  role: Role;
  departmentId?: string | null;
  managerId?: string | null;
};

function token() {
  const random = new Uint8Array(24);
  crypto.getRandomValues(random);
  return Array.from(random, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function titleFromRole(role: string | null | undefined) {
  return (role ?? "member")
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isMissingStructureColumn(error: { message?: string; details?: string } | null | undefined) {
  const text = `${error?.message ?? ""} ${error?.details ?? ""}`.toLowerCase();
  return text.includes("parent_id") || text.includes("manager_id");
}

async function fetchOrgChartRows(workspaceId: string, includeStructure: boolean) {
  const departmentSelect = includeStructure
    ? "id, name, parent_id, headcount, holds_sensitive_data, distinct_audience, audience_id, archived_at, description, lead_membership_id"
    : "id, name, headcount, holds_sensitive_data, distinct_audience, audience_id, archived_at, description, lead_membership_id";
  const membershipSelect = includeStructure
    ? "id, user_id, role, department_id, manager_id, archived_at"
    : "id, user_id, role, department_id, archived_at";

  return Promise.all([
    db
      .from("department")
      .select(departmentSelect)
      .eq("workspace_id", workspaceId)
      .is("archived_at", null)
      .order("name"),
    db
      .from("workspace_members")
      .select(membershipSelect)
      .eq("workspace_id", workspaceId)
      .is("archived_at", null),
    db
      .from("member_profile")
      .select("membership_id, display_name, job_title")
      .eq("workspace_id", workspaceId)
      .is("archived_at", null),
    db
      .from("invitation")
      .select("id, email, role, department_id, manager_id, status, first_name, last_name, position")
      .eq("workspace_id", workspaceId)
      .eq("status", "pending")
      .is("archived_at", null)
      .order("created_at", { ascending: false }),
  ]);
}

function normalizeOrgChartRows(
  rows: Awaited<ReturnType<typeof fetchOrgChartRows>>,
  structureAvailable: boolean,
): Omit<OrgChartPayload, "company"> {
  const [departments, memberships, profiles, invitations] = rows;
  if (departments.error) throw departments.error;
  if (memberships.error) throw memberships.error;
  if (profiles.error) throw profiles.error;
  if (invitations.error) throw invitations.error;

  const profileByMembership = new Map<string, { display_name?: string | null; job_title?: string | null }>(
    (profiles.data ?? []).map((profile: any) => [profile.membership_id, profile]),
  );

  const departmentRows = (departments.data ?? []) as any[];
  const membershipRows = (memberships.data ?? []) as any[];

  const childrenCountByDept = new Map<string, number>();
  if (structureAvailable) {
    for (const dept of departmentRows) {
      if (dept.parent_id) {
        childrenCountByDept.set(dept.parent_id, (childrenCountByDept.get(dept.parent_id) ?? 0) + 1);
      }
    }
  }

  const directReportsByMembership = new Map<string, number>();
  if (structureAvailable) {
    for (const m of membershipRows) {
      if (m.manager_id) {
        directReportsByMembership.set(m.manager_id, (directReportsByMembership.get(m.manager_id) ?? 0) + 1);
      }
    }
  }

  return {
    departments: departmentRows.map((department: any) => ({
      id: department.id,
      name: department.name,
      parentId: structureAvailable ? department.parent_id ?? null : null,
      headcount: department.headcount ?? null,
      holdsSensitiveData: Boolean(department.holds_sensitive_data),
      distinctAudience: Boolean(department.distinct_audience),
      audienceId: department.audience_id ?? null,
      archivedAt: department.archived_at ?? null,
      childrenCount: childrenCountByDept.get(department.id) ?? 0,
      description: department.description ?? null,
      leadMembershipId: department.lead_membership_id ?? null,
      departmentLeadId: department.lead_membership_id ?? null,
    })),
    people: membershipRows.map((membership: any) => {
      const profile = profileByMembership.get(membership.id);
      return {
        id: membership.id,
        userId: membership.user_id,
        role: membership.role,
        departmentId: membership.department_id ?? null,
        managerId: structureAvailable ? membership.manager_id ?? null : null,
        displayName: profile?.display_name || `Member ${String(membership.user_id).slice(0, 8)}`,
        jobTitle: profile?.job_title || titleFromRole(membership.role),
        archivedAt: membership.archived_at ?? null,
        directReportsCount: directReportsByMembership.get(membership.id) ?? 0,
        email: null,
      };
    }),
    pendingInvites: (invitations.data ?? []).map((invite: any) => ({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      departmentId: invite.department_id ?? null,
      managerId: invite.manager_id ?? null,
      status: invite.status,
      firstName: invite.first_name ?? null,
      lastName: invite.last_name ?? null,
      position: invite.position ?? null,
    })),
    structureAvailable,
  };
}

export async function fetchOrgChart(): Promise<OrgChartPayload> {
  const gate = await requireActiveOrg();

  const structuredRows = await fetchOrgChartRows(gate.workspaceId, true);
  const [departmentResult, membershipResult] = structuredRows;
  const orgRes = await db
    .from("workspaces")
    .select("id, name, owner_membership_id")
    .eq("id", gate.workspaceId)
    .maybeSingle();
  const company = {
    id: gate.workspaceId,
    name: orgRes?.data?.name ?? "Company",
    ownerMembershipId: (orgRes?.data?.owner_membership_id as string | null) ?? null,
  };
  if (isMissingStructureColumn(departmentResult.error) || isMissingStructureColumn(membershipResult.error)) {
    return { ...normalizeOrgChartRows(await fetchOrgChartRows(gate.workspaceId, false), false), company };
  }

  return { ...normalizeOrgChartRows(structuredRows, true), company };
}

export async function createDepartment(input: DepartmentWriteInput) {
  const gate = await requireActiveOrg();
  const payload = {
    workspace_id: gate.workspaceId,
    name: input.name,
    parent_id: input.parentId ?? null,
    headcount: input.headcount ?? 0,
    holds_sensitive_data: Boolean(input.holdsSensitiveData),
    distinct_audience: Boolean(input.distinctAudience),
    audience_id: input.audienceId ?? null,
  };

  const { error } = await db.from("department").insert(payload);
  if (isMissingStructureColumn(error)) {
    const { parent_id: _parentId, ...flatPayload } = payload;
    const { error: fallbackError } = await db.from("department").insert(flatPayload);
    if (fallbackError) throw fallbackError;
    return;
  }
  if (error) throw error;
}

export async function updateDepartment(input: DepartmentWriteInput & { id: string }) {
  const gate = await requireActiveOrg();
  const patch: Record<string, unknown> = {
    name: input.name,
    parent_id: input.parentId ?? null,
    headcount: input.headcount ?? 0,
    holds_sensitive_data: Boolean(input.holdsSensitiveData),
    distinct_audience: Boolean(input.distinctAudience),
    audience_id: input.audienceId ?? null,
  };
  if ("description" in input) patch.description = input.description ?? null;
  if ("leadMembershipId" in input) patch.lead_membership_id = input.leadMembershipId ?? null;

  const { error } = await db
    .from("department")
    .update(patch)
    .eq("workspace_id", gate.workspaceId)
    .eq("id", input.id);
  if (isMissingStructureColumn(error)) {
    const { parent_id: _parentId, ...flatPatch } = patch;
    const { error: fallbackError } = await db
      .from("department")
      .update(flatPatch)
      .eq("workspace_id", gate.workspaceId)
      .eq("id", input.id);
    if (fallbackError) throw fallbackError;
    return;
  }
  if (error) throw error;
}

export async function updateMemberProfile(input: {
  membershipId: string;
  displayName?: string;
  jobTitle?: string;
  departmentId?: string | null;
}) {
  const gate = await requireActiveOrg();
  // department lives on membership; name/title live on member_profile
  if ("departmentId" in input) {
    const { error } = await db
      .from("workspace_members")
      .update({ department_id: input.departmentId ?? null })
      .eq("workspace_id", gate.workspaceId)
      .eq("id", input.membershipId);
    if (error) throw error;
  }
  const profilePatch: Record<string, unknown> = {};
  if (typeof input.displayName === "string") profilePatch.display_name = input.displayName;
  if (typeof input.jobTitle === "string") profilePatch.job_title = input.jobTitle;
  if (Object.keys(profilePatch).length === 0) return;
  const { error } = await db
    .from("member_profile")
    .update(profilePatch)
    .eq("workspace_id", gate.workspaceId)
    .eq("membership_id", input.membershipId);
  if (error) throw error;
}

export async function updateInvitationDetails(input: {
  inviteId: string;
  firstName?: string | null;
  lastName?: string | null;
  position?: string | null;
  email?: string;
  departmentId?: string | null;
}) {
  const gate = await requireActiveOrg();
  const patch: Record<string, unknown> = {};
  if ("firstName" in input) patch.first_name = input.firstName ?? null;
  if ("lastName" in input) patch.last_name = input.lastName ?? null;
  if ("position" in input) patch.position = input.position ?? null;
  if (typeof input.email === "string" && input.email.trim()) patch.email = input.email.trim();
  if ("departmentId" in input) patch.department_id = input.departmentId ?? null;
  if (Object.keys(patch).length === 0) return;
  const { error } = await db
    .from("invitation")
    .update(patch as never)
    .eq("workspace_id", gate.workspaceId)
    .eq("id", input.inviteId);
  if (error) throw error;
}

export async function archiveDepartment(id: string): Promise<{ archived: boolean; processCount: number }> {
  const gate = await requireActiveOrg();
  const { count, error: countError } = await db
    .from("process")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", gate.workspaceId)
    .eq("department_id", id)
    .is("archived_at", null);
  if (countError) throw countError;

  const processCount = count ?? 0;
  if (processCount > 0) return { archived: false, processCount };

  const { error } = await db
    .from("department")
    .update({ archived_at: new Date().toISOString() })
    .eq("workspace_id", gate.workspaceId)
    .eq("id", id);
  if (error) throw error;
  return { archived: true, processCount };
}

export type InvitePersonExtendedInput = InvitePersonInput & {
  firstName?: string | null;
  lastName?: string | null;
  position?: string | null;
};

/**
 * Stage a new invitation as a DRAFT. No email is sent here — call
 * sendPendingInvitations (lib/org-chart/import.ts) from the org chart's
 * "Send all invites" action to flush queued drafts in one batch.
 */
export async function invitePerson(input: InvitePersonExtendedInput) {
  const gate = await requireActiveOrg();
  const { error } = await db
    .from("invitation")
    .insert({
      workspace_id: gate.workspaceId,
      email: input.email.trim().toLowerCase(),
      role: input.role,
      department_id: input.departmentId ?? null,
      manager_id: input.managerId ?? null,
      first_name: input.firstName ?? null,
      last_name: input.lastName ?? null,
      position: input.position ?? null,
      token: token(),
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
      status: "pending",
      send_state: "draft",
    } as any);
  if (error) throw error;
}

export async function assignMembership(input: { membershipId: string; departmentId?: string | null; managerId?: string | null }) {
  const gate = await requireActiveOrg();
  const patch: Record<string, string | null> = {};
  if ("departmentId" in input) patch.department_id = input.departmentId ?? null;
  if ("managerId" in input) patch.manager_id = input.managerId ?? null;

  const { error } = await db
    .from("workspace_members")
    .update(patch)
    .eq("workspace_id", gate.workspaceId)
    .eq("id", input.membershipId);
  if (error) throw error;
}

export async function updateMembershipRole(input: { membershipId: string; role: Role }) {
  const gate = await requireActiveOrg();
  const { error } = await db
    .from("workspace_members")
    .update({ role: input.role })
    .eq("workspace_id", gate.workspaceId)
    .eq("id", input.membershipId);
  if (error) throw error;
}

export async function archiveMembership(id: string) {
  const gate = await requireActiveOrg();
  const { error } = await db
    .from("workspace_members")
    .update({ archived_at: new Date().toISOString() })
    .eq("workspace_id", gate.workspaceId)
    .eq("id", id);
  if (error) throw error;
}

export async function updateOrganization(input: { name?: string; ownerMembershipId?: string | null }) {
  const gate = await requireActiveOrg();
  const patch: Record<string, string | null> = {};
  if (typeof input.name === "string") patch.name = input.name;
  if ("ownerMembershipId" in input) patch.owner_membership_id = input.ownerMembershipId ?? null;
  if (Object.keys(patch).length === 0) return;
  const { error } = await db
    .from("workspaces")
    .update(patch)
    .eq("id", gate.workspaceId);
  if (error) throw error;
}

export async function updateInvitationAssignment(input: { inviteId: string; departmentId: string | null }) {
  const gate = await requireActiveOrg();
  const { error } = await db
    .from("invitation")
    .update({ department_id: input.departmentId ?? null })
    .eq("workspace_id", gate.workspaceId)
    .eq("id", input.inviteId);
  if (error) throw error;
}

export async function updateInvitationRole(input: { inviteId: string; role: Role }) {
  const gate = await requireActiveOrg();
  const { error } = await db
    .from("invitation")
    .update({ role: input.role })
    .eq("workspace_id", gate.workspaceId)
    .eq("id", input.inviteId);
  if (error) throw error;
}

export async function updateInvitationManager(input: { inviteId: string; managerId: string | null }) {
  const gate = await requireActiveOrg();
  const { error } = await db
    .from("invitation")
    .update({ manager_id: input.managerId ?? null } as any)
    .eq("workspace_id", gate.workspaceId)
    .eq("id", input.inviteId);
  if (error) throw error;
}

export async function updateOrganizationOwner(input: { membershipId: string | null }) {
  return updateOrganization({ ownerMembershipId: input.membershipId });
}

export async function updateDepartmentLead(input: { departmentId: string; leadMembershipId: string | null }) {
  const gate = await requireActiveOrg();
  const { error } = await db
    .from("department")
    .update({ lead_membership_id: input.leadMembershipId ?? null })
    .eq("workspace_id", gate.workspaceId)
    .eq("id", input.departmentId);
  if (error) throw error;
}

export function useOrgChart() {
  return useQuery({ queryKey: ["org-chart"], queryFn: fetchOrgChart });
}

export function useOrgChartMutation<TInput, TResult = unknown>(mutationFn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["org-chart"] }),
        queryClient.invalidateQueries({ queryKey: ["members"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["departments"] }),
        queryClient.invalidateQueries({ queryKey: ["invitations"] }),
        queryClient.invalidateQueries({ queryKey: ["company-onboarding"] }),
      ]);
    },
  });
}
