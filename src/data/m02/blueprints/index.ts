import type { M02BlueprintData } from "../blueprintSchema";
import { customerSupportBlueprint } from "./customer-support";
import { hrPolicyBlueprint } from "./hr-policy";
import { rfpResponseBlueprint } from "./rfp-response";
import { salesQuoteBlueprint } from "./sales-quote";
import { supplierOnboardingBlueprint } from "./supplier-onboarding";

export const M02_BLUEPRINTS: Record<string, M02BlueprintData> = {
  [customerSupportBlueprint.useCaseId]: customerSupportBlueprint,
  [hrPolicyBlueprint.useCaseId]: hrPolicyBlueprint,
  [salesQuoteBlueprint.useCaseId]: salesQuoteBlueprint,
  [rfpResponseBlueprint.useCaseId]: rfpResponseBlueprint,
  [supplierOnboardingBlueprint.useCaseId]: supplierOnboardingBlueprint,
};

export function getM02Blueprint(useCaseId: string): M02BlueprintData | undefined {
  return M02_BLUEPRINTS[useCaseId];
}
