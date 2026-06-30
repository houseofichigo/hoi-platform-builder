## What I verified

- Dev server is healthy (Vite ready, no errors in logs).
- SSR for `/` returns HTTP 200 with the real hero HTML (7.2 KB). So the server isn't throwing.
- The branded "This page didn't load" screen is the `ErrorComponent` in `src/routes/__root.tsx` — it only renders when something throws **in the client React tree** after hydration.
- The console shows a React 19 **hydration mismatch** on `<html>` caused by the **Scribe browser extension** injecting `data-scribe-recorder-ready="true"`. In React 19 this discards the tree and re-renders from scratch — if anything throws during that re-render, the root `errorComponent` takes over. That matches your symptom exactly.

The current `ErrorComponent` hides the real message, so I can't see what's throwing on the second render. The plan is to surface the underlying error and stop the extension from triggering hydration discards.

## Plan

### 1. Stop the Scribe extension from breaking hydration
In `src/routes/__root.tsx`, add `suppressHydrationWarning` to the `<html>` and `<body>` tags in `RootShell`. This is the standard React fix for browser extensions that mutate the document shell before hydration. It does not hide real mismatches inside your app.

### 2. Surface the real error (temporary diagnostic)
In `src/routes/__root.tsx` `ErrorComponent`, render `error.message` and `error.stack` in a collapsed `<details>` block (dev only via `import.meta.env.DEV`). Also log `error.digest` if present. This way the next refresh tells us exactly which component/loader is throwing instead of the generic fallback.

### 3. Re-test, then act on the real error
Once the underlying message is visible, fix the actual throw at its source (likely a Link/asset/loader issue triggered only on client re-render). I'll patch the offending file in a follow-up — I'm not changing any feature code blind.

### Files touched
- `src/routes/__root.tsx` — add `suppressHydrationWarning`, expand `ErrorComponent` with dev-only details.

No business-logic or backend changes. No other files touched until step 3.

### Out of scope
- Disabling the Scribe extension (that's on your browser, not the app).
- Changing routes, auth, or data fetching.

After this is merged, refresh `/` and paste the new error text — that's what will let me ship the real fix in one shot.