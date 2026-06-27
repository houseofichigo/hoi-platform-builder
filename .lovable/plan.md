## Goals

1. Top-nav Build dropdown must match the Build sub-tabs.
2. Company Setup must load (currently errors because the existing tenant tables are missing the PFS columns the ported code reads).
3. Priority Dashboard must show Heatmap / Blocked / Insights even when the workspace has no processes yet.

---

## 1. Top-nav Build dropdown

File: `src/components/TopShell.tsx` (`buildPhases()`).

Replace the current items with the same labels and routes used by `src/routes/app.$workspaceSlug.build.tsx`:

```
Priority Dashboard → /app/$workspaceSlug/build
Map Process       → /app/$workspaceSlug/build/process/new
Process Library   → /app/$workspaceSlug/build/library
Template Library  → /app/$workspaceSlug/build/templates
Pending Approvals → /app/$workspaceSlug/build/approvals   (members only; hidden for admins/owners)
```

Hide "Pending Approvals" using the existing `useWorkspace().isAdmin` flag, matching how the sub-tab bar gates it.

---

## 2. Restore Company Setup

The PFS port assumes a richer `company_profile` (plus several other tenant tables) than what currently exists in the database. The earlier "PFS process-mapping schema" migration used `CREATE TABLE IF NOT EXISTS`, so existing tables were skipped and never got the new columns.

Add ONE corrective migration that:

- Adds missing columns to **company_profile** to match PFS:
  `id uuid (pk default gen_random_uuid)`, `industry, sub_industry, size, revenue_range, business_model, customer_type, locations jsonb, growth_stage, mission, overview, value_proposition, primary_jurisdiction, regulatory_regimes jsonb, data_residency jsonb, languages jsonb, is_regulated bool, sells_training bool, onboarding_step int default 0, onboarding_phase text default 'foundation', onboarding_completed_at, archived_at`.
- Defensively `ADD COLUMN IF NOT EXISTS` for every column the PFS schema declares on each tenant table touched by Company Setup: `department`, `member_profile`, `readiness_assessment`, `strategic_priority`, `product_service`, `audience`, `client`, `tool`, `data_source`, `knowledge_source`, `vault`, `vault_reference`, `process_template`, `process_template_alias`, `campaign`, `opportunity`, `roadmap_item`, `company_score`, `department_score`. This guarantees the PFS adapters in `src/lib/db/pfs/*` can read/write without column-not-found errors.
- Ensures the read-shim views the adapters expect exist (`invitation` already exists; add `membership` and `organization` views if missing, scoped to `workspace_members` and `workspaces`).
- Idempotent: every statement uses `IF NOT EXISTS` / `CREATE OR REPLACE VIEW`.

No code changes in this step beyond the migration.

---

## 3. Priority Dashboard always shows Heatmap / Blocked / Insights

File: `src/components/build/pfs/process-platform.tsx` (`DashboardScreen`, lines ~485-531).

Currently, when `processes.length === 0`, the screen short-circuits to an "empty" card and the Tabs (Board / Heatmap / Blockers / Insights) and KPI cards (incl. **Blocked**) are not rendered.

Change behavior so the full dashboard chrome — KPI strip, quick filters, and the four tabs — always renders, with each panel showing its own zero-state copy:

- Keep `MaturityStagePanel` at the top.
- Always render `<Dashboard aggregate={…} processItems={[]} maturityStage={…} />`.
- Add a small "Map your first process" CTA banner above the tabs when `processItems.length === 0`, instead of replacing the whole screen.

No other Dashboard logic changes; the existing `PortfolioHeatmap`, blocker counters, and `InsightsPanel` already handle empty arrays.

---

## Technical details (for the implementer)

- Tab list source of truth: `BuildLayout` in `src/routes/app.$workspaceSlug.build.tsx`. Mirror its `tabs` array in `buildPhases()`; also gate Approvals with `isAdmin` (same hook).
- Migration approach: one `supabase--migration` call. Re-run the same column list per table from the prior PFS migration but wrapped in `do $$ ... alter table … add column if not exists … $$` blocks so pre-existing tables get back-filled. No data writes.
- Do NOT drop or rename any existing column on `company_profile` (legal_name, hq_country, etc.) — keep them for backward compatibility.
- After migration, regenerated Supabase types will let the PFS adapters compile cleanly; no app code changes needed for #2.
- For #3, leave the loader/error guards untouched; only remove the `processes.length === 0` early return and gate the CTA banner on that condition.

---

## Out of scope

- Visual redesign of dashboard cards, heatmap, or insights panels.
- Backfilling existing rows; new columns ship nullable with sensible defaults.
- Touching Scale / Roadmap / Assess routes.
