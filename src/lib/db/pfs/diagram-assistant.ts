import { useMutation } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { diagramPatchSchema, type DiagramPatch, type DiagramPatchState } from "@/lib/diagram-patch";

export type DiagramAssistantMode = "build" | "improve" | "complete" | "scoring_readiness";

export async function requestDiagramAssistant(input: {
  mode: DiagramAssistantMode;
  message: string;
  state: DiagramPatchState;
}): Promise<DiagramPatch> {
  const { data, error } = await supabase.functions.invoke("diagram-assistant", {
    body: input,
  });
  if (error) throw error;

  const parsed = diagramPatchSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Diagram assistant returned an invalid patch.");
  }
  return parsed.data;
}

export function useDiagramAssistant() {
  return useMutation({
    mutationFn: requestDiagramAssistant,
  });
}

