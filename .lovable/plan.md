## Problem

`src/components/build/pfs/company-onboarding.tsx` is a 135-line stub showing only "Departments / Members / Pending invites" with a basic add-department form. The PFS25 reference (`Process_Flow_Studio_25.zip`, 1,393 lines) is the real 6-step wizard the screenshots show: Company basics → Org chart → Tool stack → Mapping priorities → Send invitations → Launch mapping workspace, with the step header, "saved/draft" badges, "Why we ask this" copy, `Load demo company` action, and step-by-step Save/Back/Skip controls.

All adapters the real wizard depends on already exist in this repo (just under `@/lib/db/pfs/*` instead of `@/lib/db/*`), and the supporting components (`ToolCatalogPicker`, `OrgChartCanvas`, `useOrgChart`, `computeReadiness`, onboarding mutations, audiences/clients/knowledge-sources/demo-loader) are all in place. So this is purely a component port, not a data-layer change.

## Scope

In:
- Replace `src/components/build/pfs/company-onboarding.tsx` with the full PFS25 `company-onboarding.tsx`, adjusting import paths to this project (`@/components/build/pfs/...`, `@/lib/db/pfs/...`).
- Verify the admin route renders the new wizard correctly at `/app/$workspaceSlug/admin/onboarding` (existing route already imports `CompanyOnboarding` and passes `mode="wizard"`, so likely no change needed — only adjust the surrounding header copy if it duplicates the wizard's own header).
- Typecheck and fix any small drift (e.g. type names that diverged between PFS25 and the local adapters).

Out (explicitly not touching, per user):
- Process map, workspace, Build phase, Admin sidebar, Analytics, Review Policy.
- Database schema or RLS — adapters already mirror PFS25.
- Any other admin tab.

## Technical Notes

Import rewrites needed when copying the file:
- `@/components/tool-catalog-picker` → `@/components/build/pfs/tool-catalog-picker`
- `@/components/org-chart-canvas` → `@/components/build/pfs/org-chart-canvas`
- `@/lib/db/org-chart` → `@/lib/db/pfs/org-chart`
- `@/lib/db/onboarding` → `@/lib/db/pfs/onboarding`
- `@/lib/db/audiences` → `@/lib/db/pfs/audiences`
- `@/lib/db/clients` → `@/lib/db/pfs/clients`
- `@/lib/db/demo-loader` → `@/lib/db/pfs/demo-loader`
- `@/lib/db/knowledge-sources` → `@/lib/db/pfs/knowledge-sources`
- `@/lib/db/tool-catalog` → `@/lib/db/pfs/tool-catalog`
- `@/lib/org-chart/readiness` stays as-is (already present locally).

The current route page wraps the wizard with its own "Company Setup." heading + lead paragraph. The PFS25 wizard renders its own "Complete company setup" header with the "Save each step as a draft…" copy (see screenshots). To match the screenshots, strip the route-level heading so only the wizard's header shows.

## Validation

- `bunx tsgo --noEmit` passes for the new file.
- `/app/house-of-ichigo/admin/onboarding` renders the 6-step pill row, step card with "Why we ask this", and `Load demo company` button matching the screenshots.

## Batches

Single batch — one file replacement plus one small route trim.
