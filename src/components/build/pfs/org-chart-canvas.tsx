import { Building2, Mail, UserRound } from "lucide-react";
import { useOrgChart, type OrgDepartment, type OrgPendingInvite, type OrgPerson } from "@/lib/db/org-chart";

type DepartmentNode = OrgDepartment & {
  children: DepartmentNode[];
  people: OrgPerson[];
  invites: OrgPendingInvite[];
};

function buildTree(departments: OrgDepartment[], people: OrgPerson[], invites: OrgPendingInvite[]) {
  const byId = new Map<string, DepartmentNode>();
  for (const department of departments) {
    byId.set(department.id, { ...department, children: [], people: [], invites: [] });
  }

  const roots: DepartmentNode[] = [];
  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const unassignedPeople: OrgPerson[] = [];
  for (const person of people) {
    if (person.departmentId && byId.has(person.departmentId)) {
      byId.get(person.departmentId)!.people.push(person);
    } else {
      unassignedPeople.push(person);
    }
  }

  const unassignedInvites: OrgPendingInvite[] = [];
  for (const invite of invites) {
    if (invite.departmentId && byId.has(invite.departmentId)) {
      byId.get(invite.departmentId)!.invites.push(invite);
    } else {
      unassignedInvites.push(invite);
    }
  }

  return { roots, unassignedPeople, unassignedInvites };
}

export function OrgChartCanvas(_props: { reparentEnabled?: boolean; onSelect?: (sel: any) => void } = {}) {
  const { data, isLoading, error } = useOrgChart();

  if (isLoading) {
    return (
      <div className="rounded-[var(--r-md)] border border-[var(--chalk)] bg-white p-6 text-[13px] text-[var(--slate)]">
        Loading org chart...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[var(--r-md)] border border-red-200 bg-red-50 p-6 text-[13px] text-red-700">
        {(error as Error).message}
      </div>
    );
  }

  const departments = data?.departments ?? [];
  const people = data?.people ?? [];
  const pendingInvites = data?.pendingInvites ?? [];
  const { roots, unassignedPeople, unassignedInvites } = buildTree(departments, people, pendingInvites);

  return (
    <div className="overflow-x-auto rounded-[var(--r-md)] border border-[var(--chalk)] bg-[var(--paper)] p-4">
      <div className="min-w-[760px] space-y-4">
        <div className="rounded-[var(--r-md)] border border-[var(--chalk)] bg-white p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--slate)]">Company root</p>
              <p className="mt-1 text-[18px] font-semibold text-[var(--navy)]">{data?.workspace.name ?? "Workspace"}</p>
            </div>
            <div className="flex gap-2 text-[12px] text-[var(--slate)]">
              <span>{departments.length} departments</span>
              <span>{people.length} people</span>
              <span>{pendingInvites.length} invites</span>
            </div>
          </div>
        </div>

        {roots.length === 0 ? (
          <div className="rounded-[var(--r-md)] border border-dashed border-[var(--chalk)] bg-white p-8 text-center">
            <Building2 className="mx-auto h-6 w-6 text-[var(--terracotta)]" />
            <p className="mt-3 text-[14px] font-medium text-[var(--navy)]">No departments yet.</p>
            <p className="mt-1 text-[13px] text-[var(--slate)]">Add a department in Company Setup to start the org chart.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {roots.map((node) => (
              <DepartmentBranch key={node.id} node={node} depth={0} />
            ))}
          </div>
        )}

        {(unassignedPeople.length > 0 || unassignedInvites.length > 0) && (
          <div className="rounded-[var(--r-md)] border border-[var(--chalk)] bg-white p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--slate)]">Unassigned</p>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {unassignedPeople.map((person) => (
                <PersonPill key={person.id} person={person} />
              ))}
              {unassignedInvites.map((invite) => (
                <InvitePill key={invite.id} invite={invite} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DepartmentBranch({ node, depth }: { node: DepartmentNode; depth: number }) {
  return (
    <div className="relative" style={{ marginLeft: depth ? 28 : 0 }}>
      <div className="rounded-[var(--r-md)] border border-[var(--chalk)] bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[var(--terracotta)]" />
              <p className="text-[15px] font-semibold text-[var(--navy)]">{node.name}</p>
            </div>
            {node.description && <p className="mt-1 text-[12px] text-[var(--slate)]">{node.description}</p>}
          </div>
          <span className="rounded-full bg-[var(--mist)] px-2.5 py-1 text-[11px] text-[var(--slate)]">
            {node.headcount ?? 0} headcount
          </span>
        </div>

        {(node.people.length > 0 || node.invites.length > 0) && (
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {node.people.map((person) => (
              <PersonPill key={person.id} person={person} />
            ))}
            {node.invites.map((invite) => (
              <InvitePill key={invite.id} invite={invite} />
            ))}
          </div>
        )}
      </div>

      {node.children.length > 0 && (
        <div className="mt-3 grid gap-3">
          {node.children.map((child) => (
            <DepartmentBranch key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function PersonPill({ person }: { person: OrgPerson }) {
  return (
    <div className="flex items-center gap-2 rounded-[var(--r-sm)] bg-[var(--mist)] px-3 py-2">
      <UserRound className="h-3.5 w-3.5 text-[var(--terracotta)]" />
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-[var(--navy)]">{person.displayName}</p>
        <p className="truncate text-[11px] text-[var(--slate)]">{person.jobTitle}</p>
      </div>
    </div>
  );
}

function InvitePill({ invite }: { invite: OrgPendingInvite }) {
  return (
    <div className="flex items-center gap-2 rounded-[var(--r-sm)] border border-dashed border-[var(--chalk)] bg-white px-3 py-2">
      <Mail className="h-3.5 w-3.5 text-[var(--terracotta)]" />
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-[var(--navy)]">{invite.email}</p>
        <p className="truncate text-[11px] text-[var(--slate)]">Pending {invite.role}</p>
      </div>
    </div>
  );
}
