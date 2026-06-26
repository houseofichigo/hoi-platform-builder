# Remove the Applied Track / Capstone feature

## Goal
Permanently delete every user-facing surface and supporting code for the
"applied track" / "use-case profile" / "capstone preview" feature. The core
12-module course stays; only the optional applied-track personalization and
capstone-library UI are removed.

## Files to delete
- `src/lib/assess/use-case-tracks.ts`
- `src/hooks/useUseCaseProfile.tsx`
- `src/routes/app.$workspaceSlug.onboarding.use-case-profile.tsx`
- `src/routes/app.$workspaceSlug.assess.use-cases.index.tsx`
- `src/routes/app.$workspaceSlug.assess.use-cases.$trackId.tsx`
- `src/routes/app.$workspaceSlug.assess.use-cases.$trackId.$moduleId.tsx`

## Files to edit

### `src/hooks/useOnboardingChecklist.tsx`
- Drop `"use_case_profile"` and `"example"` from `ChecklistItemId`.
- Drop `use_case_profile` from the workspaces select.
- Remove `workedExampleMeta` / `useCaseProfileValues` / `useCaseProfileComplete` block and the `resolveWorkedExample` import.
- Remove `exampleComplete`.
- Remove the "Choose an applied track" and "Personalize the applied track" checklist items.
- Remove `updateWorkedExample` mutation from `useOnboardingMutations` and from the returned object.

### `src/components/OnboardingChecklist.tsx`
- Remove `getPublishedWorkedExamples` import and `EXAMPLE_OPTIONS`.
- Remove `Dialog*` imports (only the example dialog used them — keep the tour dialog imports).
- Remove `exampleOpen` / `selectedExample` state and the `"example"` and `"use_case_profile"` cases in `handleAction`.
- Remove the whole "Applied track modal" `<Dialog>` block.
- Remove the trailing "More capstone cases are coming soon" paragraph.
- Stop destructuring `updateWorkedExample` from `useOnboardingMutations`.

### `src/routes/app.$workspaceSlug.settings.tsx`
- Remove `useUseCaseProfile` import.
- Remove `<UseCaseProfileCard />` usage and the `UseCaseProfileCard` component definition.

### `src/routes/app.$workspaceSlug.admin.settings.tsx`
- Remove the "Use-case profile" `ShortcutCard` and the `/onboarding/use-case-profile` entry from the `to` union.

### `src/routes/app.$workspaceSlug.assess.index.tsx`
- Remove `USE_CASE_TRACKS, type UseCaseTrack` import.
- Remove `"useCases"` from `CourseTab` union and from the tab nav array.
- Remove the `tab === "useCases"` render branch and the `UseCaseTracksPanel` / `UseCaseTrackCard` components.
- Remove the "Applied track" row from `CourseHero`'s aside `<dl>`, and stop passing `workedName` / `workedIndustry` (drop the `useWorkedExample` call + props if unused).
- Remove the "Use case tracks" outbound `<Link>` from `CourseShelf`.
- In `AssessHome` description: replace "apply it later to a chosen capstone case for certification." with "Earn certification by completing the assignments and gates."
- In `AboutPanel`: drop the capstone sentence (the paragraph referencing `workedName` and capstone evidence).
- Tighten the `NoticeCard` `to` union to remove `/onboarding/use-case-profile`.

## Notes
- Worked-example data files under `src/lib/worked-examples/**` remain because individual modules (e.g. M09) still surface them as worked references; they are no longer user-selectable.
- DB column `workspaces.use_case_profile` is left in place to avoid a destructive migration; it is simply no longer read or written by the app.
- `scripts/check-assess-core-boundaries.ts` is left untouched (still guards against cross-imports from the deleted dir; its checks just become no-ops).

## Changes (all in `src/components/assess/modules/M04Work.tsx`)

### 1. Replace `USE_CASES` string array with a structured catalog

Convert the existing `USE_CASES` constant into a list of 6 entries, each with:
- `id` + display `label`
- `blueprint`: a full `AssistantBlueprint` with realistic copy for that domain
- For the 6th entry, `id: "build_your_own"`, `label: "Build your own"`, blueprint with empty strings

Five seeded blueprints (concise, in the same voice as the current HR default):
- **Customer Support Policy Assistant** — purpose: answer customer-facing policy questions; users: support agents / tier-1; sources: refund/returns/SLA policies + FAQ; out of scope: don't issue refunds or promise exceptions; output: short answer + policy basis + missing info + human review flag + next step.
- **HR Policy Assistant** — current `DEFAULT_BLUEPRINT` copy.
- **Sales Enablement Assistant** — purpose: help reps find approved messaging/pricing/objection answers; users: AEs/SDRs; sources: approved battlecards, pricing sheet, ICP doc; out of scope: don't quote custom discounts or commit on contracts; output: short answer + source + missing info + human review + suggested next step.
- **SEO Content Assistant** — purpose: draft on-brand SEO briefs/outlines from approved guidelines; users: content/marketing team; sources: brand voice guide, keyword list, internal SEO playbook; out of scope: don't publish, don't invent stats; output: brief outline + sources used + gaps + review flag + next step.
- **Supplier Onboarding Assistant** — purpose: guide buyers through supplier intake/compliance checks; users: procurement team; sources: onboarding SOP, compliance checklist, approved supplier categories; out of scope: don't approve suppliers or sign NDAs; output: required step + policy basis + missing docs + human review + next step.

### 2. Adapt blueprint state to the selected use case

- Drop `DEFAULT_BLUEPRINT` initial seed; instead derive blueprint from `architecture.selectedUseCase` on first hydrate (default to "Customer Support Policy Assistant" if none selected, matching the first tile).
- When a tile is clicked: update `architecture.selectedUseCase` AND set `blueprint` to that use case's seeded blueprint (for "Build your own", set blueprint to empty strings). This overwrites any in-progress edits — acceptable because tile selection is an explicit "switch use case" action and matches the SOP framing.
- Keep `BlueprintEditor` controlled so the user can still tweak after switching.

### 3. Empty-state helper text per field (for "Build your own" and any cleared field)

Update `BlueprintEditor` so each field carries a helper hint shown only when the field is empty:
- **Purpose** — "What concrete job does this assistant do? e.g., answer questions about a bounded policy."
- **Users** — "Who will use it day to day? e.g., internal support team, procurement, marketing."
- **Sources** — "Which approved files/knowledge base may it answer from? List doc types."
- **Out of scope** — "What must it refuse or escalate? e.g., don't invent facts, don't take actions, don't promise refunds."
- **Output format / refusal line** — "What structure should every answer follow? Include a clear refusal line for unknown/unsafe asks."

Rendered as a small italic helper line under the field label (and/or as `placeholder` on the textarea) whenever `value[field.key].trim() === ""`. No extra UI when the field has content.

### 4. Update the "REPLACE THE EXAMPLE" callout text

Make it generic instead of HR-specific ("The selected use case is a starting example. Replace it with your own scope, knowledge base, and boundaries.") so it stays accurate across all six tiles, including "Build your own".

### 5. Layout

Render the 6 tiles in the existing `grid md:grid-cols-2` (3 rows of 2). "Build your own" is the 6th tile, visually distinct (e.g., dashed border) so it reads as a blank starter.

## Out of scope

- No changes to the SOP step images, demo (Refund Assistant) section, knowledge planning prompt, or downstream steps 5+.
- No persistence schema change: `architecture.selectedUseCase` already stores the string; `architecture.ownBlueprint` already stores the edited blueprint.
- No changes to `m04.ts` content file.
