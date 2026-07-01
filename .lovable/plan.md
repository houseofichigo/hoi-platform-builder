Add a **Start over** button in the diagram-tab toolbar, placed immediately to the right of the existing **Delete** button.

### Behavior
- Clicking it opens a confirmation dialog: "Start over? This will discard your current diagram and return you to the Frame step."
- On confirm:
  1. Remove the in-progress builder draft from `localStorage` (`processBuilderDraftKey`).
  2. Reset builder state: clear nodes/edges, reset frame fields to defaults, reset global pass to defaults.
  3. Navigate the builder back to the **Frame** step (`setStep("frame")`).
- On cancel, close the dialog and leave the diagram untouched.

### Implementation scope
- In `src/routes/app.$workspaceSlug.build.process.new.tsx`:
  - Add a confirmation-dialog state + handlers in the main builder component.
  - Pass an `onStartOver` callback into the `DiagramTab` sub-component.
  - In `DiagramTab`, render the new button with a `RotateCw` icon and `text-[var(--danger)]` styling, between **Delete** and **Auto-layout**.
- Use the existing shadcn `AlertDialog` primitives for the confirmation so the UX is consistent with the rest of the app.

No routing, database, or backend changes required.