import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  BadgeCheck,
  Building2,
  ClipboardCopy,
  Crosshair,
  Download,
  FileImage,
  FileText,
  Link2,
  Mail,
  Minimize2,
  Plus,
  Search,
  ShieldAlert,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  assignMembership,
  createDepartment,
  inviteWorkspacePerson,
  updateDepartment,
  updateInvitationAssignment,
  updateInvitationManager,
  updateOrganizationOwner,
  useOrgChart,
  useOrgChartMutation,
  type InviteInput,
  type OrgChartPayload,
  type OrgDepartment,
  type OrgPendingInvite,
  type OrgPerson,
} from "@/lib/db/org-chart";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Selected =
  | { kind: "department"; id: string }
  | { kind: "person"; id: string }
  | { kind: "invite"; id: string }
  | { kind: "company"; id: string }
  | null;

type CompanyData = { kind: "company"; companyId: string; name: string; ownerName: string | null; ownerTitle: string | null };
type DeptData = { kind: "department"; deptId: string; name: string; named: number; declared: number | null; sensitive: boolean; audience: boolean };
type PersonData = { kind: "person"; personId: string; name: string; title: string; role: string; isUser: boolean };
type InviteData = { kind: "invite"; inviteId: string; email: string; role: string };

type CompanyNodeT = Node<CompanyData, "companyNode">;
type DeptNodeT = Node<DeptData, "departmentNode">;
type PersonNodeT = Node<PersonData, "personNode">;
type InviteNodeT = Node<InviteData, "inviteNode">;
type OrgNode = CompanyNodeT | DeptNodeT | PersonNodeT | InviteNodeT;

type OrgFilterMode = "all" | "missing_manager" | "pending_invites" | "sensitive_departments" | "without_lead" | "headcount_gap";

const SIZE = {
  companyNode: { w: 280, h: 112 },
  departmentNode: { w: 236, h: 104 },
  personNode: { w: 236, h: 104 },
  inviteNode: { w: 212, h: 84 },
} as const;

const roleLabel: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
  department_lead: "Dept lead",
  employee: "Employee",
  reviewer: "Reviewer",
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";

function useIsBelowLg() {
  const [value, setValue] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(max-width: 1023.98px)");
    const apply = () => setValue(mql.matches);
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, []);
  return value;
}

<<<<<<< HEAD
type FocusCtx = { focusId: string | null; requestFocus: (id: string) => void; clearFocus: () => void };
const FocusContext = createContext<FocusCtx>({ focusId: null, requestFocus: () => {}, clearFocus: () => {} });
const handleStyle = { width: 9, height: 9, background: "var(--chalk)", border: "1.5px solid white" };
=======
export function OrgChartCanvas(_props: { reparentEnabled?: boolean; onSelect?: (sel: any) => void } = {}) {
  const { data, isLoading, error } = useOrgChart();
>>>>>>> b154ea6cc0920ef5046cf708ed0c86d49bc42811

function FocusButton({ targetId }: { targetId: string }) {
  const { focusId, requestFocus, clearFocus } = useContext(FocusContext);
  const active = focusId === targetId;
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        active ? clearFocus() : requestFocus(targetId);
      }}
      title={active ? "Clear focus" : "Focus on this node"}
      className={`rounded p-0.5 transition ${
        active ? "bg-[var(--terracotta)] text-white" : "text-[var(--slate)] hover:bg-[var(--mist)] hover:text-[var(--navy)]"
      }`}
    >
      <Crosshair className="h-3 w-3" />
    </button>
  );
}

function CompanyNode({ data, selected }: NodeProps<CompanyNodeT>) {
  return (
    <div className={`w-[280px] rounded-[var(--r-md)] border-2 bg-white p-3 shadow-md transition ${selected ? "border-[var(--terracotta)] ring-2 ring-[var(--terracotta)]/30" : "border-[var(--navy)]"}`}>
      <div className="flex items-center gap-2 text-[var(--navy)]">
        <Building2 className="h-4 w-4" />
        <span className="truncate text-sm font-semibold">{data.name || "Company"}</span>
        <span className="ml-auto rounded bg-[var(--mist)] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--navy)]">Company</span>
        <FocusButton targetId={`company:${data.companyId}`} />
      </div>
      <div className="mt-2 rounded-[var(--r-sm)] border border-dashed border-[var(--chalk)] bg-[var(--paper)] px-2 py-1.5">
        <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--slate)]">Workspace owner</div>
        <div className="truncate text-[13px] font-semibold text-[var(--graphite)]">{data.ownerName ?? "Unassigned"}</div>
        {data.ownerTitle ? <div className="truncate text-[11px] text-[var(--slate)]">{data.ownerTitle}</div> : null}
      </div>
      <Handle type="source" position={Position.Bottom} style={handleStyle} />
    </div>
  );
}

