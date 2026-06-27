# Fix: Company Setup "column invitation.workspace_id does not exist"

## Root cause

The Company Setup screen uses the ported PFS onboarding adapter
(`src/lib/db/pfs/onboarding.ts`), which queries `invitation` and
`membership` filtered by `workspace_id`. Those two PFS-native tables exist
in the database but only carry the original `organization_id` column.

The earlier alignment migration added the dual `workspace_id` /
`organization_id` columns (plus the `sync_workspace_organization_id`
trigger) to 27 PFS tables — but `invitation` and `membership` were missed.
Every other PFS table the adapter touches (department, company_profile,
tool, data_source, vault, etc.) already has both columns, which is why
only the invitation step blows up with `column invitation.workspace_id
does not exist`.

Confirmed by `information_schema.columns`: `invitation` and `membership`
are the only PFS tables in the schema still lacking `workspace_id`.

## Fix

One migration that, for both `public.invitation` and `public.membership`:

1. Adds nullable `workspace_id uuid` referencing `public.workspaces(id)`.
2. Back-fills `workspace_id := organization_id` for existing rows.
3. Attaches the existing `sync_workspace_organization_id` BEFORE
   INSERT/UPDATE trigger so the two columns stay mirrored (same pattern
   used by department, company_profile, etc.).
4. Adds an index on `workspace_id` to match the other PFS tables.
5. Leaves RLS policies untouched — they already key off `organization_id`,
   and the sync trigger keeps the two values identical.

No application code changes are needed; the PFS adapter already queries
`workspace_id` everywhere.

## Verification

- Reload `/app/house-of-ichigo/admin/onboarding`; the invitations step
  should load instead of throwing.
- `select workspace_id, organization_id from public.invitation limit 1;`
  returns matching values.
- Inserting an invitation through the wizard populates both columns.
