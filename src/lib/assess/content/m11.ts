import type {
  AlertRule,
  DriftRule,
  InvoiceOcrProfileContext,
  MonitoringMetric,
  MonitoringPlanScaffold,
} from "./types";

export const M11_COURSE_CONTENT = {
  placeholder: false,

  storyHeader:
    "Monitoring & Quality. What gets monitored gets sustained. What does not gets rediscovered through incidents.",

  step1: {
    title: "Monitoring metrics",
    why:
      "A healthy AI system is watched across performance, accuracy, drift, and fairness. Skip one and that dimension fails silently.",
    example:
      "Performance: latency and throughput. Accuracy: sampled quality and correction rate. Drift: input mix and output distribution shift. Fairness: escalation or rejection rates by segment.",
    whatToNotice: [
      "Every metric names a target, not a wish",
      "Each metric has a named owner",
      "Fairness is monitored as behavior, not sentiment",
    ],
    produces: "A metric set spanning performance, accuracy, drift, and fairness",
    nextLabel: "Step 2 - alert thresholds",
  },

  step2: {
    title: "Alert thresholds and escalation",
    why:
      "Alerts without owners are noise. Tiered alerts route each signal to the human who can act.",
    example:
      "Critical: P95 latency over threshold for 15 minutes. Stop: quality below stop threshold twice. Warning: HITL correction rate exceeds planned capacity.",
    whatToNotice: [
      "Critical and stop tiers must have a named owner",
      "Stop conditions pause behavior, not just notify",
      "Escalation paths name the second responder",
    ],
    produces: "Threshold matrix with tiered alerts and named owners",
    nextLabel: "Step 3 - drift response",
  },

  step3: {
    title: "Drift detection and incident response",
    why:
      "Data, concept, and model drift look different and require different responses. Naming the type is half the response.",
    example:
      "Data drift: new input population appears. Concept drift: business rule changes. Model drift: provider behavior shifts after a model update.",
    whatToNotice: [
      "Detection signals are observable, not anecdotal",
      "Responses include a kill switch and re-validation step",
      "Each drift type has a re-scoring trigger",
    ],
    produces: "Drift response spec for data, concept, and model drift",
    nextLabel: "Step 4 - monitoring plan + re-scoring",
  },

  step4: {
    title: "Monitoring plan + portfolio re-scoring",
    why:
      "The one-page plan is what an operator pins to the wall. Re-scoring triggers bridge production reality back to M09.",
    example:
      "Re-score when quality drops below stop threshold, vendor terms change, cost overruns the M08 model, a new regulation applies, or a security incident has root cause in the AI system.",
    whatToNotice: [
      "The plan is operator-facing",
      "Re-scoring is a trigger, not a calendar event",
      "Every trigger names which M09 pillar it forces a re-check on",
    ],
    produces: "Monitoring plan and re-scoring triggers tied to M09",
    nextLabel: "Complete M11 - M12",
  },

  metrics: [
    {
      id: "p95_latency",
      category: "performance",
      label: "P95 workflow latency",
      target: "Under the SLA agreed in M08",
      whyItMatters: "If the workflow blocks operators, humans work around it and quality follows.",
    },
    {
      id: "throughput",
      category: "performance",
      label: "Daily throughput",
      target: "At or above expected daily case volume",
      whyItMatters: "Backlog growth is a leading indicator of upstream failure.",
    },
    {
      id: "output_quality",
      category: "accuracy",
      label: "Output quality on sampled cases",
      target: "At least 90% pass rate against expected outputs",
      whyItMatters: "Quality decay is the primary signal that the system is no longer fit for purpose.",
    },
    {
      id: "hitl_correction_rate",
      category: "accuracy",
      label: "HITL correction rate",
      target: "Within planned reviewer capacity",
      whyItMatters: "Rising corrections mean the system is creating rework instead of leverage.",
    },
    {
      id: "input_mix_shift",
      category: "drift",
      label: "Input mix shift",
      target: "No sustained shift beyond the baseline threshold",
      whyItMatters: "A new input population means tests may no longer represent production.",
    },
    {
      id: "output_distribution_drift",
      category: "drift",
      label: "Output distribution drift",
      target: "No category/field with sustained out-of-range share",
      whyItMatters: "Output drift often reveals prompt, model, schema, or business-rule changes.",
    },
    {
      id: "escalation_rate_by_segment",
      category: "fairness",
      label: "Escalation rate by segment",
      target: "No segment materially above global escalation rate",
      whyItMatters: "Concentrated escalations often mean the system failed that segment.",
    },
    {
      id: "manual_override_rate",
      category: "fairness",
      label: "Manual override rate by reviewer",
      target: "No reviewer materially above median override rate",
      whyItMatters: "Reviewer outliers expose ambiguous rules and uncalibrated thresholds.",
    },
  ] as const satisfies readonly MonitoringMetric[],

  alertRules: [
    {
      id: "latency_critical",
      metricId: "p95_latency",
      tier: "critical",
      threshold: "P95 latency exceeds SLA for 15 minutes",
      owner: "Platform owner",
      escalation: "Page platform owner; if unacknowledged in 10 minutes, escalate to operations lead.",
    },
    {
      id: "throughput_warning",
      metricId: "throughput",
      tier: "warning",
      threshold: "Daily throughput below 80% of expected for 2 days",
      owner: "Process owner",
      escalation: "Open a ticket; review with system owner at weekly stand-up.",
    },
    {
      id: "quality_stop",
      metricId: "output_quality",
      tier: "stop",
      threshold: "Quality below stop threshold on two consecutive samples",
      owner: "AI system owner",
      escalation: "Pause automated actions; require human review until re-validation passes.",
    },
    {
      id: "correction_warning",
      metricId: "hitl_correction_rate",
      tier: "warning",
      threshold: "Correction rate exceeds planned reviewer capacity for one week",
      owner: "Process owner",
      escalation: "Sample corrections with system owner; decide rule vs. redesign.",
    },
    {
      id: "input_drift_critical",
      metricId: "input_mix_shift",
      tier: "critical",
      threshold: "Input mix shift exceeds baseline threshold for one week",
      owner: "AI system owner",
      escalation: "Trigger M09 re-scoring on Process Maturity and AI Suitability.",
    },
    {
      id: "fairness_warning",
      metricId: "escalation_rate_by_segment",
      tier: "warning",
      threshold: "Any segment materially above global escalation rate for 2 weeks",
      owner: "Governance owner",
      escalation: "Audit failure reasons in the segment; report to sponsor if unresolved.",
    },
    {
      id: "output_drift_info",
      metricId: "output_distribution_drift",
      tier: "info",
      threshold: "Any output bucket exceeds baseline threshold for one week",
      owner: "AI system owner",
      escalation: "Log to drift register; review at monthly quality review.",
    },
  ] as const satisfies readonly AlertRule[],

  driftRules: [
    {
      id: "data",
      label: "Data drift",
      detectionSignal:
        "Input mix, source system, customer/employee segment, language, document type, or category distribution shifts from baseline.",
      response:
        "Refresh baselines, retest on the new distribution, and widen HITL until the system passes representative tests.",
      rescoringTrigger:
        "Re-score on AI Suitability and Process Maturity in M09.",
    },
    {
      id: "concept",
      label: "Concept drift",
      detectionSignal:
        "Business rules, policy, pricing, product, legal, or routing criteria change while input distribution remains stable.",
      response:
        "Pause affected automation scope, update knowledge/prompt/rules, rerun regression tests, and republish after owner sign-off.",
      rescoringTrigger:
        "Re-score on Risk and Process Maturity; flag governance dependency in M09.",
    },
    {
      id: "model",
      label: "Model drift",
      detectionSignal:
        "Model/provider version changes, prompt template changes, or regression set fails on a previously passing case.",
      response:
        "Pin previous version, run the new version in shadow, and promote only after parity is documented.",
      rescoringTrigger:
        "Re-score on Feasibility, Risk, and Delivery Readiness.",
    },
  ] as const satisfies readonly DriftRule[],

  rescoringCriteria: [
    {
      id: "quality_stop_breached",
      label: "Quality stop condition breached",
      detail: "Stop-tier quality alert triggers re-scoring on AI Suitability.",
    },
    {
      id: "vendor_term_change",
      label: "Critical vendor term changes",
      detail: "Training opt-out, residency, pricing, or support terms change - re-score Risk and Feasibility.",
    },
    {
      id: "cost_overrun_30",
      label: "Cost overrun > 30% vs. M08 model",
      detail: "Re-score Business Impact and Priority.",
    },
    {
      id: "new_regulation",
      label: "New regulatory requirement applies",
      detail: "Re-score Risk and flag a governance dependency.",
    },
    {
      id: "security_incident",
      label: "Security incident with AI-system root cause",
      detail: "Re-score Risk and Delivery Readiness; halt expansion until closed.",
    },
    {
      id: "fairness_breach",
      label: "Fairness alert sustained for 2+ weeks",
      detail: "Re-score Risk and AI Suitability; document remediation plan.",
    },
    {
      id: "ownership_change",
      label: "Loss of named owner",
      detail: "Re-score Delivery Readiness; pause expansion until backup is named.",
    },
  ] as const satisfies readonly { id: string; label: string; detail: string }[],

  methodNote:
    "Monitoring is the bridge between deployed systems and the portfolio. When thresholds breach, the use case re-enters M09; its priority, tier, and investment may change.",
};

