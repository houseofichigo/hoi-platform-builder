## Goal

Turn the Template Library cards into clickable previews that match the uploaded screenshots, and let users import a template into a new process draft.

## Scope

Frontend only. The backend (`process_template` table, `useProcessTemplates`, and the existing `/build/process/new?templateSlug=…` import path) already exists and works.

## Changes

### 1. `src/components/build/pfs/process-template-library.tsx` (rewrite)

Match Screenshot 3 (browse view):

- Header card: eyebrow `PROCESS TEMPLATES`, clipboard icon + serif title "Template Library", subtitle, top-right `Build manually` button (calls a new optional `onBuildManually` prop).
- Search bar (filters by name, description, category, department hint, tags, recommended tools).
- Category filter chips derived from `templates[].category` plus `All` (active = terracotta pill, inactive = chalk outline).
- Grid of `TemplateCard`s (2-up on `md`, full-width row in screenshot). Each card shows:
  - Flow strip preview: first ~6 step labels rendered as small chalk-bordered chips; decision/approval steps highlighted in terracotta (derived from `templateJson.nodes` kinds).
  - Category pill, `Global template` / `Company` scope pill, `internal`/`external` pill.
  - `Start with this template` primary button (top-right of card body).
  - Title, department/family eyebrow, `description`.
  - Adapt-this-map helper line.
  - Three count tiles: `STEPS`, `BRANCHES`, `APPROVALS` (steps = task-like nodes, branches = decision nodes, approvals = approval nodes).
  - Numbered step list (first 5–8 step labels with short description from `templateJson.nodes[i].data?.description`).
  - Footer chips: recommended tools + `complexity` + `confidence X/5`. If present, `KPIs:` and `AI:` lines.
- Whole card is clickable (button/keyboard accessible) to open the detail modal; the inner `Start with this template` button stops propagation and triggers import directly.

### 2. New `TemplateDetailDialog` (same file)

Match Screenshots 1 & 2:

- Shadcn `Dialog` (`max-w-3xl`, scrollable body).
- Top chips row: category, `Global template`/company, `internal`, `complexity`, `confidence X/5`.
- Title (`name`) + category eyebrow + `description` paragraph.
- Flow strip: all step labels as compact chips with arrows between; decisions/approvals outlined in terracotta, end/trigger in navy.
- `PROCESS STEPS` section: `N steps · M connections` summary then a numbered list. Each row shows step number, kind badge (`TRIGGER`/`STEP`/`DECISION`/`APPROVAL`/`OUTPUT`/`END` styled like screenshot), label, description, and an `Input · Output` line built from `node.data.inputType` / `node.data.output` / tool name.
- `OBJECTIVE` paragraph (`objective` + adapt-helper line).
- Two-column meta grid: `DEPARTMENT`, `TAGS`, `RECOMMENDED TOOLS`, `KPIs`, `RISKS`, `AUTOMATION OPPORTUNITIES`, `AI AGENT OPPORTUNITIES`, `VARIATIONS`. Render each as chalk-outlined chips; hide sections that are empty.
- Footer: `Close` (outline) + `Start with this template` (terracotta) — triggers the same import handler.

### 3. `src/routes/app.$workspaceSlug.build.templates.tsx`

- Drop the separate `TemplateLibraryIntro` block (the new component owns its own header).
- Pass `onApply={(t) => navigate({ to: "/app/$workspaceSlug/build/process/new", params: { workspaceSlug }, search: { templateSlug: t.slug } })}` and `onBuildManually={() => navigate({ to: "/app/$workspaceSlug/build/process/new", params: { workspaceSlug } })}`.
- Action label stays `Start with this template`.

### 4. No DB / migration / server changes

The import flow already exists via `?templateSlug=` consumed by `/build/process/new` (`getProcessTemplateBySlug` + `templateToBuilderState`). Existing CSV data populates everything the new UI reads.

## Notes

- Step labels/descriptions are read from `template.templateJson.nodes[i].data?.label` / `…?.description` with a graceful fallback to `node.label`.
- Counts use the same `nodeKinds` mapping already used by `templateToBuilderState` so previews match what the builder will create.
- Out of scope: editing templates, saving company templates, drag-and-drop reordering — this PR is preview + import only.
