# Re-sync Company Setup to uploaded PFS package

Goal: make Company Setup (admin/onboarding) match the uploaded `admin-setup-section.zip` byte-for-byte after the workspace shim, align the admin Settings tab with what the package actually owns, fold the legacy homepage "Workspace profile" flow into the new wizard, and delete leftover code.

## Scope

In scope
- `src/components/build/pfs/` — re-port the 6 PFS UI files from the zip; add the missing `org-chart-admin.tsx`.
- `src/lib/db/pfs/` — re-port the 13 db files from the zip; keep `shared.ts` and `auth.ts` as the workspace-scoping seam (do NOT overwrite those two with the org-scoped originals).
- `src/lib/org-chart/` — re-port `import.ts`, `readiness.ts`, `template.ts`.
- Admin routes: rewrite `app.$workspaceSlug.admin.settings.tsx`, simplify `app.$workspaceSlug.admin.onboarding.tsx`, keep the existing admin layout/tabs.
- Legacy homepage flow: delete `app.$workspaceSlug.onboarding.workspace-profile.tsx` and the OnboardingChecklist "Workspace profile" entry; redirect any deep-link to the new Setup wizard.

Out of scope
- Schema migrations (Batch 1 already created all needed tables).
- The Build/Map/Library/Approvals phase (already swapped in Batches 3–5).
- The Scale phase and `use_cases` bridge (kept as-is).
- The user profile form (`PersonalFieldsForm`) — kept; it's used by `/app/$workspaceSlug/settings`.

## What the zip says vs. what we have

The zip is the canonical Company Setup. Current ports are close but drifted (line counts differ by 1, and `admin-overview.tsx` grew from 172 → 208 lines). The README's integration seams that must be preserved are:
1. `lib/db/shared.ts` — workspace scope (not org). Current `shared.ts` (84 lines) is the workspace shim; keep it.
2. `auth.ts` — current (126 lines) is the HOI auth shim; keep it.
3. `AdminShell` import — already replaced by the HOI admin layout route.
4. Supabase client + types — already use HOI client.

Everything else should match the zip exactly.

## Plan

### 1. Re-port PFS UI to match zip (with minimal HOI shims)
Overwrite from `/tmp/admin-setup/src/components/` into `src/components/build/pfs/`:
- `company-onboarding.tsx`
- `org-chart-canvas.tsx` (keep synchronous tree layout, no `elkjs`)
- `org-node-editor-drawer.tsx`
- `tool-catalog-picker.tsx`
- `admin-overview.tsx` (revert to the 172-line zip version)

Add the missing file:
- `org-chart-admin.tsx` (723 lines, not currently in the project)

Adjust imports in each file:
- `@/integrations/supabase/types` → keep (HOI types exist).
- `@/components/org-chart-canvas` → `./org-chart-canvas` (relative within `pfs/`).
- `@/lib/db/<x>` → `@/lib/db/pfs/<x>`.
- `@/lib/org-chart/<x>` → `@/lib/org-chart/<x>` (unchanged).
- `Link`/router calls already shimmed via `./_link`; preserve.

### 2. Re-port `lib/db/pfs/*` to match zip
Overwrite from `/tmp/admin-setup/src/lib/db/` into `src/lib/db/pfs/`:
- `org-chart.ts`, `onboarding.ts`, `admin.ts`, `members.ts`, `member-profile.ts`,
  `tool-catalog.ts`, `clients.ts`, `audiences.ts`, `knowledge-sources.ts`,
  `vaults.ts`, `demo-loader.ts`

Do NOT overwrite:
- `shared.ts` (HOI workspace shim)
- `auth.ts` (HOI auth shim)

In each ported file, rewrite imports:
- `@/lib/db/shared` → `./shared`
- `@/lib/db/auth` → `./auth`
- `@/integrations/supabase/client` → `@/integrations/supabase/client` (unchanged)
- `@/integrations/supabase/types` → unchanged

### 3. Re-port `lib/org-chart/*` to match zip
Overwrite `import.ts`, `readiness.ts`, `template.ts`. Same import remapping for `@/lib/db/*` → `@/lib/db/pfs/*`.

### 4. Align the admin Settings tab
The zip has no "Settings" sub-page — the wizard owns company/profile/team/tools. Current `admin.settings.tsx` is a 3-card link shelf pointing at legacy routes.

