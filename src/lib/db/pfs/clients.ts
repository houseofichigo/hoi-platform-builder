import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { db, requireActiveOrg } from "@/lib/db/pfs/shared";

export type ClientRow = {
  id: string;
  workspace_id: string;
  name: string;
  kind: string;
  sector: string | null;
  engagement_type: string | null;
  under_nda: boolean;
  reusable_ip: boolean;
  data_residency: string | null;
  internal_audience: unknown;
  notes: string | null;
  status: string;
  created_at: string | null;
  archived_at: string | null;
};

const clientSchema = z.object({
  name: z.string().trim().min(1),
  kind: z.enum(["client", "partner", "supplier", "subcontractor"]).default("client"),
  sector: z.string().optional().default(""),
  engagementType: z.string().optional().default(""),
  underNda: z.boolean().default(false),
  reusableIp: z.boolean().default(false),
  dataResidency: z.string().optional().default(""),
  internalAudience: z.array(z.string()).default([]),
  notes: z.string().optional().default(""),
});

export type ClientInput = z.input<typeof clientSchema>;

export async function listClients() {
  const gate = await requireActiveOrg();
  const { data, error } = await db
    .from("client")
    .select("*")
    .eq("workspace_id", gate.workspaceId)
    .is("archived_at", null)
    .order("name");
  if (error) throw error;
  return (data ?? []) as ClientRow[];
}

export async function saveClient(input: ClientInput) {
  const gate = await requireActiveOrg();
  const parsed = clientSchema.parse(input);
  const { error } = await db.from("client").insert({
    workspace_id: gate.workspaceId,
    name: parsed.name,
    kind: parsed.kind,
    sector: parsed.sector,
    engagement_type: parsed.engagementType,
    under_nda: parsed.underNda,
    reusable_ip: parsed.reusableIp,
    data_residency: parsed.dataResidency,
    internal_audience: parsed.internalAudience,
    notes: parsed.notes,
    status: "active",
  });
  if (error) throw error;
}

export function useClients() {
  return useQuery({ queryKey: ["clients"], queryFn: listClients });
}

export function useSaveClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveClient,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["clients"] }),
        queryClient.invalidateQueries({ queryKey: ["company-onboarding"] }),
      ]);
    },
  });
}
