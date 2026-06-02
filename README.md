# House of Ichigo Platform

This repository is the canonical production source for the House of Ichigo platform.

## Canonical Repository

- Production repo: `houseofichigo/hoi-platform-builder`
- Production branch: `main`
- Lovable must connect to: `https://github.com/houseofichigo/hoi-platform-builder`, branch `main`

Do not push production app work to:

- `houseofichigo/hoi-platform`
- `sabribenradhia/hoi-platform-builder`
- local review-artifact folders
- temporary zip exports

Those locations may exist only as backups or historical references.

## Protected Source Tree

Treat `docs/source-tree-contract.md` and `.lovable/plan.md` as authoritative. Do not delete, rebuild, or replace the protected Assess, Discover, Build, Scale, Admin, or validation files to make an error disappear.

Required Build files include:

- `src/lib/build/wizard-schema.ts`
- `src/lib/build/approvals.functions.ts`
- `src/lib/build/dashboardBuckets.ts`

Required latest security migration:

- `supabase/migrations/20260601213000_lock_workspace_admin_escalation.sql`

## Verification

Before merging production changes, run:

```sh
npm exec -- tsc --noEmit
npm run build
npm test
node --experimental-strip-types scripts/check-import-integrity.ts
node --experimental-strip-types scripts/check-build-output-keys.ts
```

If Bun is available, also run:

```sh
bun scripts/check-assess-output-keys.ts
```

After reconnecting Lovable, download a fresh Lovable ZIP and confirm it contains the required Build files and latest security migration above.
