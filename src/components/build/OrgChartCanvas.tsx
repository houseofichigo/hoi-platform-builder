import { Building2, Mail, UserRound } from "lucide-react";
import type { OrgChartPayload } from "@/lib/db/org-chart";

type Node = {
  id: string;
  parentId: string | null;
  kind: "workspace" | "department" | "person" | "invite";
  title: string;
  subtitle: string;
  badge?: string;
  x: number;
  y: number;
};

const NODE_W = 220;
const NODE_H = 92;
const GAP_X = 34;
const GAP_Y = 84;

function buildNodes(data: OrgChartPayload): Node[] {
  const rootId = `workspace:${data.workspace.id}`;
  const departments = data.departments.map((department) => ({
    id: `department:${department.id}`,
    parentId: department.parentId ? `department:${department.parentId}` : rootId,
    kind: "department" as const,
    title: department.name,
    subtitle: department.description ?? `${department.headcount ?? 0} expected people`,
    badge: department.holdsSensitiveData ? "Sensitive" : undefined,
    x: 0,
    y: 0,
  }));

  const people = data.people.map((person) => ({
    id: `person:${person.id}`,
    parentId: person.departmentId ? `department:${person.departmentId}` : rootId,
    kind: "person" as const,
    title: person.displayName,
    subtitle: person.jobTitle,
    badge: person.role,
    x: 0,
    y: 0,
  }));

  const invites = data.pendingInvites.map((invite) => ({
    id: `invite:${invite.id}`,
    parentId: invite.departmentId ? `department:${invite.departmentId}` : rootId,
    kind: "invite" as const,
    title: invite.email,
    subtitle: "Pending invitation",
    badge: invite.role,
    x: 0,
    y: 0,
  }));

  return [
    {
      id: rootId,
      parentId: null,
      kind: "workspace",
      title: data.workspace.name,
      subtitle: "Workspace",
      x: 0,
      y: 0,
    },
    ...departments,
    ...people,
    ...invites,
  ];
}

function layoutTree(nodes: Node[]) {
  const children = new Map<string, Node[]>();
  for (const node of nodes) {
    if (!node.parentId) continue;
    const list = children.get(node.parentId) ?? [];
    list.push(node);
    children.set(node.parentId, list);
  }

  for (const list of children.values()) {
    list.sort((a, b) => a.kind.localeCompare(b.kind) || a.title.localeCompare(b.title));
  }

  const byId = new Map(nodes.map((node) => [node.id, node]));
  const roots = nodes.filter((node) => !node.parentId);
  let cursor = 0;

  const place = (node: Node, depth: number): number => {
    const kids = children.get(node.id) ?? [];
    node.y = depth * (NODE_H + GAP_Y);
    if (kids.length === 0) {
      node.x = cursor;
      cursor += NODE_W + GAP_X;
      return node.x + NODE_W / 2;
    }

    const centers = kids.map((child) => place(child, depth + 1));
    const center = (centers[0] + centers[centers.length - 1]) / 2;
    node.x = center - NODE_W / 2;
    return center;
  };

  roots.forEach((root) => place(root, 0));

  let minX = Math.min(...nodes.map((node) => node.x), 0);
  if (minX < 24) {
    for (const node of nodes) node.x += 24 - minX;
  }

  return { nodes, byId };
}

export function OrgChartCanvas({ data }: { data: OrgChartPayload }) {
  const { nodes, byId } = layoutTree(buildNodes(data));
  const width = Math.max(720, Math.max(...nodes.map((node) => node.x + NODE_W + 24)));
  const height = Math.max(320, Math.max(...nodes.map((node) => node.y + NODE_H + 24)));

  return (
    <div className="overflow-auto rounded-md border border-chalk bg-paper">
      <div className="relative" style={{ width, height }}>
        <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
          {nodes
            .filter((node) => node.parentId)
            .map((node) => {
              const parent = byId.get(node.parentId!);
              if (!parent) return null;
              const startX = parent.x + NODE_W / 2;
              const startY = parent.y + NODE_H;
              const endX = node.x + NODE_W / 2;
              const endY = node.y;
              const midY = startY + GAP_Y / 2;
              return (
                <path
                  key={`${parent.id}-${node.id}`}
                  d={`M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`}
                  fill="none"
                  stroke="rgb(224 219 211)"
                  strokeWidth="2"
                />
              );
            })}
        </svg>
        {nodes.map((node) => (
          <OrgNode key={node.id} node={node} />
        ))}
      </div>
    </div>
  );
}

function OrgNode({ node }: { node: Node }) {
  const Icon = node.kind === "department" || node.kind === "workspace" ? Building2 : node.kind === "invite" ? Mail : UserRound;
  const color =
    node.kind === "workspace"
      ? "border-navy bg-navy text-white"
      : node.kind === "department"
        ? "border-navy/25 bg-white text-navy"
        : node.kind === "invite"
          ? "border-dashed border-terracotta/50 bg-white text-graphite"
          : "border-terracotta/40 bg-white text-navy";

  return (
    <div
      className={`absolute rounded-md border p-3 shadow-sm ${color}`}
      style={{ left: node.x, top: node.y, width: NODE_W, minHeight: NODE_H }}
    >
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0">
          <p className="truncate text-[14px] font-medium">{node.title}</p>
          <p className={node.kind === "workspace" ? "mt-1 truncate text-[12px] text-white/75" : "mt-1 truncate text-[12px] text-slate"}>
            {node.subtitle}
          </p>
        </div>
      </div>
      {node.badge ? (
        <span className={node.kind === "workspace" ? "mt-3 inline-flex rounded-full bg-white/15 px-2 py-0.5 text-[11px]" : "mt-3 inline-flex rounded-full bg-mist px-2 py-0.5 text-[11px] text-slate"}>
          {node.badge}
        </span>
      ) : null}
    </div>
  );
}
