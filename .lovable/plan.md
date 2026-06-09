## Problem
The preview loads (HTTP 200, Vite running fine on port 8080) but immediately renders the "This page didn't load" error screen. Root cause: `.env` is missing from the project root, so `import.meta.env.VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are `undefined`. The Supabase client in `src/integrations/supabase/client.ts` throws on first access, which happens immediately because `AuthProvider` (mounted in `src/routes/__root.tsx`) calls `supabase.auth.onAuthStateChange` on mount. The error bubbles into the root `errorComponent`.

The `.env` was recreated in a prior turn but did not survive — likely a sandbox reset wiped it (it's gitignored, so it never came back from the repo).

## Plan
1. Recreate `.env` at the project root with the Lovable Cloud values for this project:
   - `VITE_SUPABASE_PROJECT_ID=hqliaebgjwjyhmfpwxti`
   - `VITE_SUPABASE_URL=https://hqliaebgjwjyhmfpwxti.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY=<anon key>`
2. Restart the Vite dev server so it picks up the new env (Vite only reads `.env` at startup).
3. Verify the preview renders the app (not the error screen) by checking dev-server logs and hitting `/`.

## Notes
- No code changes needed; `client.ts` already reads `import.meta.env.VITE_SUPABASE_*` with a clear error when missing.
- If `.env` keeps disappearing across sandbox resets, the next step would be to look at why the managed env isn't being restored, but one recreate-and-verify pass first is the right move.