function DepartmentNode({ data, selected }: NodeProps<DeptNodeT>) {
  const reconcile = data.declared && data.declared > 0 ? `${data.named}/${data.declared} named` : `${data.named} named`;
  const over = data.declared != null && data.declared > 0 && data.named > data.declared;
  return (
    <div className={`w-[236px] rounded-[var(--r-md)] border bg-[var(--navy)] p-3 text-white shadow-sm transition ${selected ? "ring-2 ring-[var(--terracotta)]/60" : ""}`}>
      <Handle type="target" position={Position.Top} style={handleStyle} />
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 opacity-80" />
        <span className="truncate text-sm font-semibold">{data.name || "Untitled"}</span>
        <span className="ml-auto"><FocusButton targetId={`dept:${data.deptId}`} /></span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="rounded px-1.5 py-0.5 font-mono text-[10px]" style={{ background: over ? "color-mix(in srgb, var(--terracotta) 30%, transparent)" : "rgba(255,255,255,0.14)" }}>{reconcile}</span>
        {data.sensitive && <span className="flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px]" style={{ background: "color-mix(in srgb, var(--terracotta) 30%, transparent)" }}><ShieldAlert className="h-2.5 w-2.5" /> Sensitive</span>}
        {data.audience && <span className="rounded px-1.5 py-0.5 font-mono text-[10px]" style={{ background: "rgba(255,255,255,0.14)" }}>Audience</span>}
      </div>
      <Handle type="source" position={Position.Bottom} style={handleStyle} />
    </div>
  );
}

function PersonNode({ data, selected }: NodeProps<PersonNodeT>) {
  return (
    <div className={`w-[236px] rounded-[var(--r-md)] border border-l-[3px] bg-white p-3 shadow-sm transition ${selected ? "border-[var(--terracotta)] ring-2 ring-[var(--terracotta)]/25" : "border-[var(--chalk)]"}`} style={{ borderLeftColor: "var(--terracotta)" }}>
      <Handle type="target" position={Position.Top} style={handleStyle} />
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--r-sm)] border border-[var(--chalk)] bg-[var(--paper)] font-mono text-[11px] font-semibold text-[var(--terracotta)]">{initials(data.name)}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-sm font-semibold text-[var(--graphite)]">
            <span className="truncate">{data.name || "Unnamed"}</span>
            {data.isUser && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[var(--azure)]" />}
            <span className="ml-auto"><FocusButton targetId={`person:${data.personId}`} /></span>
          </div>
          <div className="truncate text-xs text-[var(--slate)]">{data.title || "-"}</div>
        </div>
      </div>
      <span className="mt-2 inline-block rounded px-1.5 py-0.5 font-mono text-[10px]" style={{ background: "color-mix(in srgb, var(--azure) 10%, transparent)", color: "var(--azure)" }}>{roleLabel[data.role] ?? data.role}</span>
      <Handle type="source" position={Position.Bottom} style={handleStyle} />
    </div>
  );
}

function InviteNode({ data, selected }: NodeProps<InviteNodeT>) {
  return (
    <div className={`w-[212px] rounded-[var(--r-md)] border border-dashed bg-[var(--paper)] p-3 shadow-sm transition ${selected ? "border-[var(--terracotta)] ring-2 ring-[var(--terracotta)]/25" : "border-[var(--chalk)]"}`}>
      <Handle type="target" position={Position.Top} style={handleStyle} />
      <div className="flex items-center gap-2 text-[var(--slate)]">
        <Mail className="h-3.5 w-3.5" />
        <span className="truncate font-mono text-[11px]">{data.email}</span>
      </div>
      <span className="mt-2 inline-block rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-[var(--slate)]">Invited · {roleLabel[data.role] ?? data.role}</span>
    </div>
  );
}

const nodeTypes = { companyNode: CompanyNode, departmentNode: DepartmentNode, personNode: PersonNode, inviteNode: InviteNode };

function edge(source: string, target: string): Edge {
  return { id: `${source}->${target}`, source, target, type: "smoothstep", style: { stroke: "var(--chalk)", strokeWidth: 1.5 } };
}

