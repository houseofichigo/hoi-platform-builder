
# Enrich `tool_catalog` and `tool_action_catalog` from Phase 1 deliverables

## What the uploaded files actually are

A deterministic Phase-1 cleanup of the two catalogs currently in our DB. They are not a content refresh — they are:

- Cleaner names/slugs (26 renames, 221 slug rederivations, 20 duplicate clusters merged → 2975 → **2955 tools**).
- Cleaner action rows (1681 column-shift-corrupted rows recovered, 40 exact duplicates removed → 17020 → **16980 actions**).
- A reshape into a richer 23-col tool schema and 13-col action schema (we currently only carry ~10 cols on `tool_catalog`).
- A category remap onto the 57-category brief taxonomy (985 mapped, **1970 left as `review`**).
- Audit/queue files (`name_normalization_log`, `proposed_merges`, `deleted_duplicate_actions`, `manual_review_queue`, `category_mapping`, `gap_analysis`, `PHASE1_REPORT`).

**Out of scope of Phase 1 (and so blank in the CSVs):** `region_relevance`, `countries_relevant`, `subcategory`, `common_sme_use_cases`, `business_criticality_default`, `departments`, `homepage_url`. These are the Phase 2 enrichment targets.

## Mismatch with our current DB

`tool_catalog` today has only: `id, name, slug, category, icon_key, trigger_capable, source, is_active, created_at, domain` — it lacks every field the cleaned CSV adds (description, subcategory, region, use-cases, defaults, departments, process_categories, criticality, logo_url, homepage_url, source_urls, confidence_score, notes). So we can't just `UPDATE` — we need a schema extension first, then a data load.

`tool_action_catalog` already has most of the cleaned columns and a few extras (`integration_source`, `evidence_url`, `confidence_level` etc.). It needs reconciliation, not new columns.

---

## Plan

### Phase A — Schema extension (migration)

Add to `public.tool_catalog`:

- `description text`
- `subcategory text`
- `region_relevance text[]`  (e.g. `{eu, mena, na, global}`)
- `countries_relevant text[]`
- `common_sme_use_cases text[]`
- `default_data_structure text`
- `default_data_sensitivity text`
- `default_accessibility text`
- `default_api_available boolean`
- `business_criticality_default text`
- `departments text[]`
- `process_categories text[]`
- `logo_url text`
- `homepage_url text`
- `source_urls text[]`
- `confidence_score smallint`
- `notes text`
- `needs_review boolean default false`
- `review_reason text`
- `updated_at timestamptz default now()`

Add to `public.tool_action_catalog`:
- `needs_review boolean default false`  (if not already covered by `needs_manual_review`)
- `review_reason text`

Add support tables:
- `tool_catalog_merge_log` — `cluster_id, canonical_slug, merged_slug, decision, reason, merged_at`
- `tool_catalog_rename_log` — `original_name, original_slug, new_name, new_slug, rule_applied, applied_at`
- `tool_action_deleted_log` — full row of each deleted exact duplicate (40 rows)
- `tool_review_queue` — entity (`tool`|`action`), name_or_action, reason, suggested_phase, status, resolved_by, resolved_at

Add CHECK constraints + indexes (`slug` unique, `category` btree, `region_relevance` GIN).

### Phase B — Load Phase 1 cleaned data (idempotent script)

1. Stage the 9 CSVs into temp tables via `\copy` from `/mnt/user-uploads/`.
2. Apply renames first: update `tool_catalog` rows by `id` from `name_normalization_log` (sets `name`, `slug`).
3. Apply merges: for each cluster in `proposed_merges.csv` with `decision = auto_merged`, repoint `tool_action_catalog.tool_id` to canonical, then soft-delete the merged tool (set `is_active = false`, record in `tool_catalog_merge_log`). Insert `needs_review` rows for `needs_review` clusters into `tool_review_queue` (no deletion).
4. Upsert enrichment columns from `tool_catalog_cleaned.csv` by `clean_slug` (description, category, defaults, logo_url, source_urls, confidence_score, notes, derived `likely_triggers`/`likely_actions`/`process_categories`). Rows with `category = review` get `needs_review = true`.
5. For `tool_action_catalog`:
   - Delete the 40 exact duplicates listed in `deleted_duplicate_actions.csv` (after archiving them to `tool_action_deleted_log`).
   - Update recovered rows (use `manual_review_queue` corrupted-recovered set) — match on stable identity (`tool_slug + business_action + business_object + operation_group`).
   - Mark the other ~2273 review-queue actions `needs_review = true` with `review_reason`.
6. Insert `manual_review_queue.csv` into `tool_review_queue` for ongoing triage.
7. Recompute `tool_catalog.trigger_capable` from action data; refresh aggregates (`likely_actions` etc.) via a view or generated columns where possible.

Every step is wrapped in a transaction and re-runnable (use `ON CONFLICT` / `WHERE` guards).

### Phase C — Phase 2 enrichment surface (admin UI)

Add an admin-only review console at `/admin/catalog`:

- **Tools tab** — filterable list of `needs_review` tools (1970 + 88 duplicates). Inline editors for: brief category (57-value enum), subcategory, region, countries, use-cases, departments, criticality, homepage, description. "Approve & clear review" writes to `tool_catalog` and removes the row from the queue.
- **Actions tab** — list of `needs_review` actions (~2313). Bulk approve / re-classify / delete with reason.
- **Merges tab** — render the 45 needs_review and 43 fuzzy-candidate clusters; reviewer picks canonical or rejects.
- **Coverage dashboard** — counts per brief category from `gap_analysis.md` updated live, so we can target the 45 empty categories (Email, Calendar, Project mgmt, HRIS, ERP, etc.) for Phase-2 sourcing.

Gated by `hoi_admin_users` / `super_admin` role; all writes go through `createServerFn` with `requireSupabaseAuth` and write an `audit_log` row.

### Phase D — Phase 2 data sourcing (separate workstream, surfaced through the same UI)

For each empty brief category, fetch a curated batch (from n8n / Zapier / Pipedream connector lists already used in Phase 1) into a staging table and let the admin promote rows into `tool_catalog`. Same flow used to add `region_relevance` and `countries_relevant` for EU + MENA tools.

This phase is **not part of this implementation** — it's the manual + scripted research the report calls "Phase 2". The plan above gives us the schema, the loader, and the console it needs.

---

## Technical notes

- All migrations follow our `public`-schema GRANT rules (`GRANT SELECT,INSERT,UPDATE,DELETE … TO authenticated; GRANT ALL TO service_role`) and RLS via `has_role(auth.uid(),'super_admin')`.
- Loader runs from a server function (`src/lib/admin/catalog-import.functions.ts`) callable from the admin console; it streams the CSVs with `\copy` into temp tables then runs the SQL above. Existing 2975 rows are matched by current `slug` first, falling back to `id` from `name_normalization_log`.
- `tool_action_catalog` keeps its current column shape; only flags/dedup happen.
- `process_template-export-…csv` files attached are unrelated to this work (process templates, already loaded earlier) — they are ignored here.
- No destructive deletes outside the 40 audited exact-duplicate actions and 20 audited auto-merge tools (both fully logged).

## Deliverables

1. One Supabase migration adding the columns/tables above.
2. `scripts/import_phase1_catalog.ts` (or SQL) that loads all 9 CSVs idempotently.
3. New admin route `/admin/catalog` with Tools / Actions / Merges / Coverage tabs.
4. Updated `docs/` note describing the review workflow and Phase 2 enrichment targets.

