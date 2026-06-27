import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type RiskTier = "low" | "standard" | "elevated" | "critical" | string | null | undefined;

const tierClass: Record<string, string> = {
  low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  standard: "border-chalk bg-mist text-navy",
  elevated: "border-terracotta/30 bg-terracotta/10 text-terracotta",
  critical: "border-red-200 bg-red-50 text-red-700",
};

function label(tier: RiskTier) {
  return String(tier ?? "standard").replaceAll("_", " ");
}

export function RiskTierBadge({
  tier,
  process,
  className,
}: {
  tier?: RiskTier;
  process?: { riskTier?: RiskTier; risk_tier?: RiskTier; record?: { riskTier?: RiskTier } };
  className?: string;
}) {
  const value = tier ?? process?.riskTier ?? process?.risk_tier ?? process?.record?.riskTier ?? "standard";
  return (
    <Badge variant="outline" className={cn("capitalize", tierClass[String(value)] ?? tierClass.standard, className)}>
      {label(value)}
    </Badge>
  );
}
