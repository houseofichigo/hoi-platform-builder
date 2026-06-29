## Issues observed

1. **Duplicate Frame/Diagram/Submit stepper.** The header card (`src/routes/app.$workspaceSlug.build.process.new.tsx:1405`) renders `BuilderStepper`, AND each step screen (`FrameStep` line 1687, `DiagramStep` line 1847, `SubmitStep` line 3791) also renders `BuilderStageStepper`. Result: two near-identical 3-card steppers stack on every step (visible in both screenshots).

2. **No persistent way out.** The only escape is the "Discard" link in the autosave chip, which appears only when `hasDraftContent` is true. Once a draft exists the user can reset, but with an empty/fresh process they cannot get back to the Start picker (template / manual / AI). They also have no clear "Cancel" to leave the builder entirely.

## Fix

### 1. Remove the duplicate stepper
Keep the larger `BuilderStageStepper` (the one matching the design the user approved previously, used inside each step + the fixed diagram canvas header). Remove the header-card `BuilderStepper`.

- Delete line 1405: `{step !== "start" ? <BuilderStepper current={step} onSelect={setStep} /> : null}`
- Remove the now-unused `BuilderStepper` component (lines 1554-1598) to keep the file clean.

### 2. Add a clear, always-visible exit
In the header card (next to the title / autosave chip), render a button group that is always available once `step !== "start"`:

- **"Start over"** — calls `discardDraft()` (resets nodes/edges/frame and returns to the Start picker at `/build/process/new`). Uses a subtle outline style.
- **"Cancel"** — `navigate({ to: "/app/$workspaceSlug/build", params: { workspaceSlug } })` to leave the builder back to the Build phase.

Both wrapped in a confirm dialog (native `confirm()` is fine) when there is draft content, to avoid losing work accidentally. The existing "Discard" link inside the autosave chip is removed (replaced by "Start over").

No changes to data flow, validation, draft autosave, or the BuilderStageStepper.

## Files touched

- `src/routes/app.$workspaceSlug.build.process.new.tsx` only.
