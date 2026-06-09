## Problem
The live preview is not working because the preview server is crashing before the app loads.

## Root cause
A required native Rollup package is missing in the sandbox install:
- Missing module: `@rollup/rollup-linux-x64-gnu`
- Crash happens during `vite dev`, so the preview never starts

There is also dependency drift in the repo:
- `package.json` and `package-lock.json` are not fully aligned
- `bun.lock` references a different Rollup version than the installed `node_modules`
- The npm lockfile does not contain the missing native Rollup package entry

## Plan
1. Clean up dependency drift so the project uses one consistent install state.
2. Reinstall dependencies so the required Rollup native package is restored.
3. Restart the dev server / preview.
4. Verify the preview loads normally after the dependency repair.

## Technical details
Current evidence from the project:
- Dev server log shows: `Cannot find module '@rollup/rollup-linux-x64-gnu'`
- Installed versions currently observed:
  - `vite`: `7.3.5`
  - `rollup`: `4.61.0`
- `bun.lock` still references Rollup `4.60.2`
- `package-lock.json` does not include `node_modules/@rollup/rollup-linux-x64-gnu`

## Expected outcome
Once dependencies are resynced and reinstalled, the preview should start again normally.