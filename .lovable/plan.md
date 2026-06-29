# Make org chart nodes clickable & editable

The canvas already emits `onNodeClick` and a typed `Selected` union, but the only caller (`company-onboarding.tsx`) renders `<OrgChartCanvas />` with no `onSelect`, so clicks do nothing. The adapters in `src/lib/db/org-chart.ts` already cover every mutation we need (`saveDepartment`, `archiveDepartment`, `assignMemberStructure`, `setDepartmentLead`, `updateInvitationAssignment`, `updateInvitationManager`, `inviteWorkspacePerson`). We just need to surface them through an editor and wire selection.

## Scope

1. **New `OrgNodeEditor` side sheet** (`src/components/build/pfs/org-node-editor.tsx`) using existing shadcn `Sheet`. It receives the active `Selected` value + the loaded `OrgChartPayload` and renders one of three forms:
   - **Department**: name, parent department (select, excludes self+descendants), lead (member select), declared headcount, description, "holds sensitive data" + "distinct audience" toggles, Save + Archive (Archive disabled with tooltip when adapter rejects due to active processes).
   - **Person / member**: department select, manager select (excludes self + own reports), "Set as department lead" action, role display (read-only — owner/admin escalation is blocked by DB trigger, so we don't expose it), Save.
   - **Invite (pending)**: department select, manager select, Cancel invite (delete row via existing adapter pattern — add `cancelInvitation` helper alongside `updateInvitationAssignment`).
   - **Company root**: read-only summary with a "Change owner" picker that calls `updateOrganizationOwner`.
   Each form uses the matching `useOrgChartMutation(...)`. On success: toast, invalidate `useOrgChart` (already done by `useOrgChartMutation`), close sheet.

2. **Wire selection in `OrgChartCanvas`**:
   - Lift `selected` state into the canvas component (or accept controlled `selected`/`onSelect` props — keep existing prop signature; default to internal state when `onSelect` is omitted).
   - Render `<OrgNodeEditor selected={...} onClose={...} data={data} />` inside the canvas frame so any consumer (incl. `company-onboarding`) gets editing without extra wiring.
   - Keep the existing drag-to-reparent behavior; clicks open the editor, drags still mutate.

3. **Affordance polish** in the existing node components:
   - Add `cursor-pointer` + a subtle hover ring on `DepartmentNode`, `PersonNode`, `InviteNode`, `CompanyNode`.
   - Add a small pencil icon in the node header that also triggers selection (for touch/keyboard users), with `aria-label="Edit <name>"`.
   - Make the node container a `<button>` (or add `role="button"` + `tabIndex={0}` + Enter/Space handler) so keyboard users can open the editor. Stop propagation on the existing inner buttons (focus, links) so they don't double-trigger.

4. **Small adapter additions** in `src/lib/db/org-chart.ts`:
   - `cancelInvitation(workspaceId, inviteId)` → delete from `workspace_invitations` where `status = 'pending'`.
   - Export a `useCancelInvitation` hook mirroring the existing pattern.
   No schema changes; RLS already restricts these tables to workspace admins/owners.

5. **`company-onboarding.tsx`**: leave `<OrgChartCanvas />` untouched — editor renders from inside the canvas. No prop changes required.

## Technical notes

- The DB trigger `enforce_workspace_role_escalation_limits` blocks role changes to/from owner|admin for non-HOI admins, so the person form intentionally omits the role select to avoid a misleading failure path.
- Department parent select must filter out `self` and descendants (compute with the same BFS already used in `onNodeDragStop`) to avoid the existing `department_parent_cycle_check` trigger error.
- Manager select for people must filter out self + reports (mirror `personReports` BFS already in `onNodeDragStop`).
- Archive button calls `archiveDepartment`; surface the adapter's "Reassign or archive this department's processes..." error via toast.
- Editor closes on successful save; on error, stays open and shows the toast so the user can correct input.
- No new packages; reuses `Sheet`, `Select`, `Input`, `Textarea`, `Switch`, `Button` from existing shadcn surface.

## Out of scope

- Editing a person's display name / job title (lives on `profiles`, not org-chart). Can be a follow-up if you want it.
- Bulk edits, undo, audit-log UI.
