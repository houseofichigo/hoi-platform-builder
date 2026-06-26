import { z } from "zod";

import type {
  DataAccessibility,
  DataProfile,
  DataQualityRating,
  DataSensitivity,
  DataStructure,
  InputType,
  NodeKind,
  TriggerType,
} from "@/lib/process-data";

const nodeKinds = ["trigger", "task", "decision", "approval", "handoff", "output", "merge", "end"] as const;
const insertableNodeKinds = ["task", "decision", "approval", "handoff", "output", "merge"] as const;
const triggerTypes = ["manual", "schedule", "event"] as const;
const scheduleKinds = ["interval", "cron"] as const;
const inputTypes = ["System Record", "Manual Entry", "Email", "File/PDF", "Call notes", "Routing"] as const;
const dataQualities = ["trusted", "needs_checking", "unreliable", "not_assessed"] as const;
const dataStructures = ["structured", "semi_structured", "unstructured"] as const;
const dataAccessibilities = ["api_accessible", "export_only", "manual"] as const;
const dataSensitivities = ["public", "internal", "personal", "sensitive"] as const;
const dataProfileSources = ["inherited", "overridden", "ai_suggested"] as const;
const toolRoles = ["creates", "stores", "updates", "sends", "receives", "approves", "reads", "exports", "notifies", "custom"] as const;
const stickyCategories = [
  "pain_point",
  "exception",
  "bottleneck",
  "observation",
  "compliance",
  "missing_info",
  "ai_recommendation",
] as const;
const impactValues = ["low", "medium", "high", "critical"] as const;
const reversibilityValues = ["easy_to_reverse", "manual_fix", "hard_to_reverse", "irreversible"] as const;
const frequencyValues = ["daily", "weekly", "monthly", "quarterly"] as const;
const standardizationValues = ["low", "medium", "high"] as const;
const criticalityValues = ["customer_facing", "financial_impact", "legal_compliance", "internal_only"] as const;

const positionSchema = z.object({
  x: z.number().finite().default(0),
  y: z.number().finite().default(0),
});

const dataProfileSchema = z.object({
  structure: z.enum(dataStructures),
  accessibility: z.enum(dataAccessibilities),
  sensitivity: z.enum(dataSensitivities),
  ownership: z.string().trim().min(1).default("Step owner"),
  source: z.enum(dataProfileSources).default("ai_suggested"),
});

export const processNodeDataSchema = z.object({
  label: z.string().trim().min(1),
  description: z.string().default(""),
  kind: z.enum(nodeKinds),
  triggerType: z.enum(triggerTypes).optional(),
  triggerConfig: z.object({
    scheduleKind: z.enum(scheduleKinds).optional(),
    interval: z.string().optional(),
    cron: z.string().optional(),
    toolId: z.string().nullable().optional(),
    toolName: z.string().nullable().optional(),
    eventName: z.string().optional(),
    toolActionId: z.string().nullable().optional(),
    toolActionName: z.string().nullable().optional(),
  }).optional(),
  actor: z.string().default(""),
  owner: z.array(z.string()).default([]),
  toolId: z.string().nullable().default(null),
  toolName: z.string().nullable().default(null),
  toolRole: z.enum(toolRoles).or(z.string()).optional(),
  toolActionId: z.string().nullable().default(null),
  toolActionName: z.string().nullable().default(null),
  toolActionObject: z.string().nullable().default(null),
  toolActionFamily: z.string().nullable().default(null),
  automationLevel: z.number().int().min(0).max(4).default(1),
  hitl: z.string().default("human_review"),
  inputType: z.enum(inputTypes).default("System Record"),
  output: z.string().default(""),
  producesData: z.boolean().default(false),
  dataSourceId: z.string().nullable().default(null),
  dataProfile: dataProfileSchema.default({
    structure: "unstructured",
    accessibility: "manual",
    sensitivity: "internal",
    ownership: "Step owner",
    source: "ai_suggested",
  }),
  dataQuality: z.enum(dataQualities).default("not_assessed"),
  isDataCritical: z.boolean().default(false),
  assistantOpportunity: z.boolean().default(false),
});

export const processNodeSchema = z.object({
  id: z.string().trim().min(1).optional(),
  type: z.literal("processNode").default("processNode"),
  position: positionSchema.default({ x: 0, y: 0 }),
  data: processNodeDataSchema,
});

export const stickyNodeDataSchema = z.object({
  text: z.string().trim().min(1),
  category: z.enum(stickyCategories).default("observation"),
  referenceNodeId: z.string().optional(),
});

