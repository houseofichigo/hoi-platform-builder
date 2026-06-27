// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";
import { getAuthGateState } from "@/lib/db/pfs/auth";

export type WelcomeContext = {
  organizationId: string;
  membershipId: string;
  userId: string;
  role: string;
  departmentId: string | null;
  departmentName: string | null;
  departments: Array<{ id: string; name: string }>;
  tools: Array<{ id: string; name: string; category: string | null }>;
};

export type CompleteMemberProfileInput = {
  responsibilities: string[];
  dailyToolIds: string[];
  collaborators: string[];
  decisionsMade: string[];
  departmentId: string | null;
};

export async function getWelcomeContext(): Promise<WelcomeContext> {
  const gate = await getAuthGateState();
  if (gate.status !== "signed_in" || !gate.organizationId || !gate.membershipId || !gate.role) {
    throw new Error("No active membership found.");
  }

  const client = supabase as any;
  const [{ data: department }, { data: departments }, { data: tools }] = await Promise.all([
    gate.departmentId
      ? client
          .from("department")
          .select("id, name")
          .eq("id", gate.departmentId)
          .eq("organization_id", gate.organizationId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    client
      .from("department")
      .select("id, name")
      .eq("organization_id", gate.organizationId)
      .is("archived_at", null)
      .order("name"),
    client
      .from("tool")
      .select("id, name, category")
      .eq("organization_id", gate.organizationId)
      .is("archived_at", null)
      .order("name"),
  ]);

  return {
    organizationId: gate.organizationId,
    membershipId: gate.membershipId,
    userId: gate.userId,
    role: gate.role,
    departmentId: gate.departmentId,
    departmentName: department?.name ?? null,
    departments: departments ?? [],
    tools: tools ?? [],
  };
}

export async function completeMemberProfile(input: CompleteMemberProfileInput) {
  const context = await getWelcomeContext();
  const { error } = await supabase.functions.invoke("complete-welcome", {
    body: {
      membershipId: context.membershipId,
      departmentId: input.departmentId,
      responsibilities: input.responsibilities,
      dailyToolIds: input.dailyToolIds,
      collaborators: input.collaborators,
      decisionsMade: input.decisionsMade,
    },
  });

  if (error) throw error;
}
