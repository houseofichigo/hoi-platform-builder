# Port `hoi-platform` into this Lovable project

The GitHub repo is a fully-built, substantial TanStack Start app — not a spec to build from scratch. It already contains:

- **230 source files** across routes, components, and libs
- **42 routes** spanning auth, onboarding, a multi-tenant workspace (`/app/$workspaceSlug/...`) with four phases: **Assess → Discover → Build → Scale**, plus an Admin Library CMS
- **22 Supabase migrations** (auth profiles, workspaces, assess modules, build use-cases, scale governance, library items, invitations, notifications, super-admin role, RLS policies, etc.)
- Server functions, scoring engine, curriculum, worked-examples, notifications, invitations
- Integration scaffolding for Supabase (browser client, admin client, auth middleware, auth attacher)
- A `resend` dependency (transactional email) and integrity-check scripts

The Lovable project currently holds only the blank TanStack Start template. The goal is to **make this Lovable project run the repo's app** end-to-end.

## Plan

### 1. Sync the source tree
Copy every tracked file from the repo into this project, overwriting the blank template:
- `src/` (routes, components, lib, hooks, integrations, assets, styles, router/server bootstrap)
- `supabase/` (config + all 22 migrations)
- `scripts/` (integrity / schema checks)
- `docs/` (admin-bootstrap, source-tree-contract)
- Root configs: `package.json`, `bun.lock`, `bunfig.toml`, `components.json`, `eslint.config.js`, `tsconfig.json`, `vite.config.ts`, `wrangler.jsonc`
- Skip `.git/` so Lovable's own git state stays clean

### 2. Install dependencies
Run `bun install` so all repo deps (Supabase SDK, Radix, Recharts, Resend, Embla, etc.) are present.

### 3. Enable Lovable Cloud
Provision Supabase via Lovable Cloud so `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and the service role key are injected. The repo's `src/integrations/supabase/*` already expects these env names.

### 4. Apply migrations
Replay the 22 migrations (in timestamp order) against the new Cloud database. This creates all tables, RLS policies, functions, and seed data the app needs.

### 5. Optional secrets
- `RESEND_API_KEY` if you want transactional emails (invitations, notifications) to actually send. The app should still boot without it; I'll confirm and surface anything that breaks.

### 6. Smoke check
- Confirm the dev server boots and `/`, `/login`, `/signup`, `/app` render.
- Run `bun scripts/check-import-integrity.ts` (the repo's own guard) to ensure nothing got dropped in the sync.

### 7. Bootstrap super-admin (you, after build)
Per `docs/admin-bootstrap.md`, the Library CMS at `/admin/library` requires `profiles.role = 'super_admin'`. Once you've signed up, I'll run the promotion SQL for the email you give me.

## Things to know

- **Overwrite is total.** The current blank-template `src/routes/index.tsx`, `__root.tsx`, etc. will be replaced by the repo's versions. That's the intent.
- **No code changes on first pass.** I'm porting verbatim; I'll only patch files if a build/runtime error forces it (e.g. env-name mismatch with how Lovable Cloud exposes Supabase).
- **Email won't send without `RESEND_API_KEY`.** Everything else (auth, workspaces, assess/build/scale flows) should work on Cloud's bundled Supabase.

## Technical notes

- The repo uses the same stack as this template (TanStack Start v1, React 19, Tailwind v4, Supabase, bun), so no framework migration needed.
- `wrangler.jsonc` is present but Lovable's runtime supplies its own Worker config — I'll keep the file for parity but it won't be used to deploy.
- The repo pins `@lovable.dev/vite-tanstack-config`, which is what this template uses, so `vite.config.ts` should be compatible out of the box.
