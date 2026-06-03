## Plan: Clear stale bundle for `/app/.../assess/m02/work`

### Diagnosis
- `AssessRetakeProvider` is correctly exported from `src/hooks/useAssess.tsx` (line 55).
- `src/routes/app.$workspaceSlug.assess.$moduleId.work.tsx` imports and uses it correctly.
- TypeScript passes clean — the error in the browser is from a stale cached module, not real source code.

### Steps
1. Restart the Vite dev server (`code--restart_dev_server`) to flush HMR state.
2. Ask you to **hard-refresh** the preview tab (Cmd/Ctrl+Shift+R) to drop the cached bundle.
3. Re-navigate to `/app/house-of-ichigo/assess/m02/work` and confirm the page loads.

### If the error returns after hard refresh
Investigate deeper — likely candidates: a circular import between `useAssess.tsx` and one of the `MxxWork` components, or a runtime throw inside `M02Work` masked as a missing-export error by Vite.

No code changes in this plan.