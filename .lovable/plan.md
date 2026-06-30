## What's actually happening

`/app/house-of-ichigo/admin/onboarding` renders `<CompanyOnboarding mode="wizard" />`, which calls `useOnboardingContext()` (`src/lib/db/pfs/onboarding.ts:310`). That hook fires ~15 parallel Supabase reads and **throws on the first one that errors** (`onboarding.ts:275-278`). The throw escapes the component, there is no error boundary on the route, and TanStack falls back to the global `ErrorComponent` in `src/routes/__root.tsx` — the "This page didn't load" screen.

When I inspected the live preview the wizard rendered fine (Step 1 of 6), which matches the symptom: a single flaky / RLS-denied query is enough to wipe the entire page, even though the wizard itself works. The fix has two layers:

1. **Never let the wizard nuke the page**: render an inline error card when `useOnboardingContext` errors, with the underlying message + retry.
2. **Stop one optional query from killing the whole context load**: in `getOnboardingContext`, only throw for the queries the wizard genuinely needs (profile + departments + members). Treat secondary lists (tools, audiences, clients, knowledge sources, vaults, priorities, campaign) as `[]` / `null` with a console warning when they error individually.
3. **Per-route error boundary** so any other throw (e.g. inside `OrgChartCanvas` or a mutation render) shows the real message inline instead of the generic screen.

## Changes

### `src/lib/db/pfs/onboarding.ts`
- Refactor the parallel-read block in `getOnboardingContext`:
  - Required reads (`profile`, `departments`, `members`, `memberProfiles`): if `error` is set, throw it (preserve current behaviour).
  - Optional reads (`products`, `invitations`, `tools`, `dataSources`, `audiences`, `clients`, `knowledgeSources`, `vaults`, `readiness`, `priorities`, `campaign`): on error, `console.warn` and fall back to `[] / null` so the wizard still loads.
- Keep the existing return shape unchanged.

### `src/components/build/pfs/company-onboarding.tsx`
- Destructure `isError` and `error` from `useOnboardingContext()`.
- When `isError`, render an inline error card (Card + Button) showing `error.message` and a "Retry" button that calls `refetch()`. Do not let the error propagate.
- Keep the existing loading skeleton path.

### `src/routes/app.$workspaceSlug.admin.onboarding.tsx`
- Add a local `errorComponent` to the route definition that:
  - Logs the raw error.
  - Renders an inline card with the error message, a "Try again" button (`router.invalidate(); reset();`), and a "Back to admin" link.
  - In dev (`import.meta.env.DEV`), shows `error.stack` in a `<details>` block — same pattern we already use in `__root.tsx`.

### Verification
- `curl` the route on dev and confirm 200 + wizard HTML (already verified).
- In the live preview, force one of the optional queries to fail (e.g. via a bad column) and confirm the wizard still renders and the inline warning appears in the console — not the global error screen.
- Click through Step 1 → Step 2 of the wizard to confirm no regression.

## Out of scope

- No schema or RLS changes.
- No edits to the global `ErrorComponent`, `__root.tsx`, `src/server.ts`, or auto-generated Supabase files.
- No changes to other admin routes.
