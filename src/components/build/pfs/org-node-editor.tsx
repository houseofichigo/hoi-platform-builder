import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ShieldAlert, Trash2, UserCog, Crown } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  archiveDepartment,
  assignMembership,
  cancelInvitation,
  updateDepartmentLead,
  updateDepartment,
  updateInvitationAssignment,
  updateInvitationManager,
  updateOrganizationOwner,
  useOrgChartMutation,
  type OrgChartPayload,
} from "@/lib/db/org-chart";

export type EditorSelection =
  | { kind: "department"; id: string }
  | { kind: "person"; id: string }
  | { kind: "invite"; id: string }
  | { kind: "company"; id: string }
  | null;

function descendantDeptIds(payload: OrgChartPayload, rootId: string): Set<string> {
  const out = new Set<string>([rootId]);
  let added = true;
  while (added) {
    added = false;
    for (const d of payload.departments) {
      if (d.parentId && out.has(d.parentId) && !out.has(d.id)) {
        out.add(d.id);
        added = true;
      }
    }
  }
  return out;
}

function reportingDescendants(payload: OrgChartPayload, rootId: string): Set<string> {
  const out = new Set<string>([rootId]);
  let added = true;
  while (added) {
    added = false;
    for (const p of payload.people) {
      if (p.managerId && out.has(p.managerId) && !out.has(p.id)) {
        out.add(p.id);
        added = true;
      }
    }
  }
  return out;
}