export const stickyNodeSchema = z.object({
  id: z.string().trim().min(1).optional(),
  type: z.literal("stickyNode").default("stickyNode"),
  position: positionSchema.default({ x: 0, y: 0 }),
  data: stickyNodeDataSchema,
});

const framePatchSchema = z.object({
  name: z.string().optional(),
  family: z.string().optional(),
  objective: z.string().optional(),
  successMetric: z.string().optional(),
  departmentId: z.string().optional(),
}).strict();

const globalPassPatchSchema = z.object({
  outputCriticality: z.array(z.enum(criticalityValues)).optional(),
  impactIfFailure: z.enum(impactValues).optional(),
  errorReversibility: z.enum(reversibilityValues).optional(),
  frequency: z.enum(frequencyValues).optional(),
  standardization: z.enum(standardizationValues).optional(),
  volume: z.number().finite().nonnegative().optional(),
}).strict();

const addNodeOperationSchema = z.object({
  op: z.literal("add_node"),
  node: processNodeSchema,
});
const updateNodeOperationSchema = z.object({
  op: z.literal("update_node"),
  id: z.string().trim().min(1),
  patch: processNodeDataSchema.partial().strict(),
});
const deleteNodeOperationSchema = z.object({
  op: z.literal("delete_node"),
  id: z.string().trim().min(1),
});
const addEdgeOperationSchema = z.object({
  op: z.literal("add_edge"),
  id: z.string().trim().min(1).optional(),
  source: z.string().trim().min(1),
  target: z.string().trim().min(1),
  label: z.string().optional(),
});
const deleteEdgeOperationSchema = z.object({
  op: z.literal("delete_edge"),
  id: z.string().trim().min(1).optional(),
  source: z.string().trim().min(1).optional(),
  target: z.string().trim().min(1).optional(),
});
const insertNodeAfterOperationSchema = z.object({
  op: z.literal("insert_node_after"),
  afterId: z.string().trim().min(1),
  node: processNodeSchema,
});
const addBranchOperationSchema = z.object({
  op: z.literal("add_branch"),
  decisionId: z.string().trim().min(1),
  label: z.string().default("False"),
  node: processNodeSchema,
});
const addStickyNoteOperationSchema = z.object({
  op: z.literal("add_sticky_note"),
  note: stickyNodeSchema,
  nearNodeId: z.string().trim().min(1).optional(),
});
const updateFrameOperationSchema = z.object({
  op: z.literal("update_frame"),
  patch: framePatchSchema,
});
const updateGlobalPassOperationSchema = z.object({
  op: z.literal("update_global_pass"),
  patch: globalPassPatchSchema,
});

export const patchOperationSchema = z.discriminatedUnion("op", [
  addNodeOperationSchema,
  updateNodeOperationSchema,
  deleteNodeOperationSchema,
  addEdgeOperationSchema,
  deleteEdgeOperationSchema,
  insertNodeAfterOperationSchema,
  addBranchOperationSchema,
  addStickyNoteOperationSchema,
  updateFrameOperationSchema,
  updateGlobalPassOperationSchema,
]);

export const diagramPatchSchema = z.object({
  type: z.literal("diagram_patch"),
  summary: z.string().trim().min(1),
  operations: z.array(patchOperationSchema).default([]),
  questions: z.array(z.object({ field: z.string(), question: z.string() })).optional(),
  confidence: z.enum(["low", "medium", "high"]),
});

export type PatchOperation = z.infer<typeof patchOperationSchema>;
export type DiagramPatch = z.infer<typeof diagramPatchSchema>;
export type StickyCategory = (typeof stickyCategories)[number];
export type DiagramNode = z.infer<typeof processNodeSchema> | z.infer<typeof stickyNodeSchema>;
export type DiagramEdge = { id: string; source: string; target: string; type?: string; label?: string; [key: string]: unknown };
export type DiagramPatchState = {
  frame: Record<string, unknown>;
  globalPass: Record<string, unknown>;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
};
export type OperationReport = { op: string; status: "applied" | "rejected"; reason?: string; detail?: string };
export type ReadinessItem = { id: string; label: string; passed: boolean; detail: string };

function isProcessNode(node: DiagramNode): node is z.infer<typeof processNodeSchema> {
  return node.type !== "stickyNode";
}

function freshId(prefix: string, ids: Set<string>) {
  let id = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  while (ids.has(id)) id = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  ids.add(id);
  return id;
}