function buildGraph(payload: OrgChartPayload, collapsed: Set<string>): { nodes: OrgNode[]; edges: Edge[] } {
  const { departments, people, pendingInvites, company } = payload;
  const depts = departments.filter((department) => !department.archivedAt);
  const persons = people.filter((person) => !person.archivedAt);
  const namedByDept = new Map<string, number>();
  persons.forEach((person) => {
    if (person.departmentId) namedByDept.set(person.departmentId, (namedByDept.get(person.departmentId) ?? 0) + 1);
  });

  const nodes: OrgNode[] = [];
  const edges: Edge[] = [];
  const childDeptsOf = new Map<string, string[]>();
  depts.forEach((department) => {
    if (!department.parentId) return;
    childDeptsOf.set(department.parentId, [...(childDeptsOf.get(department.parentId) ?? []), department.id]);
  });

  const hiddenDeptIds = new Set<string>();
  const queue = Array.from(collapsed).flatMap((id) => childDeptsOf.get(id) ?? []);
  while (queue.length) {
    const id = queue.shift()!;
    if (hiddenDeptIds.has(id)) continue;
    hiddenDeptIds.add(id);
    (childDeptsOf.get(id) ?? []).forEach((child) => queue.push(child));
  }
  const isHiddenDept = (id: string) => hiddenDeptIds.has(id);
  const isHiddenPerson = (person: OrgPerson) => Boolean(person.departmentId) && (collapsed.has(person.departmentId!) || isHiddenDept(person.departmentId!));
  const isHiddenInvite = (invite: OrgPendingInvite) => Boolean(invite.departmentId) && (collapsed.has(invite.departmentId!) || isHiddenDept(invite.departmentId!));

  const companyNodeId = `company:${company.id}`;
  const owner = company.ownerMembershipId ? persons.find((person) => person.id === company.ownerMembershipId) : null;
  nodes.push({
    id: companyNodeId,
    type: "companyNode",
    position: { x: 0, y: 0 },
    data: { kind: "company", companyId: company.id, name: company.name, ownerName: owner?.displayName ?? null, ownerTitle: owner?.jobTitle ?? null },
  });

  depts.forEach((department) => {
    nodes.push({
      id: `dept:${department.id}`,
      type: "departmentNode",
      position: { x: 0, y: 0 },
      hidden: isHiddenDept(department.id),
      data: {
        kind: "department",
        deptId: department.id,
        name: department.name,
        named: namedByDept.get(department.id) ?? 0,
        declared: department.headcount,
        sensitive: department.holdsSensitiveData,
        audience: department.distinctAudience,
      },
    });
    edges.push(edge(department.parentId ? `dept:${department.parentId}` : companyNodeId, `dept:${department.id}`));
  });

  const personNodeId = new Map(persons.map((person) => [person.id, `person:${person.id}`]));
  persons.forEach((person) => {
    nodes.push({
      id: `person:${person.id}`,
      type: "personNode",
      position: { x: 0, y: 0 },
      hidden: isHiddenPerson(person),
      data: { kind: "person", personId: person.id, name: person.displayName, title: person.jobTitle, role: person.role, isUser: Boolean(person.userId) },
    });
    if (person.managerId && personNodeId.has(person.managerId)) edges.push(edge(`person:${person.managerId}`, `person:${person.id}`));
    else if (person.departmentId) edges.push(edge(`dept:${person.departmentId}`, `person:${person.id}`));
    else if (person.id === company.ownerMembershipId) edges.push(edge(companyNodeId, `person:${person.id}`));
  });

  pendingInvites.forEach((invite) => {
    nodes.push({
      id: `invite:${invite.id}`,
      type: "inviteNode",
      position: { x: 0, y: 0 },
      hidden: isHiddenInvite(invite),
      data: { kind: "invite", inviteId: invite.id, email: invite.email, role: invite.role },
    });
    if (invite.departmentId) edges.push(edge(`dept:${invite.departmentId}`, `invite:${invite.id}`));
  });

  return { nodes, edges };
}

const H_GAP = 28;
const ROW_H = 168;

function layout(nodes: OrgNode[], edges: Edge[]): OrgNode[] {
  if (!nodes.length) return nodes;
  const typeById = new Map<string, keyof typeof SIZE>(nodes.map((node) => [node.id, node.type as keyof typeof SIZE]));
  const widthOf = (id: string) => SIZE[typeById.get(id) ?? "departmentNode"].w;
  const visible = new Set(nodes.filter((node) => !node.hidden).map((node) => node.id));
  const children = new Map<string, string[]>();
  const hasParent = new Set<string>();
  edges.forEach((link) => {
    if (!visible.has(link.source) || !visible.has(link.target)) return;
    children.set(link.source, [...(children.get(link.source) ?? []), link.target]);
    hasParent.add(link.target);
  });

  const roots = nodes.filter((node) => visible.has(node.id) && !hasParent.has(node.id)).map((node) => node.id);
  const pos = new Map<string, { x: number; y: number }>();
  let cursorX = 0;
  const place = (id: string, depth: number): number => {
    const width = widthOf(id);
    const kids = children.get(id) ?? [];
    if (kids.length === 0) {
      const x = cursorX;
      pos.set(id, { x, y: depth * ROW_H });
      cursorX += width + H_GAP;
      return x + width / 2;
    }
    const centers = kids.map((kid) => place(kid, depth + 1));
    const center = (centers[0] + centers[centers.length - 1]) / 2;
    pos.set(id, { x: center - width / 2, y: depth * ROW_H });
    return center;
  };
  roots.forEach((root) => {
    place(root, 0);
    cursorX += 48;
  });
  return nodes.map((node) => ({ ...node, position: pos.get(node.id) ?? { x: 0, y: 0 } }));
}

