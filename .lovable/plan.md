# Verify MapProcessDiagram standalone

Goal: confirm `/mnt/documents/MapProcessDiagram.tsx` (2,922 lines) compiles and renders without runtime errors when dropped into a new route in this project.

## Steps

1. **Stage the file into the app**
   - Copy `/mnt/documents/MapProcessDiagram.tsx` → `src/components/build/MapProcessDiagram.tsx`.
   - Create a throwaway route `src/routes/app.$workspaceSlug.build.map-verify.tsx` that renders `<MapProcessDiagram />` inside the existing workspace layout (auth + workspace context already provided by parent `app.$workspaceSlug.tsx`, so React Flow hooks and `useActiveOrg` will resolve).

2. **Typecheck**
   - Run `tsgo` on the two staged files only (file has `@ts-nocheck`, so we're really checking that every `@/…` import resolves and the route file itself is well-typed).
   - Resolve any missing peer imports the header comment listed (e.g. `@/lib/db/pfs/*` hook names) by grepping the referenced modules for the exact exports the component uses.

3. **Runtime smoke test via Playwright**
   - Sign in using the injected Supabase session (`LOVABLE_BROWSER_AUTH_STATUS=injected`).
   - Navigate to `/app/<slug>/build/map-verify` on `http://localhost:8080`.
   - Capture console errors + a screenshot at 1280×1800.
   - Pass criteria: no red-screen error overlay, no uncaught console errors, the React Flow canvas + stepper + toolbar are visible.

4. **Report + cleanup**
   - Report typecheck result, console log excerpt, and screenshot path.
   - Delete the throwaway route and staged component (or leave behind a note) — user decides. Default: remove both after verification so the codebase stays clean.

## Technical notes

- The file carries `// @ts-nocheck`, so the meaningful compile signal is Vite's import resolution, not TS types. A dev-server route load exercises that path end to end.
- Verification uses the existing `_authenticated`-equivalent parent (`app.$workspaceSlug.tsx`) so `useWorkspace`/`useActiveOrg` won't 401 during render.
- No behavioral changes to the extracted file itself — if an import fails to resolve, fix it in `/mnt/documents/MapProcessDiagram.tsx` (source of truth) and re-copy.
