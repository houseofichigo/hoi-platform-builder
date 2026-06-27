## Goal

1. Fix the **"Set up your company profile"** checklist item so it always lands on the admin Company Setup wizard the user just configured.
2. Replace the current static **"Tour the methodology"** dialog with a real guided tour that walks through every main tab of the app and returns to the homepage at the end.

---

## 1. Company-profile link

`src/components/OnboardingChecklist.tsx` already navigates `workspace_profile` to `/app/$workspaceSlug/admin/onboarding` (the Company Setup wizard). The issue is the destination: the admin layout (`app.$workspaceSlug.admin.tsx`) blocks non-admins with an "Admin access required" screen, and the checklist item is shown to every member.

Changes:
- In `useOnboardingChecklist.tsx`, only render the `workspace_profile` item for admins/owners (re-use `useWorkspace().isAdmin`). For non-admins, drop the item so it doesn't appear or count against progress.
- Keep the navigation target as `/app/$workspaceSlug/admin/onboarding` — that is the canonical Company Setup wizard (`components/build/pfs/company-onboarding.tsx`), already wired to the same data admins edit in `Admin → Setup`.
- Update the checklist item copy to "Set up your company profile in Admin → Setup" so the destination is explicit.

---

## 2. Guided app tour

Replace the current single-modal "Methodology tour" with a step-driven product tour using a lightweight popover/spotlight pattern (no new deps; built with existing `Dialog` + a floating card pinned to the top-right of each route).

### New component: `src/components/GuidedTour.tsx`
- Controlled by `tourOpen` state already in `OnboardingChecklist`.
- Holds an ordered list of steps. Each step:
  - `route` — TanStack route to navigate to (with `workspaceSlug` param)
  - `title` — tab name
  - `body` — 2-3 sentence explanation of what the tab does and how to use it
  - `cta` — "Next" / "Finish"
- Renders a fixed bottom-right card (z-50) with progress (e.g. "Step 3 of 6"), Back, Skip tour, Next buttons. Card stays mounted across navigations via a React context provider mounted in `__root.tsx` (or in `app.$workspaceSlug.tsx` layout so it only shows inside a workspace).
- On "Next": navigate to the next step's route. On "Finish": call `markTourCompleted`, navigate back to `/app/$workspaceSlug`, close.
- On "Skip tour": close without marking complete (or mark complete + toast — confirm in build).

### Tour steps (in order)

```text
1. Home         /app/$workspaceSlug                 — "Your command center..."
2. Assess       /app/$workspaceSlug/assess          — "Diagnose readiness and complete the curriculum..."
3. Discover     /app/$workspaceSlug/discover        — "Browse the resource library..."
4. Build        /app/$workspaceSlug/build           — "Map processes, score use cases, prioritize..."
5. Scale        /app/$workspaceSlug/scale           — "Sequence the roadmap and review governance..."
6. Admin (admins only) /app/$workspaceSlug/admin    — "Manage members, billing, company setup..."
7. Back to Home /app/$workspaceSlug                 — "You're ready. Welcome back."  (Finish)
```

Admin step is conditionally inserted via `useWorkspace().isAdmin`.

### Wiring

- Move `tourOpen` state and the tour trigger into a `TourProvider` context in `src/contexts/TourContext.tsx` (or co-locate in `app.$workspaceSlug.tsx`). Expose `startTour()`.
- In `OnboardingChecklist.tsx`, replace `setTourOpen(true)` with `startTour()` from the context. Delete the old `<Dialog>` markup at the bottom of the file.
- Render `<GuidedTour />` inside `src/routes/app.$workspaceSlug.tsx` so it persists across route changes within the workspace.
- Keep the existing `markTourCompleted` mutation — called once on Finish.

---

## Files touched

- `src/hooks/useOnboardingChecklist.tsx` — gate `workspace_profile` to admins; copy tweak.
- `src/components/OnboardingChecklist.tsx` — remove inline tour dialog; call `startTour()`.
- `src/contexts/TourContext.tsx` *(new)* — provider + `useTour()` hook.
- `src/components/GuidedTour.tsx` *(new)* — floating step card + navigation logic.
- `src/routes/app.$workspaceSlug.tsx` — wrap children in `TourProvider`, render `<GuidedTour />`.

## Out of scope

- No element-level spotlight/highlight overlays (keeps scope small; can add later if you want).
- No DB schema changes — reusing existing `tour_completed_at` field on `profiles`.