function addDeptAncestors(visible: Set<string>, deptById: Map<string, OrgDepartment>, deptId: string) {
  let current: string | null | undefined = deptId;
  while (current) {
    visible.add(`dept:${current}`);
    current = deptById.get(current)?.parentId ?? null;
  }
}

function computeFocusVisible(payload: OrgChartPayload, focusId: string): Set<string> {
  const visible = new Set<string>([`company:${payload.company.id}`]);
  const deptById = new Map(payload.departments.map((department) => [department.id, department]));
  const [kind, rawId] = focusId.split(":");
  if (kind === "company") {
    payload.departments.filter((department) => !department.parentId).forEach((department) => visible.add(`dept:${department.id}`));
    payload.people.filter((person) => person.id === payload.company.ownerMembershipId).forEach((person) => visible.add(`person:${person.id}`));
  } else if (kind === "dept") {
    addDeptAncestors(visible, deptById, rawId);
    payload.departments.filter((department) => department.parentId === rawId).forEach((department) => visible.add(`dept:${department.id}`));
    payload.people.filter((person) => person.departmentId === rawId).forEach((person) => visible.add(`person:${person.id}`));
    payload.pendingInvites.filter((invite) => invite.departmentId === rawId).forEach((invite) => visible.add(`invite:${invite.id}`));
  } else if (kind === "person") {
    const person = payload.people.find((row) => row.id === rawId);
    if (person) {
      visible.add(`person:${person.id}`);
      if (person.departmentId) addDeptAncestors(visible, deptById, person.departmentId);
      payload.people.filter((row) => row.managerId === person.id).forEach((row) => visible.add(`person:${row.id}`));
    }
  }
  return visible;
}

function computeFilterVisible(payload: OrgChartPayload, mode: OrgFilterMode): Set<string> | null {
  if (mode === "all") return null;
  const visible = new Set<string>([`company:${payload.company.id}`]);
  const departments = payload.departments.filter((department) => !department.archivedAt);
  const people = payload.people.filter((person) => !person.archivedAt);
  const deptById = new Map(departments.map((department) => [department.id, department]));
  if (mode === "missing_manager") {
    people.filter((person) => !person.managerId && person.id !== payload.company.ownerMembershipId).forEach((person) => {
      visible.add(`person:${person.id}`);
      if (person.departmentId) addDeptAncestors(visible, deptById, person.departmentId);
    });
  } else if (mode === "pending_invites") {
    payload.pendingInvites.forEach((invite) => {
      visible.add(`invite:${invite.id}`);
      if (invite.departmentId) addDeptAncestors(visible, deptById, invite.departmentId);
    });
  } else if (mode === "sensitive_departments") {
    departments.filter((department) => department.holdsSensitiveData).forEach((department) => addDeptAncestors(visible, deptById, department.id));
  } else if (mode === "without_lead") {
    departments.filter((department) => !department.leadMembershipId).forEach((department) => addDeptAncestors(visible, deptById, department.id));
  } else if (mode === "headcount_gap") {
    const namedByDept = new Map<string, number>();
    people.forEach((person) => {
      if (person.departmentId) namedByDept.set(person.departmentId, (namedByDept.get(person.departmentId) ?? 0) + 1);
    });
    departments
      .filter((department) => (department.headcount ?? 0) > 0 && (namedByDept.get(department.id) ?? 0) < (department.headcount ?? 0))
      .forEach((department) => addDeptAncestors(visible, deptById, department.id));
  }
  return visible;
}

