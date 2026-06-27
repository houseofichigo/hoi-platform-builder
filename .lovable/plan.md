## Goal

Fully replace the Build phase with the v24 Process Flow Studio workspace bundle (`workspace-section.zip`), wired into HOI's `/app/$workspaceSlug/build/*` shell. Sub-tabs become: **Priority Dashboard · Map Process · Process Library · Template Library · Pending Approvals**, with Pending Approvals visible only to non-admin members.

## Scope

**In scope**
- Re-port the 5 component files and 8 `lib/db/*` files from the zip into the existing PFS folders, overwriting current copies and refreshing `process-data.ts`, `maturity-stage.ts`, `risk-tier.ts`.
- Rebuild the Build tab nav and routes.
- Role-gate the Approvals tab + route on non-admin membership.

**Out of scope (kept as-is)**
- Workspace Admin (Company Setup, Analytics, Review Policy) ported in earlier batches.
- Auth / workspace resolution / Supabase schema. PFS's `shared.ts` and `auth.ts` shims stay (org→workspace mapping).
- HOI's `AppShell` chrome — we keep the existing Build layout (PhaseNav/TopShell) and drop PFS's `AppShell`; we mount the screens directly.
- `__root.tsx`, `welcome.tsx`, `settings.tsx`, `tasks.tsx`, `import.tsx`, `process.templates.tsx` from the zip — not needed; HOI owns these.

## Files to port (overwrite under existing paths)

Components → `src/components/build/pfs/`
- `process-platform.tsx` (2079L — AppShell, DashboardScreen, MappingScreen, MaturityStagePanel, MaturityScoringTab, PendingTasks, ProcessLibrary, TemplateLibrary)
- `process-template-library.tsx`
- `risk-tier-badge.tsx`
- `tool-catalog-picker.tsx`

Data layer → `src/lib/db/pfs/`
- `processes.ts`, `scores.ts`, `governance.ts`, `reference.ts`, `onboarding.ts`, `admin.ts`, `tool-catalog.ts`
- `shared.ts` / `auth.ts` — KEEP the existing HOI-shimmed versions; only merge any new exports the zip's processes/scores need.

Libs → `src/lib/`
- `maturity-stage.ts`, `process-data.ts`, `risk-tier.ts` overwritten

All ported files get imports rewritten:
- `@/lib/db/*` → `@/lib/db/pfs/*`
- `@/components/*` (PFS internals) → `@/components/build/pfs/*`
- PFS `Link` usage → existing workspace-aware `_link.tsx` shim
- `// @ts-nocheck` at the top to match the rest of the ported PFS.

## Route changes (under `src/routes/`)

Update `app.$workspaceSlug.build.tsx` tab list:
```
Priority Dashboard  → /app/$slug/build
Map Process         → /app/$slug/build/process/new
Process Library     → /app/$slug/build/library
Template Library    → /app/$slug/build/templates
Pending Approvals   → /app/$slug/build/approvals   (hidden when role === 'admin'|'owner')
```

Route files:
- `app.$workspaceSlug.build.index.tsx` → render `DashboardScreen` (replaces current overview).
- `app.$workspaceSlug.build.process.new.tsx` → mount PFS process editor (`routes/process.new.tsx`, 4471L) inline; strip its `createFileRoute` wrapper and reuse the component.
- `app.$workspaceSlug.build.templates.tsx` → **new**, mounts `TemplateLibrary`.
- `app.$workspaceSlug.build.library.tsx` → keep, swap to new `ProcessLibrary`.
- `app.$workspaceSlug.build.approvals.tsx` → mount new `PendingTasks`; `beforeLoad` redirects admins/owners to `/build`.
- `app.$workspaceSlug.build.map.tsx` → DELETE (replaced by `process/new`).
- `app.$workspaceSlug.build.process.$id.tsx` → keep, but swap detail body to PFS's `process.$id.tsx` content.

Tab gating uses `useWorkspace().role` (existing hook). Approvals tab item is filtered out when role is admin/owner; the route's `beforeLoad` enforces the same server-side.

## Schema

No migrations. The earlier batches already added `organization_id` sync, `roadmap_item`, `tool_catalog`, `vault`, `member_profile`, etc., which are what these screens read. If a runtime "missing column/table" surfaces during smoke test, fix it as a follow-up.

## Cleanup

Delete legacy Build files no longer referenced:
- `src/routes/app.$workspaceSlug.build.map.tsx`
- Any stale `src/components/build/*` that the old Map/Overview used (verified with `rg` before deletion).

## Verification

1. `bun run build:dev` clean.
2. Smoke per tab as admin: Dashboard renders, Map Process opens editor, Library + Templates list, Approvals tab hidden + `/build/approvals` redirects.
3. Smoke as a member (non-admin): Approvals tab visible, route opens.

## Batches

Single batch — files are bounded (~13.9K LOC, all ports) and changes are isolated to `src/components/build/pfs/`, `src/lib/db/pfs/`, three `lib/` files, and the Build route layer.