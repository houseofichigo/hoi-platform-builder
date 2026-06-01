## What changed upstream

One new commit on `main` (`091a997` — "Harden Build approval and wizard validation") touches 8 files. No new migrations, no new dependencies.

## Files to sync from GitHub → project

1. `src/lib/build/approvals.functions.ts` — **new file** (server functions for Build approval flow)
2. `src/lib/build/wizard-schema.ts` — tightened wizard validation
3. `src/lib/scale/scale.functions.ts` — refactor aligned with new approval flow
4. `src/hooks/useBuild.tsx` — small hook update
5. `src/routes/app.$workspaceSlug.build.approvals.tsx` — wire to new approvals fns
6. `src/routes/app.$workspaceSlug.build.capture.$useCaseId.tsx` — capture flow update
7. `scripts/check-build-output-keys.ts` — extended guard checks
8. `.lovable/plan.md` — doc update

## Plan

1. Copy the 8 files verbatim from the freshly cloned `hoi-check` working tree into `/dev-server` at the same paths.
2. Run the project's own guards to confirm the sync is internally consistent:
   - `bun scripts/check-import-integrity.ts`
   - `bun scripts/check-build-output-keys.ts`
   - `bunx tsc --noEmit`
3. Confirm dev server still serves (preview reload).

No database migrations, no `bun add`, no env changes needed.

## Risks

- `approvals.functions.ts` is brand new; if `useBuild.tsx` or the approvals route reference exports we don't sync correctly the typecheck will catch it.
- If the updated `check-build-output-keys.ts` adds stricter rules that the rest of the synced code doesn't satisfy, we fix forward — the upstream commit was authored together so it should pass as a set.