function Canvas({
  onSelect,
  reparentEnabled,
  collapsed,
  focusId,
  setFocusId,
  filterMode,
  centerOnId,
  onCentered,
}: {
  onSelect?: (selection: Selected) => void;
  reparentEnabled: boolean;
  collapsed: Set<string>;
  focusId: string | null;
  setFocusId: (id: string | null) => void;
  filterMode: OrgFilterMode;
  centerOnId: string | null;
  onCentered: () => void;
}) {
  const { data, isLoading, isError, refetch } = useOrgChart();
  const updateDepartmentMutation = useOrgChartMutation(updateDepartment);
  const assignMembershipMutation = useOrgChartMutation(assignMembership);
  const updateInviteDepartmentMutation = useOrgChartMutation(updateInvitationAssignment);
  const updateInviteManagerMutation = useOrgChartMutation(updateInvitationManager);
  const updateOwnerMutation = useOrgChartMutation(updateOrganizationOwner);
  const [nodes, setNodes, onNodesChange] = useNodesState<OrgNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { fitView, getIntersectingNodes } = useReactFlow();
  const lastSignature = useRef("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!data) return;
    const graph = buildGraph(data, collapsed);
    const focusVisible = focusId ? computeFocusVisible(data, focusId) : null;
    const filterVisible = computeFilterVisible(data, filterMode);
    const merged = graph.nodes.map((node) => ({
      ...node,
      hidden: node.hidden || Boolean(focusVisible && !focusVisible.has(node.id)) || Boolean(filterVisible && !filterVisible.has(node.id)),
    }));
    const signature = JSON.stringify(merged.map((node) => [node.id, node.hidden ?? false])) + JSON.stringify(graph.edges.map((link) => link.id));
    if (signature === lastSignature.current) return;
    lastSignature.current = signature;
    setNodes(layout(merged, graph.edges));
    setEdges(graph.edges);
    requestAnimationFrame(() => fitView({ padding: 0.2, duration: 300 }));
  }, [data, collapsed, focusId, filterMode, setNodes, setEdges, fitView]);

  useEffect(() => {
    if (!centerOnId) return;
    requestAnimationFrame(() => {
      fitView({ nodes: [{ id: centerOnId }], duration: 400, padding: 0.5, maxZoom: 1.2 });
      onCentered();
    });
  }, [centerOnId, fitView, onCentered]);

  const done = useCallback(async () => {
    lastSignature.current = "";
    await refetch();
    requestAnimationFrame(() => fitView({ padding: 0.2, duration: 300 }));
  }, [fitView, refetch]);

  const onNodeClick = useCallback((_: unknown, node: OrgNode) => {
    if (!onSelect) return;
    if (node.type === "companyNode") onSelect({ kind: "company", id: node.data.companyId });
    else if (node.type === "departmentNode") onSelect({ kind: "department", id: node.data.deptId });
    else if (node.type === "personNode") onSelect({ kind: "person", id: node.data.personId });
    else onSelect({ kind: "invite", id: node.data.inviteId });
  }, [onSelect]);

  const onNodeDragStop = useCallback(async (_: unknown, node: OrgNode) => {
    if (!data || node.type === "companyNode" || !reparentEnabled) return done();
    const target = getIntersectingNodes(node).find((candidate) => ["departmentNode", "companyNode", "personNode"].includes(String(candidate.type)) && candidate.id !== node.id);
    if (!target) return done();

    const deptDescendants = (rootId: string): Set<string> => {
      const out = new Set<string>([rootId]);
      let added = true;
      while (added) {
        added = false;
        for (const department of data.departments) {
          if (department.parentId && out.has(department.parentId) && !out.has(department.id)) {
            out.add(department.id);
            added = true;
          }
        }
      }
      return out;
    };
    const personReports = (rootId: string): Set<string> => {
      const out = new Set<string>([rootId]);
      let added = true;
      while (added) {
        added = false;
        for (const person of data.people) {
          if (person.managerId && out.has(person.managerId) && !out.has(person.id)) {
            out.add(person.id);
            added = true;
          }
        }
      }
      return out;
    };

    try {
      if (node.type === "departmentNode") {
        if (target.type === "companyNode") await updateDepartmentMutation.mutateAsync({ id: node.data.deptId, name: node.data.name, parentId: null });
        else if (target.type === "departmentNode") {
          const targetDeptId = (target.data as DeptData).deptId;
          if (!deptDescendants(node.data.deptId).has(targetDeptId)) {
            await updateDepartmentMutation.mutateAsync({ id: node.data.deptId, name: node.data.name, parentId: targetDeptId });
          }
        }
      } else if (node.type === "personNode") {
        if (target.type === "companyNode") await updateOwnerMutation.mutateAsync({ membershipId: node.data.personId });
        else if (target.type === "departmentNode") await assignMembershipMutation.mutateAsync({ membershipId: node.data.personId, departmentId: (target.data as DeptData).deptId, managerId: null });
        else if (target.type === "personNode") {
          const targetPersonId = (target.data as PersonData).personId;
          if (!personReports(node.data.personId).has(targetPersonId)) {
            await assignMembershipMutation.mutateAsync({ membershipId: node.data.personId, managerId: targetPersonId });
          }
        }
      } else if (node.type === "inviteNode") {
        if (target.type === "departmentNode") await updateInviteDepartmentMutation.mutateAsync({ inviteId: node.data.inviteId, departmentId: (target.data as DeptData).deptId });
        else if (target.type === "personNode") await updateInviteManagerMutation.mutateAsync({ inviteId: node.data.inviteId, managerId: (target.data as PersonData).personId });
      }
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      await done();
    }
  }, [assignMembershipMutation, data, done, getIntersectingNodes, reparentEnabled, updateDepartmentMutation, updateInviteDepartmentMutation, updateInviteManagerMutation, updateOwnerMutation]);

  if (!mounted || isLoading) return <CanvasFrame><p className="text-sm text-[var(--slate)]">Loading org chart...</p></CanvasFrame>;
  if (isError) return <CanvasFrame><p className="text-sm text-[var(--danger)]">Couldn't load the org chart.</p><button className="mt-2 text-sm underline" onClick={() => refetch()}>Retry</button></CanvasFrame>;

  return (
    <FocusContext.Provider value={{ focusId, requestFocus: (id) => setFocusId(id), clearFocus: () => setFocusId(null) }}>
      <div className="relative h-[640px] w-full overflow-hidden rounded-[var(--r-md)] border border-[var(--chalk)] bg-[var(--paper)]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onNodeDragStop={onNodeDragStop}
          nodesDraggable={reparentEnabled}
          nodesConnectable={false}
          elementsSelectable
          fitView
          proOptions={{ hideAttribution: true }}
          minZoom={0.2}
        >
          <Background color="var(--chalk)" gap={22} size={1.2} />
          <MiniMap pannable zoomable nodeColor={(node) => node.type === "departmentNode" || node.type === "companyNode" ? "var(--navy)" : "var(--terracotta)"} className="!border !border-[var(--chalk)] !bg-white" />
          <Controls className="!bottom-4 !left-4 !border !border-[var(--chalk)] !bg-white !shadow-sm" />
        </ReactFlow>
      </div>
    </FocusContext.Provider>
  );
}

