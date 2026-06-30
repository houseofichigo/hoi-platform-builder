# Build & Onboarding — Essential Data Model

Tables the app depends on to run the **onboarding** (company setup, org chart, invites) and **Build** (process mapping, templates, tools) flows. Grouped by concern.

## 1. Workspace & identity (foundation)
- `workspaces` — tenant root; every other row scopes by `workspace_id`.
- `workspace_members` — user ↔ workspace, role (`owner | admin | member | viewer`), `department_id`, `manager_member_id`.
- `workspace_invitations` — pending invites (`email`, `role`, `department_id`, `manager_member_id`, `token`).
- `profiles` — per-user display data (`full_name`, `avatar_url`, `job_role`) joined into the org chart.
- `hoi_admin_users` — gates platform-level admin (`/admin/*`).

## 2. Company setup / Onboarding
- `company_profile` — company-level metadata captured in the setup wizard.
- `department` — org structure (`parent_id`, `lead_member_id`, `headcount`, sensitive-data flag, audience flag).
- `audience` — distinct audiences referenced by departments.
- `member_profile` — extended per-member onboarding fields.
- `onboarding_events` — checklist / progress tracking.

## 3. Org chart (read model used by Build)
Assembled in `fetchOrgChart` from: `workspaces` + `department` + `workspace_members` + `workspace_invitations` + `profiles`. No dedicated table.

## 4. Process mapping (Build core)
- `process` — the mapped process (status, `department_id`, `owner_member_id`, risk tier, `archived_at`).
- `process_step` — ordered steps (`actor_member_id`, `department_id`, tool/action refs).
- `process_status_audit` — status transitions for the `decide_process` workflow.
- `process_export` — exportable artifacts (PDF/JSON) per process.

## 5. Template library
- `process_template` — published templates shown in the Template Library cards.
- `process_template_alias` — alternate names/lookup for templates.

## 6. Tools & actions catalog (used inside process steps)
- `tool_catalog` — master list of ~2,806 tools (vendor, category, logo, governance flags).
- `tool_action_catalog` — actions each tool exposes (used by step pickers).
- `tool` — workspace-scoped instance of a catalog tool (adoption record).
- `tool_action` — workspace-scoped instance of a catalog action.
- `tool_review_queue` — admin catalog console (enrichment queue).

## 7. Approvals / governance
- `use_case_approvals` — approvals tied to processes/use cases.
- `governance_flags` + `governance_threshold` — risk gates surfaced in Build.
- `audit_log` — admin diff trail (`get_audit_log_with_diffs`).
- `notifications` + `notification_preferences` — invite accepted, approval, roadmap events.

## 8. Supporting
- `roadmap_entries` — created on process approval (Build → Scale bridge).
- `vault` / `vault_reference` — secrets/connections attached to tools.
- `knowledge_source` / `data_source` — referenced by process steps that read data.

## Minimum viable set
Bare minimum for Build + Onboarding to function:

```
workspaces, workspace_members, workspace_invitations, profiles, hoi_admin_users,
company_profile, department,
process, process_step, process_status_audit,
process_template,
tool_catalog, tool_action_catalog, tool, tool_action,
use_case_approvals, audit_log, notifications
```

Everything else is enrichment (audience, vault, roadmap, governance thresholds, exports, review queue).