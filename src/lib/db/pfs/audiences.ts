// @ts-nocheck
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { db, requireActiveOrg } from "@/lib/db/pfs/shared";

export type AudienceRow = {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  scope: string | null;
  created_at: string | null;
  archived_at: string | null;
};

const audienceSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().optional().default(""),
  scope: z.enum(["all_staff", "leadership", "learners", "client", "custom"]).default("custom"),
});

export type AudienceInput = z.input<typeof audienceSchema>;

export async function listAudiences() {
  const gate = await requireActiveOrg();
  const { data, error } = await db
    .from("audience")
    .select("*")
    .eq("workspace_id", gate.workspaceId)
    .is("archived_at", null)
    .order("name");
  if (error) throw error;
  return (data ?? []) as AudienceRow[];
}

export async function saveAudience(input: AudienceInput) {
  const gate = await requireActiveOrg();
  const parsed = audienceSchema.parse(input);
  const { error } = await db.from("audience").insert({
    workspace_id: gate.workspaceId,
    name: parsed.name,
    description: parsed.description,
    scope: parsed.scope,
  });
  if (error) throw error;
}

export async function archiveAudience(id: string) {
  const gate = await requireActiveOrg();
  const { error } = await db
    .from("audience")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .eq("workspace_id", gate.workspaceId);
  if (error) throw error;
}

export function useAudiences() {
  return useQuery({ queryKey: ["audiences"], queryFn: listAudiences });
}

export function useSaveAudience() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveAudience,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["audiences"] }),
        queryClient.invalidateQueries({ queryKey: ["company-onboarding"] }),
      ]);
    },
  });
}
