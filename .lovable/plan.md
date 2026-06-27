## Goal
Make the Frame / Diagram / Submit step navigation always reachable from the Process editor so the user can jump back to the process description (Frame) or forward to Submit at any time — without losing draft state.

## Problem
In the full-bleed canvas refactor, the `BuilderStepper` (which lives in the old outer `Card`) is no longer rendered during the Diagram step. The "Review & submit" button is a one-way forward jump, and there is no path back to Frame from Diagram, or back to Frame/Diagram from Submit.

## Files
- `src/routes/app.$workspaceSlug.build.process.new.tsx`

## Changes (presentation only — no logic changes, no schema changes)

1. **Persistent step nav in the canvas toolbar (Diagram step)**
   - Replace the static "Process canvas" heading block in the DiagramStep toolbar (~L1774–1778) with a compact inline stepper: three pill buttons `Frame · Diagram · Submit` mirroring `builderSteps`.
   - Current step is solid `--ichigo-navy`; the others are outlined chips. Clicking any chip calls `setStep(id)`.
   - Keep the right-hand toolbar group (Templates / Undo / Redo / Delete / Auto-layout / Review & submit) intact. "Review & submit" remains as the primary CTA.
   - Pass a new `onNavigateStep: (step: BuilderStep) => void` prop into `DiagramStep` wired to `setStep` at the call site (~L1445).

2. **Persistent step nav on the Frame and Submit screens**
   - At the top of `FrameStep` and `SubmitStep`, render the same compact stepper component so the user can move between Frame / Diagram / Submit from those screens too.
   - Add `onNavigateStep` (and `current`) props to both, wired from the parent.
   - From Submit, clicking Frame or Diagram returns the user to that screen with all in-memory state preserved (already handled by parent `useState`).

3. **Extract the stepper**
   - Factor the existing `BuilderStepper` into a compact horizontal variant (`BuilderStepNav`) used in all three places. Keep the original vertical/card variant code path unused/removed once references are migrated (single source of truth).
   - The compact variant: small pills, single row, no connecting line; numbered with check icon when complete; uses existing tokens (`--ichigo-navy`, `--chalk`, `--paper`, `--slate`, `--r-md`).

4. **Behavior guardrails**
   - Switching steps does not clear `frame`, `globalPass`, `nodes`, `edges`, `selectedId`, or the autosaved draft — these already live in the parent component state.
   - "Review & submit" CTA stays as the visually dominant forward action on the canvas.

## Out of scope
- Layout/sizing of the canvas, inspector, or ReactFlow defaults (untouched).
- Validation gating, submit logic, draft persistence.
- Any backend / DB / route changes.

## Verification
- On Diagram step, the compact `Frame · Diagram · Submit` nav is visible in the top-left of the canvas toolbar; clicking `Frame` opens FrameStep with the previously entered process name/objective/department populated.
- From FrameStep, clicking `Diagram` returns to the canvas with the same nodes/edges and selection. Clicking `Submit` opens SubmitStep.
- From SubmitStep, clicking `Frame` or `Diagram` returns without losing any data.
- Autosave indicator and draft restore continue to behave as before.
- Build passes; no other routes affected.
