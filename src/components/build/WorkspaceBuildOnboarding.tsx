import { useState } from "react";
import { Plus, Send, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { OrgChartCanvas } from "@/components/build/OrgChartCanvas";
import {
  useArchiveDepartment,
  useInviteWorkspacePerson,
  useOrgChart,
  useSaveDepartment,
  type WorkspaceRole,
} from "@/lib/db/org-chart";

export function WorkspaceBuildOnboarding() {
  const { data: chart, isLoading, error } = useOrgChart();
  const saveDepartment = useSaveDepartment();
  const archiveDepartment = useArchiveDepartment();
  const invitePerson = useInviteWorkspacePerson();
  const [departmentName, setDepartmentName] = useState("");
  const [parentId, setParentId] = useState("");
  const [leadMemberId, setLeadMemberId] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Exclude<WorkspaceRole, "owner">>("member");
  const [inviteDepartmentId, setInviteDepartmentId] = useState("");

  const addDepartment = async () => {
    if (!departmentName.trim()) return;
    await saveDepartment.mutateAsync({
      name: departmentName,
      parentId: parentId || null,
      leadMemberId: leadMemberId || null,
      headcount: 0,
    });
    setDepartmentName("");
    setParentId("");
    setLeadMemberId("");
    toast.success("Department saved.");
  };

  const sendInvite = async () => {
    if (!email.trim()) return;
    await invitePerson.mutateAsync({
      email,
      role,
      departmentId: inviteDepartmentId || null,
    });
    setEmail("");
    setInviteDepartmentId("");
    toast.success("Invitation staged.");
  };

  if (isLoading) return <p className="text-[13px] text-slate">Loading setup...</p>;
  if (error) return <p className="rounded-md border border-red-200 bg-red-50 p-4 text-[13px] text-red-700">{(error as Error).message}</p>;
  if (!chart) return null;

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-md border border-chalk bg-white p-5">
          <p className="eyebrow-muted">Departments</p>
          <h2 className="h-heading-md mt-2">Set up the org chart.</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <input className="rounded-md border border-chalk bg-white px-3 py-2 text-[14px]" value={departmentName} onChange={(event) => setDepartmentName(event.target.value)} placeholder="Department name" />
            <select className="rounded-md border border-chalk bg-white px-3 py-2 text-[14px]" value={parentId} onChange={(event) => setParentId(event.target.value)}>
              <option value="">No parent</option>
              {chart.departments.map((department) => (
                <option key={department.id} value={department.id}>{department.name}</option>
              ))}
            </select>
            <select className="rounded-md border border-chalk bg-white px-3 py-2 text-[14px] md:col-span-2" value={leadMemberId} onChange={(event) => setLeadMemberId(event.target.value)}>
              <option value="">No department lead</option>
              {chart.people.map((person) => (
                <option key={person.id} value={person.id}>{person.displayName}</option>
              ))}
            </select>
          </div>
          <button type="button" onClick={addDepartment} className="btn-ichigo mt-4">
            <Plus className="h-4 w-4" /> Add department
          </button>

          <div className="mt-6 space-y-2">
            {chart.departments.map((department) => (
              <div key={department.id} className="flex items-center justify-between rounded-md bg-paper px-3 py-2">
                <span className="text-[13px] text-navy">{department.name}</span>
                <button type="button" className="rounded-md p-1.5 text-slate hover:text-terracotta" onClick={() => archiveDepartment.mutateAsync(department.id)} aria-label="Archive department">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-chalk bg-white p-5">
          <p className="eyebrow-muted">People and invites</p>
          <h2 className="h-heading-md mt-2">Invite people into the structure.</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <input className="rounded-md border border-chalk bg-white px-3 py-2 text-[14px]" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" />
            <select className="rounded-md border border-chalk bg-white px-3 py-2 text-[14px]" value={role} onChange={(event) => setRole(event.target.value as Exclude<WorkspaceRole, "owner">)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
            <select className="rounded-md border border-chalk bg-white px-3 py-2 text-[14px] md:col-span-2" value={inviteDepartmentId} onChange={(event) => setInviteDepartmentId(event.target.value)}>
              <option value="">No department</option>
              {chart.departments.map((department) => (
                <option key={department.id} value={department.id}>{department.name}</option>
              ))}
            </select>
          </div>
          <button type="button" onClick={sendInvite} className="btn-ichigo mt-4">
            <Send className="h-4 w-4" /> Stage invite
          </button>

          <div className="mt-6 rounded-md bg-paper p-4">
            <div className="flex items-center gap-2 text-navy">
              <Users className="h-4 w-4 text-terracotta" />
              <p className="text-[14px] font-medium">{chart.people.length} active people · {chart.pendingInvites.length} pending invites</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <p className="eyebrow">Org chart source of truth</p>
        <div className="mt-4">
          <OrgChartCanvas data={chart} />
        </div>
      </section>
    </div>
  );
}
