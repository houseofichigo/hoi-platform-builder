## Goal
Make the Process Editor full-bleed: canvas fills viewport below the top nav, inspector is a sibling column with matching height (not fixed/absolute). Layout-only change — no logic, no elkjs, same tokens.

## Files
- `src/routes/app.$workspaceSlug.build.process.new.tsx`
- `src/routes/app.$workspaceSlug.build.process.$id.tsx`

## Changes (applied identically to both files)

### 1. Outer wrapper
Replace the current `<div className="space-y-5"><div className="relative"><Card ...>` editor shell with a fixed full-width flex row that breaks out of the centered content column:

```tsx
<div className="fixed inset-x-0 bottom-0 top-[56px] z-30 flex bg-[var(--paper)]">
  <div className="relative flex min-w-0 flex-1 flex-col">
    {/* toolbar: "Process canvas" header + Templates/Undo/Redo/Delete/Auto-layout/Review & submit */}
    <div className="relative min-h-0 flex-1">
      <ReactFlow ... className="h-full w-full" />
    </div>
    {/* readiness / steps / automation / data stats bar */}
  </div>
  {selected ? (
    <aside className="flex w-[360px] shrink-0 flex-col overflow-y-auto border-l border-[var(--chalk)] bg-white">
      <SidePanel ... />
    </aside>
  ) : null}
</div>
```

Top offset is `56px` — will verify against the actual top-nav height in the layout and adjust if different.

### 2. Inspector
- Remove `fixed bottom-0 right-0 top-0 ... max-w-[390px]` variant (~L1896).
- Remove `absolute inset-y-0 right-0 ... max-w-[460px]` variant (~L2032).
- Both collapse into the single `<aside className="w-[360px] shrink-0 ...">` sibling above.

### 3. Canvas sizing
- Replace `h-[calc(100vh-280px)] min-h-[620px]` on the canvas container with `min-h-0 flex-1`.
- ReactFlow gets `className="h-full w-full"`.

### 4. ReactFlow props (comfort defaults)
```tsx
fitView
fitViewOptions={{ padding: 0.25, minZoom: 0.6, maxZoom: 1.4 }}
minZoom={0.4}
maxZoom={1.75}
defaultEdgeOptions={{ type: "smoothstep" }}
proOptions={{ hideAttribution: true }}
```
Call `fitView()` after node/layout changes so the diagram stays framed. Keep `MiniMap` and `Controls` pinned bottom-left inside the canvas column.

## Out of scope
Node behavior, data flow, validation, elkjs/auto-layout logic, design tokens — untouched.

## Verification
- Canvas spans full width minus the 360px inspector.
- Inspector top/bottom align exactly with canvas (no overhang).
- A fresh 2–3 node process is fully visible without manual zoom.
- Window resize keeps canvas + inspector at equal height.
- Build passes; no logic regressions in process create/edit flows.
