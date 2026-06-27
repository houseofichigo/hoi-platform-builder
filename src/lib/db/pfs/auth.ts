/**
 * HOI-flavored auth gate that mimics the PFS `AuthGateState` shape so all
 * ported PFS adapters keep working unchanged. The "organization" in PFS maps
 * to a HOI workspace; the "membership" maps to a `workspace_members` row.
 *
 * The active workspace is normally derived from the current Workspace context
 * (set in `useWorkspace`). For modules that need to know the active workspace
 * outside of React (server fns, query fns), call `setActiveWorkspaceId(id)`
 * from a top-level effect in the workspace shell.
 */
import { supabase } from "@/integrations/supabase/client";

export type MembershipRole = "owner" | "admin" | "member" | "viewer";

export type AuthGateState =
  | { status: "signed_out" }
  | {
      status: "signed_in";
      userId: string;
      membershipId: string | null;
      workspaceId: string | null;
      organizationId: string | null;
      role: MembershipRole | null;
      departmentId: string | null;
      onboardingComplete: boolean;
      roleContextComplete: boolean;
    };

export function isAdminRole(role: MembershipRole | null) {
  return role === "owner" || role === "admin";
}

export function needsRoleContext(role: MembershipRole | null) {
  return role != null && role !== "admin" && role !== "owner";
}

let activeWorkspaceId: string | null = null;

export function setActiveWorkspaceId(id: string | null) {
  activeWorkspaceId = id;
}

export function getActiveWorkspaceId(): string | null {
  return activeWorkspaceId;
}

const client = supabase as any;

async function resolveActiveWorkspaceId(userId: string): Promise<string | null> {
  if (activeWorkspaceId) return activeWorkspaceId;
  // Fallback: user's default workspace from profile
  const { data: profile } = await client
    .from("profiles")
    .select("default_workspace_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (profile?.default_workspace_id) return profile.default_workspace_id as string;
  // Last resort: first membership
  const { data: m } = await client
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  return (m?.workspace_id as string) ?? null;
}

export async function getAuthGateState(): Promise<AuthGateState> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return { status: "signed_out" };

  const workspaceId = await resolveActiveWorkspaceId(user.id);

  if (!workspaceId) {
    return {
      status: "signed_in",
      userId: user.id,
      membershipId: null,
      workspaceId: null,
      organizationId: null,
      role: null,
      departmentId: null,
      onboardingComplete: false,
      roleContextComplete: false,
    };
  }

  const { data: membership } = await client
    .from("workspace_members")
    .select("id, role, department_id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();

  const membershipId = (membership?.id as string) ?? null;
  const role = (membership?.role as MembershipRole) ?? null;
  const departmentId = (membership?.department_id as string) ?? null;

  // Onboarding heuristic: company_profile exists for the workspace and member_profile exists for this membership
  const [{ count: profileCount }, { data: memberProfile }] = await Promise.all([
    client
      .from("company_profile")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .is("archived_at", null),
    membershipId
      ? client
          .from("member_profile")
          .select("completed_at")
          .eq("workspace_id", workspaceId)
          .eq("membership_id", membershipId)
          .is("archived_at", null)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    status: "signed_in",
    userId: user.id,
    membershipId,
    workspaceId,
    organizationId: workspaceId,
    role,
    departmentId,
    onboardingComplete: Boolean((profileCount ?? 0) > 0),
    roleContextComplete: !needsRoleContext(role) || Boolean(memberProfile?.completed_at),
  };
}