Replace `app.$workspaceSlug.admin.settings.tsx` with a thin settings page that owns only what's NOT in the wizard:
- Workspace name + slug (read-only, with "Contact House of Ichigo to rename")
- Notification preferences (link to `/app/$workspaceSlug/settings` personal area)
- Danger zone placeholder (archive workspace — owner-only, disabled with explanatory copy)

Remove the "Company profile" and "Invite team" cards (both are now inside the Setup wizard).

### 5. Fold the homepage "Workspace profile" flow into Setup
- Delete `src/routes/app.$workspaceSlug.onboarding.workspace-profile.tsx`.
- In `src/components/OnboardingChecklist.tsx`, change the "Workspace profile" step's `to` from `/app/$workspaceSlug/onboarding/workspace-profile` to `/app/$workspaceSlug/admin/onboarding` (admin-only; non-admins see a "Ask your admin to complete setup" state — already handled by the admin gate).
- In `src/routes/app.$workspaceSlug.settings.tsx`, replace the legacy `workspace-profile` link with a link to `/app/$workspaceSlug/admin/onboarding` (admins) or a static "Company setup is managed by your admin" panel (non-admins).
- `src/routes/app.$workspaceSlug.invite.tsx`, `invite.accept.tsx`, `app.onboarding.create-workspace.tsx`: untouched — these are platform-level flows the wizard doesn't replace.

### 6. Remove leftovers
- Delete `src/lib/profile/workspace-profile.ts` (the legacy WORKSPACE_PROFILE_DEFAULTS/SCHEMA) only if no other route imports it after step 5; verify with a grep first and skip if still referenced.
- Delete `src/components/profile/ProfileForm.tsx` only if unused after step 5 (same check).
- Keep `PersonalFieldsForm` and `useUserProfile` (used by `/app/$workspaceSlug/settings`).

### 7. Verify
- `bun run build:dev` succeeds.
- `/app/$workspaceSlug/admin/onboarding` renders the wizard with all 6+ steps from the zip.
- Org chart in the wizard lays out departments side-by-side (synchronous tree layout, no ELK).
- Admin nav unchanged: Overview · Setup · Members · Analytics · Review policy · Billing · Invoices · Settings.
- Settings tab shows only workspace name / notifications link / danger zone — no "Company profile" or "Invite team" shortcuts.
- `/app/$workspaceSlug/onboarding/workspace-profile` returns 404 (route deleted) and OnboardingChecklist points to `/admin/onboarding`.

## Technical notes

- The README explicitly says: do NOT reintroduce `elkjs` for the org chart — the zip's `org-chart-canvas.tsx` uses a synchronous tree layout. We will keep `elkjs` installed because the Build phase canvas uses it; just don't import it in `org-chart-canvas.tsx`.
- Role mapping (already in `shared.ts`): `admin→admin`, `department_lead→member`, `employee→member`, `reviewer→admin`, `viewer→viewer`. No change needed.
- All ported files keep `// @ts-nocheck` at the top to avoid blocking on PFS-vs-HOI type drift; types regen happens automatically when migrations run.
- No new migrations — Batch 1 already created `tool_catalog`, `vault`, `member_profile`, `audience`, `client`, `knowledge_source`, `readiness_assessment`, `strategic_priority`, `product_service`, `data_source`, `campaign`, and the `department` / `process` extensions.

## Files changed

Re-written (overwrite from zip + import remap):
- `src/components/build/pfs/company-onboarding.tsx`
- `src/components/build/pfs/org-chart-canvas.tsx`
- `src/components/build/pfs/org-node-editor-drawer.tsx`
- `src/components/build/pfs/tool-catalog-picker.tsx`
- `src/components/build/pfs/admin-overview.tsx`
- `src/lib/db/pfs/{org-chart,onboarding,admin,members,member-profile,tool-catalog,clients,audiences,knowledge-sources,vaults,demo-loader}.ts`
- `src/lib/org-chart/{import,readiness,template}.ts`
- `src/routes/app.$workspaceSlug.admin.settings.tsx`
- `src/routes/app.$workspaceSlug.settings.tsx` (only the workspace-profile link)
- `src/components/OnboardingChecklist.tsx` (only the workspace-profile step target)

Added:
- `src/components/build/pfs/org-chart-admin.tsx` (from zip)

Deleted:
- `src/routes/app.$workspaceSlug.onboarding.workspace-profile.tsx`
- `src/lib/profile/workspace-profile.ts` (if unreferenced after step 5)
- `src/components/profile/ProfileForm.tsx` (if unreferenced after step 5)
