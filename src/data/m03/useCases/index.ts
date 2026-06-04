import type { UseCaseBlueprint } from "../m03Schema";
import { competitorPricingMonitor } from "./competitor-pricing-monitor";

export const useCases: Record<string, UseCaseBlueprint> = {
  "competitor-pricing-monitor": competitorPricingMonitor,
};

export function getUseCase(id: string): UseCaseBlueprint | undefined {
  return useCases[id];
}

export const availableUseCases = Object.keys(useCases);
