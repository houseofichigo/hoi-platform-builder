# Deploy-Readiness — Final Pass

Fresh security scan came back clean: **0 errors, 6 warnings**, and all 6 are the app-facing RPCs already documented as accepted in `@security-memory`. Nothing left to fix on the database/security side.

## What's left before publish

### 1. Verify root metadata (`src/routes/__root.tsx`)
`preview_ui--publish` requires real title, description, `og:title`, `og:description`, `og:type`, `twitter:card`, `twitter:title`, `twitter:description`, and a favicon. I'll read the current `head()` and patch any placeholders ("Lovable App", "Vite App", "Lovable Generated Project") with the real HOI Platform identity.

### 2. Confirm production build is green
Harness runs typecheck/build automatically; we just confirm the last result is clean before publishing.

### 3. Smoke test in preview (manual, by you)
- Sign in.
- `/app/<workspace>/build` — list renders, decision flow works.
- `/app/<workspace>/scale` — roadmap loads.
- Approve a process in Build → confirm a `use_cases` row appears (bridge trigger).
- Open a different workspace → confirm you can't see the first one's data.

### 4. Publish
Call `preview_ui--publish` with the metadata preflight summary.

## What is explicitly NOT in this pass

- Scale → `process` full cutover (Path B).
- Discover migration decision.
- Dropping legacy `use_case*` tables.
- The 6 accepted-RPC linter warnings (documented).

## Order of execution

1. Audit + update `src/routes/__root.tsx` metadata.
2. Confirm clean build.
3. Hand back to you for the smoke test.
4. You say "publish" → I call `preview_ui--publish`.

## Question

Anything you want to include or exclude before step 1? Otherwise I'll proceed straight through to handing the preview back to you for the smoke test.