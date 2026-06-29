## Goal

Show the three Frame / Diagram / Submit stages as the prominent stepper from the screenshot at the top of the process builder, without reducing the working canvas area.

## Changes (all in `src/routes/app.$workspaceSlug.build.process.new.tsx`)

### 1. New `BuilderStageStepper` component

Render three large cards matching the screenshot:

- Card per stage with: round number badge (filled navy with check when complete; filled navy when active; outlined chalk when upcoming), bold label (`Frame` / `Diagram` / `Submit`), small caption (`Define & characterize` / `Map the flow` / `Review & submit`).
- Active card: solid navy background, white text, white number bubble.
- Complete card: white background, navy text, navy bubble with check icon.
- Upcoming card: white background, slate text, chalk-outlined bubble.
- All three are buttons that call `onSelect(step)`; equal width via `grid-cols-3` with `gap-3`.

### 2. Diagram view (fixed full-bleed shell around line 1827)

- Add a compact wrapper above the existing toolbar that hosts `BuilderStageStepper`. Keep it inside the fixed container so the canvas still fills the remaining space via the existing `flex-1` column.
- Remove the inline `BuilderStepNav` pill row + helper sentence from the toolbar (replaced by the stepper); keep right-side action buttons (Templates, Undo, Redo, Delete, Auto-layout, Review & submit) as-is.
- Canvas keeps its current `flex-1 min-h-0` sizing; net vertical use is roughly the same as today (stepper replaces the pill row + helper line), so the canvas does not shrink.

### 3. Frame and Submit steps (the two non-canvas screens)

- Replace the existing small `BuilderStepNav` rendered at the top of `FrameStep` (line 1670) and the Submit step card (line ~3772) with `BuilderStageStepper` for visual consistency with the diagram screen.
- Keep `onNavigateStep` wiring as-is.

### 4. Cleanup

- Leave `BuilderStepNav` exported/unused only if still referenced elsewhere; otherwise remove its definition. Quick check shows it is only used in these three call sites, so it can be deleted after the swap.

No backend or schema changes. No new dependencies.
