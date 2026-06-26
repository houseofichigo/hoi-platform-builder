import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { db, requireActiveOrg } from "@/lib/db/pfs/shared";

export type KnowledgeSourceRow = {
  id: string;
  workspace_id: string;
  name: string;
  source_type: string | null;
  location_uri: string | null;
  owner_department_id: string | null;
  owner_client_id: string | null;
  sensitivity_level: string | null;
  data_residency: string | null;
  connector_status: string | null;
  ingestion_status: string | null;
  created_at: string | null;
  archived_at: string | null;
};

const knowledgeSourceSchema = z.object({
  name: z.string().trim().min(1),
  sourceType: z.enum(["upload", "gdrive", "sharepoint", "notion", "url", "email", "wiki", "other"]).default("url"),
  locationUri: z.string().optional().default(""),
  ownerDepartmentId: z.string().nullable().optional(),
  ownerClientId: z.string().nullable().optional(),
  sensitivityLevel: z.enum(["public", "internal", "personal", "sensitive"]).default("internal"),
  dataResidency: z.string().optional().default(""),
});

export type KnowledgeSourceInput = z.input<typeof knowledgeSourceSchema>;

export async function listKnowledgeSources() {
  const gate = await requireActiveOrg();
  const { data, error } = await db
    .from("knowledge_source")
    .select("*")
    .eq("workspace_id", gate.workspaceId)
    .is("archived_at", null)
    .order("name");
  if (error) throw error;
  return (data ?? []) as KnowledgeSourceRow[];
}

export async function saveKnowledgeSource(input: KnowledgeSourceInput) {
  const gate = await requireActiveOrg();
  const parsed = knowledgeSourceSchema.parse(input);
  const { error } = await db.from("knowledge_source").insert({
    workspace_id: gate.workspaceId,
    name: parsed.name,
    source_type: parsed.sourceType,
    location_uri: parsed.locationUri,
    owner_department_id: parsed.ownerDepartmentId || null,
    owner_client_id: parsed.ownerClientId || null,
    sensitivity_level: parsed.sensitivityLevel,
    data_residency: parsed.dataResidency,
    connector_status: "not_connected",
    ingestion_status: "pending",
  });
  if (error) throw error;
}

export function useKnowledgeSources() {
  return useQuery({ queryKey: ["knowledge-sources"], queryFn: listKnowledgeSources });
}

export function useSaveKnowledgeSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveKnowledgeSource,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["knowledge-sources"] }),
        queryClient.invalidateQueries({ queryKey: ["company-onboarding"] }),
      ]);
    },
  });
}
