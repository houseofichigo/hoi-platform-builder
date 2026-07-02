# Refactor MapProcessDiagram.tsx to compile standalone

Goal: make `/mnt/documents/MapProcessDiagram.tsx` drop-in usable in any project without pulling TanStack Router route APIs.

## Findings

- Only two truly route-specific symbols are imported at the top of the file: `createFileRoute` and `useNavigate` from `@tanstack/react-router` (line 2).
- Neither symbol is actually referenced anywhere in the body (verified via grep — the only match is a comment on line 420 reminding to clean them up).
- The remaining imports are legitimate runtime deps used by the component (React Flow, lucide, UI primitives, PFS helpers, `@/lib/*` utilities). They are not route-specific — they're the component's real dependencies.
- File already carries `// @ts-nocheck` so TS won't complain about unused imports, but the router import still creates a hard runtime coupling to `@tanstack/react-router` (which a non-TanStack host project might not have installed).

## Changes

1. **Remove** the line:
   ```ts
   import { createFileRoute, useNavigate } from "@tanstack/react-router";
   ```
2. **Remove** the now-stale reminder comment on line 420 ("Remove unused imports (e.g. createFileRoute, useNavigate, useMutation, etc.) when moving to another project.").
3. **Add** a short header comment listing the external dependency surface a host project must provide so this file compiles:
   - npm: `react`, `@xyflow/react`, `lucide-react`, `@tanstack/react-query` (used transitively by the `@/lib/db/pfs/*` hooks)
   - local modules it expects at these `@/` paths (unchanged): `@/components/ui/*`, `@/components/build/pfs/{process-template-library,risk-tier-badge,tool-catalog-picker}`, `@/lib/diagram-patch`, `@/lib/db/pfs/*`, `@/lib/node-field-schema`, `@/lib/risk-tier`, `@/lib/scoring/process-score`, `@/lib/process-data`.
4. **Write** the updated file to `/mnt/documents/MapProcessDiagram.tsx` (overwrite) and emit a `<presentation-artifact>` tag so you can re-download it.

## Non-changes (intentional)

- Not inlining the `@/lib/db/pfs/*` hooks or PFS components — that would balloon the file to 6k+ lines and re-couple it to Supabase. The header comment documents them as required peer modules instead.
- Not touching the `@ts-nocheck` directive — keeps the file portable across TS configs.
- No behavioral changes.