function CanvasFrame({ children }: { children: React.ReactNode }) {
  return <div className="flex h-[640px] w-full flex-col items-center justify-center rounded-[var(--r-md)] border border-[var(--chalk)] bg-[var(--paper)]">{children}</div>;
}

function Counter({ icon: Icon, value, label }: { icon: typeof Building2; value: number; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--chalk)] bg-[var(--paper)] px-3 py-1.5">
      <Icon className="h-4 w-4 text-[var(--terracotta)]" />
      <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--slate)]">{label}</span>
      <span className="text-[13px] font-semibold text-[var(--navy)]">{value}</span>
    </div>
  );
}

function AddEmployeePanel({ onDone }: { onDone: () => void }) {
  const { workspace } = useWorkspace();
  const { user } = useAuth();
  const { data } = useOrgChart();
  const [email, setEmail] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [role, setRole] = useState<InviteInput["role"]>("member");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!workspace || !user) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Enter a valid email.");
      return;
    }
    setSaving(true);
    try {
      await inviteWorkspacePerson(workspace.id, user.id, { email, role, departmentId: departmentId || null });
      setEmail("");
      setDepartmentId("");
      toast.success("Invitation staged");
      onDone();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-[var(--r-md)] border border-[var(--chalk)] bg-white p-3">
      <div className="grid gap-2 md:grid-cols-[1fr_180px_140px_auto]">
        <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="person@company.com" type="email" className="h-9" />
        <select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} className="h-9 rounded-md border border-[var(--chalk)] bg-white px-2 text-sm">
          <option value="">No department</option>
          {(data?.departments ?? []).filter((department) => !department.archivedAt).map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
        </select>
        <select value={role} onChange={(event) => setRole(event.target.value as InviteInput["role"])} className="h-9 rounded-md border border-[var(--chalk)] bg-white px-2 text-sm">
          <option value="member">Member</option>
          <option value="admin">Admin</option>
          <option value="viewer">Viewer</option>
        </select>
        <Button size="sm" onClick={submit} disabled={saving} className="h-9 rounded-[var(--r-md)] bg-[var(--terracotta)] text-white hover:bg-[var(--terracotta)]/90">
          Add invite
        </Button>
      </div>
    </div>
  );
}