function edgeId(source: string, target: string, ids: Set<string>) {
  let id = `${source}-${target}-${Date.now()}`;
  while (ids.has(id)) id = `${source}-${target}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  ids.add(id);
  return id;
}

function withAiProfile(data: z.infer<typeof processNodeDataSchema>) {
  return {
    ...data,
    dataProfile: {
      ...data.dataProfile,
      source: "ai_suggested" as const,
    },
  };
}

function processNodeIds(nodes: DiagramNode[]) {
  return new Set(nodes.filter(isProcessNode).map((node) => node.id).filter(Boolean) as string[]);
}

function normalizeProcessNode(node: z.infer<typeof processNodeSchema>, ids: Set<string>) {
  const kind = node.data.kind;
  const id = node.id && !ids.has(node.id) ? node.id : freshId(kind, ids);
  ids.add(id);
  const triggerDefaults =
    kind === "trigger"
      ? {
          triggerType: node.data.triggerType ?? ("manual" as const),
          triggerConfig: node.data.triggerConfig ?? {},
          automationLevel: 0,
        }
      : kind === "merge"
        ? { automationLevel: 0 }
      : {};
  return {
    ...node,
    id,
    type: "processNode" as const,
    data: withAiProfile({ ...node.data, ...triggerDefaults }),
  };
}

function normalizeStickyNode(note: z.infer<typeof stickyNodeSchema>, ids: Set<string>) {
  const id = note.id && !ids.has(note.id) ? note.id : freshId("sticky", ids);
  ids.add(id);
  return { ...note, id, type: "stickyNode" as const };
}

function validatesConnectedGraph(nodes: DiagramNode[], edges: DiagramEdge[]) {
  const processNodes = nodes.filter(isProcessNode);
  const triggers = processNodes.filter((node) => node.data.kind === "trigger");
  const workNodes = processNodes.filter((node) => !["trigger", "end", "merge"].includes(node.data.kind));
  if (triggers.length === 0 || workNodes.length === 0) return false;
  const ids = processNodeIds(nodes);
  if (edges.some((item) => !ids.has(item.source) || !ids.has(item.target))) return false;

  const visited = new Set<string>();
  const queue = triggers.map((node) => node.id);
  while (queue.length) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    visited.add(current);
    edges.filter((item) => item.source === current).forEach((item) => queue.push(item.target));
  }
  return workNodes.every((node) => visited.has(node.id ?? ""));
}

function reject(op: PatchOperation, reason: string): OperationReport {
  return { op: op.op, status: "rejected", reason };
}

function applyOne(state: DiagramPatchState, op: PatchOperation): { state: DiagramPatchState; report: OperationReport } {
  const nodeIds = new Set(state.nodes.map((node) => node.id).filter(Boolean) as string[]);
  const edgeIds = new Set(state.edges.map((item) => item.id).filter(Boolean) as string[]);
  const processIds = processNodeIds(state.nodes);

  if (op.op === "add_node") {
    const node = normalizeProcessNode(op.node, nodeIds);
    return { state: { ...state, nodes: [...state.nodes, node] }, report: { op: op.op, status: "applied", detail: node.id } };
  }

  if (op.op === "update_node") {
    if (!processIds.has(op.id)) return { state, report: reject(op, `Unknown process node ${op.id}.`) };
    return {
      state: {
        ...state,
        nodes: state.nodes.map((node) =>
          isProcessNode(node) && node.id === op.id
            ? { ...node, data: withAiProfile(processNodeDataSchema.parse({ ...node.data, ...op.patch })) }
            : node,
        ),
      },
      report: { op: op.op, status: "applied", detail: op.id },
    };
  }

  if (op.op === "delete_node") {
    const node = state.nodes.find((item) => item.id === op.id);
    if (!node) return { state, report: reject(op, `Unknown node ${op.id}.`) };
    const nextNodes = state.nodes.filter((item) => item.id !== op.id);
    const nextEdges = state.edges.filter((item) => item.source !== op.id && item.target !== op.id);
    if (isProcessNode(node) && nextNodes.filter(isProcessNode).length > 0 && !validatesConnectedGraph(nextNodes, nextEdges)) {
      return { state, report: reject(op, "Deleting this node would orphan the process path.") };
    }
    return { state: { ...state, nodes: nextNodes, edges: nextEdges }, report: { op: op.op, status: "applied", detail: op.id } };
  }

  if (op.op === "add_edge") {
    if (!processIds.has(op.source) || !processIds.has(op.target)) return { state, report: reject(op, "Edge endpoints must be existing process nodes.") };
    if (op.source === op.target) return { state, report: reject(op, "Self-connections are not allowed.") };
    if (state.edges.some((item) => item.source === op.source && item.target === op.target)) {
      return { state, report: reject(op, "This connection already exists.") };
    }
    const sourceNode = state.nodes.find((node) => node.id === op.source);
    if (sourceNode && isProcessNode(sourceNode) && sourceNode.data.kind === "merge" && state.edges.some((item) => item.source === op.source)) {
      return { state, report: reject(op, "Merge nodes can only have one outgoing path.") };
    }
    const id = op.id && !edgeIds.has(op.id) ? op.id : edgeId(op.source, op.target, edgeIds);
    return {
      state: { ...state, edges: [...state.edges, { id, source: op.source, target: op.target, type: "insertEdge", label: op.label }] },
      report: { op: op.op, status: "applied", detail: id },
    };
  }

  if (op.op === "delete_edge") {
    const match = state.edges.find((item) => (op.id ? item.id === op.id : item.source === op.source && item.target === op.target));
    if (!match) return { state, report: reject(op, "Unknown edge.") };
    return { state: { ...state, edges: state.edges.filter((item) => item.id !== match.id) }, report: { op: op.op, status: "applied", detail: match.id } };
  }

  if (op.op === "insert_node_after") {
    if (!processIds.has(op.afterId)) return { state, report: reject(op, `Unknown process node ${op.afterId}.`) };
    const source = state.nodes.find((node) => node.id === op.afterId);
    if (source && isProcessNode(source) && source.data.kind === "end") return { state, report: reject(op, "Cannot insert after End.") };
    const node = normalizeProcessNode(op.node, nodeIds);
    const outgoing = state.edges.filter((item) => item.source === op.afterId);
    const keepEdges = state.edges.filter((item) => item.source !== op.afterId);
    const nextEdges = [
      ...keepEdges,
      { id: edgeId(op.afterId, node.id, edgeIds), source: op.afterId, target: node.id, type: "insertEdge" },
      ...outgoing.map((item) => ({ ...item, id: edgeId(node.id, item.target, edgeIds), source: node.id })),
    ];
    return {
      state: { ...state, nodes: [...state.nodes, node], edges: nextEdges },
      report: { op: op.op, status: "applied", detail: node.id },
    };
  }

  if (op.op === "add_branch") {
    const source = state.nodes.find((node) => isProcessNode(node) && node.id === op.decisionId);
    if (!source || !isProcessNode(source)) return { state, report: reject(op, `Unknown If node ${op.decisionId}.`) };
    if (source.data.kind !== "decision") return { state, report: reject(op, "Branches can only be added from If nodes.") };
    const sourceId = source.id;
    if (!sourceId) return { state, report: reject(op, `Unknown If node ${op.decisionId}.`) };
    const node = normalizeProcessNode(op.node, nodeIds);
    const edge = { id: edgeId(sourceId, node.id, edgeIds), source: sourceId, target: node.id, type: "insertEdge", label: op.label };
    return {
      state: { ...state, nodes: [...state.nodes, node], edges: [...state.edges, edge] },
      report: { op: op.op, status: "applied", detail: `${source.id} → ${node.id}` },
    };
  }

  if (op.op === "add_sticky_note") {
    if (op.nearNodeId && !nodeIds.has(op.nearNodeId)) return { state, report: reject(op, `Unknown reference node ${op.nearNodeId}.`) };
    const reference = op.nearNodeId ? state.nodes.find((node) => node.id === op.nearNodeId) : undefined;
    const note = normalizeStickyNode(
      {
        ...op.note,
        position: reference ? { x: reference.position.x + 40, y: reference.position.y + 100 } : op.note.position,
      },
      nodeIds,
    );
    return { state: { ...state, nodes: [...state.nodes, note] }, report: { op: op.op, status: "applied", detail: note.id } };
  }

  if (op.op === "update_frame") {
    return { state: { ...state, frame: { ...state.frame, ...op.patch } }, report: { op: op.op, status: "applied" } };
  }

  if (op.op === "update_global_pass") {
    return { state: { ...state, globalPass: { ...state.globalPass, ...op.patch } }, report: { op: op.op, status: "applied" } };
  }

  return { state, report: { op: "unknown", status: "rejected", reason: "Unsupported operation." } };
}

export function applyPatch(state: DiagramPatchState, candidate: unknown) {
  const parsed = diagramPatchSchema.safeParse(candidate);
  if (!parsed.success) {
    return {
      state,
      applied: [] as OperationReport[],
      rejected: [{ op: "diagram_patch", status: "rejected" as const, reason: parsed.error.message }],
    };
  }

  let working = {
    frame: { ...state.frame },
    globalPass: { ...state.globalPass },
    nodes: state.nodes.map((node) => ({ ...node, data: { ...node.data }, position: { ...node.position } })),
    edges: state.edges.map((item) => ({ ...item })),
  } as DiagramPatchState;
  const applied: OperationReport[] = [];
  const rejected: OperationReport[] = [];

  for (const op of parsed.data.operations) {
    const result = applyOne(working, op);
    working = result.state;
    if (result.report.status === "applied") applied.push(result.report);
    else rejected.push(result.report);
  }

  return { state: working, applied, rejected };
}

export function validateScoreReadiness(state: DiagramPatchState) {
  const processNodes = state.nodes.filter(isProcessNode);
  const workNodes = processNodes.filter((node) => !["trigger", "end", "merge"].includes(node.data.kind));
  const decisions = processNodes.filter((node) => node.data.kind === "decision");
  const merges = processNodes.filter((node) => node.data.kind === "merge");
  const approvals = processNodes.filter((node) => node.data.kind === "approval");
  const outgoingCount = (id: string) => state.edges.filter((edge) => edge.source === id).length;
  const incomingCount = (id: string) => state.edges.filter((edge) => edge.target === id).length;
  const hasExceptionPath = decisions.concat(approvals).some((node) => Boolean(node.id && outgoingCount(node.id) >= 2));
  const ownersFor = (node: z.infer<typeof processNodeSchema>) => {
    const owners = Array.isArray(node.data.owner) ? node.data.owner.filter(Boolean) : [];
    if (owners.length) return owners;
    return node.data.actor?.trim() ? [node.data.actor.trim()] : [];
  };

  const checks: ReadinessItem[] = [
    {
      id: "owners",
      label: "Every step has an owner",
      passed: workNodes.every((node) => ownersFor(node).length > 0),
      detail: "Assign at least one person, role, or team to each non-trigger/end step.",
    },
    {
      id: "outputs",
      label: "Every step has an output",
      passed: workNodes.every((node) => Boolean(node.data.output?.trim())),
      detail: "Outputs make trigger/output derivation and scoring defensible.",
    },
    {
      id: "decision_branches",
      label: "If nodes have at least two branches",
      passed: decisions.every((node) => Boolean(node.id && outgoingCount(node.id) >= 2)),
      detail: "If paths should include alternate outcomes.",
    },
    {
      id: "merge_inputs",
      label: "Merge nodes have at least two incoming paths",
      passed: merges.every((node) => Boolean(node.id && incomingCount(node.id) >= 2)),
      detail: "Merge nodes should visibly join at least two paths.",
    },
    {
      id: "data_inputs",
      label: "Data-producing steps identify data handling",
      passed: workNodes.filter((node) => node.data.producesData).every((node) => Boolean(node.data.inputType)),
      detail: "Mark the input type for steps that produce or transform data.",
    },
    {
      id: "tools",
      label: "Tools are linked where applicable",
      passed: workNodes.every((node) => node.data.toolId || node.data.inputType === "Manual Entry" || node.data.toolName === null),
      detail: "Manual steps can remain without a tool; system steps should link their primary tool.",
    },
    {
      id: "exceptions",
      label: "Exception/rejection path exists when needed",
      passed: decisions.length + approvals.length === 0 || hasExceptionPath,
      detail: "Approval or If flows should show what happens when the answer is false or rejected.",
    },
    {
      id: "frame_fields",
      label: "Frame characterization is complete",
      passed:
        Boolean(state.globalPass.frequency) &&
        Number(state.globalPass.volume) > 0 &&
        Array.isArray(state.globalPass.outputCriticality) &&
        state.globalPass.outputCriticality.length > 0 &&
        Boolean(state.globalPass.impactIfFailure),
      detail: "Frequency, volume, output criticality, and failure impact feed scoring and risk.",
    },
  ];

  const passed = checks.filter((item) => item.passed).length;
  const confidence = passed === checks.length ? "high" : passed >= Math.ceil(checks.length * 0.7) ? "medium" : "low";
  return { confidence, checks, passed, total: checks.length };
}
