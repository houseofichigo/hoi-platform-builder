# PFS Build Integration Plan

This repo integrates Process Flow Studio as the workspace-scoped Build phase.

Source archive: `/Users/sabribenradhia/Downloads/Process Flow Studio (23).zip`.

Do not copy PFS migrations verbatim. In particular, do not import `20260622223000_baseline_schema_repair.sql`.

Platform tenancy mapping:

- PFS `organization` maps to platform `workspaces`.
- PFS `organization_id` maps to `workspace_id`.
- PFS `membership` maps to `workspace_members`.
- PFS org role helpers map to `is_workspace_member` and `has_workspace_role`.

Build replacement scope:

- Delete old Build capture/dashboard route behavior from `app.$workspaceSlug.build.capture.*` and `app.$workspaceSlug.build.dashboard`.
- Replace old Build pages in `build.index`, `build.library`, and `build.approvals`.
- Retire `src/hooks/useBuild.tsx`, `src/lib/build/approvals.functions.ts`, and `src/lib/build/dashboardBuckets.ts` once all `use_case*` callers are removed.
- Port the useful PFS concepts: process mapping, process library, approvals, org chart, onboarding, and admin overview.

Role mapping:

- `admin` -> `admin`
- `reviewer` -> `admin`
- `department_lead` -> `member`
- `employee` -> `member`
- `viewer` -> `viewer`

Build permissions:

- Members and above can map processes.
- Admins and owners can manage departments, onboarding/setup, and approval decisions.
- Viewers are read-only.
