import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { WORKSPACE_PROFILE_SCHEMA } from "@/lib/profile/workspace-profile";
import { isProfileComplete, type ProfileValues } from "@/lib/profile/schema";

export type ChecklistItemId =
  | "workspace_profile"
  | "invite"
  | "tour"
  | "library";

export interface ChecklistItem {
  id: ChecklistItemId;
  title: string;
  description: string;
  complete: boolean;
  actionLabel: string;
  actionDisabled?: boolean;
  optional?: boolean;
}

export interface ChecklistState {
  shouldRender: boolean;
  dismissedAt: string | null;
  isFresh: boolean;
  hasFewMembers: boolean;
  isAdmin: boolean;
  firstName: string | null;
  workedExample: string | null;
  items: ChecklistItem[];
  completedCount: number;
  totalCount: number;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function useOnboardingChecklist() {
  const { user } = useAuth();
  const { workspace, isAdmin } = useWorkspace();

  return useQuery({
    enabled: !!user && !!workspace,
    queryKey: ["onboarding-checklist", workspace?.id, user?.id],
    queryFn: async (): Promise<ChecklistState> => {
      const nowIso = new Date().toISOString();
      const [
        { data: ws },
        { data: profile },
        { count: memberCount },
        { count: acceptedInviteCount },
        { count: activePendingInviteCount },
      ] = await Promise.all([
        supabase
          .from("workspaces")
          .select("created_at, onboarding_dismissed_at, workspace_profile")
          .eq("id", workspace!.id)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("full_name, tour_completed_at, library_visited_at")
          .eq("user_id", user!.id)
          .maybeSingle(),
        supabase
          .from("workspace_members")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspace!.id),
        supabase
          .from("workspace_invitations")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspace!.id)
          .eq("status", "accepted"),
        supabase
          .from("workspace_invitations")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspace!.id)
          .eq("status", "pending")
          .gt("expires_at", nowIso),
      ]);

      const safeMemberCount = memberCount ?? 0;
      const safeAcceptedInvites = acceptedInviteCount ?? 0;
      const safeActivePendingInvites = activePendingInviteCount ?? 0;

      const createdAt = ws?.created_at ? new Date(ws.created_at).getTime() : 0;
      const isFresh = createdAt > 0 && Date.now() - createdAt < THIRTY_DAYS_MS;
      const hasFewMembers = safeMemberCount < 3;
      const notDismissed = !ws?.onboarding_dismissed_at;
      const shouldRender = !!isAdmin && isFresh && hasFewMembers && notDismissed;

      
      const workspaceProfileComplete =
        !!ws?.workspace_profile &&
        isProfileComplete(
          WORKSPACE_PROFILE_SCHEMA,
          ws.workspace_profile as ProfileValues,
        );

      // "Invite your team" is complete when ANY of these are true, so the
      // item can't get stuck:
      //   - another member actually joined (memberCount > 1), OR
      //   - an invitation was accepted (covers the join even if the member
      //     row read is blocked by RLS), OR
      //   - there's a still-valid pending invitation outstanding.
      // Expired or revoked invitations intentionally don't keep it complete.
      const inviteComplete =
        safeMemberCount > 1 ||
        safeAcceptedInvites > 0 ||
        safeActivePendingInvites > 0;
      const tourComplete = !!profile?.tour_completed_at;
      const libraryComplete = !!profile?.library_visited_at;

      const items: ChecklistItem[] = [
        {
          id: "workspace_profile",
          title: "Set up your company profile",
          description:
            "Five quick questions about your company. Every example in your training is generated from this context — no fictional profile.",
          complete: workspaceProfileComplete,
          actionLabel: "Set up company profile",
        },
        {
          id: "invite",
          title: "Invite your team",
          description: "Workspaces are better with teammates. Invite the people you'll work with.",
          complete: inviteComplete,
          actionLabel: "Send invites",
        },

        {
          id: "tour",
          title: "Tour the methodology",
          description: "Three-minute walkthrough of the four phases, three gates, twelve modules.",
          complete: tourComplete,
          actionLabel: "Take the tour",
        },
        {
          id: "library",
          title: "Browse the library",
          description: "See what's possible. Prompts, agents, and case studies curated by House of Ichigo.",
          complete: libraryComplete,
          actionLabel: "Browse library",
        },
      ];

      const firstName = profile?.full_name?.trim().split(/\s+/)[0] ?? null;
      const requiredItems = items.filter((i) => !i.optional);

      return {
        shouldRender,
        dismissedAt: ws?.onboarding_dismissed_at ?? null,
        isFresh,
        hasFewMembers,
        isAdmin,
        firstName,
        workedExample: null,
        items,
        completedCount: requiredItems.filter((i) => i.complete).length,
        totalCount: requiredItems.length,
      };
    },
  });
}

export function useOnboardingMutations() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { workspace } = useWorkspace();

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["onboarding-checklist", workspace?.id, user?.id] });

  const trackEvent = async (eventType: string, metadata: Record<string, unknown> = {}) => {
    if (!user || !workspace) return;
    await (supabase as any).from("onboarding_events").insert({
      workspace_id: workspace.id,
      user_id: user.id,
      event_type: eventType,
      metadata: metadata as never,
    } as never);
  };

  const markTourCompleted = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ tour_completed_at: new Date().toISOString() })
        .eq("user_id", user!.id);
      if (error) throw error;
      await trackEvent("methodology_tour_completed");
    },
    onSuccess: invalidate,
  });

  const markLibraryVisited = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ library_visited_at: new Date().toISOString() })
        .eq("user_id", user!.id);
      if (error) throw error;
      await trackEvent("discover_library_visited");
    },
    onSuccess: invalidate,
  });

  const dismissChecklist = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("workspaces")
        .update({ onboarding_dismissed_at: new Date().toISOString() })
        .eq("id", workspace!.id);
      if (error) throw error;
      await trackEvent("checklist_hidden");
    },
    onSuccess: invalidate,
  });

  const restoreChecklist = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("workspaces")
        .update({ onboarding_dismissed_at: null })
        .eq("id", workspace!.id);
      if (error) throw error;
      await trackEvent("checklist_restored");
    },
    onSuccess: invalidate,
  });

  return {
    markTourCompleted,
    markLibraryVisited,
    dismissChecklist,
    restoreChecklist,
  };
}