export function getM11MonitoringPlanScaffold(
  ctx: InvoiceOcrProfileContext,
): MonitoringPlanScaffold {
  const company = ctx.companyName ?? "your company";
  const country = ctx.country ?? "your region";

  return {
    metrics:
      `Metrics for ${company}:\n` +
      `- Performance: P95 workflow latency under SLA; daily throughput at expected volume.\n` +
      `- Accuracy: output quality pass rate >= 90%; HITL correction rate within reviewer capacity.\n` +
      `- Drift: input mix and output distribution remain within baseline thresholds.\n` +
      `- Fairness: no segment or reviewer materially above global escalation/override rate.`,
    alerts:
      `Alert tiers:\n` +
      `- Critical: latency or input drift exceeds threshold -> platform/system owner acts.\n` +
      `- Stop: quality below stop threshold twice -> pause automated actions and require human review.\n` +
      `- Warning: correction rate or fairness alert sustained -> process/governance owner investigates.\n` +
      `- Info: output distribution shift logged to drift register.`,
    driftResponse:
      `Drift response for ${company} in ${country}:\n` +
      `- Data drift: refresh baselines, retest, widen HITL until tests pass.\n` +
      `- Concept drift: pause affected scope, update knowledge/rules/prompts, rerun regression tests.\n` +
      `- Model drift: pin previous version, run new version in shadow, promote only after parity sign-off.`,
    rescoringCriteria:
      `Re-scoring triggers for the ${company} portfolio:\n` +
      `1. Quality stop condition breached.\n` +
      `2. Critical vendor term change.\n` +
      `3. Cost overrun > 30% vs. M08 model.\n` +
      `4. New regulatory requirement in ${country}.\n` +
      `5. Security incident with AI-system root cause.\n` +
      `6. Sustained fairness breach.\n` +
      `7. Loss of named owner without backup.`,
  };
}
