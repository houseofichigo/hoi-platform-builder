import { capabilityMatrix, getRungCountForPlatform } from "@/data/m03/capabilityMatrix";
import type { Platform } from "@/data/m03/m03Schema";
import { platforms } from "@/data/m03/platforms";
import { competitorPricingMonitor } from "@/data/m03/useCases/competitor-pricing-monitor";

interface CapabilityMatrixViewProps {
  defaultOpen?: boolean;
  highlightedPlatform?: Platform;
}

const platformOrder: Platform[] = ["chatgpt", "claude", "gemini", "mistral", "copilot"];

export function CapabilityMatrixView({
  defaultOpen = false,
  highlightedPlatform,
}: CapabilityMatrixViewProps) {
  const rungs = competitorPricingMonitor.rungs;

  return (
    <details className="card overflow-hidden" open={defaultOpen}>
      <summary className="cursor-pointer list-none font-mono text-[11px] uppercase tracking-[0.18em] text-terracotta">
        See full capability matrix
      </summary>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-[720px] w-full border-collapse text-left text-[13px]">
          <thead>
            <tr className="bg-navy text-white">
              <th className="px-3 py-2 font-medium">Rung</th>
              <th className="px-3 py-2 font-medium">Capability</th>
              {platformOrder.map((platform) => (
                <th
                  key={platform}
                  className={`px-3 py-2 font-medium ${
                    highlightedPlatform === platform ? "bg-terracotta" : ""
                  }`}
                >
                  {platforms[platform].shortName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rungs.map((rung, index) => (
              <tr key={rung.rungNumber} className={index % 2 ? "bg-white" : "bg-paper"}>
                <td className="border border-chalk px-3 py-2 font-mono text-[12px]">
                  {rung.rungNumber}
                </td>
                <td className="border border-chalk px-3 py-2">{rung.rungName}</td>
                {platformOrder.map((platform) => {
                  const available = capabilityMatrix.matrix[rung.rungNumber]?.[platform] === "available";
                  return (
                    <td
                      key={platform}
                      className={`border border-chalk px-3 py-2 text-center font-mono ${
                        highlightedPlatform === platform ? "bg-mist/70" : ""
                      }`}
                    >
                      <span className={available ? "text-success" : "text-slate"}>
                        {available ? "✓" : "—"}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="bg-mist font-medium text-navy">
              <td className="border border-chalk px-3 py-2" colSpan={2}>
                Total rungs available
              </td>
              {platformOrder.map((platform) => (
                <td
                  key={platform}
                  className={`border border-chalk px-3 py-2 text-center font-mono ${
                    highlightedPlatform === platform ? "bg-terracotta/15" : ""
                  }`}
                >
                  {getRungCountForPlatform(platform)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-[12px] leading-relaxed text-slate">
        Productised concepts like Custom GPTs, Gems, Mistral Agents, and Copilot Studio are
        covered in M04. M03 focuses on the generic ladder concepts that work across platforms.
        Last verified: {capabilityMatrix.lastVerified}.
      </p>
    </details>
  );
}

