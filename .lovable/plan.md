## Remaining work on Process Flow Studio Build integration

Based on the last sync, the Build foundation is live (tables `department`, `process`, `process_step`, `process_status_audit` exist with grants + RLS, Build routes use them, isolation test passes, orphaned `useBuild` / `approvals.functions.ts` / `dashboardBuckets.ts` were deleted, CI guardrail in place).

What's still open:

### 1. Retire the legacy `use_case*` tables
Blocked by remaining callers outside Build. Need to migrate or remove these before dropping the tables:
- `src/routes/app.$workspaceSlug.scale.index.tsx`
- `src/routes/app.$workspaceSlug.scale.roadmap.tsx`
- `src/routes/app.$workspaceSlug.scale.reviews.tsx`
- `src/routes/app.$workspaceSlug.scale.governance.tsx`
- `src/routes/app.$workspaceSlug.scale.audit.tsx`
- `src/routes/app.$workspaceSlug.scale.$useCaseId.review.tsx`
- `src/lib/scale/*` (queries, scale.functions, governanceFlags, notify)
- `src/routes/app.$workspaceSlug.discover.*`
- `src/lib/library/roadmap.functions.ts`

Path: repoint Scale + Discover to read from `process` (+ `roadmap_entries`, `governance_flags`, `post_pilot_reviews`), then ship a drop migration for `use_cases`, `use_case_captures`, `use_case_scores`, `use_case_approvals`, `use_case_score_snapshots`.

### 2. Org-chart hardening (`src/lib/db/org-chart.ts`)
Profiles read is cast through `any` and silently falls back to "Member <id>" if schema drifts. Type it against `Database["public"]["Tables"]["profiles"]` and surface an error instead of swallowing.

### 3. Supabase linter warnings (36 pre-existing)
Not introduced this turn, but worth a dedicated pass:
- mutable `search_path` on legacy SECURITY DEFINER functions
- anon-executable SECURITY DEFINERs
- public storage bucket listing

### 4. Local verification we couldn't run in the sandbox
- `supabase db reset` against a local DB
- `scripts/build-isolation.sql` run locally (only ran against cloud)
- `bun run build` full production build

### Suggested order
1. Scale → `process` migration (biggest blocker for table drop).
2. Discover → `process` migration.
3. Drop `use_case*` tables + delete `src/lib/scale/*` legacy pieces.
4. Org-chart typing fix.
5. Linter warning sweep.

Tell me which of these you want to tackle first (my recommendation: #1 Scale migration) and I'll switch to build mode with a focused plan for that slice.
