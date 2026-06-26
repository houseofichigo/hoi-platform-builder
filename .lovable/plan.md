## Goal

Replace HOI's current Build phase with the Process Flow Studio (PFS) codebase, and lift PFS's Company Setup + Analytics + Review Policy into our **workspace admin** (every workspace gets its own). Everything stays multi-tenant: scoped by `workspace_id`, gated by `is_workspace_member`, surfaced under `/app/$workspaceSlug/...`.

## Architectural translation (one-time)

PFS is single-tenant; HOI is multi-tenant. I will translate at the data-access layer once, then port PFS UI almost verbatim.

| PFS concept            | HOI equivalent                          |
| ---------------------- | --------------------------------------- |
| `organization`         | `workspaces`                            |
| `membership` + role    | `workspace_members` + role              |
| `requireActiveOrg()`   | new `requireWorkspace()` reading slug   |
| `getAuthGateState`     | existing supabase session + `useWorkspace` |
| `/process/*`, `/admin/*` (top-level) | `/app/$slug/build/*`, `/app/$slug/admin/*` |

## Six batches

### Batch 1 — DB foundation (schema only, additive)

One migration that adds every PFS table the new Build/Admin code reads, all scoped by `workspace_id`, with `is_workspace_member` RLS and explicit GRANTs:

- `process_template`, `process_template_step`, `process_template_diagram`
- `tool_catalog`, `tool_action_catalog` (global reference — `workspace_id NULL = shared`)
- `org_tool`, `org_tool_action` (per-workspace adoption)
- `vault`, `vault_field`, `vault_entry` (governed vault skeleton)
- `readiness_assessment`, `governance_threshold`
- `member_profile` extension columns on `workspace_members` (role context, languages, etc.)
- `department` already exists — add any missing PFS columns (head_count, color, etc.)
- Extend existing `process` / `process_step` with PFS columns (risk_tier, ebitda_impact, effort_savings, error_reduction, data_value, diagram_json, capture_json, score_json) — nullable so existing rows survive.
- Seed global `process_template` + `tool_catalog` rows (`workspace_id = NULL`).

No data destruction yet. Existing Build/Scale keeps working.

### Batch 2 — DB adapter layer (`src/lib/`)

Port PFS libs but rewrite the auth/scoping seam so every query takes a `workspace_id`:

- New `src/lib/db/workspace.ts` exporting `useActiveWorkspace()` and `requireWorkspace(slug)` that returns `{ workspaceId, membershipId, role }` from `workspace_members` (mirrors PFS's `requireActiveOrg` shape so the rest of PFS code compiles).
- Port: `process-data.ts`, `risk-tier.ts`, `maturity-stage.ts`, `vault-derivation.ts`, `node-field-schema.ts`, `diagram-patch.ts`, `scoring/process-score.ts`, `org-chart/*`.
- Port `src/lib/db/*`: `processes.ts`, `process-templates.ts`, `process-builder.ts`, `tool-catalog.ts`, `tool-actions.ts`, `governance.ts`, `org-chart.ts`, `onboarding.ts`, `members.ts`, `member-profile.ts`, `vaults.ts`, `audiences.ts`, `clients.ts`, `knowledge-sources.ts`, `opportunities.ts`, `scores.ts`, `reference.ts`, `diagram-assistant.ts`, `admin.ts`, `shared.ts`. Every hook reads `workspaceId` from the new helper instead of `organization_id`.
- Skip `demo-loader.ts` (no Maison Atlas seeding).

No UI changes yet — this batch is just imports + typechecks.

### Batch 3 — Build phase swap

Delete the four existing files:

- `src/routes/app.$workspaceSlug.build.tsx` (layout)
- `src/routes/app.$workspaceSlug.build.index.tsx`
- `src/routes/app.$workspaceSlug.build.map.tsx`
- `src/routes/app.$workspaceSlug.build.library.tsx`
- `src/routes/app.$workspaceSlug.build.approvals.tsx`

Add new routes under `/app/$workspaceSlug/build/`:

- `build.tsx` — new tabbed shell (Dashboard · Map · Templates · Library · Approvals · Tasks)
- `build.index.tsx` — PFS dashboard view from `process-platform.tsx`
- `build.map.tsx` — PFS Map screen
- `build.templates.tsx` — `process-template-library.tsx`
- `build.library.tsx` — PFS Library
- `build.approvals.tsx` — PFS Approvals
- `build.tasks.tsx` — PFS Tasks
- `build.process.new.tsx` — the 4,471-line PFS map editor
- `build.process.$id.tsx` — PFS process detail

Port components: `process-platform.tsx`, `process-template-library.tsx`, `tool-catalog-picker.tsx`, `risk-tier-badge.tsx`. Rewrite all `<Link to="/process/...">` to `to="/app/$workspaceSlug/build/process/..." params={{ workspaceSlug }}`. Replace PFS's admin gate with our workspace `role` check (`owner`/`admin`).

After this batch the Build phase is fully PFS, scoped per workspace.

### Batch 4 — Workspace Admin: Company Setup (with Org Chart + Tool Stack folded in)

- Route: `app.$workspaceSlug.admin.setup.tsx` hosts PFS's `CompanyOnboarding` wizard (which already contains Org chart + Tool stack steps).
- Replace existing thin `app.$workspaceSlug.admin.onboarding.tsx` with a redirect to `/admin/setup`.
- Port components: `company-onboarding.tsx`, `org-chart-admin.tsx`, `org-chart-canvas.tsx`, `org-chart-add-employee-dialog.tsx`, `org-chart-import-dialog.tsx`, `org-node-editor-drawer.tsx`.
- Update workspace admin nav (`app.$workspaceSlug.admin.tsx`) with a "Company Setup" tab.
- Workspace owner/admin can also **invite employees** from inside this wizard (PFS's existing flow, re-pointed at our `workspace_invitations` table).

### Batch 5 — Workspace Admin: Analytics + Review Policy

- Route: `app.$workspaceSlug.admin.analytics.tsx` — replace/augment existing analytics page with PFS's `AdminOverview` (process volume, risk distribution, EBITDA/effort/error/data charts, department breakdown).
- Route: `app.$workspaceSlug.admin.review-policy.tsx` — PFS `ReviewPolicy` (governance thresholds: auto-approve cutoffs, required reviewers, risk-tier gates).
- Tabs added to workspace admin nav.

### Batch 6 — Cleanup & cutover

- Delete now-unused legacy files: any old build/process components no longer imported, the old `process`↔`use_cases` bridge if Scale doesn't read from it (verify first).
- Remove PFS's top-level routes that don't fit (`/process/*`, `/admin/*` at root, `/welcome`, `/templates`, `/template-library`, `/tasks`, `/approvals`, `/library`, `/onboarding`, `/invite/$token`, `/login`, `/mapping`, `/import`, `/settings`) — we already have equivalents or they belong inside the workspace shell.
- Run Supabase linter, fix any new warnings introduced by Batch 1.
- Smoke test Sabri's super-admin flow + a regular workspace owner flow.
- Update sidebar/nav copy.

## Technical notes

- **Tenant scoping**: every PFS query gets a `.eq("workspace_id", workspaceId)` added in the adapter (Batch 2). The UI components stay PFS-shaped and stay agnostic of multi-tenancy.
- **Process editor**: `process.new.tsx` (4,471 lines) is the most fragile port — I will keep it intact except for the route path, the workspace-scoped fetch hooks, and the back-link target.
- **Existing `process` schema**: extended additively in Batch 1 so existing rows keep working; new fields are nullable.
- **Scale**: `roadmap_entries` already reads `use_case_id`; we keep the existing bridge trigger so an approved PFS process still lands in Scale. Retiring `use_cases` is a separate follow-up after this six-batch sequence is stable.
- **Auth**: no changes to top-level `/admin/*` (HOI super-admin) — Sabri keeps existing access. PFS admin features go to workspace admin only.
- **No demo data**: only global templates + tool catalog are seeded; tenants start empty.

## What you'll see after each batch

| Batch | Visible result |
| ----- | -------------- |
| 1 | Nothing visible; new tables ready. |
| 2 | Nothing visible; new lib code typechecks. |
| 3 | `/app/<slug>/build/*` is the PFS process platform. |
| 4 | Workspace admin gains "Company Setup" with org chart + tool stack + invites. |
| 5 | Workspace admin gains "Analytics" + "Review Policy". |
| 6 | Dead code gone, navigation cleaned, linter clean. |

Approve and I'll execute Batch 1 first.