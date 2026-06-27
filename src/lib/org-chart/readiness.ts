// @ts-nocheck
import type { OrgChartPayload } from "@/lib/db/org-chart";

/**
 * Readiness signals for the Org Chart onboarding step.
 *
 * `blockers` gate the Continue button; `warnings` are surfaced as small inline
 * badges and never block. Declared headcount is treated as a reconciliation
 * signal against named people — it is not auto-overwritten anywhere.
 */
export type OrgChartReadiness = {
  hasDepartment: boolean;
  hasPeopleOrInvites: boolean;
  departmentsWithoutLead: number;
  missingManagers: number;
  pendingInvites: number;
  declaredHeadcount: number;
  namedPeople: number;
  coveragePercent: number;
  blockers: string[];
  warnings: string[];
};

const COVERAGE_WARN_THRESHOLD = 60;

export function computeReadiness(payload: OrgChartPayload | null | undefined): OrgChartReadiness {
  const departments = (payload?.departments ?? []).filter((d) => !d.archivedAt);
  const people = payload?.people ?? [];
  const invites = payload?.pendingInvites ?? [];
  const ownerId = payload?.company?.ownerMembershipId ?? null;

  const hasDepartment = departments.length > 0;
  const hasPeopleOrInvites = people.length > 0 || invites.length > 0;
  const departmentsWithoutLead = departments.filter((d) => !(d.leadMembershipId ?? d.leadMemberId)).length;

  // a "missing manager" is an active person with no managerId who is not the
  // company owner (the org root has no manager by definition).
  const missingManagers = people.filter((p) => !(p.managerId ?? p.managerMemberId) && p.id !== ownerId).length;

  const pendingInvites = invites.length;

  const declaredHeadcount = departments.reduce((sum, d) => sum + (d.headcount ?? 0), 0);
  const namedPeople = people.length;
  const coveragePercent = declaredHeadcount > 0
    ? Math.min(100, Math.round((namedPeople / declaredHeadcount) * 100))
    : namedPeople > 0
      ? 100
      : 0;

  const blockers: string[] = [];
  if (!hasDepartment) blockers.push("Add at least one department to continue.");

  const warnings: string[] = [];
  if (hasDepartment && !hasPeopleOrInvites) {
    warnings.push("No people or invites yet — you can still continue and add them later.");
  }
  if (missingManagers > 0) {
    warnings.push(`${missingManagers} ${missingManagers === 1 ? "person is" : "people are"} missing a manager.`);
  }
  if (departmentsWithoutLead > 0 && hasDepartment) {
    warnings.push(
      `${departmentsWithoutLead} department${departmentsWithoutLead === 1 ? "" : "s"} without a lead.`,
    );
  }
  if (declaredHeadcount > 0 && coveragePercent < COVERAGE_WARN_THRESHOLD) {
    warnings.push(`Headcount coverage is ${coveragePercent}% — declared ${declaredHeadcount}, named ${namedPeople}.`);
  }

  // sensitive department with no reviewer/admin attached
  const sensitiveDeptIds = new Set(
    departments.filter((d) => (d as { holdsSensitiveData?: boolean }).holdsSensitiveData).map((d) => d.id),
  );
  if (sensitiveDeptIds.size > 0) {
    const reviewerRoles = new Set(["admin", "reviewer"]);
    const coveredSensitive = new Set<string>();
    for (const p of people) {
      if (p.departmentId && sensitiveDeptIds.has(p.departmentId) && reviewerRoles.has(p.role)) {
        coveredSensitive.add(p.departmentId);
      }
    }
    const uncovered = sensitiveDeptIds.size - coveredSensitive.size;
    if (uncovered > 0) {
      warnings.push(
        `${uncovered} sensitive department${uncovered === 1 ? "" : "s"} without a reviewer or admin.`,
      );
    }
  }

  return {
    hasDepartment,
    hasPeopleOrInvites,
    departmentsWithoutLead,
    missingManagers,
    pendingInvites,
    declaredHeadcount,
    namedPeople,
    coveragePercent,
    blockers,
    warnings,
  };
}
