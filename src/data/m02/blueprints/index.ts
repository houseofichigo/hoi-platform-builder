import type { M02BlueprintData } from "../blueprintSchema";
import { supplierOnboardingBlueprint } from "./supplier-onboarding";

export const M02_BLUEPRINTS: Record<string, M02BlueprintData> = {
  [supplierOnboardingBlueprint.useCaseId]: supplierOnboardingBlueprint,
};

export function getM02Blueprint(useCaseId: string): M02BlueprintData | undefined {
  return M02_BLUEPRINTS[useCaseId];
}