export function OrgChartCanvas({ onSelect, reparentEnabled = true }: { onSelect?: (selection: Selected) => void; reparentEnabled?: boolean }) {
  const { data, refetch } = useOrgChart();
  const createDepartmentMutation = useOrgChartMutation(createDepartment);
  const isMobile = useIsBelowLg();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [addingPerson, setAddingPerson] = useState(false);
  const [newName, setNewName] = useState("");
  const [focusId, setFocusId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<OrgFilterMode>("all");
  const [searchQ, setSearchQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [centerOnId, setCenterOnId] = useState<string | null>(null);

  const counters = useMemo(() => {
    const departments = data?.departments.filter((department) => !department.archivedAt) ?? [];
    const people = data?.people.filter((person) => !person.archivedAt) ?? [];
    return { departments: departments.length, named: people.length, linked: people.filter((person) => Boolean(person.userId)).length };
  }, [data]);

  const allCollapsed = useMemo(() => {
    const deptIds = data?.departments.filter((department) => !department.archivedAt).map((department) => department.id) ?? [];
    return deptIds.length > 0 && deptIds.every((id) => collapsed.has(id));
  }, [collapsed, data]);

  const searchResults = useMemo(() => {
    const query = searchQ.trim().toLowerCase();
    if (!data || query.length < 1) return [] as { id: string; label: string; sub: string }[];
    const rows: { id: string; label: string; sub: string }[] = [];
    data.departments.filter((department) => !department.archivedAt && department.name.toLowerCase().includes(query)).forEach((department) => rows.push({ id: `dept:${department.id}`, label: department.name, sub: "Department" }));
    data.people
      .filter((person) => !person.archivedAt)
      .filter((person) => person.displayName.toLowerCase().includes(query) || (person.jobTitle ?? "").toLowerCase().includes(query) || (person.role ?? "").toLowerCase().includes(query))
      .forEach((person) => rows.push({ id: `person:${person.id}`, label: person.displayName, sub: person.jobTitle || roleLabel[person.role] || person.role }));
    data.pendingInvites.filter((invite) => invite.email.toLowerCase().includes(query)).forEach((invite) => rows.push({ id: `invite:${invite.id}`, label: invite.email, sub: `Invite · ${roleLabel[invite.role] ?? invite.role}` }));
    return rows.slice(0, 12);
  }, [data, searchQ]);

  const buildExport = () => JSON.stringify({ company: data?.company, departments: data?.departments, people: data?.people, pendingInvites: data?.pendingInvites }, null, 2);
  const slug = (data?.company.name || "export").toLowerCase().replace(/\s+/g, "-");
  const download = (body: string, type: string, fileName: string) => {
    const blob = new Blob([body], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const addDepartment = async () => {
    const name = newName.trim();
    if (!name) return;
    await createDepartmentMutation.mutateAsync({ name, parentId: null });
    setNewName("");
    setAdding(false);
    await refetch();
  };

  const exportCsv = () => {
    if (!data) return;
    const deptName = new Map(data.departments.map((department) => [department.id, department.name] as const));
    const personName = new Map(data.people.map((person) => [person.id, person.displayName || person.email || "Member"] as const));
    const escapeCell = (value: unknown) => {
      const text = value == null ? "" : String(value);
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    const rows: Array<Array<string | number | null>> = [["type", "name_or_email", "department", "manager", "role", "status", "headcount", "sensitive"]];
    data.departments.forEach((department) => rows.push(["department", department.name, "", "", "", department.archivedAt ? "archived" : "active", department.headcount ?? "", department.holdsSensitiveData ? "true" : "false"]));
    data.people.forEach((person) => rows.push(["person", person.displayName || person.email || "", person.departmentId ? deptName.get(person.departmentId) ?? "" : "", person.managerId ? personName.get(person.managerId) ?? "" : "", person.role, person.archivedAt ? "archived" : "active", "", ""]));
    data.pendingInvites.forEach((invite) => rows.push(["invite", invite.email, invite.departmentId ? deptName.get(invite.departmentId) ?? "" : "", invite.managerId ? personName.get(invite.managerId) ?? "" : "", invite.role, invite.status, "", ""]));
    download(rows.map((row) => row.map(escapeCell).join(",")).join("\n"), "text/csv;charset=utf-8", `org-chart-${slug}.csv`);
  };

  const exportPng = async () => {
    const element = document.querySelector(".react-flow") as HTMLElement | null;
    if (!element) return;
    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(element, {
      backgroundColor: "#ffffff",
      pixelRatio: 2,
      cacheBust: true,
      filter: (node) => {
        const classList = (node as HTMLElement).classList;
        return !classList || (!classList.contains("react-flow__minimap") && !classList.contains("react-flow__controls"));
      },
    });
    const anchor = document.createElement("a");
    anchor.href = dataUrl;
    anchor.download = `org-chart-${slug}.png`;
    anchor.click();
  };

  return (
    <ReactFlowProvider>
      <div className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3 px-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--r-sm)] bg-[var(--navy)] text-white"><Building2 className="h-5 w-5" /></div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--slate)]">Process flow studio</p>
              <h3 className="font-display text-[28px] font-medium leading-none tracking-normal text-[var(--navy)]">Organisation <span className="italic text-[var(--terracotta)]">map</span></h3>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <Counter icon={Building2} value={counters.departments} label="Departments" />
            <Counter icon={Users} value={counters.named} label="Named" />
            <Counter icon={Link2} value={counters.linked} label="Linked users" />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {adding ? (
              <div className="flex items-center gap-2 rounded-[var(--r-md)] border border-[var(--chalk)] bg-white px-2 py-1">
                <input autoFocus value={newName} onChange={(event) => setNewName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addDepartment(); if (event.key === "Escape") { setAdding(false); setNewName(""); } }} placeholder="Department name" className="h-8 w-56 bg-transparent text-sm outline-none" />
                <Button size="sm" onClick={addDepartment} className="h-8 rounded-[var(--r-sm)] bg-[var(--terracotta)] text-white hover:bg-[var(--terracotta)]/90">Add</Button>
                <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setNewName(""); }} className="h-8 rounded-[var(--r-sm)]">Cancel</Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setAdding(true)} className="h-9 rounded-[var(--r-md)]"><Plus className="h-4 w-4" /> Department</Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setAddingPerson((value) => !value)} className="h-9 rounded-[var(--r-md)]"><UserPlus className="h-4 w-4" /> Employee</Button>
            <Button variant="outline" size="sm" onClick={() => setCollapsed(allCollapsed ? new Set() : new Set(data?.departments.filter((department) => !department.archivedAt).map((department) => department.id) ?? []))} className="h-9 rounded-[var(--r-md)]"><Minimize2 className="h-4 w-4" /> {allCollapsed ? "Expand all" : "Collapse all"}</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(buildExport())} className="h-9 rounded-[var(--r-md)]"><ClipboardCopy className="h-4 w-4" /> Copy JSON</Button>
            <Button variant="outline" size="sm" onClick={() => download(buildExport(), "application/json", `org-chart-${slug}.json`)} className="h-9 rounded-[var(--r-md)]"><Download className="h-4 w-4" /> JSON</Button>
            <Button variant="outline" size="sm" onClick={exportCsv} className="h-9 rounded-[var(--r-md)]"><FileText className="h-4 w-4" /> CSV</Button>
            {!isMobile && <Button variant="outline" size="sm" onClick={exportPng} className="h-9 rounded-[var(--r-md)]"><FileImage className="h-4 w-4" /> PNG</Button>}
          </div>
        </div>

        {addingPerson && <AddEmployeePanel onDone={() => { setAddingPerson(false); refetch(); }} />}

        {!isMobile && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <div className="flex h-9 items-center gap-2 rounded-[var(--r-md)] border border-[var(--chalk)] bg-white px-2">
                <Search className="h-4 w-4 text-[var(--slate)]" />
                <input value={searchQ} onFocus={() => setSearchOpen(true)} onChange={(event) => { setSearchQ(event.target.value); setSearchOpen(true); }} placeholder="Search org chart" className="h-8 w-64 bg-transparent text-sm outline-none" />
                {searchQ && <button type="button" onClick={() => setSearchQ("")} className="text-[var(--slate)]"><X className="h-3.5 w-3.5" /></button>}
              </div>
              {searchOpen && searchResults.length > 0 && (
                <div className="absolute left-0 top-10 z-20 w-80 overflow-hidden rounded-[var(--r-md)] border border-[var(--chalk)] bg-white shadow-lg">
                  {searchResults.map((result) => (
                    <button key={result.id} type="button" onClick={() => { setCenterOnId(result.id); setSearchOpen(false); }} className="block w-full px-3 py-2 text-left hover:bg-[var(--mist)]">
                      <span className="block text-sm font-medium text-[var(--navy)]">{result.label}</span>
                      <span className="text-xs text-[var(--slate)]">{result.sub}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {[
              ["all", "All"],
              ["missing_manager", "Missing manager"],
              ["pending_invites", "Pending invites"],
              ["sensitive_departments", "Sensitive"],
              ["without_lead", "Without lead"],
              ["headcount_gap", "Headcount gap"],
            ].map(([value, label]) => (
              <button key={value} type="button" onClick={() => setFilterMode(value as OrgFilterMode)} className={`rounded-full border px-3 py-1.5 text-xs ${filterMode === value ? "border-[var(--terracotta)] bg-[var(--terracotta)] text-white" : "border-[var(--chalk)] bg-white text-[var(--slate)] hover:border-[var(--terracotta)]"}`}>{label}</button>
            ))}
            {focusId && <Button variant="ghost" size="sm" onClick={() => setFocusId(null)} className="h-9 rounded-[var(--r-md)]">Clear focus</Button>}
          </div>
        )}

        <Canvas
          onSelect={onSelect}
          reparentEnabled={reparentEnabled}
          collapsed={collapsed}
          focusId={focusId}
          setFocusId={setFocusId}
          filterMode={filterMode}
          centerOnId={centerOnId}
          onCentered={() => setCenterOnId(null)}
        />
      </div>
    </ReactFlowProvider>
  );
}
