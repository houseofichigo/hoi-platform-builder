## Why logos aren't showing

The picker calls `toolCatalogLogoUrl(row)` which reads `row.logo_mirror_key` from the `tool_catalog` table and builds a Supabase Storage URL from the `tool-logos` bucket. But the live `tool_catalog` schema only has 9 columns — `logo_mirror_key` does not exist, so the key is always undefined, the `<img>` 404s, and every tile falls back to the generic category icon.

No logos were ever uploaded to a `tool-logos` bucket either, so even adding the column wouldn't produce images on its own.

## Fix: source logos from Logo.dev (already available as a connector)

Logo.dev returns a real brand logo for any domain via `https://img.logo.dev/<domain>?token=...`. We already have the publishable key wired as `VITE_LOVABLE_CONNECTOR_LOGO_DEV_API_KEY`. We just need a reliable domain per tool.

### Steps

1. **Add a `domain` column to `tool_catalog`** (migration), nullable text. Keep `logo_mirror_key` path intact for future custom uploads.
2. **Backfill `domain`** for catalog rows using slug → known mapping (e.g. `notion` → `notion.so`, `hubspot` → `hubspot.com`, `chatgpt` → `openai.com`, `google-sheets` → `google.com`). For unmapped rows, default to `<slug>.com`. Logo.dev returns a transparent fallback when the domain is unknown, so worst case the tile shows a clean placeholder rather than nothing.
3. **Update `src/lib/db/pfs/tool-catalog.ts`**:
   - Extend `ToolCatalogRow` with `domain?: string | null`.
   - Replace `toolCatalogLogoUrl` so it prefers the Supabase storage mirror if `logo_mirror_key` is set, otherwise returns `https://img.logo.dev/{domain}?token={VITE_LOVABLE_CONNECTOR_LOGO_DEV_API_KEY}&size=80&format=png` when `domain` exists.
   - Include `domain` in the select.
4. **No component changes** — `ToolTile` already renders `<img src={logoUrl}>` and has graceful `onError` fallback to the category icon for any remaining misses.

### Acceptance

- In Company Setup → Tool stack, opening the picker shows real brand logos for the major tools (Notion, Slack, HubSpot, Salesforce, OpenAI, Google Workspace, etc.).
- Unknown/custom tools still show the orange category icon.
- No new secrets required; uses the existing Logo.dev connector key.

### Out of scope

- Uploading curated SVGs to a `tool-logos` Storage bucket. We can do that later for tools where Logo.dev returns a poor match — the `logo_mirror_key` path stays as the override.