export function OrgNodeEditor({
  selection,
  payload,
  onClose,
}: {
  selection: EditorSelection;
  payload: OrgChartPayload | undefined;
  onClose: () => void;
}) {
  const open = selection !== null && !!payload;

  return (
    <Sheet open={open} onOpenChange={(value) => { if (!value) onClose(); }}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {open && payload && selection ? (
          selection.kind === "department" ? (
            <DepartmentForm key={selection.id} departmentId={selection.id} payload={payload} onClose={onClose} />
          ) : selection.kind === "person" ? (
            <PersonForm key={selection.id} personId={selection.id} payload={payload} onClose={onClose} />
          ) : selection.kind === "invite" ? (
            <InviteForm key={selection.id} inviteId={selection.id} payload={payload} onClose={onClose} />
          ) : (
            <CompanyForm key={selection.id} payload={payload} onClose={onClose} />
          )
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function DepartmentForm({ departmentId, payload, onClose }: { departmentId: string; payload: OrgChartPayload; onClose: () => void }) {
  const department = payload.departments.find((d) => d.id === departmentId);
  const updateMut = useOrgChartMutation(updateDepartment);
  const archiveMut = useOrgChartMutation<string>((wsId, id) => archiveDepartment(wsId, id));
  const leadMut = useOrgChartMutation(setDepartmentLead);

  const [name, setName] = useState(department?.name ?? "");
  const [parentId, setParentId] = useState<string>(department?.parentId ?? "");
  const [leadId, setLeadId] = useState<string>(department?.leadMembershipId ?? department?.leadMemberId ?? "");
  const [headcount, setHeadcount] = useState<string>(department?.headcount != null ? String(department.headcount) : "");
  const [description, setDescription] = useState<string>(department?.description ?? "");
  const [sensitive, setSensitive] = useState<boolean>(Boolean(department?.holdsSensitiveData));
  const [audience, setAudience] = useState<boolean>(Boolean(department?.distinctAudience));

  const forbiddenParents = useMemo(() => descendantDeptIds(payload, departmentId), [payload, departmentId]);
  const parentOptions = payload.departments.filter((d) => !d.archivedAt && !forbiddenParents.has(d.id));
  const leadOptions = payload.people.filter((p) => !p.archivedAt && (p.departmentId === departmentId || p.departmentId === null));

  if (!department) {
    return (
      <>
        <SheetHeader><SheetTitle>Department not found</SheetTitle></SheetHeader>
        <SheetFooter className="mt-4"><Button onClick={onClose}>Close</Button></SheetFooter>
      </>
    );
  }

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) { toast.error("Department name is required."); return; }
    try {
      await updateMut.mutateAsync({
        id: departmentId,
        name: trimmed,
        parentId: parentId || null,
        headcount: headcount === "" ? null : Math.max(0, Number(headcount) || 0),
        description: description.trim() || null,
        holdsSensitiveData: sensitive,
        distinctAudience: audience,
      });
      const previousLead = department.leadMembershipId ?? department.leadMemberId ?? "";
      if ((leadId || "") !== previousLead) {
        await leadMut.mutateAsync({ departmentId, leadMemberId: leadId || null });
      }
      toast.success("Department updated");
      onClose();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const archive = async () => {
    if (!confirm(`Archive "${department.name}"? This can be reversed by an admin.`)) return;
    try {
      await archiveMut.mutateAsync(departmentId);
      toast.success("Department archived");
      onClose();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle>Edit department</SheetTitle>
        <SheetDescription>Update the structure, lead and metadata for this department.</SheetDescription>
      </SheetHeader>
      <div className="mt-4 space-y-4">
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Department name" />
        </Field>
        <Field label="Parent department">
          <NativeSelect value={parentId} onChange={setParentId}>
            <option value="">Reports to company</option>
            {parentOptions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </NativeSelect>
        </Field>
        <Field label="Department lead">
          <NativeSelect value={leadId} onChange={setLeadId}>
            <option value="">No lead</option>
            {leadOptions.map((p) => <option key={p.id} value={p.id}>{p.displayName}{p.jobTitle ? ` — ${p.jobTitle}` : ""}</option>)}
          </NativeSelect>
        </Field>
        <Field label="Declared headcount">
          <Input type="number" min={0} value={headcount} onChange={(e) => setHeadcount(e.target.value)} placeholder="0" />
        </Field>
        <Field label="Description">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What this team does" />
        </Field>
        <ToggleRow icon={<ShieldAlert className="h-4 w-4 text-[var(--terracotta)]" />} label="Holds sensitive data" checked={sensitive} onCheckedChange={setSensitive} />
        <ToggleRow icon={<UserCog className="h-4 w-4 text-[var(--azure)]" />} label="Has a distinct audience" checked={audience} onCheckedChange={setAudience} />
      </div>
      <SheetFooter className="mt-6 flex-row justify-between gap-2 sm:justify-between">
        <Button variant="ghost" className="text-[var(--danger,#b91c1c)] hover:bg-[var(--danger,#b91c1c)]/10" onClick={archive} disabled={archiveMut.isPending}>
          <Trash2 className="mr-1 h-4 w-4" /> Archive
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={updateMut.isPending || leadMut.isPending} className="bg-[var(--terracotta)] text-white hover:bg-[var(--terracotta)]/90">Save</Button>
        </div>
      </SheetFooter>
    </>
  );
}

function PersonForm({ personId, payload, onClose }: { personId: string; payload: OrgChartPayload; onClose: () => void }) {
  const person = payload.people.find((p) => p.id === personId);
  const assignMut = useOrgChartMutation(assignMembership);
  const leadMut = useOrgChartMutation(setDepartmentLead);

  const [departmentId, setDepartmentId] = useState<string>(person?.departmentId ?? "");
  const [managerId, setManagerId] = useState<string>(person?.managerId ?? "");
  const [makeLead, setMakeLead] = useState<boolean>(false);

  const forbiddenManagers = useMemo(() => (person ? reportingDescendants(payload, person.id) : new Set<string>()), [payload, person]);
  const managerOptions = payload.people.filter((p) => !p.archivedAt && !forbiddenManagers.has(p.id));
  const isCurrentLead = useMemo(() => {
    if (!person) return false;
    const dept = payload.departments.find((d) => d.id === person.departmentId);
    if (!dept) return false;
    return (dept.leadMembershipId ?? dept.leadMemberId) === person.id;
  }, [payload, person]);

  useEffect(() => { setMakeLead(isCurrentLead); }, [isCurrentLead]);

  if (!person) {
    return (
      <>
        <SheetHeader><SheetTitle>Member not found</SheetTitle></SheetHeader>
        <SheetFooter className="mt-4"><Button onClick={onClose}>Close</Button></SheetFooter>
      </>
    );
  }

  const submit = async () => {
    try {
      await assignMut.mutateAsync({
        membershipId: person.id,
        departmentId: departmentId || null,
        managerId: managerId || null,
      });
      if (departmentId && makeLead && !isCurrentLead) {
        await leadMut.mutateAsync({ departmentId, leadMemberId: person.id });
      } else if (isCurrentLead && (!makeLead || departmentId !== person.departmentId)) {
        if (person.departmentId) await leadMut.mutateAsync({ departmentId: person.departmentId, leadMemberId: null });
      }
      toast.success("Member updated");
      onClose();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle>{person.displayName}</SheetTitle>
        <SheetDescription>{person.jobTitle || "Team member"} · Role: <span className="font-mono">{person.role}</span></SheetDescription>
      </SheetHeader>
      <div className="mt-4 space-y-4">
        <Field label="Department">
          <NativeSelect value={departmentId} onChange={setDepartmentId}>
            <option value="">No department</option>
            {payload.departments.filter((d) => !d.archivedAt).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </NativeSelect>
        </Field>
        <Field label="Manager">
          <NativeSelect value={managerId} onChange={setManagerId}>
            <option value="">No manager</option>
            {managerOptions.map((p) => <option key={p.id} value={p.id}>{p.displayName}{p.jobTitle ? ` — ${p.jobTitle}` : ""}</option>)}
          </NativeSelect>
        </Field>
        {departmentId ? (
          <ToggleRow icon={<Crown className="h-4 w-4 text-[var(--terracotta)]" />} label="Department lead" checked={makeLead} onCheckedChange={setMakeLead} />
        ) : null}
        <p className="rounded-md border border-[var(--chalk)] bg-[var(--paper)] px-3 py-2 text-xs text-[var(--slate)]">
          Workspace role (owner/admin/member/viewer) is managed by House of Ichigo and cannot be changed here.
        </p>
      </div>
      <SheetFooter className="mt-6">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} disabled={assignMut.isPending || leadMut.isPending} className="bg-[var(--terracotta)] text-white hover:bg-[var(--terracotta)]/90">Save</Button>
      </SheetFooter>
    </>
  );
}

function InviteForm({ inviteId, payload, onClose }: { inviteId: string; payload: OrgChartPayload; onClose: () => void }) {
  const invite = payload.pendingInvites.find((i) => i.id === inviteId);
  const deptMut = useOrgChartMutation(updateInvitationAssignment);
  const mgrMut = useOrgChartMutation(updateInvitationManager);
  const cancelMut = useOrgChartMutation<string>((wsId, id) => cancelInvitation(wsId, id));

  const [departmentId, setDepartmentId] = useState<string>(invite?.departmentId ?? "");
  const [managerId, setManagerId] = useState<string>(invite?.managerId ?? "");

  if (!invite) {
    return (
      <>
        <SheetHeader><SheetTitle>Invitation not found</SheetTitle></SheetHeader>
        <SheetFooter className="mt-4"><Button onClick={onClose}>Close</Button></SheetFooter>
      </>
    );
  }

  const submit = async () => {
    try {
      if ((departmentId || null) !== (invite.departmentId || null)) {
        await deptMut.mutateAsync({ inviteId, departmentId: departmentId || null });
      }
      if ((managerId || null) !== (invite.managerId || null)) {
        await mgrMut.mutateAsync({ inviteId, managerId: managerId || null });
      }
      toast.success("Invitation updated");
      onClose();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const cancel = async () => {
    if (!confirm(`Cancel invitation for ${invite.email}?`)) return;
    try {
      await cancelMut.mutateAsync(inviteId);
      toast.success("Invitation cancelled");
      onClose();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle>{invite.email}</SheetTitle>
        <SheetDescription>Pending invitation · {invite.role}</SheetDescription>
      </SheetHeader>
      <div className="mt-4 space-y-4">
        <Field label="Department">
          <NativeSelect value={departmentId} onChange={setDepartmentId}>
            <option value="">No department</option>
            {payload.departments.filter((d) => !d.archivedAt).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </NativeSelect>
        </Field>
        <Field label="Manager">
          <NativeSelect value={managerId} onChange={setManagerId}>
            <option value="">No manager</option>
            {payload.people.filter((p) => !p.archivedAt).map((p) => <option key={p.id} value={p.id}>{p.displayName}{p.jobTitle ? ` — ${p.jobTitle}` : ""}</option>)}
          </NativeSelect>
        </Field>
      </div>
      <SheetFooter className="mt-6 flex-row justify-between gap-2 sm:justify-between">
        <Button variant="ghost" className="text-[var(--danger,#b91c1c)] hover:bg-[var(--danger,#b91c1c)]/10" onClick={cancel} disabled={cancelMut.isPending}>
          <Trash2 className="mr-1 h-4 w-4" /> Cancel invite
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={submit} disabled={deptMut.isPending || mgrMut.isPending} className="bg-[var(--terracotta)] text-white hover:bg-[var(--terracotta)]/90">Save</Button>
        </div>
      </SheetFooter>
    </>
  );
}

function CompanyForm({ payload, onClose }: { payload: OrgChartPayload; onClose: () => void }) {
  const ownerMut = useOrgChartMutation(updateOrganizationOwner);
  const [ownerId, setOwnerId] = useState<string>(payload.company.ownerMembershipId ?? "");

  const submit = async () => {
    if (!ownerId) { toast.error("Pick a workspace owner."); return; }
    try {
      await ownerMut.mutateAsync({ membershipId: ownerId });
      toast.success("Workspace owner updated");
      onClose();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle>{payload.company.name}</SheetTitle>
        <SheetDescription>Company root · {payload.departments.length} departments, {payload.people.length} members</SheetDescription>
      </SheetHeader>
      <div className="mt-4 space-y-4">
        <Field label="Workspace owner">
          <NativeSelect value={ownerId} onChange={setOwnerId}>
            <option value="">Unassigned</option>
            {payload.people.filter((p) => !p.archivedAt).map((p) => <option key={p.id} value={p.id}>{p.displayName}{p.jobTitle ? ` — ${p.jobTitle}` : ""}</option>)}
          </NativeSelect>
        </Field>
      </div>
      <SheetFooter className="mt-6">
        <Button variant="outline" onClick={onClose}>Close</Button>
        <Button onClick={submit} disabled={ownerMut.isPending} className="bg-[var(--terracotta)] text-white hover:bg-[var(--terracotta)]/90">Save</Button>
      </SheetFooter>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--slate)]">{label}</Label>
      {children}
    </div>
  );
}

function NativeSelect({ value, onChange, children }: { value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex h-9 w-full rounded-md border border-[var(--chalk)] bg-white px-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--terracotta)]/40"
    >
      {children}
    </select>
  );
}

function ToggleRow({ icon, label, checked, onCheckedChange }: { icon: React.ReactNode; label: string; checked: boolean; onCheckedChange: (value: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-[var(--chalk)] bg-white px-3 py-2">
      <div className="flex items-center gap-2 text-sm text-[var(--graphite)]">{icon}{label}</div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}