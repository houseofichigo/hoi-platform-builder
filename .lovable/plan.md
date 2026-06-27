## Problem

The PFS Company Setup adapter (`src/lib/db/pfs/onboarding.ts`) and 16 other PFS adapter files query/insert with `organization_id`, but our HOI tables use `workspace_id`. Result: `column company_profile.organization_id does not exist` and the wizard fails to load. The screenshot also shows reference table names (`organization`, `membership`, `invitation`, `roadmap_item`) that don't exist in our schema (we have `workspaces`, `workspace_members`, `workspace_invitations`, `roadmap_entries`).

## Approach: DB-side alias, not code rewrite

Rather than rewriting 17 PFS files (and breaking the "implement PFS exactly as-is" guarantee), make the database speak PFS's vocabulary. One migration, two parts.

### Part 1 — Add `organization_id` to every PFS-scoped table

For each table the PFS adapters touch (`company_profile`, `member_profile`, `department`, `process`, `process_step`, `process_export`, `process_status_audit`, `process_template`, `vault`, `vault_reference`, `tool`, `tool_action`, `audience`, `campaign`, `client`, `company_score`, `data_source`, `department_score`, `knowledge_source`, `opportunity`, `product_service`, `readiness_assessment`, `strategic_priority`):

1. `ADD COLUMN organization_id uuid` (nullable initially).
2. Backfill `organization_id = workspace_id`.
3. `BEFORE INSERT OR UPDATE` trigger that mirrors the two columns: if one is set and the other null, copy across; if both set and differ, raise. This keeps HOI code (writes `workspace_id`) and PFS code (writes `organization_id`) interoperable.
4. `SET NOT NULL` + index on `organization_id`.

RLS already keys off `workspace_id`; no policy changes needed because the trigger guarantees the two stay equal.

### Part 2 — Create PFS-named views for the four renamed tables

- `public.organization` → view over `public.workspaces` (id, name, slug, created_at, …)
- `public.membership` → view over `public.workspace_members`
- `public.invitation` → view over `public.workspace_invitations`
- `public.roadmap_item` → view over `public.roadmap_entries`

Views use `security_invoker=on` so existing RLS on the base tables applies. Add `INSTEAD OF` triggers only if PFS code writes to them (verify during implementation; most reads only).

Grant `SELECT` (and `INSERT/UPDATE/DELETE` where needed) to `authenticated` and `ALL` to `service_role` on every view.

### Part 3 — Verify

After the migration runs and types regenerate:
- Reload `/app/house-of-ichigo/admin/onboarding` and confirm the wizard renders.
- Smoke-test saving the company profile step (writes `company_profile` via `organization_id`).
- Confirm HOI Build pages still work (they write `workspace_id`).

## Out of scope

- No PFS adapter file rewrites.
- No changes to HOI tables' primary naming (`workspace_id` remains the source of truth).
- The screenshot tables `process_template_alias`, `tool_catalog`, `tool_action_catalog`, `member_profile`, `vault`, `vault_reference` already exist — no action needed beyond Part 1.
