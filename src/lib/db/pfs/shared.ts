import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { getAuthGateState, type AuthGateState } from "@/lib/db/pfs/auth";

export type Tables = Database["public"]["Tables"];
export type Row<T extends keyof Tables> = Tables[T]["Row"];
export type JsonRecord = Record<string, unknown>;

export const db = supabase as any;

export function asRecord(value: unknown): JsonRecord {
  return value != null && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};
}

export function numberFrom(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function stringFrom(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

type SignedInState = Extract<AuthGateState, { status: "signed_in" }> & {
  workspaceId: string;
  membershipId: string;
};

export async function requireActiveOrg(): Promise<SignedInState> {
  const state = await getAuthGateState();
  if (state.status !== "signed_in" || !state.workspaceId || !state.membershipId) {
    throw new Error("No active workspace found.");
  }
  return state as SignedInState;
}

/** SSR-safe variant. Returns null during SSR or when there is no active workspace. */
export async function tryGetActiveOrg(): Promise<SignedInState | null> {
  if (typeof window === "undefined") return null;
  try {
    const state = await getAuthGateState();
    if (state.status !== "signed_in" || !state.workspaceId || !state.membershipId) return null;
    return state as SignedInState;
  } catch {
    return null;
  }
}

export function useCurrentMembership() {
  return useQuery({ queryKey: ["pfs-current-membership"], queryFn: requireActiveOrg });
}

export function useActiveOrg() {
  return useQuery({
    queryKey: ["pfs-active-workspace"],
    queryFn: async () => {
      const gate = await requireActiveOrg();
      const { data, error } = await db
        .from("workspaces")
        .select("id, name, slug, plan")
        .eq("id", gate.workspaceId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useOnboardingStatus() {
  return useQuery({
    queryKey: ["pfs-onboarding-status"],
    queryFn: async () => {
      const gate = await requireActiveOrg();
      return {
        workspaceId: gate.workspaceId,
        role: gate.role,
        companyOnboardingComplete: gate.onboardingComplete,
        roleContextComplete: gate.roleContextComplete,
      };
    },
  });
}
