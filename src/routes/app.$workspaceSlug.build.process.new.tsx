// @ts-nocheck — Ported PFS module.
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  addEdge,
  Background,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  applyEdgeChanges,
  applyNodeChanges,
  getSmoothStepPath,
  type Connection,
  type Edge,
  type EdgeChange,
  type EdgeProps,
  type Node,
  type NodeChange,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Check,
  CheckCircle2,
  ArrowLeft,
  CircleDot,
  Circle,
  ClipboardCheck,
  Bot,
  Diamond,
  Database,
  FileQuestion,
  GitBranch,
  Globe2,
  Loader2,
  Maximize2,
  MessageSquare,
  Plus,
  Redo2,
  RotateCw,
  Save,
  Search,
  Send,
  ShieldCheck,
  Square,
  StickyNote,
  Trash2,
  Undo2,
  UserCheck,
  X,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

// import { AppShell } from "@/components/build/pfs/process-platform";
import { ProcessTemplateBrowser } from "@/components/build/pfs/process-template-library";
import { RiskTierBadge } from "@/components/build/pfs/risk-tier-badge";
import { ToolCatalogPicker } from "@/components/build/pfs/tool-catalog-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { applyPatch, validateScoreReadiness, type DiagramPatch, type DiagramPatchState, type OperationReport, type StickyCategory } from "@/lib/diagram-patch";
import { useDiagramAssistant, type DiagramAssistantMode } from "@/lib/db/pfs/diagram-assistant";
import { useMembers, type MemberSuggestion } from "@/lib/db/pfs/members";
import { useCreateSubmittedProcess } from "@/lib/db/pfs/process-builder";
import { getProcessTemplateBySlug, useProcessTemplates, type ProcessTemplate } from "@/lib/db/pfs/process-templates";
import { useDataSources, useDepartments, useTools } from "@/lib/db/pfs/reference";
import { groupToolActions, outputFromToolAction, roleFromToolAction, useToolActions, type ToolActionCatalogRow } from "@/lib/db/pfs/tool-actions";
import { catalogProfileDefaults, toolCatalogLogoUrl, useEnsureOrgToolFromCatalog, useToolCatalog, type ToolCatalogRow } from "@/lib/db/pfs/tool-catalog";
import { getNodeFieldSchema, type NodeFieldDescriptor } from "@/lib/node-field-schema";
import { classifyRiskTier, riskTierClass } from "@/lib/risk-tier";
import { scoreProcess } from "@/lib/scoring/process-score";
import type {
  DataAccessibility,
  DataProfile,
  DataQualityRating,
  DataSensitivity,
  DataStructure,
  InputType,
  NodeKind,
  ToolRole,
  TriggerType,
} from "@/lib/process-data";

type BuilderData = {
  label: string;
  description: string;
  kind: NodeKind;
  triggerType?: TriggerType;
  triggerConfig?: {
    scheduleKind?: "interval" | "cron";
    interval?: string;
    cron?: string;
    toolId?: string | null;
    toolName?: string | null;
    eventName?: string;
    toolActionId?: string | null;
    toolActionName?: string | null;
  };
  actor?: string;
  owner: string[];
  toolId: string | null;
  toolName: string | null;
  toolRole?: ToolRole | string;
  toolActionId?: string | null;
  toolActionName?: string | null;
  toolActionObject?: string | null;
  toolActionFamily?: string | null;
  automationLevel: number;
  hitl: string;
  inputType: InputType;
  output: string;
  producesData: boolean;
  dataSourceId: string | null;
  dataProfile: DataProfile;
  dataQuality: DataQualityRating;
  isDataCritical: boolean;
  templateSuggested?: boolean;
  assistantOpportunity?: boolean;
  ui?: {
    outgoingCount: number;
    incomingCount: number;
    branchLabels: string[];
    issues: string[];
    layoutDirection?: LayoutDirection;
    showToolTile?: boolean;
    toolCategory?: string | null;
    toolLogoUrl?: string;
  };
};

type StickyData = {
  text: string;
  category: StickyCategory;
  referenceNodeId?: string;
  templateSuggested?: boolean;
};

type ProcessBuilderNode = Node<BuilderData, "processNode">;
type StickyBuilderNode = Node<StickyData, "stickyNode">;
type BuilderNode = ProcessBuilderNode | StickyBuilderNode;
type BuilderEdge = Edge;
type BuilderStep = "start" | "frame" | "diagram" | "submit";
type StartPanelMode = null | "template" | "ai";
type DiagramSnapshot = {
  nodes: BuilderNode[];
  edges: BuilderEdge[];
  selectedId: string;
  selectedEdgeId: string;
  frame?: Record<string, any>;
  globalPass?: Record<string, any>;
};
type ProcessBuilderDraft = {
  version: 1;
  savedAt: string;
  step: BuilderStep;
  frame: {
    name: string;
    family: string;
    objective: string;
    successMetric: string;
    departmentId: string;
  };
  globalPass: {
    outputCriticality: string[];
    impactIfFailure: string;
    errorReversibility: string;
    frequency: string;
    standardization: string;
    volume: number;
  };
  nodes: BuilderNode[];
  edges: BuilderEdge[];
  selectedId: string;
  selectedEdgeId: string;
  layoutDirection: LayoutDirection;
  showToolTiles: boolean;
};
type NodePickerTarget =
  | { mode: "append"; sourceId?: string }
  | { mode: "insert"; edgeId: string; source: string; target: string; x: number; y: number }
  | { mode: "branch"; sourceId: string; label?: string };
type OpenNodePickerDetail = NodePickerTarget;
type LayoutDirection = "RIGHT" | "DOWN";

const processBuilderDraftKey = "hoi-process-builder-draft-v1";
const defaultFrame = {
  name: "",
  family: "Operations",
  objective: "",
  successMetric: "",
  departmentId: "",
};
const defaultGlobalPass = {
  outputCriticality: [] as string[],
  impactIfFailure: "medium",
  errorReversibility: "manual_fix",
  frequency: "weekly",
  standardization: "medium",
  volume: 25,
};
const nodeKinds: NodeKind[] = ["trigger", "task", "decision", "approval", "handoff", "output", "merge", "end"];
const inputTypes: InputType[] = ["System Record", "Manual Entry", "Email", "File/PDF", "Call notes", "Routing"];
const openNodePickerEvent = "hoi:open-node-picker";
const builderSteps: Array<{ id: BuilderStep; label: string; caption: string }> = [
  { id: "frame", label: "Frame", caption: "Define & characterize" },
  { id: "diagram", label: "Diagram", caption: "Map the flow" },
  { id: "submit", label: "Submit", caption: "Review & submit" },
];
const criticalityOptions = [
  ["customer_facing", "Customer-facing"],
  ["financial_impact", "Financial impact"],
  ["legal_compliance", "Legal/compliance"],
  ["internal_only", "Internal only"],
] as const;
const eventTriggerOptions: Array<[string, string]> = [
  ["record_created", "Record created"],
  ["record_updated", "Record updated"],
  ["record_deleted", "Record deleted"],
  ["message_received", "Message received"],
  ["form_submitted", "Form submitted"],
  ["file_added", "File added"],
  ["status_changed", "Status changed"],
  ["webhook_called", "Webhook called"],
];
const customEventValue = "__custom__";
const toolRoleOptions: Array<[ToolRole, string]> = [
  ["creates", "Creates"],
  ["stores", "Stores"],
  ["updates", "Updates"],
  ["sends", "Sends"],
  ["receives", "Receives"],
  ["approves", "Approves"],
  ["reads", "Reads"],
  ["exports", "Exports"],
  ["notifies", "Notifies"],
  ["custom", "Custom"],
];
const stepTemplates: Array<{ label: string; kind: NodeKind; data: Partial<BuilderData> }> = [
  { label: "Receive request", kind: "task", data: { label: "Receive request", inputType: "Email", output: "Request captured", owner: ["Requester"] } },
  { label: "Validate information", kind: "task", data: { label: "Validate information", inputType: "Manual Entry", output: "Validated information", owner: ["Process owner"] } },
  { label: "Approve request", kind: "approval", data: { label: "Approve request", output: "Approval decision", owner: ["Approver"], hitl: "human_approval" } },
  { label: "Enrich data", kind: "task", data: { label: "Enrich data", producesData: true, output: "Enriched record", owner: ["Operations"] } },
  { label: "Send email", kind: "task", data: { label: "Send email", inputType: "Email", output: "Email sent", owner: ["Process owner"] } },
  { label: "Update CRM", kind: "task", data: { label: "Update CRM", output: "CRM updated", owner: ["Sales"] } },
  { label: "Generate report", kind: "output", data: { label: "Generate report", producesData: true, output: "Report generated", owner: ["Analyst"] } },
  { label: "Escalate exception", kind: "handoff", data: { label: "Escalate exception", inputType: "Routing", output: "Exception escalated", owner: ["Team lead"] } },
  { label: "Archive record", kind: "task", data: { label: "Archive record", output: "Record archived", owner: ["Operations"] } },
];

type ProcessTemplateCategory = "Action" | "Data transformation" | "Flow" | "Human review" | "Output";
type DrawerCategory = "Action" | "tools" | "Data transformation" | "Flow" | "Core" | "Human review" | "trigger";
type ProcessTemplateGroup = "Most common" | "More" | "Advanced";

const processTemplateCategories: Array<{
  id: ProcessTemplateCategory;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  { id: "Action", label: "Action", description: "Work performed by a person, team, or system.", icon: Square },
  { id: "Data transformation", label: "Data transformation", description: "Extract, clean, enrich, match, or store information.", icon: Database },
  { id: "Flow", label: "Flow", description: "Branch, merge, wait, hand off, or repeat the process.", icon: GitBranch },
  { id: "Human review", label: "Human review", description: "Approvals, checks, escalations, and decisions by people.", icon: UserCheck },
  { id: "Output", label: "Output", description: "Invoices, records, dashboards, confirmations, and endings.", icon: Send },
];

const drawerRootRows: Array<{
  id: DrawerCategory;
  label: string;
  description: string;
  icon: LucideIcon;
  separated?: boolean;
}> = [
  { id: "Action", label: "Action", description: "Describe human work such as drafting, checking, requesting, notifying, or closing work.", icon: Square },
  { id: "tools", label: "Action in an app", description: "Do something in a company app or service like Gmail, Notion, or Sheets.", icon: Globe2 },
  { id: "Data transformation", label: "Data transformation", description: "Manipulate, filter, clean, enrich, or convert data.", icon: Database },
  { id: "Flow", label: "Flow", description: "Branch, merge, hand off, wait, or loop the process.", icon: GitBranch },
  { id: "Core", label: "Core", description: "Common process outputs such as documents, records, dashboards, confirmations, and endings.", icon: ClipboardCheck },
  { id: "Human review", label: "Human review", description: "Request approval, review exceptions, validate data, or escalate issues.", icon: UserCheck },
  { id: "trigger", label: "Add another trigger", description: "Triggers start the process. A map can have multiple triggers.", icon: Zap, separated: true },
];

const processCategoryActions: Array<{
  category: ProcessTemplateCategory;
  group: ProcessTemplateGroup;
  label: string;
  description: string;
  icon: LucideIcon;
  kind: NodeKind;
  data?: Partial<BuilderData>;
}> = [
  { category: "Action", group: "Most common", label: "Receive request", description: "Capture an incoming request, order, ticket, or form that starts or feeds the process.", icon: MessageSquare, kind: "task", data: { label: "Receive request", owner: ["Intake team", "Process owner"], inputType: "Email", output: "Logged request / new case", toolRole: "receives", producesData: true, automationLevel: 2, hitl: "" } },
  { category: "Action", group: "More", label: "Collect / capture details", description: "Gather and enter the information needed to work the item, from a form, email, or conversation.", icon: ClipboardCheck, kind: "task", data: { label: "Collect / capture details", owner: ["Operations", "Any team member"], inputType: "Manual Entry", output: "Completed intake record", toolRole: "creates", producesData: true, automationLevel: 1, hitl: "" } },
  { category: "Action", group: "More", label: "Check / verify details", description: "Confirm the information is present, correct, and complete before continuing.", icon: ClipboardCheck, kind: "task", data: { label: "Check / verify details", owner: ["Operations", "Reviewer"], inputType: "System Record", output: "Verified record", toolRole: "reads", producesData: false, automationLevel: 1, hitl: "" } },
  { category: "Action", group: "Most common", label: "Create record", description: "Open a new record such as a customer, ticket, order, or case in a system of record.", icon: Square, kind: "task", data: { label: "Create record", owner: ["Operations"], inputType: "Manual Entry", output: "New system record", toolRole: "creates", producesData: true, automationLevel: 2, hitl: "" } },
  { category: "Action", group: "Most common", label: "Update record", description: "Change or add information to an existing record to reflect the latest status.", icon: RotateCw, kind: "task", data: { label: "Update record", owner: ["Operations"], inputType: "System Record", output: "Updated record", toolRole: "updates", producesData: true, automationLevel: 2, hitl: "" } },
  { category: "Action", group: "Most common", label: "Assign owner / task", description: "Route the item to the right person, team, or queue to take the next action.", icon: UserCheck, kind: "handoff", data: { label: "Assign owner / task", owner: ["Team lead", "Manager"], inputType: "Routing", output: "Assigned task", toolRole: "updates", producesData: true, automationLevel: 2, hitl: "" } },
  { category: "Action", group: "More", label: "Request information", description: "Ask a customer, colleague, or third party for missing details or documents.", icon: Send, kind: "task", data: { label: "Request information", owner: ["Any team member"], inputType: "Email", output: "Outbound request / pending reply", toolRole: "sends", producesData: false, automationLevel: 2, hitl: "" } },
  { category: "Action", group: "More", label: "Send email / message", description: "Send a message to a person or group as part of the process.", icon: Send, kind: "task", data: { label: "Send email / message", owner: ["Any team member"], inputType: "Email", output: "Sent message", toolRole: "sends", producesData: false, automationLevel: 3, hitl: "" } },
  { category: "Action", group: "Most common", label: "Notify stakeholder", description: "Alert an interested party that something happened or needs attention.", icon: MessageSquare, kind: "task", data: { label: "Notify stakeholder", owner: ["System", "Process owner"], inputType: "Routing", output: "Notification sent", toolRole: "notifies", producesData: false, automationLevel: 3, hitl: "" } },
  { category: "Action", group: "More", label: "Schedule activity", description: "Book a meeting, call, task, or future date so the work happens at the right time.", icon: Circle, kind: "task", data: { label: "Schedule activity", owner: ["Any team member"], inputType: "Manual Entry", output: "Scheduled event", toolRole: "creates", producesData: true, automationLevel: 2, hitl: "" } },
  { category: "Action", group: "Advanced", label: "Log activity", description: "Record that an action took place, for audit, tracking, or reporting.", icon: Database, kind: "task", data: { label: "Log activity", owner: ["System", "Any team member"], inputType: "System Record", output: "Activity log entry", toolRole: "creates", producesData: true, automationLevel: 3, hitl: "" } },
  { category: "Action", group: "More", label: "Close item", description: "Mark the request, ticket, case, or order as completed and resolved.", icon: CheckCircle2, kind: "task", data: { label: "Close item", owner: ["Operations"], inputType: "System Record", output: "Closed record", toolRole: "updates", producesData: true, automationLevel: 2, hitl: "" } },

  { category: "Data transformation", group: "Most common", label: "Extract data", description: "Pull specific fields or values out of a document, email, or system into a structured form.", icon: Database, kind: "task", data: { label: "Extract data", owner: ["Operations", "System"], inputType: "File/PDF", output: "Structured fields", toolRole: "reads", producesData: true, automationLevel: 3, hitl: "" } },
  { category: "Data transformation", group: "Most common", label: "Clean data", description: "Standardize and fix formatting, remove blanks, and correct obvious errors.", icon: Database, kind: "task", data: { label: "Clean data", owner: ["Operations", "System"], inputType: "System Record", output: "Cleaned dataset", toolRole: "updates", producesData: true, automationLevel: 2, hitl: "" } },
  { category: "Data transformation", group: "Most common", label: "Validate data", description: "Check data against rules or required formats and flag anything that fails.", icon: ClipboardCheck, kind: "task", data: { label: "Validate data", owner: ["System", "Operations"], inputType: "System Record", output: "Validation result / flagged records", toolRole: "reads", producesData: true, automationLevel: 3, hitl: "" } },
  { category: "Data transformation", group: "More", label: "Enrich data", description: "Add extra detail from another source to make a record more complete.", icon: Database, kind: "task", data: { label: "Enrich data", owner: ["System", "Operations"], inputType: "System Record", output: "Enriched record", toolRole: "updates", producesData: true, automationLevel: 3, hitl: "" } },
  { category: "Data transformation", group: "Most common", label: "Match records", description: "Link related records together so the process treats them as connected.", icon: GitBranch, kind: "task", data: { label: "Match records", owner: ["System", "Operations"], inputType: "System Record", output: "Matched/linked records", toolRole: "updates", producesData: true, automationLevel: 3, hitl: "" } },
  { category: "Data transformation", group: "Advanced", label: "Deduplicate records", description: "Find and merge or remove duplicate entries so there is one clean version.", icon: GitBranch, kind: "task", data: { label: "Deduplicate records", owner: ["System", "Operations"], inputType: "System Record", output: "De-duplicated dataset", toolRole: "updates", producesData: true, automationLevel: 3, hitl: "" } },
  { category: "Data transformation", group: "Most common", label: "Calculate values", description: "Compute totals, taxes, scores, durations, or other derived numbers.", icon: Database, kind: "task", data: { label: "Calculate values", owner: ["System", "Finance"], inputType: "System Record", output: "Calculated values", toolRole: "creates", producesData: true, automationLevel: 3, hitl: "" } },
  { category: "Data transformation", group: "Advanced", label: "Convert format", description: "Change data or a file from one format, unit, or currency to another.", icon: FileQuestion, kind: "task", data: { label: "Convert format", owner: ["System"], inputType: "File/PDF", output: "Converted file/values", toolRole: "exports", producesData: true, automationLevel: 3, hitl: "" } },
  { category: "Data transformation", group: "Advanced", label: "Aggregate data", description: "Combine many records into grouped totals or a single consolidated view.", icon: Database, kind: "task", data: { label: "Aggregate data", owner: ["System", "Finance"], inputType: "System Record", output: "Aggregated dataset", toolRole: "creates", producesData: true, automationLevel: 3, hitl: "" } },
  { category: "Data transformation", group: "More", label: "Store dataset", description: "Save structured data to the right system or table for later use.", icon: Database, kind: "task", data: { label: "Store dataset", owner: ["System"], inputType: "System Record", output: "Saved dataset", toolRole: "stores", producesData: true, automationLevel: 3, hitl: "" } },
  { category: "Data transformation", group: "Advanced", label: "Export data", description: "Produce a data extract for another system, team, or report.", icon: Send, kind: "task", data: { label: "Export data", owner: ["System", "Operations"], inputType: "System Record", output: "Exported file/feed", toolRole: "exports", producesData: true, automationLevel: 3, hitl: "" } },

  { category: "Flow", group: "Most common", label: "If / condition", description: "Split the process into different paths based on a yes/no or true/false condition.", icon: Diamond, kind: "decision", data: { label: "If / condition", owner: ["Process owner"], inputType: "Routing", output: "Branch taken", toolRole: "reads", producesData: false, automationLevel: 4, hitl: "" } },
  { category: "Flow", group: "More", label: "Route (multi-way)", description: "Send the item down one of several paths based on a category or value.", icon: Diamond, kind: "decision", data: { label: "Route (multi-way)", owner: ["Process owner"], inputType: "Routing", output: "Selected route", toolRole: "reads", producesData: false, automationLevel: 3, hitl: "" } },
  { category: "Flow", group: "Most common", label: "Merge paths", description: "Bring multiple branches back together into a single continuing path.", icon: GitBranch, kind: "merge", data: { label: "Merge paths", owner: ["Process owner"], inputType: "Routing", output: "Single combined path", toolRole: "custom", producesData: false, automationLevel: 4, hitl: "" } },
  { category: "Flow", group: "Advanced", label: "Parallel path (split)", description: "Run two or more activities at the same time instead of one after another.", icon: GitBranch, kind: "decision", data: { label: "Parallel path (split)", owner: ["Process owner"], inputType: "Routing", output: "Parallel branches", toolRole: "custom", producesData: false, automationLevel: 3, hitl: "" } },
  { category: "Flow", group: "Most common", label: "Handoff", description: "Pass the work from one person or team to another to continue.", icon: RotateCw, kind: "handoff", data: { label: "Handoff", owner: ["Team lead"], inputType: "Routing", output: "Work transferred", toolRole: "notifies", producesData: false, automationLevel: 2, hitl: "" } },
  { category: "Flow", group: "Most common", label: "Wait / delay", description: "Pause the process until a time passes or an event occurs.", icon: Circle, kind: "task", data: { label: "Wait / delay", owner: ["System"], inputType: "Routing", output: "Resumed after wait", toolRole: "custom", producesData: false, automationLevel: 4, hitl: "" } },
  { category: "Flow", group: "Advanced", label: "Retry", description: "Attempt a failed step again, up to a set number of times, before giving up.", icon: RotateCw, kind: "decision", data: { label: "Retry", owner: ["System"], inputType: "Routing", output: "Retried / failed-out", toolRole: "custom", producesData: false, automationLevel: 4, hitl: "" } },
  { category: "Flow", group: "Advanced", label: "Loop / repeat check", description: "Repeat a step for each item, or until a condition is met.", icon: GitBranch, kind: "decision", data: { label: "Loop / repeat check", owner: ["System"], inputType: "Routing", output: "Loop completed", toolRole: "custom", producesData: false, automationLevel: 4, hitl: "" } },
  { category: "Flow", group: "More", label: "Exception path", description: "Divert to a special handling path when something is wrong or unusual.", icon: FileQuestion, kind: "decision", data: { label: "Exception path", owner: ["Process owner"], inputType: "Routing", output: "Exception branch", toolRole: "custom", producesData: false, automationLevel: 2, hitl: "" } },
  { category: "Flow", group: "Most common", label: "Return for correction", description: "Send the item back to a previous step or person to fix and resubmit.", icon: RotateCw, kind: "handoff", data: { label: "Return for correction", owner: ["Reviewer"], inputType: "Routing", output: "Returned item", toolRole: "notifies", producesData: false, automationLevel: 2, hitl: "" } },

  { category: "Human review", group: "Most common", label: "Approve request", description: "A person authorizes the item to proceed.", icon: UserCheck, kind: "approval", data: { label: "Approve request", owner: ["Manager", "Approver"], inputType: "System Record", output: "Approval decision", toolRole: "approves", producesData: true, automationLevel: 0, hitl: "human_approval" } },
  { category: "Human review", group: "More", label: "Reject / decline", description: "A person declines the item and stops or returns it.", icon: Diamond, kind: "decision", data: { label: "Reject / decline", owner: ["Manager", "Approver"], inputType: "System Record", output: "Rejection decision", toolRole: "approves", producesData: true, automationLevel: 0, hitl: "human_approval" } },
  { category: "Human review", group: "Most common", label: "Review exception", description: "A person examines a flagged or unusual case and decides what to do.", icon: FileQuestion, kind: "task", data: { label: "Review exception", owner: ["Reviewer", "Specialist"], inputType: "System Record", output: "Exception decision", toolRole: "reads", producesData: true, automationLevel: 0, hitl: "human_review" } },
  { category: "Human review", group: "Most common", label: "Validate data", description: "A person checks that extracted or entered data is correct before it is used.", icon: ClipboardCheck, kind: "task", data: { label: "Validate data", owner: ["Reviewer", "Operations"], inputType: "System Record", output: "Verified data", toolRole: "reads", producesData: true, automationLevel: 1, hitl: "human_review" } },
  { category: "Human review", group: "More", label: "Sign off", description: "A person gives formal final approval, often for compliance or completion.", icon: UserCheck, kind: "approval", data: { label: "Sign off", owner: ["Manager", "Executive"], inputType: "System Record", output: "Sign-off record", toolRole: "approves", producesData: true, automationLevel: 0, hitl: "human_approval" } },
  { category: "Human review", group: "More", label: "Request clarification", description: "A reviewer asks for more detail before deciding.", icon: Send, kind: "task", data: { label: "Request clarification", owner: ["Reviewer"], inputType: "Email", output: "Clarification request", toolRole: "sends", producesData: false, automationLevel: 1, hitl: "human_review" } },
  { category: "Human review", group: "Most common", label: "Escalate issue", description: "Raise the item to a higher authority or specialist when it cannot be resolved at the current level.", icon: RotateCw, kind: "handoff", data: { label: "Escalate issue", owner: ["Team lead", "Manager"], inputType: "Routing", output: "Escalated case", toolRole: "notifies", producesData: false, automationLevel: 1, hitl: "human_review" } },
  { category: "Human review", group: "Most common", label: "Confirm completion", description: "A person confirms the work is finished and meets requirements.", icon: CheckCircle2, kind: "task", data: { label: "Confirm completion", owner: ["Reviewer", "Process owner"], inputType: "System Record", output: "Completion confirmed", toolRole: "approves", producesData: true, automationLevel: 1, hitl: "human_review" } },
  { category: "Human review", group: "Advanced", label: "Quality check (QA review)", description: "A person reviews work for quality and accuracy before it goes out.", icon: ClipboardCheck, kind: "task", data: { label: "Quality check (QA review)", owner: ["Reviewer", "QA"], inputType: "System Record", output: "QA result", toolRole: "reads", producesData: true, automationLevel: 1, hitl: "human_review" } },

  { category: "Data transformation", group: "Most common", label: "Summarize information", description: "Condense long text, a thread, or notes into the key points for a person to use.", icon: ClipboardCheck, kind: "task", data: { label: "Summarize information", owner: [], inputType: "Email", output: "Summary of key points", toolRole: "creates", producesData: true, automationLevel: 1, hitl: "human_review", assistantOpportunity: true } },
  { category: "Data transformation", group: "Most common", label: "Classify request", description: "Assign an item to a category, type, queue, or label based on its content.", icon: ClipboardCheck, kind: "task", data: { label: "Classify request", owner: [], inputType: "Email", output: "Category or label", toolRole: "creates", producesData: true, automationLevel: 1, hitl: "human_review", assistantOpportunity: true } },
  { category: "Data transformation", group: "Most common", label: "Extract details from document", description: "Read a document or message and pull out the fields needed to continue.", icon: FileQuestion, kind: "task", data: { label: "Extract details from document", owner: [], inputType: "File/PDF", output: "Extracted details", toolRole: "reads", producesData: true, automationLevel: 1, hitl: "human_review", assistantOpportunity: true } },
  { category: "Action", group: "More", label: "Draft response for review", description: "Prepare a reply, message, or document draft for a person to check before sending.", icon: MessageSquare, kind: "task", data: { label: "Draft response for review", owner: [], inputType: "Email", output: "Draft response", toolRole: "creates", producesData: true, automationLevel: 1, hitl: "human_review", assistantOpportunity: true } },
  { category: "Flow", group: "More", label: "Recommend next action", description: "Review the item and decide what should happen next.", icon: GitBranch, kind: "task", data: { label: "Recommend next action", owner: [], inputType: "System Record", output: "Recommended next step", toolRole: "reads", producesData: true, automationLevel: 1, hitl: "human_review", assistantOpportunity: true } },
  { category: "Data transformation", group: "Advanced", label: "Detect anomalies", description: "Flag items that look unusual or out of pattern for a closer human review.", icon: FileQuestion, kind: "task", data: { label: "Detect anomalies", owner: [], inputType: "System Record", output: "Items flagged for review", toolRole: "reads", producesData: true, automationLevel: 1, hitl: "human_review", assistantOpportunity: true } },
  { category: "Flow", group: "More", label: "Score priority", description: "Rank or score items so the most important work is handled first.", icon: GitBranch, kind: "task", data: { label: "Score priority", owner: [], inputType: "System Record", output: "Priority score", toolRole: "creates", producesData: true, automationLevel: 1, hitl: "human_review", assistantOpportunity: true } },
  { category: "Data transformation", group: "Advanced", label: "Identify duplicates", description: "Find records that likely refer to the same person, company, item, or case.", icon: GitBranch, kind: "task", data: { label: "Identify duplicates", owner: [], inputType: "System Record", output: "Duplicate candidates", toolRole: "reads", producesData: true, automationLevel: 1, hitl: "human_review", assistantOpportunity: true } },
  { category: "Action", group: "More", label: "Generate checklist", description: "Prepare a tailored list of steps, checks, or requirements for a case.", icon: ClipboardCheck, kind: "task", data: { label: "Generate checklist", owner: [], inputType: "System Record", output: "Checklist", toolRole: "creates", producesData: true, automationLevel: 1, hitl: "human_review", assistantOpportunity: true } },
  { category: "Data transformation", group: "Advanced", label: "Translate", description: "Convert text from one language to another for a person to use or review.", icon: MessageSquare, kind: "task", data: { label: "Translate", owner: [], inputType: "Email", output: "Translated text", toolRole: "creates", producesData: true, automationLevel: 1, hitl: "human_review", assistantOpportunity: true } },
  { category: "Flow", group: "More", label: "Triage and route request", description: "Read an incoming item and decide where it should go and how urgent it is.", icon: GitBranch, kind: "handoff", data: { label: "Triage and route request", owner: [], inputType: "Email", output: "Routing and priority decision", toolRole: "updates", producesData: true, automationLevel: 1, hitl: "human_review", assistantOpportunity: true } },
  { category: "Action", group: "Advanced", label: "Find answer from knowledge base", description: "Search approved documents or FAQs and prepare an answer with supporting sources.", icon: FileQuestion, kind: "task", data: { label: "Find answer from knowledge base", owner: [], inputType: "System Record", output: "Answer with sources", toolRole: "reads", producesData: true, automationLevel: 1, hitl: "human_review", assistantOpportunity: true } },

  { category: "Output", group: "Most common", label: "Generate document", description: "Produce a finished document such as a contract, letter, or certificate from a template.", icon: Send, kind: "output", data: { label: "Generate document", owner: ["System", "Operations"], inputType: "System Record", output: "Generated document", toolRole: "creates", producesData: true, automationLevel: 3, hitl: "" } },
  { category: "Output", group: "Most common", label: "Create report", description: "Compile data into a formatted report for people to read.", icon: Send, kind: "output", data: { label: "Create report", owner: ["System", "Finance"], inputType: "System Record", output: "Report", toolRole: "creates", producesData: true, automationLevel: 3, hitl: "" } },
  { category: "Output", group: "More", label: "Send invoice", description: "Issue an invoice to a customer.", icon: Send, kind: "output", data: { label: "Send invoice", owner: ["Finance"], inputType: "System Record", output: "Sent invoice", toolRole: "sends", producesData: true, automationLevel: 3, hitl: "" } },
  { category: "Output", group: "More", label: "Update dashboard", description: "Refresh a live dashboard or tracker with the latest figures.", icon: Send, kind: "output", data: { label: "Update dashboard", owner: ["System"], inputType: "System Record", output: "Updated dashboard", toolRole: "updates", producesData: true, automationLevel: 4, hitl: "" } },
  { category: "Output", group: "Advanced", label: "Publish result", description: "Make the outcome available to others by posting or releasing it.", icon: Send, kind: "output", data: { label: "Publish result", owner: ["System", "Operations"], inputType: "System Record", output: "Published output", toolRole: "sends", producesData: true, automationLevel: 3, hitl: "" } },
  { category: "Output", group: "Most common", label: "Store file", description: "Save the final document or file to the right location for the record.", icon: Database, kind: "output", data: { label: "Store file", owner: ["System"], inputType: "File/PDF", output: "Stored file", toolRole: "stores", producesData: true, automationLevel: 3, hitl: "" } },
  { category: "Output", group: "Advanced", label: "Archive record", description: "Move a completed record to long-term storage.", icon: Database, kind: "output", data: { label: "Archive record", owner: ["System"], inputType: "System Record", output: "Archived record", toolRole: "stores", producesData: true, automationLevel: 4, hitl: "" } },
  { category: "Output", group: "Most common", label: "Send confirmation", description: "Tell the requester or customer that the process is complete.", icon: MessageSquare, kind: "output", data: { label: "Send confirmation", owner: ["System"], inputType: "Email", output: "Confirmation sent", toolRole: "sends", producesData: false, automationLevel: 4, hitl: "" } },
  { category: "Output", group: "Most common", label: "Create task / follow-up", description: "Create a follow-up task or reminder for a person or team.", icon: Square, kind: "output", data: { label: "Create task / follow-up", owner: ["System", "Process owner"], inputType: "System Record", output: "Created task", toolRole: "creates", producesData: true, automationLevel: 3, hitl: "" } },
  { category: "Output", group: "More", label: "End", description: "Mark the end of the process path.", icon: Circle, kind: "end", data: { label: "End", owner: ["Process owner"], inputType: "Routing", output: "Process complete", toolRole: "custom", producesData: false, automationLevel: 4, hitl: "" } },
];

const manualProfile: DataProfile = {
  structure: "unstructured",
  accessibility: "manual",
  sensitivity: "internal",
  ownership: "Step owner",
  source: "inherited",
};

const kindIcon: Record<NodeKind, LucideIcon> = {
  trigger: CircleDot,
  task: Square,
  decision: Diamond,
  approval: CheckCircle2,
  handoff: RotateCw,
  output: Send,
  merge: GitBranch,
  end: Circle,
};

function nodeKindLabel(kind: NodeKind) {
  return kind === "decision" ? "If" : kind.charAt(0).toUpperCase() + kind.slice(1);
}

const nodeTypes = { processNode: ProcessNode, stickyNode: StickyNode };
const edgeTypes = { insertEdge: InsertEdge };

export const Route = createFileRoute("/app/$workspaceSlug/build/process/new")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    template: typeof search.template === "string" ? search.template : undefined,
    templateSlug: typeof search.templateSlug === "string" ? search.templateSlug : undefined,
  }),
  // No-op loader gives TanStack Router a match entry to stream during SSR so
  // the client hydrator does not throw "Expected to find a match below the
  // root match in SPA mode". All real data is loaded client-side via the
  // useQuery hooks below.
  loader: () => ({}),
  component: NewProcessRoute,
  errorComponent: ({ error }) => (
    <>
      <Card className="rounded-[var(--r-md)] border-[var(--chalk)] bg-white p-8 text-center">
        <p className="font-display text-[30px] font-medium tracking-normal text-[var(--ichigo-navy)]">
          Process builder did not load
        </p>
        <p className="mx-auto mt-2 max-w-xl font-sans text-[15px] text-[var(--slate)]">
          {error.message || "Something interrupted the process builder. Refresh or start a new map."}
        </p>
      </Card>
    </>
  ),
});

function isProcessNode(node: BuilderNode | undefined): node is ProcessBuilderNode {
  return Boolean(node && node.type !== "stickyNode" && "kind" in node.data);
}

function emptyNode(kind: NodeKind, index: number, id = `${kind}-${Date.now()}-${index}`): ProcessBuilderNode {
  return hydrateNode({
    id,
    type: "processNode",
    position: { x: 120 + index * 180, y: 160 },
    data: {
      label: kind === "trigger" ? "Trigger" : kind === "end" ? "End" : kind === "merge" ? "Merge" : `New ${nodeKindLabel(kind).toLowerCase()}`,
      description: "",
      kind,
      triggerType: kind === "trigger" ? "manual" : undefined,
      triggerConfig: kind === "trigger" ? {} : undefined,
      owner: [],
      toolId: null,
      toolName: null,
      toolRole: undefined,
      toolActionId: null,
      toolActionName: null,
      toolActionObject: null,
      toolActionFamily: null,
      automationLevel: kind === "trigger" || kind === "end" || kind === "merge" ? 0 : 1,
      hitl: "human_review",
      inputType: kind === "handoff" ? "Routing" : "System Record",
      output: "",
      producesData: kind === "output",
      dataSourceId: null,
      dataProfile: manualProfile,
      dataQuality: "not_assessed",
      isDataCritical: false,
      assistantOpportunity: false,
    },
  }) as ProcessBuilderNode;
}

function readProcessBuilderDraft(): ProcessBuilderDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(processBuilderDraftKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ProcessBuilderDraft>;
    if (parsed.version !== 1 || !parsed.frame || !parsed.globalPass) return null;
    const nodes = Array.isArray(parsed.nodes)
      ? parsed.nodes.map((node) => (isProcessNode(node as BuilderNode) ? hydrateNode(node) : node as BuilderNode))
      : [];
    const edges = Array.isArray(parsed.edges) ? parsed.edges : [];
    return {
      version: 1,
      savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : new Date().toISOString(),
      step:
        parsed.step === "start" ||
        parsed.step === "diagram" ||
        parsed.step === "submit"
          ? parsed.step
          : "frame",
      frame: { ...defaultFrame, ...parsed.frame },
      globalPass: { ...defaultGlobalPass, ...parsed.globalPass },
      nodes,
      edges,
      selectedId: typeof parsed.selectedId === "string" ? parsed.selectedId : "",
      selectedEdgeId: typeof parsed.selectedEdgeId === "string" ? parsed.selectedEdgeId : "",
      layoutDirection: parsed.layoutDirection === "DOWN" ? "DOWN" : "RIGHT",
      showToolTiles: parsed.showToolTiles !== false,
    };
  } catch {
    return null;
  }
}

function hasMeaningfulDraftContent(draft: Pick<ProcessBuilderDraft, "frame" | "globalPass" | "nodes" | "edges">) {
  return Boolean(
    draft.frame.name.trim() ||
      draft.frame.objective.trim() ||
      draft.frame.successMetric.trim() ||
      draft.frame.departmentId ||
      draft.globalPass.outputCriticality.length ||
      draft.nodes.length ||
      draft.edges.length,
  );
}

function templateToBuilderState(template: ProcessTemplate): { nodes: BuilderNode[]; edges: BuilderEdge[]; error?: string } {
  const rawNodes = Array.isArray(template.templateJson.nodes) ? template.templateJson.nodes : [];
  const rawEdges = Array.isArray(template.templateJson.edges) ? template.templateJson.edges : [];
  if (!rawNodes.length) {
    return { nodes: [], edges: [], error: "This template could not be loaded. Please choose another template." };
  }

  const idMap = new Map<string, string>();
  const timestamp = Date.now();
  // Maps the seed template_json's flat node.type (e.g. "start", "task",
  // "decision", "end") onto the builder's NodeKind set. Falls back to a
  // generic "task" for unknown values so we never silently drop a node.
  const mapKind = (raw: unknown): NodeKind | null => {
    if (typeof raw !== "string") return null;
    const value = raw.toLowerCase();
    const alias: Record<string, NodeKind> = {
      start: "trigger",
      trigger: "trigger",
      task: "task",
      step: "task",
      action: "task",
      decision: "decision",
      gateway: "decision",
      approval: "approval",
      approve: "approval",
      handoff: "handoff",
      output: "output",
      result: "output",
      merge: "merge",
      join: "merge",
      end: "end",
      stop: "end",
      finish: "end",
    };
    return alias[value] ?? (nodeKinds.includes(value as NodeKind) ? (value as NodeKind) : null);
  };
  const nodes = rawNodes
    .map((rawNode, index) => {
      if (!rawNode || typeof rawNode !== "object") return null;
      const node = rawNode as Partial<BuilderNode> & {
        data?: Partial<BuilderData>;
        label?: string;
        description?: string;
      };
      const isSticky = node.type === "stickyNode";
      // Seed templates use a flat {id,type,label} shape; React Flow exports
      // use {type:"processNode", data:{kind,label,...}}. Accept either.
      const kindCandidate = node.data?.kind ?? (node.type !== "processNode" && !isSticky ? node.type : undefined);
      const kind = isSticky ? null : mapKind(kindCandidate);
      if (!isSticky && !kind) return null;
      const labelFromTop = typeof node.label === "string" ? node.label : undefined;
      const descriptionFromTop = typeof node.description === "string" ? node.description : undefined;
      const oldId = typeof node.id === "string" ? node.id : `template-node-${index}`;
      const newId = `template-${timestamp}-${index}`;
      idMap.set(oldId, newId);
      if (!isSticky && kind) {
        const baseNode = emptyNode(kind, index, newId);
        const incomingData: any = node.data ?? {};
        const label = incomingData.label ?? labelFromTop ?? baseNode.data.label;
        const description = incomingData.description ?? descriptionFromTop ?? baseNode.data.description ?? "";
        const triggerType = kind === "trigger" ? incomingData.triggerType ?? "manual" : incomingData.triggerType;
        const triggerConfig =
          kind === "trigger"
            ? incomingData.triggerConfig ?? {}
            : incomingData.triggerConfig;

        return hydrateNode({
          ...baseNode,
          ...node,
          id: newId,
          type: "processNode",
          position: node.position ?? { x: 120 + index * 260, y: 180 },
          data: {
            ...baseNode.data,
            ...incomingData,
            kind,
            label,
            description,
            triggerType,
            triggerConfig,
            owner: [],
            toolId: incomingData.toolId ?? null,
            toolName: incomingData.toolName ?? null,
            toolActionId: incomingData.toolActionId ?? null,
            toolActionName: incomingData.toolActionName ?? null,
            toolActionObject: incomingData.toolActionObject ?? null,
            toolActionFamily: incomingData.toolActionFamily ?? null,
            dataSourceId: incomingData.dataSourceId ?? null,
            dataProfile: incomingData.dataProfile ?? baseNode.data.dataProfile,
            dataQuality: incomingData.dataQuality ?? baseNode.data.dataQuality,
            templateSuggested: true,
          },
        } as BuilderNode);
      }

      return hydrateNode({
        ...node,
        id: newId,
        type: "stickyNode",
        position: node.position ?? { x: 120 + index * 260, y: 180 },
        data: {
          ...(node.data ?? {}),
          text: (node.data as StickyData | undefined)?.text ?? descriptionFromTop ?? labelFromTop ?? "Template note",
          category: (node.data as StickyData | undefined)?.category ?? "observation",
          templateSuggested: true,
        },
      } as BuilderNode);
    })
    .filter((node): node is BuilderNode => Boolean(node));

  const processNodes = nodes.filter(isProcessNode);
  const hasTrigger = processNodes.some((node) => node.data.kind === "trigger");
  let injectedTriggerId = "";
  if (!hasTrigger) {
    const trigger = emptyNode("trigger", 0, `template-${timestamp}-trigger`);
    trigger.data = {
      ...trigger.data,
      label: "Manual trigger",
      templateSuggested: true,
    };
    injectedTriggerId = trigger.id;
    nodes.unshift(trigger);
  }

  const edges = rawEdges
    .map((rawEdge, index) => {
      if (!rawEdge || typeof rawEdge !== "object") return null;
      const edgeInput = rawEdge as Partial<BuilderEdge> & { from?: string; to?: string };
      const sourceKey = typeof edgeInput.source === "string"
        ? edgeInput.source
        : typeof edgeInput.from === "string" ? edgeInput.from : undefined;
      const targetKey = typeof edgeInput.target === "string"
        ? edgeInput.target
        : typeof edgeInput.to === "string" ? edgeInput.to : undefined;
      const source = sourceKey ? idMap.get(sourceKey) : undefined;
      const target = targetKey ? idMap.get(targetKey) : undefined;
      if (!source || !target) return null;
      return normalizeEdge({
        ...edgeInput,
        id: `template-edge-${timestamp}-${index}`,
        source,
        target,
      } as BuilderEdge);
    })
    .filter((item): item is BuilderEdge => Boolean(item));

  const normalizedProcessNodes = nodes.filter(isProcessNode);
  const workNodes = normalizedProcessNodes.filter((node) => !["trigger", "end", "merge"].includes(node.data.kind));
  if (!workNodes.length) {
    return { nodes, edges, error: "This template could not be loaded. Please choose another template." };
  }
  if (injectedTriggerId && !edges.some((item) => item.source === injectedTriggerId)) {
    edges.unshift(normalizeEdge(edge(injectedTriggerId, workNodes[0].id)));
  }

  return { nodes, edges };
}

function NewProcessRoute() {
  return (
    <>
      <ReactFlowProvider>
        <ProcessBuilder />
      </ReactFlowProvider>
    </>
  );
}

function ProcessBuilder() {
  const navigate = useNavigate();
  const templateSearch = Route.useSearch();
  // When the user arrives here via "Start with this template" from the
  // Template Library, treat it as an explicit "new diagram" intent: ignore any
  // saved draft, clear it from storage, and skip the replace-draft confirm in
  // applyProcessTemplate below.
  const arrivedWithTemplateRef = useRef<boolean>(
    Boolean(templateSearch.template || templateSearch.templateSlug),
  );
  const restoredDraft = useMemo(() => {
    if (arrivedWithTemplateRef.current) {
      if (typeof window !== "undefined") {
        try {
          window.localStorage.removeItem(processBuilderDraftKey);
        } catch {
          // ignore
        }
      }
      return null;
    }
    return readProcessBuilderDraft();
  }, []);
  const departmentsQuery = useDepartments();
  const toolsQuery = useTools();
  const toolCatalogQuery = useToolCatalog();
  const dataSourcesQuery = useDataSources();
  const membersQuery = useMembers();
  const processTemplatesQuery = useProcessTemplates();
  const createProcess = useCreateSubmittedProcess();
  const [step, setStep] = useState<BuilderStep>(restoredDraft?.step ?? "start");
  const [selectedId, setSelectedId] = useState<string>(restoredDraft?.selectedId ?? "");
  const [selectedEdgeId, setSelectedEdgeId] = useState<string>(restoredDraft?.selectedEdgeId ?? "");
  const [frame, setFrame] = useState(restoredDraft?.frame ?? defaultFrame);
  const [globalPass, setGlobalPass] = useState(restoredDraft?.globalPass ?? defaultGlobalPass);
  const [nodes, setNodes] = useState<BuilderNode[]>(restoredDraft?.nodes ?? []);
  const [edges, setEdges] = useState<BuilderEdge[]>(restoredDraft?.edges ?? []);
  const [triggerPickerOpen, setTriggerPickerOpen] = useState(false);
  const [startPanel, setStartPanel] = useState<StartPanelMode>(null);
  const [openTriggerOnDiagram, setOpenTriggerOnDiagram] = useState(false);
  const [templateApplyError, setTemplateApplyError] = useState<string | null>(null);
  const [nodePickerTarget, setNodePickerTarget] = useState<NodePickerTarget | null>(null);
  const [layoutDirection, setLayoutDirection] = useState<LayoutDirection>(restoredDraft?.layoutDirection ?? "RIGHT");
  const [showToolTiles, setShowToolTiles] = useState(restoredDraft?.showToolTiles ?? true);
  const [draftStatus, setDraftStatus] = useState<"restored" | "saved" | "idle">(restoredDraft ? "restored" : "idle");
  const historyRef = useRef<DiagramSnapshot[]>([]);
  const futureRef = useRef<DiagramSnapshot[]>([]);
  const appliedTemplateSearchRef = useRef<string | null>(null);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const selectedIdRef = useRef(selectedId);
  const selectedEdgeIdRef = useRef(selectedEdgeId);
  const frameRef = useRef<Record<string, any>>(frame);
  const globalPassRef = useRef<Record<string, any>>(globalPass);
  const [historyTick, setHistoryTick] = useState(0);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    selectedEdgeIdRef.current = selectedEdgeId;
  }, [selectedEdgeId]);

  useEffect(() => {
    frameRef.current = frame;
  }, [frame]);

  useEffect(() => {
    globalPassRef.current = globalPass;
  }, [globalPass]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const draft: ProcessBuilderDraft = {
      version: 1,
      savedAt: new Date().toISOString(),
      step,
      frame,
      globalPass,
      nodes,
      edges,
      selectedId,
      selectedEdgeId,
      layoutDirection,
      showToolTiles,
    };

    const timer = window.setTimeout(() => {
      if (!hasMeaningfulDraftContent(draft)) {
        window.localStorage.removeItem(processBuilderDraftKey);
        setDraftStatus("idle");
        return;
      }
      window.localStorage.setItem(processBuilderDraftKey, JSON.stringify(draft));
      setDraftStatus("saved");
    }, 700);

    return () => window.clearTimeout(timer);
  }, [edges, frame, globalPass, layoutDirection, nodes, selectedEdgeId, selectedId, showToolTiles, step]);

  const departments = departmentsQuery.data ?? [];
  const tools = toolsQuery.data ?? [];
  const toolCatalog = toolCatalogQuery.data ?? [];
  const dataSources = dataSourcesQuery.data ?? [];
  const members = membersQuery.data ?? [];
  const processTemplates = processTemplatesQuery.data ?? [];
  const selected = nodes.find((node) => node.id === selectedId);
  const selectedProcessNode = isProcessNode(selected) ? selected : undefined;
  const derivedFromDiagram = useMemo(() => deriveDiagram(nodes), [nodes]);
  const derivedData = useMemo(() => deriveStepData(nodes), [nodes]);
  const derivedEndpoints = useMemo(() => deriveProcessEndpoints(nodes), [nodes]);
  const engineFrame = useMemo(
    () => ({ ...frame, trigger: derivedEndpoints.trigger, output: derivedEndpoints.output }),
    [derivedEndpoints.output, derivedEndpoints.trigger, frame],
  );
  const riskTier = useMemo(
    () => classifyRiskTier({ frame: engineFrame, globalPass, derivedFromDiagram, derivedData }),
    [engineFrame, globalPass, derivedFromDiagram, derivedData],
  );
  const scores = useMemo(
    () => scoreProcess({ derivedFromDiagram, derivedData, globalPass }),
    [derivedFromDiagram, derivedData, globalPass],
  );

  const applyDiagram = useCallback((next: DiagramSnapshot) => {
    const nextFrame = next.frame ?? frameRef.current;
    const nextGlobalPass = next.globalPass ?? globalPassRef.current;
    nodesRef.current = next.nodes;
    edgesRef.current = next.edges;
    selectedIdRef.current = next.selectedId;
    selectedEdgeIdRef.current = next.selectedEdgeId;
    frameRef.current = nextFrame;
    globalPassRef.current = nextGlobalPass;
    setNodes(next.nodes);
    setEdges(next.edges);
    setSelectedId(next.selectedId);
    setSelectedEdgeId(next.selectedEdgeId);
    setFrame(nextFrame as typeof frame);
    setGlobalPass(nextGlobalPass as typeof globalPass);
    setHistoryTick((tick) => tick + 1);
  }, []);

  const snapshot = useCallback((): DiagramSnapshot => ({
    nodes: nodesRef.current,
    edges: edgesRef.current,
    selectedId: selectedIdRef.current,
    selectedEdgeId: selectedEdgeIdRef.current,
    frame: frameRef.current,
    globalPass: globalPassRef.current,
  }), []);

  const commitDiagram = useCallback((next: DiagramSnapshot) => {
    historyRef.current = [...historyRef.current.slice(-49), snapshot()];
    futureRef.current = [];
    applyDiagram(next);
  }, [applyDiagram, snapshot]);

  const discardDraft = useCallback(() => {
    if (typeof window !== "undefined") window.localStorage.removeItem(processBuilderDraftKey);
    historyRef.current = [];
    futureRef.current = [];
    setLayoutDirection("RIGHT");
    setShowToolTiles(true);
    setStep("start");
    setStartPanel(null);
    setOpenTriggerOnDiagram(false);
    setTriggerPickerOpen(false);
    setTemplateApplyError(null);
    setDraftStatus("idle");
    applyDiagram({
      nodes: [],
      edges: [],
      selectedId: "",
      selectedEdgeId: "",
      frame: defaultFrame,
      globalPass: defaultGlobalPass,
    });
  }, [applyDiagram]);

  useEffect(() => {
    if (step !== "diagram" || !openTriggerOnDiagram || nodesRef.current.length > 0) return;
    setTriggerPickerOpen(true);
    setOpenTriggerOnDiagram(false);
  }, [openTriggerOnDiagram, step]);

  const undo = useCallback(() => {
    const previous = historyRef.current.pop();
    if (!previous) return;
    futureRef.current = [snapshot(), ...futureRef.current.slice(0, 49)];
    applyDiagram(previous);
  }, [applyDiagram, snapshot]);

  const redo = useCallback(() => {
    const next = futureRef.current.shift();
    if (!next) return;
    historyRef.current = [...historyRef.current.slice(-49), snapshot()];
    applyDiagram(next);
  }, [applyDiagram, snapshot]);

  const deleteSelected = useCallback(() => {
    const selectedNode = nodesRef.current.find((node) => node.id === selectedIdRef.current);
    if (!selectedNode) {
      const selectedEdge = edgesRef.current.find((item) => item.id === selectedEdgeIdRef.current);
      if (!selectedEdge) return;

      commitDiagram({
        nodes: nodesRef.current,
        edges: edgesRef.current.filter((item) => item.id !== selectedEdge.id),
        selectedId: selectedIdRef.current,
        selectedEdgeId: "",
      });
      return;
    }

    if (!isProcessNode(selectedNode)) {
      commitDiagram({
        nodes: nodesRef.current.filter((node) => node.id !== selectedNode.id),
        edges: edgesRef.current,
        selectedId: "",
        selectedEdgeId: "",
      });
      return;
    }

    const incoming = edgesRef.current.filter((item) => item.target === selectedNode.id);
    const outgoing = edgesRef.current.filter((item) => item.source === selectedNode.id);
    const reconnectedEdges =
      incoming.length === 1 && outgoing.length === 1
        ? [edge(incoming[0].source, outgoing[0].target)]
        : [];

    commitDiagram({
      nodes: nodesRef.current.filter((node) => node.id !== selectedNode.id),
      edges: edgesRef.current
        .filter((item) => item.source !== selectedNode.id && item.target !== selectedNode.id)
        .concat(reconnectedEdges),
      selectedId: reconnectedEdges[0]?.target ?? "",
      selectedEdgeId: "",
    });
  }, [commitDiagram]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const isUndo = (event.metaKey || event.ctrlKey) && key === "z" && !event.shiftKey;
      const isRedo =
        ((event.metaKey || event.ctrlKey) && key === "z" && event.shiftKey) ||
        ((event.metaKey || event.ctrlKey) && key === "y");
      const isDelete = key === "backspace" || key === "delete";

      if (!isUndo && !isRedo && !isDelete) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable='true']")) return;
      event.preventDefault();
      if (isUndo) undo();
      if (isRedo) redo();
      if (isDelete) deleteSelected();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteSelected, redo, undo]);

  useEffect(() => {
    const onOpenNodePicker = (event: Event) => {
      setNodePickerTarget((event as CustomEvent<OpenNodePickerDetail>).detail);
    };

    window.addEventListener(openNodePickerEvent, onOpenNodePicker);
    return () => window.removeEventListener(openNodePickerEvent, onOpenNodePicker);
  }, []);

  const onNodesChange = useCallback((changes: NodeChange<BuilderNode>[]) => {
    const meaningful = changes.some((change) => change.type !== "select" && change.type !== "dimensions");
    const nextNodes = applyNodeChanges(changes, nodesRef.current);
    if (meaningful) {
      commitDiagram({ nodes: nextNodes, edges: edgesRef.current, selectedId: selectedIdRef.current, selectedEdgeId: selectedEdgeIdRef.current });
    } else {
      setNodes(nextNodes);
    }
  }, [commitDiagram]);

  const onEdgesChange = useCallback((changes: EdgeChange<BuilderEdge>[]) => {
    const meaningful = changes.some((change) => change.type !== "select");
    const nextEdges = applyEdgeChanges(changes, edgesRef.current);
    if (meaningful) {
      commitDiagram({ nodes: nodesRef.current, edges: nextEdges, selectedId: selectedIdRef.current, selectedEdgeId: selectedEdgeIdRef.current });
    } else {
      setEdges(nextEdges);
    }
  }, [commitDiagram]);

  const updateSelected = (next: BuilderNode) => {
    if (!isProcessNode(next)) return;
    commitDiagram({
      nodes: nodesRef.current.map((node) => (node.id === next.id ? hydrateNode(next) : node)),
      edges: edgesRef.current,
      selectedId: next.id,
      selectedEdgeId: "",
    });
  };

  const onConnect = (connection: Connection) => {
    if (!connection.source || !connection.target) return;
    if (connection.source === connection.target) return;
    if (edgesRef.current.some((item) => item.source === connection.source && item.target === connection.target)) return;
    const sourceNode = nodesRef.current.find((node) => node.id === connection.source);
    const targetNode = nodesRef.current.find((node) => node.id === connection.target);
    if (!isProcessNode(sourceNode) || !isProcessNode(targetNode)) return;
    if (sourceNode.data.kind === "merge" && edgesRef.current.some((item) => item.source === sourceNode.id)) return;
    commitDiagram({
      nodes: nodesRef.current,
      edges: addEdge(edge(connection.source, connection.target), edgesRef.current),
      selectedId: selectedIdRef.current,
      selectedEdgeId: "",
    });
  };

  const addNodeForTarget = useCallback((target: NodePickerTarget, kind: NodeKind, data: Partial<BuilderData> = {}) => {
    if (target.mode === "insert") {
      const newId = `${kind}-${Date.now()}`;
      const nextNode = hydrateNode({
        ...emptyNode(kind, 0, newId),
        position: { x: target.x - 90, y: target.y - 36 },
        selected: true,
        data: { ...emptyNode(kind, 0, newId).data, ...data },
      });
      commitDiagram({
        nodes: [...nodesRef.current.map((node): BuilderNode => ({ ...node, selected: false })), nextNode],
        edges: edgesRef.current.filter((item) => item.id !== target.edgeId).concat(edge(target.source, newId), edge(newId, target.target)),
        selectedId: newId,
        selectedEdgeId: "",
      });
      return;
    }

    const explicitSource = nodesRef.current.find((node) => isProcessNode(node) && node.id === target.sourceId);
    const sourceNode =
      explicitSource ??
      nodesRef.current.find((node) => isProcessNode(node) && node.id === selectedIdRef.current && node.data.kind !== "end") ??
      nodesRef.current.find((node) => isProcessNode(node) && node.data.kind === "trigger") ??
      [...nodesRef.current].reverse().find((node) => isProcessNode(node) && node.data.kind !== "end");
    if (!sourceNode) return;

    const outgoing = edgesRef.current.find((item) => item.source === sourceNode.id);
    const targetNode = outgoing ? nodesRef.current.find((node) => node.id === outgoing.target) : undefined;
    const newId = `${kind}-${Date.now()}`;
    const nextX = targetNode ? (sourceNode.position.x + targetNode.position.x) / 2 : sourceNode.position.x + 220;
    const branchOffset = target.mode === "branch" ? 120 : 0;
    const nextY = targetNode ? (sourceNode.position.y + targetNode.position.y) / 2 + branchOffset : sourceNode.position.y + branchOffset;
    const baseNode = emptyNode(kind, 0, newId);
    const nextNode = hydrateNode({
      ...baseNode,
      position: { x: nextX, y: nextY },
      selected: true,
      data: { ...baseNode.data, ...data },
    });
    const firstEdge = edge(sourceNode.id, newId);
    const labelledFirstEdge = target.mode === "branch" && target.label ? { ...firstEdge, label: target.label } : firstEdge;

    commitDiagram({
      nodes: [...nodesRef.current.map((node): BuilderNode => ({ ...node, selected: false })), nextNode],
      edges: edgesRef.current
        .filter((item) => (target.mode === "branch" ? true : item.id !== outgoing?.id))
        .concat(target.mode !== "branch" && outgoing ? [labelledFirstEdge, edge(newId, outgoing.target)] : [labelledFirstEdge]),
      selectedId: newId,
      selectedEdgeId: "",
    });
  }, [commitDiagram]);

  const addToolStepForTarget = useCallback((target: NodePickerTarget, tool: { id: string; name: string; catalog_id?: string | null; data_stored?: string | null; integration_status?: number | null; api_available?: boolean | null }, action?: ToolActionCatalogRow | null) => {
    const source = dataSources.find((item) => item.tool_id === tool.id);
    const catalog = tool.catalog_id ? toolCatalog.find((item) => item.id === tool.catalog_id) : undefined;
    const catalogProfile = catalogProfileDefaults(catalog);
    const profile = catalogProfile ?? profileFrom(tool, source);
    const actionRole = action ? roleFromToolAction(action) : undefined;
    const actionOutput = action ? outputFromToolAction(action) : "";
    addNodeForTarget(target, "task", {
      label: action?.business_action ?? `Use ${tool.name}`,
      description: action?.business_use_case ?? "",
      toolId: tool.id,
      toolName: tool.name,
      toolRole: actionRole ?? "custom",
      toolActionId: action?.id ?? null,
      toolActionName: action?.business_action ?? null,
      toolActionObject: action?.business_object ?? null,
      toolActionFamily: action?.action_family ?? null,
      dataSourceId: source?.id ?? null,
      dataProfile: { ...profile, source: catalogProfile ? "ai_suggested" : "inherited" },
      dataQuality: qualityFrom(source?.reliability),
      inputType: source ? "System Record" : "Manual Entry",
      output: actionOutput,
    });
  }, [addNodeForTarget, dataSources, toolCatalog]);

  const addTemplateAfterSelected = useCallback((template: (typeof stepTemplates)[number]) => {
    const sourceNode =
      nodesRef.current.find((node) => isProcessNode(node) && node.id === selectedIdRef.current && node.data.kind !== "end") ??
      nodesRef.current.find((node) => isProcessNode(node) && node.data.kind === "trigger") ??
      [...nodesRef.current].reverse().find((node) => isProcessNode(node) && node.data.kind !== "end");
    if (!sourceNode) return;

    const outgoing = edgesRef.current.find((item) => item.source === sourceNode.id);
    const targetNode = outgoing ? nodesRef.current.find((node) => node.id === outgoing.target) : undefined;
    const newId = `${template.kind}-${Date.now()}`;
    const nextX = targetNode ? (sourceNode.position.x + targetNode.position.x) / 2 : sourceNode.position.x + 220;
    const nextY = targetNode ? (sourceNode.position.y + targetNode.position.y) / 2 : sourceNode.position.y + 90;
    const baseNode = emptyNode(template.kind, 0, newId);
    const nextNode = hydrateNode({
      ...baseNode,
      position: { x: nextX, y: nextY },
      selected: true,
      data: { ...baseNode.data, ...template.data },
    });

    commitDiagram({
      nodes: [...nodesRef.current.map((node): BuilderNode => ({ ...node, selected: false })), nextNode],
      edges: edgesRef.current
        .filter((item) => item.id !== outgoing?.id)
        .concat(outgoing ? [edge(sourceNode.id, newId), edge(newId, outgoing.target)] : [edge(sourceNode.id, newId)]),
      selectedId: newId,
      selectedEdgeId: "",
    });
  }, [commitDiagram]);

  const createTrigger = useCallback((input: { triggerType: TriggerType; toolId?: string | null; toolName?: string | null; eventName?: string; toolActionId?: string | null; toolActionName?: string | null }) => {
    const tool = input.toolId ? tools.find((item) => item.id === input.toolId) : undefined;
    const toolName = input.toolName ?? tool?.name ?? "Tool";
    const label =
      input.triggerType === "manual"
        ? "Manual trigger"
        : input.triggerType === "schedule"
          ? "Schedule trigger"
          : `${toolName} — ${(input.eventName ?? "event").replaceAll("_", " ")}`;
    const triggerNode = hydrateNode({
      ...emptyNode("trigger", 0, `trigger-${Date.now()}`),
      position: { x: 160, y: 180 },
      selected: true,
      data: {
        ...(emptyNode("trigger", 0, `trigger-${Date.now()}`) as ProcessBuilderNode).data,
        label,
        kind: "trigger",
        triggerType: input.triggerType,
        triggerConfig:
          input.triggerType === "schedule"
              ? { scheduleKind: "interval", interval: "1 day" }
            : input.triggerType === "event"
              ? { toolId: input.toolId ?? tool?.id ?? null, toolName, eventName: input.eventName ?? "message_received", toolActionId: input.toolActionId ?? null, toolActionName: input.toolActionName ?? null }
              : {},
      },
    });

    commitDiagram({
      nodes: nodesRef.current.map((node) => ({ ...node, selected: false })).concat({ ...triggerNode, selected: triggerNode.selected ?? false }),
      edges: edgesRef.current,
      selectedId: triggerNode.id,
      selectedEdgeId: "",
    });
    setTriggerPickerOpen(false);
  }, [commitDiagram, tools]);

  const applyAssistantPatch = useCallback(async (patch: DiagramPatch) => {
    const result = applyPatch(
      {
        frame: frameRef.current,
        globalPass: globalPassRef.current,
        nodes: nodesRef.current as DiagramPatchState["nodes"],
        edges: edgesRef.current as DiagramPatchState["edges"],
      },
      patch,
    );
    const needsLayout = result.applied.some((item) => ["add_node", "delete_node", "insert_node_after", "add_branch"].includes(item.op));
    const nextEdges = (result.state.edges as BuilderEdge[]).map(normalizeEdge);
    const nextNodes = needsLayout
      ? await layoutNodes(result.state.nodes as BuilderNode[], nextEdges, layoutDirection)
      : result.state.nodes as BuilderNode[];
    const lastNodeId = [...result.applied].reverse().find((item) => item.detail && nodesRef.current.every((node) => node.id !== item.detail))?.detail;

    commitDiagram({
      nodes: nextNodes,
      edges: nextEdges,
      selectedId: lastNodeId ?? selectedIdRef.current,
      selectedEdgeId: "",
      frame: result.state.frame,
      globalPass: result.state.globalPass,
    });

    return { applied: result.applied, rejected: result.rejected };
  }, [commitDiagram, layoutDirection]);

  const applyProcessTemplate = useCallback(async (template: ProcessTemplate, options?: { skipConfirm?: boolean }) => {
    setTemplateApplyError(null);
    try {
      const templateState = templateToBuilderState(template);
      if (templateState.error) {
        setTemplateApplyError(templateState.error);
        return false;
      }

      const hasExistingDraft = hasMeaningfulDraftContent({
        frame: frameRef.current as typeof defaultFrame,
        globalPass: globalPassRef.current as typeof defaultGlobalPass,
        nodes: nodesRef.current,
        edges: edgesRef.current,
      });
      if (!options?.skipConfirm && hasExistingDraft && typeof window !== "undefined") {
        const confirmed = window.confirm("Replace current draft with this template?");
        if (!confirmed) return false;
      }

      const nextNodes = await layoutNodes(templateState.nodes, templateState.edges, layoutDirection);
      const selectedWorkNode =
        nextNodes.find((node) => isProcessNode(node) && !["trigger", "end", "merge"].includes(node.data.kind)) ??
        nextNodes.find(isProcessNode);
      commitDiagram({
        nodes: nextNodes,
        edges: templateState.edges,
        selectedId: selectedWorkNode?.id ?? "",
        selectedEdgeId: "",
      });
      setFrame((current) => ({
        ...current,
        name: current.name.trim() ? current.name : template.name,
        family: template.category || current.family,
        objective: current.objective || template.description,
      }));
      setStartPanel(null);
      setTriggerPickerOpen(false);
      setStep("diagram");
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "This template could not be loaded. Please choose another template.";
      setTemplateApplyError(message);
      return false;
    }
  }, [commitDiagram, layoutDirection]);

  useEffect(() => {
    const requestedTemplate = templateSearch.template ?? templateSearch.templateSlug;
    if (!requestedTemplate || appliedTemplateSearchRef.current === requestedTemplate) return;
    let cancelled = false;

    const applyRequestedTemplate = async () => {
      const localTemplate = processTemplates.find((item) => item.id === requestedTemplate || item.slug === requestedTemplate);
      if (localTemplate) {
        appliedTemplateSearchRef.current = requestedTemplate;
        await applyProcessTemplate(localTemplate, { skipConfirm: true });
        return;
      }

      if (templateSearch.templateSlug) {
        try {
          const resolvedTemplate = await getProcessTemplateBySlug(templateSearch.templateSlug);
          if (cancelled) return;
          if (resolvedTemplate) {
            appliedTemplateSearchRef.current = requestedTemplate;
            await applyProcessTemplate(resolvedTemplate, { skipConfirm: true });
            return;
          }
        } catch (error) {
          if (cancelled) return;
          const message = error instanceof Error ? error.message : "This template could not be loaded. Please choose another template.";
          setTemplateApplyError(message);
          setStartPanel("template");
          return;
        }
      }

      if (processTemplatesQuery.isFetched) {
        setTemplateApplyError("This template could not be loaded. Please choose another template.");
        setStartPanel("template");
      }
    };

    void applyRequestedTemplate();
    return () => {
      cancelled = true;
    };
  }, [applyProcessTemplate, processTemplates, processTemplatesQuery.isFetched, templateSearch.template, templateSearch.templateSlug]);

  const readiness = useMemo(
    () => validateScoreReadiness({ frame: engineFrame, globalPass, nodes: nodes as DiagramPatchState["nodes"], edges: edges as DiagramPatchState["edges"] }),
    [edges, engineFrame, globalPass, nodes],
  );
  const assistantState = useMemo(
    () => ({ frame: engineFrame, globalPass, nodes: nodes as DiagramPatchState["nodes"], edges: edges as DiagramPatchState["edges"] }),
    [edges, engineFrame, globalPass, nodes],
  );

  const chooseManualStart = () => {
    setStartPanel(null);
    setTemplateApplyError(null);
    setOpenTriggerOnDiagram(true);
    setStep("frame");
  };

  const chooseTemplateStart = () => {
    setStartPanel("template");
    setTemplateApplyError(null);
    setTriggerPickerOpen(false);
  };

  const chooseAiStart = () => {
    setStartPanel("ai");
    setTemplateApplyError(null);
    setTriggerPickerOpen(false);
  };

  const submit = async () => {
    const processId = await createProcess.mutateAsync({
      name: frame.name,
      departmentId: frame.departmentId,
      frame: engineFrame,
      globalPass,
      diagram: { nodes, edges },
      derivedFromDiagram,
      derivedData,
      scores,
      steps: nodes
        .filter((node): node is ProcessBuilderNode => isProcessNode(node) && !["trigger", "end", "merge"].includes(node.data.kind))
        .map((node) => ({
          nodeId: node.id,
          label: node.data.label,
          kind: node.data.kind,
          actor: ownerDisplay(node.data),
          owner: node.data.owner ?? [],
          description: node.data.description,
          toolId: node.data.toolId,
          toolRole: node.data.toolRole,
          toolActionId: node.data.toolActionId,
          toolActionName: node.data.toolActionName,
          toolActionObject: node.data.toolActionObject,
          toolActionFamily: node.data.toolActionFamily,
          automationLevel: node.data.automationLevel,
          hitl: node.data.hitl,
          inputType: node.data.inputType,
          output: node.data.output,
          producesData: node.data.producesData,
          dataSourceId: node.data.dataSourceId,
          dataProfile: node.data.dataProfile,
          dataQuality: node.data.dataQuality,
          isDataCritical: node.data.isDataCritical,
          assistantOpportunity: node.data.assistantOpportunity,
        })),
    });
    if (typeof window !== "undefined") window.localStorage.removeItem(processBuilderDraftKey);
    await navigate({ to: "/process/$id", params: { id: processId } });
  };

  if (departmentsQuery.isLoading || toolsQuery.isLoading || dataSourcesQuery.isLoading || toolCatalogQuery.isLoading || membersQuery.isLoading || processTemplatesQuery.isLoading) {
    return <StateCard title="Loading builder" detail="Fetching departments, tools, data sources, and templates." />;
  }

  if (departmentsQuery.isError || toolsQuery.isError || dataSourcesQuery.isError || toolCatalogQuery.isError || membersQuery.isError || processTemplatesQuery.isError) {
    return (
      <StateCard
        title="Builder did not load"
        detail={(departmentsQuery.error ?? toolsQuery.error ?? dataSourcesQuery.error ?? toolCatalogQuery.error ?? membersQuery.error ?? processTemplatesQuery.error)?.message ?? "Please try again."}
      />
    );
  }

  const canUndo = historyTick >= 0 && historyRef.current.length > 0;
  const canRedo = historyTick >= 0 && futureRef.current.length > 0;
  const diagramReady = isDiagramSubmittable(nodes, edges);
  const processNodes = nodes.filter(isProcessNode);
  const hasTrigger = processNodes.some((node) => node.data.kind === "trigger");
  const hasWorkNode = processNodes.some((node) => !["trigger", "end", "merge"].includes(node.data.kind));
  const hasDraftContent = hasMeaningfulDraftContent({ frame, globalPass, nodes, edges });
  const submitBlockReason = !frame.name
    ? "Add a process name in Frame before submitting."
    : !frame.departmentId
      ? "Choose the owning department in Frame before submitting."
      : !hasTrigger
        ? "Add a trigger before submitting."
      : !hasWorkNode
        ? "Add at least one process step after the trigger before submitting."
      : !diagramReady
        ? "Connect every process step so it is reachable from a trigger."
        : undefined;

  return (
    <div className="space-y-5">
      <Card className="rounded-[var(--r-md)] border-[var(--chalk)] bg-white p-4">
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ichigo-orange)]">
                Process builder
              </p>
              <h1 className="mt-1 font-display text-[38px] font-medium tracking-normal">
                Diagram-first <span className="italic text-[var(--ichigo-orange)]">capture</span>
              </h1>
            </div>
            {hasDraftContent ? (
              <div className="flex items-center gap-2 rounded-[var(--r-md)] border border-[var(--chalk)] bg-[var(--paper)] px-3 py-2">
                <Save className="h-4 w-4 text-[var(--ichigo-orange)]" />
                <span className="font-sans text-[12px] text-[var(--slate)]">
                  {draftStatus === "restored" ? "Draft restored" : draftStatus === "saved" ? "Draft autosaved" : "Draft active"}
                </span>
                <button
                  type="button"
                  onClick={discardDraft}
                  className="font-sans text-[12px] font-semibold text-[var(--ichigo-orange)]"
                >
                  Discard
                </button>
              </div>
            ) : null}
          </div>
          {step !== "start" ? <BuilderStepper current={step} onSelect={setStep} /> : null}
        </div>
      </Card>

      {step === "start" ? (
        <StartStep
          templates={processTemplates}
          startPanel={startPanel}
          templateError={templateApplyError}
          assistantState={assistantState}
          onManual={chooseManualStart}
          onTemplate={chooseTemplateStart}
          onAiDraft={chooseAiStart}
          onApplyTemplate={applyProcessTemplate}
          onApplyAssistantPatch={async (patch) => {
            const result = await applyAssistantPatch(patch);
            if (result.applied.length) {
              setStartPanel(null);
              setStep("frame");
            }
            return result;
          }}
          onClosePanel={() => {
            setStartPanel(null);
            setTemplateApplyError(null);
          }}
        />
      ) : null}

      {step === "frame" ? (
        <FrameStep
          frame={frame}
          setFrame={setFrame}
          globalPass={globalPass}
          setGlobalPass={setGlobalPass}
          departments={departments}
          onNext={() => setStep("diagram")}
          currentStep={step}
          onNavigateStep={setStep}
        />
      ) : null}

      {step === "diagram" ? (
        <DiagramStep
          nodes={nodes}
          edges={edges}
          selected={selectedProcessNode}
          selectedEdgeId={selectedEdgeId}
          frame={engineFrame}
          globalPass={globalPass}
          tools={tools}
          processTemplates={processTemplates}
          toolCatalog={toolCatalog}
          dataSources={dataSources}
          members={members}
          triggerPickerOpen={triggerPickerOpen}
          derivedFromDiagram={derivedFromDiagram}
          derivedData={derivedData}
          readiness={readiness}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onSelect={(id) => {
            selectedIdRef.current = id;
            selectedEdgeIdRef.current = "";
            setSelectedId(id);
            setSelectedEdgeId("");
          }}
          onSelectEdge={(id) => {
            selectedIdRef.current = "";
            selectedEdgeIdRef.current = id;
            setSelectedId("");
            setSelectedEdgeId(id);
          }}
          onClearSelection={() => {
            selectedIdRef.current = "";
            selectedEdgeIdRef.current = "";
            setSelectedId("");
            setSelectedEdgeId("");
          }}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          onDelete={deleteSelected}
          onOpenNodePicker={(target) => setNodePickerTarget(target)}
          onAddTemplate={addTemplateAfterSelected}
          onOpenTriggerPicker={() => setTriggerPickerOpen(true)}
          onCloseTriggerPicker={() => setTriggerPickerOpen(false)}
          onCreateTrigger={createTrigger}
          onUpdateSelected={updateSelected}
          onApplyAssistantPatch={applyAssistantPatch}
          onApplyProcessTemplate={applyProcessTemplate}
          onLayout={async () => {
            const layouted = await layoutNodes(nodes, edges, layoutDirection);
            commitDiagram({ nodes: layouted, edges, selectedId: selectedIdRef.current, selectedEdgeId: selectedEdgeIdRef.current });
          }}
          layoutDirection={layoutDirection}
          showToolTiles={showToolTiles}
          onToggleToolTiles={() => setShowToolTiles((current) => !current)}
          onToggleLayoutDirection={() => setLayoutDirection((current) => current === "RIGHT" ? "DOWN" : "RIGHT")}
          onNext={() => setStep("submit")}
          currentStep={step}
          onNavigateStep={setStep}
        />
      ) : null}

      {step === "diagram" && nodePickerTarget ? (
        <NodeToolPicker
          target={nodePickerTarget}
          tools={tools}
          onClose={() => setNodePickerTarget(null)}
          onChooseKind={(target, kind, data) => {
            addNodeForTarget(target, kind, data);
            setNodePickerTarget(null);
          }}
          onChooseTool={(target, tool, action) => {
            addToolStepForTarget(target, tool, action);
            setNodePickerTarget(null);
          }}
          onAddTrigger={() => {
            setNodePickerTarget(null);
            setTriggerPickerOpen(true);
          }}
        />
      ) : null}

      {step === "submit" ? (
        <SubmitStep
          frame={engineFrame}
          derivedEndpoints={derivedEndpoints}
          derivedFromDiagram={derivedFromDiagram}
          derivedData={derivedData}
          riskTier={riskTier}
          scores={scores}
          readiness={readiness}
          disabled={!frame.name || !frame.departmentId || !diagramReady || createProcess.isPending}
          blockReason={submitBlockReason}
          pending={createProcess.isPending}
          error={createProcess.error?.message}
          onSubmit={submit}
          currentStep={step}
          onNavigateStep={setStep}
        />
      ) : null}
    </div>
  );
}

function BuilderStepper({ current, onSelect }: { current: BuilderStep; onSelect: (step: BuilderStep) => void }) {
  const currentIndex = builderSteps.findIndex((item) => item.id === current);

  return (
    <div className="relative grid gap-3 md:grid-cols-3">
      <div className="absolute left-[12%] right-[12%] top-6 hidden h-px bg-[var(--chalk)] md:block" />
      {builderSteps.map((item, index) => {
        const active = item.id === current;
        const complete = index < currentIndex;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`relative z-10 flex min-h-20 items-center gap-3 rounded-[var(--r-md)] border p-3 text-left transition ${
              active
                ? "border-[var(--ichigo-navy)] bg-[var(--ichigo-navy)] text-white shadow-sm"
                : complete
                  ? "border-[var(--ichigo-navy)] bg-white text-[var(--ichigo-navy)]"
                  : "border-[var(--chalk)] bg-[var(--paper)] text-[var(--slate)]"
            }`}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border font-mono text-[13px] ${
                active
                  ? "border-white bg-white text-[var(--ichigo-navy)]"
                  : complete
                    ? "border-[var(--ichigo-navy)] bg-[var(--ichigo-navy)] text-white"
                    : "border-[var(--chalk)] bg-white text-[var(--slate)]"
              }`}
            >
              {complete ? <Check className="h-4 w-4" /> : index + 1}
            </span>
            <span>
              <span className="block font-sans text-[14px] font-semibold">{item.label}</span>
              <span className={`mt-1 block font-sans text-[12px] ${active ? "text-white/75" : "text-[var(--slate)]"}`}>
                {item.caption}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function BuilderStageStepper({
  current,
  onSelect,
  className,
}: {
  current: BuilderStep;
  onSelect: (step: BuilderStep) => void;
  className?: string;
}) {
  const navSteps = builderSteps.filter((item) => item.id !== "start");
  const currentIndex = navSteps.findIndex((item) => item.id === current);
  return (
    <div className={`grid grid-cols-1 gap-3 sm:grid-cols-3 ${className ?? ""}`}>
      {navSteps.map((item, index) => {
        const active = item.id === current;
        const complete = currentIndex >= 0 && index < currentIndex;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`flex items-center gap-3 rounded-[var(--r-md)] border px-4 py-3 text-left transition ${
              active
                ? "border-[var(--ichigo-navy)] bg-[var(--ichigo-navy)] text-white shadow-sm"
                : complete
                  ? "border-[var(--chalk)] bg-white text-[var(--ichigo-navy)] hover:border-[var(--ichigo-navy)]"
                  : "border-[var(--chalk)] bg-white text-[var(--slate)] hover:border-[var(--ichigo-navy)] hover:text-[var(--ichigo-navy)]"
            }`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-[13px] font-semibold ${
                active
                  ? "bg-white text-[var(--ichigo-navy)]"
                  : complete
                    ? "bg-[var(--ichigo-navy)] text-white"
                    : "border border-[var(--chalk)] bg-[var(--paper)] text-[var(--slate)]"
              }`}
            >
              {complete ? <Check className="h-4 w-4" /> : index + 1}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="font-sans text-[14px] font-semibold leading-tight">{item.label}</span>
              <span
                className={`font-sans text-[12px] leading-tight ${
                  active ? "text-white/75" : "text-[var(--slate)]"
                }`}
              >
                {item.caption}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function FrameStep({
  frame,
  setFrame,
  globalPass,
  setGlobalPass,
  departments,
  onNext,
  currentStep,
  onNavigateStep,
}: {
  frame: Record<string, any>;
  setFrame: (frame: any) => void;
  globalPass: Record<string, any>;
  setGlobalPass: (value: any) => void;
  departments: Array<{ id: string; name: string }>;
  onNext: () => void;
  currentStep: BuilderStep;
  onNavigateStep: (step: BuilderStep) => void;
}) {
  const selectedCriticality = Array.isArray(globalPass.outputCriticality) ? globalPass.outputCriticality : [];
  const toggleCriticality = (value: string) => {
    const next = selectedCriticality.includes(value)
      ? selectedCriticality.filter((item: string) => item !== value)
      : [...selectedCriticality, value];
    setGlobalPass({ ...globalPass, outputCriticality: next });
  };

  return (
    <Card className="rounded-[var(--r-md)] border-[var(--chalk)] bg-white p-6">
      <div className="mb-5 border-b border-[var(--chalk)] pb-4">
        <BuilderStageStepper current={currentStep} onSelect={onNavigateStep} />
      </div>
      <div className="space-y-6">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ichigo-orange)]">Identity</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <TextInput label="Process name" value={frame.name} onChange={(name) => setFrame({ ...frame, name })} />
            <TextInput label="Process family" value={frame.family} onChange={(family) => setFrame({ ...frame, family })} />
            <TextInput label="Success metric" value={frame.successMetric} onChange={(successMetric) => setFrame({ ...frame, successMetric })} />
            <div className="space-y-2">
              <Label className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--slate)]">Department</Label>
              <Select value={frame.departmentId || "none"} onValueChange={(departmentId) => setFrame({ ...frame, departmentId: departmentId === "none" ? "" : departmentId })}>
                <SelectTrigger className="h-11 rounded-[var(--r-md)] border-[var(--chalk)] bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select department</SelectItem>
                  {departments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <TextArea label="Objective" value={frame.objective} onChange={(objective) => setFrame({ ...frame, objective })} />
          </div>
        </div>

        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ichigo-orange)]">Characterization</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--slate)]">Output criticality</Label>
              <div className="flex flex-wrap gap-2">
                {criticalityOptions.map(([value, label]) => {
                  const active = selectedCriticality.includes(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleCriticality(value)}
                      className={`rounded-full border px-3 py-2 font-sans text-[12px] font-medium ${
                        active
                          ? "border-[var(--ichigo-navy)] bg-[var(--ichigo-navy)] text-white"
                          : "border-[var(--chalk)] bg-[var(--ichigo-mist)] text-[var(--ichigo-navy)]"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <SelectField label="Impact if failure" value={globalPass.impactIfFailure} onChange={(impactIfFailure) => setGlobalPass({ ...globalPass, impactIfFailure })} options={[["low", "Low"], ["medium", "Medium"], ["high", "High"], ["critical", "Critical"]]} />
            <SelectField label="Error reversibility" value={globalPass.errorReversibility} onChange={(errorReversibility) => setGlobalPass({ ...globalPass, errorReversibility })} options={[["easy_to_reverse", "Easy to reverse"], ["manual_fix", "Manual fix"], ["hard_to_reverse", "Hard to reverse"], ["irreversible", "Irreversible"]]} />
            <SelectField label="Frequency" value={globalPass.frequency} onChange={(frequency) => setGlobalPass({ ...globalPass, frequency })} options={[["daily", "Daily"], ["weekly", "Weekly"], ["monthly", "Monthly"], ["quarterly", "Quarterly"]]} />
            <SelectField label="Standardization" value={globalPass.standardization} onChange={(standardization) => setGlobalPass({ ...globalPass, standardization })} options={[["low", "Low"], ["medium", "Medium"], ["high", "High"]]} />
            <TextInput label="Volume per cycle" type="number" value={String(globalPass.volume)} onChange={(value) => setGlobalPass({ ...globalPass, volume: Number(value) })} />
          </div>
        </div>
      </div>
      <Button onClick={onNext} className="mt-5 rounded-[var(--r-md)] bg-[var(--ichigo-orange)] text-white hover:bg-[var(--ichigo-orange)]/90">
        Continue to diagram
      </Button>
    </Card>
  );
}

function DiagramStep(props: {
  nodes: BuilderNode[];
  edges: BuilderEdge[];
  selected?: ProcessBuilderNode;
  selectedEdgeId: string;
  frame: Record<string, any>;
  globalPass: Record<string, any>;
  tools: Array<{ id: string; name: string; category?: string | null; catalog_id?: string | null; data_stored: string | null; integration_status: number | null; api_available: boolean | null }>;
  processTemplates: ProcessTemplate[];
  toolCatalog: ToolCatalogRow[];
  dataSources: Array<{ id: string; name: string; tool_id: string | null; data_type: string | null; accessibility: string | null; reliability: string | null; sensitivity_level: string | null; department_owner_id: string | null }>;
  members: MemberSuggestion[];
  triggerPickerOpen: boolean;
  derivedFromDiagram: ReturnType<typeof deriveDiagram>;
  derivedData: ReturnType<typeof deriveStepData>;
  readiness: ReturnType<typeof validateScoreReadiness>;
  onNodesChange: any;
  onEdgesChange: any;
  onConnect: (connection: Connection) => void;
  onSelect: (id: string) => void;
  onSelectEdge: (id: string) => void;
  onClearSelection: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onDelete: () => void;
  onOpenNodePicker: (target: NodePickerTarget) => void;
  onAddTemplate: (template: (typeof stepTemplates)[number]) => void;
  onOpenTriggerPicker: () => void;
  onCloseTriggerPicker: () => void;
  onCreateTrigger: (input: { triggerType: TriggerType; toolId?: string | null; toolName?: string | null; eventName?: string; toolActionId?: string | null; toolActionName?: string | null }) => void;
  onUpdateSelected: (node: ProcessBuilderNode) => void;
  onApplyAssistantPatch: (patch: DiagramPatch) => Promise<{ applied: OperationReport[]; rejected: OperationReport[] }>;
  onApplyProcessTemplate: (template: ProcessTemplate, options?: { skipConfirm?: boolean }) => boolean | void | Promise<boolean | void>;
  onLayout: () => void;
  layoutDirection: LayoutDirection;
  showToolTiles: boolean;
  onToggleToolTiles: () => void;
  onToggleLayoutDirection: () => void;
  onNext: () => void;
  currentStep: BuilderStep;
  onNavigateStep: (step: BuilderStep) => void;
}) {
  const [templateMenuOpen, setTemplateMenuOpen] = useState(false);
  const canDelete = Boolean(props.selected || props.selectedEdgeId);
  const { fitView } = useReactFlow();
  useEffect(() => {
    const id = window.setTimeout(() => {
      fitView({ padding: 0.25, duration: 300, minZoom: 0.6, maxZoom: 1.4 });
    }, 60);
    return () => window.clearTimeout(id);
  }, [fitView, props.nodes.length, props.edges.length, props.layoutDirection]);
  const toolById = useMemo(() => new Map(props.tools.map((tool) => [tool.id, tool])), [props.tools]);
  const catalogById = useMemo(() => new Map(props.toolCatalog.map((tool) => [tool.id, tool])), [props.toolCatalog]);
  const renderNodes = useMemo(
    () =>
      props.nodes.map((node) => {
        if (!isProcessNode(node)) return node;
        const outgoing = props.edges.filter((edge) => edge.source === node.id);
        const incoming = props.edges.filter((edge) => edge.target === node.id);
        const tool = node.data.toolId ? toolById.get(node.data.toolId) : undefined;
        const catalog = tool?.catalog_id ? catalogById.get(tool.catalog_id) : undefined;
        return {
          ...node,
          data: {
            ...node.data,
            ui: {
              outgoingCount: outgoing.length,
              incomingCount: incoming.length,
              branchLabels: outgoing.map((edge, index) => String(edge.label ?? (index === 0 ? "True" : "False"))),
              layoutDirection: props.layoutDirection,
              showToolTile: props.showToolTiles,
              toolCategory: tool?.category ?? catalog?.category ?? null,
              toolLogoUrl: toolCatalogLogoUrl(catalog),
              issues: nodeIssues(node, props.edges),
            },
          },
        };
      }),
    [catalogById, props.edges, props.layoutDirection, props.nodes, props.showToolTiles, toolById],
  );
  const assistantState = useMemo(
    () => ({ frame: props.frame, globalPass: props.globalPass, nodes: props.nodes as DiagramPatchState["nodes"], edges: props.edges as DiagramPatchState["edges"] }),
    [props.edges, props.frame, props.globalPass, props.nodes],
  );

  return (
    <div className="fixed inset-x-0 bottom-0 top-[56px] z-30 flex bg-[var(--paper)]">
      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="border-b border-[var(--chalk)] bg-white/90 px-4 py-3">
          <BuilderStageStepper current={props.currentStep} onSelect={props.onNavigateStep} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--chalk)] bg-white/90 p-4">
            <div className="flex min-w-0 flex-col gap-2">
              <p className="font-sans text-[12px] text-[var(--slate)]">Start with a trigger, then use the + controls to add steps, branches, joins, and tools.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Button type="button" variant="outline" onClick={() => setTemplateMenuOpen((current) => !current)} className="rounded-[var(--r-md)] border-[var(--chalk)]">
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  Templates
                </Button>
                {templateMenuOpen ? (
                  <div className="absolute right-0 top-12 z-50 w-60 rounded-[var(--r-md)] border border-[var(--chalk)] bg-white p-2 shadow-xl">
                    {stepTemplates.map((template) => (
                      <button
                        key={template.label}
                        type="button"
                        onClick={() => {
                          props.onAddTemplate(template);
                          setTemplateMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-[var(--r-sm)] px-3 py-2 text-left font-sans text-[13px] font-medium text-[var(--ichigo-navy)] hover:bg-[var(--paper)]"
                      >
                        <Square className="h-3.5 w-3.5 text-[var(--ichigo-orange)]" />
                        {template.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <Button type="button" variant="outline" disabled={!props.canUndo} onClick={props.onUndo} className="rounded-[var(--r-md)] border-[var(--chalk)]">
                <Undo2 className="mr-2 h-4 w-4" />
                Undo
              </Button>
              <Button type="button" variant="outline" disabled={!props.canRedo} onClick={props.onRedo} className="rounded-[var(--r-md)] border-[var(--chalk)]">
                <Redo2 className="mr-2 h-4 w-4" />
                Redo
              </Button>
              <Button type="button" variant="outline" disabled={!canDelete} onClick={props.onDelete} className="rounded-[var(--r-md)] border-[var(--chalk)] text-[var(--danger)]">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
              <Button type="button" variant="outline" onClick={props.onLayout} className="rounded-[var(--r-md)] border-[var(--chalk)]">
                <GitBranch className="mr-2 h-4 w-4" />
                Auto-layout
              </Button>
              <Button type="button" onClick={props.onNext} className="rounded-[var(--r-md)] bg-[var(--ichigo-orange)] text-white hover:bg-[var(--ichigo-orange)]/90">
                Review & submit
              </Button>
            </div>
        </div>
        <div className="relative min-h-0 flex-1 bg-[var(--paper)]">
            <ReactFlow
              nodes={renderNodes}
              edges={props.edges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onNodesChange={props.onNodesChange}
              onEdgesChange={props.onEdgesChange}
              onConnect={props.onConnect}
              onNodeClick={(_, node) => props.onSelect(node.id)}
              onEdgeClick={(_, edge) => props.onSelectEdge(edge.id)}
              onPaneClick={props.onClearSelection}
              onSelectionChange={({ nodes, edges }) => {
                if (nodes[0]) props.onSelect(nodes[0].id);
                else if (edges[0]) props.onSelectEdge(edges[0].id);
              }}
              className="h-full w-full"
              fitView
              fitViewOptions={{ padding: 0.25, minZoom: 0.6, maxZoom: 1.4 }}
              minZoom={0.4}
              maxZoom={1.75}
              defaultEdgeOptions={{ type: "smoothstep" }}
              proOptions={{ hideAttribution: true }}
            >
              <Background color="var(--chalk)" gap={22} size={1.2} />
              <CanvasToolbar
                canUndo={props.canUndo}
                canRedo={props.canRedo}
                canDelete={canDelete}
                layoutDirection={props.layoutDirection}
                showToolTiles={props.showToolTiles}
                onAdd={() => props.onOpenNodePicker({ mode: "append", sourceId: props.selected?.id })}
                onLayout={props.onLayout}
                onFit={() => fitView({ padding: 0.2, duration: 400 })}
                onUndo={props.onUndo}
                onRedo={props.onRedo}
                onDelete={props.onDelete}
                onToggleToolTiles={props.onToggleToolTiles}
                onToggleLayoutDirection={props.onToggleLayoutDirection}
              />
              <Controls className="!bottom-4 !left-4 !border !border-[var(--chalk)] !bg-white !shadow-sm" />
              <MiniMap className="!border !border-[var(--chalk)] !bg-white/90" maskColor="rgba(250,250,247,0.72)" nodeColor="var(--ichigo-navy)" />
            </ReactFlow>
            {props.nodes.length === 0 ? (
              <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                <button
                  type="button"
                  onClick={props.onOpenTriggerPicker}
                  className="pointer-events-auto flex h-40 w-48 flex-col items-center justify-center rounded-[var(--r-md)] border-2 border-dashed border-[var(--chalk)] bg-white/90 font-sans text-[var(--ichigo-navy)] shadow-xl backdrop-blur transition hover:border-[var(--ichigo-orange)] hover:text-[var(--ichigo-orange)]"
                >
                  <Plus className="h-8 w-8" />
                  <span className="mt-3 text-[15px] font-semibold">Add a trigger</span>
                </button>
              </div>
            ) : null}
            {props.triggerPickerOpen ? (
              <TriggerPicker
                tools={props.tools}
                hasTrigger={props.nodes.some((node) => isProcessNode(node) && node.data.kind === "trigger")}
                onCreate={props.onCreateTrigger}
                onClose={props.onCloseTriggerPicker}
              />
            ) : null}
            {props.nodes.length > 0 ? (
              <div className="pointer-events-none absolute bottom-4 right-4 z-30 w-[min(420px,calc(100%-2rem))]">
                <div className="pointer-events-auto">
                  <CopilotDrawer state={assistantState} onApplyPatch={props.onApplyAssistantPatch} />
                </div>
              </div>
            ) : null}
        </div>
        <div className="border-t border-[var(--chalk)] bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 p-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--slate)]">Readiness / activity</p>
                <p className="font-sans text-[12px] text-[var(--slate)]">
                  {props.readiness.passed}/{props.readiness.total} checks passed · {props.readiness.confidence} confidence
                </p>
              </div>
              <div className="grid flex-1 gap-2 sm:grid-cols-4">
                <Metric label="steps" value={props.derivedFromDiagram.stepCount} />
                <Metric label="if points" value={props.derivedFromDiagram.decisionPoints} />
                <Metric label="automation" value={`L${props.derivedFromDiagram.automationCeiling}`} />
                <Metric label="data" value={props.derivedData.dataReadiness} />
              </div>
            </div>
        </div>
      </div>
      {props.selected ? (
        <aside className="flex w-[360px] shrink-0 flex-col overflow-y-auto border-l border-[var(--chalk)] bg-white">
          <SidePanel
            node={props.selected}
            tools={props.tools}
            toolCatalog={props.toolCatalog}
            dataSources={props.dataSources}
            members={props.members}
            onChange={props.onUpdateSelected}
          />
        </aside>
      ) : null}
    </div>
  );
}

function StartStep({
  templates,
  startPanel,
  templateError,
  assistantState,
  onManual,
  onTemplate,
  onAiDraft,
  onApplyTemplate,
  onApplyAssistantPatch,
  onClosePanel,
}: {
  templates: ProcessTemplate[];
  startPanel: StartPanelMode;
  templateError: string | null;
  assistantState: DiagramPatchState;
  onManual: () => void;
  onTemplate: () => void;
  onAiDraft: () => void;
  onApplyTemplate: (template: ProcessTemplate, options?: { skipConfirm?: boolean }) => boolean | void | Promise<boolean | void>;
  onApplyAssistantPatch: (patch: DiagramPatch) => Promise<{ applied: OperationReport[]; rejected: OperationReport[] }>;
  onClosePanel: () => void;
}) {
  return (
    <Card className="relative min-h-[620px] overflow-hidden rounded-[var(--r-md)] border-[var(--chalk)] bg-[var(--paper)] p-6">
      <div className="flex min-h-[560px] items-center justify-center">
        <StartChoiceOverlay onManual={onManual} onAiDraft={onAiDraft} onTemplate={onTemplate} />
      </div>
      {startPanel === "template" ? (
        <ProcessTemplateStartPanel
          templates={templates}
          error={templateError}
          onApply={onApplyTemplate}
          onClose={onClosePanel}
        />
      ) : null}
      {startPanel === "ai" ? (
        <AIDraftStartPanel
          state={assistantState}
          onApplyPatch={onApplyAssistantPatch}
          onClose={onClosePanel}
        />
      ) : null}
    </Card>
  );
}

function StartChoiceOverlay({ onManual, onAiDraft, onTemplate }: { onManual: () => void; onAiDraft: () => void; onTemplate: () => void }) {
  return (
    <div className="pointer-events-auto w-full max-w-4xl rounded-[var(--r-md)] border border-[var(--chalk)] bg-white/95 p-5 shadow-2xl backdrop-blur">
      <div className="text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ichigo-orange)]">Start mapping</p>
        <h3 className="mt-2 font-display text-[30px] font-medium text-[var(--ichigo-navy)]">How would you like to build this process?</h3>
        <p className="mx-auto mt-2 max-w-xl font-sans text-[14px] leading-6 text-[var(--slate)]">
          Start manually with a trigger, let AI draft a first map, or copy a reusable process template and adapt it to your company.
        </p>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <button
          type="button"
          onClick={onManual}
          className="group rounded-[var(--r-md)] border border-[var(--chalk)] bg-white p-5 text-left shadow-sm transition hover:border-[var(--ichigo-orange)] hover:bg-[var(--paper)]"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-[var(--r-sm)] border border-[var(--chalk)] bg-[var(--paper)] text-[var(--ichigo-orange)] group-hover:border-[var(--ichigo-orange)]">
            <Plus className="h-5 w-5" />
          </span>
          <span className="mt-4 block font-sans text-[16px] font-semibold text-[var(--ichigo-navy)]">Build manually</span>
          <span className="mt-1 block font-sans text-[13px] leading-5 text-[var(--slate)]">
            Choose a trigger, then add each step, branch, tool, and approval yourself.
          </span>
        </button>
        <button
          type="button"
          onClick={onTemplate}
          className="group rounded-[var(--r-md)] border border-[var(--chalk)] bg-white p-5 text-left shadow-sm transition hover:border-[var(--ichigo-orange)] hover:bg-[var(--paper)]"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-[var(--r-sm)] border border-[var(--chalk)] bg-[var(--paper)] text-[var(--ichigo-orange)] group-hover:border-[var(--ichigo-orange)]">
            <ClipboardCheck className="h-5 w-5" />
          </span>
          <span className="mt-4 block font-sans text-[16px] font-semibold text-[var(--ichigo-navy)]">Start from template</span>
          <span className="mt-1 block font-sans text-[13px] leading-5 text-[var(--slate)]">
            Copy a starter blueprint into this canvas. You will adapt owners, tools, outputs, volume, reliability, and criticality.
          </span>
        </button>
        <button
          type="button"
          onClick={onAiDraft}
          className="group rounded-[var(--r-md)] border border-[var(--ichigo-orange)] bg-[var(--paper)] p-5 text-left shadow-sm transition hover:bg-white"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-[var(--r-sm)] bg-[var(--ichigo-orange)] text-white">
            <Bot className="h-5 w-5" />
          </span>
          <span className="mt-4 block font-sans text-[16px] font-semibold text-[var(--ichigo-navy)]">Draft with AI</span>
          <span className="mt-1 block font-sans text-[13px] leading-5 text-[var(--slate)]">
            Explain the workflow in plain language. AI proposes a map, then you confirm the missing business details.
          </span>
        </button>
      </div>
    </div>
  );
}

function ProcessTemplateStartPanel({
  templates,
  error,
  onApply,
  onClose,
}: {
  templates: ProcessTemplate[];
  error?: string | null;
  onApply: (template: ProcessTemplate) => boolean | void | Promise<boolean | void>;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-y-0 right-0 z-40 flex w-full max-w-[460px] flex-col border-l border-[var(--chalk)] bg-white shadow-2xl">
      <div className="border-b border-[var(--chalk)] bg-[var(--paper)] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ichigo-orange)]">Template library</p>
            <h3 className="mt-1 flex items-center gap-2 font-display text-[26px] font-medium text-[var(--ichigo-navy)]">
              <ClipboardCheck className="h-6 w-6 text-[var(--ichigo-orange)]" />
              Start from template
            </h3>
            <p className="mt-1 font-sans text-[13px] leading-5 text-[var(--slate)]">
              Templates are starting points. You will adapt owners, tools, outputs, volume, data reliability, and criticality before submitting.
            </p>
          </div>
          <IconButton label="Close template library" icon={X} onClick={onClose} />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {error ? (
          <p className="mb-3 rounded-[var(--r-md)] bg-[var(--danger)]/10 p-3 font-sans text-[13px] text-[var(--danger)]">
            {error}
          </p>
        ) : null}
        <ProcessTemplateBrowser templates={templates} onApply={onApply} actionLabel="Start" showHeader={false} />
      </div>
    </div>
  );
}

function AIDraftStartPanel({
  state,
  onApplyPatch,
  onClose,
}: {
  state: DiagramPatchState;
  onApplyPatch: (patch: DiagramPatch) => Promise<{ applied: OperationReport[]; rejected: OperationReport[] }>;
  onClose: () => void;
}) {
  const assistant = useDiagramAssistant();
  const [description, setDescription] = useState("");
  const [departmentHint, setDepartmentHint] = useState("");
  const [toolsHint, setToolsHint] = useState("");
  const [exceptionsHint, setExceptionsHint] = useState("");
  const [patch, setPatch] = useState<DiagramPatch | null>(null);
  const [reports, setReports] = useState<{ applied: OperationReport[]; rejected: OperationReport[] } | null>(null);

  const requestDraft = async () => {
    const processDescription = description.trim();
    if (!processDescription) return;
    setReports(null);
    const prompt = [
      "Draft an initial process map from this description.",
      "Create only the process structure: trigger, business steps, If branches, approvals, handoffs, merge points, outputs, and tool/action suggestions when clearly supported.",
      "Do not finalize owner, expected output, frequency, volume, data reliability, output criticality, impact if failure, or error reversibility. Put those as questions for the user.",
      `Process description: ${processDescription}`,
      departmentHint.trim() ? `Department/team context: ${departmentHint.trim()}` : "",
      toolsHint.trim() ? `Tools mentioned by the user: ${toolsHint.trim()}` : "",
      exceptionsHint.trim() ? `Known exceptions/approvals: ${exceptionsHint.trim()}` : "",
    ].filter(Boolean).join("\n\n");
    const nextPatch = await assistant.mutateAsync({ mode: "build", message: prompt, state });
    setPatch(nextPatch);
  };

  const applyDraft = async () => {
    if (!patch) return;
    const result = await onApplyPatch(patch);
    setReports(result);
    if (result.applied.length) onClose();
  };

  return (
    <div className="absolute inset-y-0 right-0 z-40 flex w-full max-w-[430px] flex-col border-l border-[var(--chalk)] bg-white shadow-2xl">
      <div className="border-b border-[var(--chalk)] bg-[var(--paper)] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ichigo-orange)]">AI process builder</p>
            <h3 className="mt-1 flex items-center gap-2 font-display text-[26px] font-medium text-[var(--ichigo-navy)]">
              <Bot className="h-6 w-6 text-[var(--ichigo-orange)]" />
              Draft with AI
            </h3>
            <p className="mt-1 font-sans text-[13px] leading-5 text-[var(--slate)]">
              AI drafts the map. You still confirm owner, output, frequency, reliability, and criticality.
            </p>
          </div>
          <IconButton label="Close AI builder" icon={X} onClick={onClose} />
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <div className="space-y-2">
          <Label className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--slate)]">Describe the process</Label>
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Example: When an invoice arrives by email, Finance checks it, matches it to the purchase order, asks for manager approval if over €5,000, records it in QuickBooks, then stores the PDF in Google Drive."
            className="min-h-36 rounded-[var(--r-md)] border-[var(--chalk)] bg-white"
          />
        </div>
        <div className="grid gap-3">
          <Input
            value={departmentHint}
            onChange={(event) => setDepartmentHint(event.target.value)}
            placeholder="Optional: department or team"
            className="h-11 rounded-[var(--r-md)] border-[var(--chalk)] bg-white"
          />
          <Input
            value={toolsHint}
            onChange={(event) => setToolsHint(event.target.value)}
            placeholder="Optional: tools involved"
            className="h-11 rounded-[var(--r-md)] border-[var(--chalk)] bg-white"
          />
          <Input
            value={exceptionsHint}
            onChange={(event) => setExceptionsHint(event.target.value)}
            placeholder="Optional: exceptions, approvals, or branches"
            className="h-11 rounded-[var(--r-md)] border-[var(--chalk)] bg-white"
          />
        </div>
        <div className="rounded-[var(--r-md)] border border-[var(--chalk)] bg-[var(--paper)] p-3">
          <p className="font-sans text-[13px] font-semibold text-[var(--ichigo-navy)]">User must confirm later</p>
          <p className="mt-1 font-sans text-[12px] leading-5 text-[var(--slate)]">
            Owner, expected output, frequency/volume, data reliability, criticality, failure impact, and reversibility stay user-owned.
          </p>
        </div>
        <Button
          type="button"
          disabled={assistant.isPending || !description.trim()}
          onClick={requestDraft}
          className="w-full rounded-[var(--r-md)] bg-[var(--ichigo-orange)] text-white hover:bg-[var(--ichigo-orange)]/90"
        >
          {assistant.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
          Generate draft map
        </Button>
        {assistant.error ? (
          <p className="rounded-[var(--r-md)] bg-[var(--danger)]/10 p-3 font-sans text-[13px] text-[var(--danger)]">
            {assistant.error.message}
          </p>
        ) : null}
        {patch ? (
          <div className="rounded-[var(--r-md)] border border-[var(--chalk)] bg-[var(--paper)] p-4">
            <div className="flex items-center justify-between gap-3">
              <Badge className="rounded-full bg-[var(--ichigo-mist)] px-3 py-1 text-[var(--ichigo-navy)]">
                {patch.confidence} confidence
              </Badge>
              <span className="font-sans text-[12px] text-[var(--slate)]">{patch.operations.length} edits</span>
            </div>
            <p className="mt-3 font-sans text-[14px] leading-6 text-[var(--graphite)]">{patch.summary}</p>
            <div className="mt-3 max-h-52 space-y-2 overflow-y-auto">
              {patch.operations.length ? patch.operations.map((operation, index) => (
                <div key={`${operation.op}-${index}`} className="rounded-[var(--r-sm)] border border-[var(--chalk)] bg-white p-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--slate)]">{operation.op.replaceAll("_", " ")}</p>
                  <p className="mt-1 font-sans text-[12px] leading-5 text-[var(--ichigo-navy)]">{operationSummary(operation)}</p>
                </div>
              )) : (
                <p className="rounded-[var(--r-sm)] bg-white p-3 font-sans text-[13px] text-[var(--slate)]">No graph edits proposed.</p>
              )}
            </div>
            {patch.questions?.length ? (
              <div className="mt-3 space-y-2">
                {patch.questions.map((question) => (
                  <p key={`${question.field}-${question.question}`} className="rounded-[var(--r-sm)] bg-white p-3 font-sans text-[12px] leading-5 text-[var(--graphite)]">
                    <span className="font-semibold text-[var(--ichigo-navy)]">{question.field}: </span>
                    {question.question}
                  </p>
                ))}
              </div>
            ) : null}
            <Button type="button" onClick={applyDraft} className="mt-4 w-full rounded-[var(--r-md)] bg-[var(--ichigo-navy)] text-white hover:bg-[var(--ichigo-navy)]/90">
              Apply to canvas
            </Button>
          </div>
        ) : null}
        {reports?.rejected.length ? (
          <div className="space-y-2">
            {reports.rejected.map((report, index) => (
              <p key={`${report.op}-${index}`} className="rounded-[var(--r-sm)] bg-[var(--warning)]/10 p-3 font-sans text-[12px] text-[var(--ichigo-navy)]">
                Could not apply {report.op.replaceAll("_", " ")}: {report.reason}
              </p>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TriggerPicker({
  tools,
  hasTrigger,
  onCreate,
  onClose,
}: {
  tools: Array<{ id: string; name: string; category?: string | null; catalog_id?: string | null }>;
  hasTrigger: boolean;
  onCreate: (input: { triggerType: TriggerType; toolId?: string | null; toolName?: string | null; eventName?: string; toolActionId?: string | null; toolActionName?: string | null }) => void;
  onClose: () => void;
}) {
  const ensureCatalogTool = useEnsureOrgToolFromCatalog();
  const toolCatalogQuery = useToolCatalog();
  const toolCatalog = toolCatalogQuery.data ?? [];
  const [screen, setScreen] = useState<"root" | "apps" | "tool">("root");
  const [toolSearch, setToolSearch] = useState("");
  const [pendingTool, setPendingTool] = useState<{ id: string; name: string; category?: string | null; catalog_id?: string | null } | null>(null);
  const pendingCatalog = pendingTool?.catalog_id ? toolCatalog.find((item) => item.id === pendingTool.catalog_id) : undefined;
  const triggerActionsQuery = useToolActions({ toolSlug: pendingCatalog?.slug, capabilityType: "trigger" });
  const triggerActions = triggerActionsQuery.data ?? [];
  const chooseCatalogTool = async (tool: ToolCatalogRow) => {
    const orgTool = await ensureCatalogTool.mutateAsync(tool.id);
    setPendingTool(orgTool);
    setScreen("tool");
  };
  const toolNeedle = toolSearch.trim().toLowerCase();
  const orgCatalogIds = new Set(tools.map((tool) => tool.catalog_id).filter(Boolean));
  const visibleOrgTools = tools
    .map((tool) => ({ kind: "org" as const, tool, catalog: tool.catalog_id ? toolCatalog.find((item) => item.id === tool.catalog_id) : undefined }))
    .filter((item) => item.catalog?.trigger_capable)
    .filter((item) => !toolNeedle || `${item.tool.name} ${item.tool.category ?? ""}`.toLowerCase().includes(toolNeedle));
  const visibleCatalogTools = toolNeedle
    ? toolCatalog
        .filter((tool) => tool.trigger_capable && !orgCatalogIds.has(tool.id))
        .filter((tool) => `${tool.name} ${tool.category ?? ""} ${tool.description ?? ""}`.toLowerCase().includes(toolNeedle))
        .slice(0, 40)
    : [];
  const goBack = () => {
    if (screen === "tool") {
      setPendingTool(null);
      setScreen("apps");
      return;
    }
    if (screen === "apps") {
      setScreen("root");
      return;
    }
  };

  return (
    <div className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-[390px] flex-col border-l border-[var(--chalk)] bg-white shadow-2xl">
      <div className="border-b border-[var(--chalk)] bg-[var(--paper)] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ichigo-orange)]">Start process</p>
            <h3 className="mt-1 font-display text-[26px] font-medium tracking-normal">
              {screen === "tool" && pendingTool ? pendingTool.name : screen === "apps" ? "App event" : "What starts this process?"}
            </h3>
            <p className="mt-1 font-sans text-[13px] text-[var(--slate)]">
              {screen === "tool" && pendingTool ? `Choose the ${pendingTool.name} event.` : screen === "apps" ? "Choose the app that emits the starting event." : "A trigger is the event or moment that begins the map."}
            </p>
            {hasTrigger ? (
              <p className="mt-2 rounded-[var(--r-sm)] bg-[var(--warning)]/10 p-2 font-sans text-[13px] text-[var(--ichigo-navy)]">
                This map already has a trigger. Multiple triggers are allowed, but keep each one intentional.
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {screen !== "root" ? <IconButton label="Back" onClick={goBack} icon={ArrowLeft} /> : null}
            <IconButton label="Close trigger picker" onClick={onClose} icon={X} />
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {screen === "root" ? (
          <>
          <button
            type="button"
            onClick={() => onCreate({ triggerType: "manual" })}
            className="flex w-full items-start gap-3 rounded-[var(--r-md)] border border-[var(--chalk)] bg-white p-4 text-left hover:border-[var(--ichigo-orange)] hover:bg-[var(--paper)]"
          >
            <CircleDot className="mt-0.5 h-5 w-5 text-[var(--ichigo-orange)]" />
            <span>
              <span className="block font-sans text-[15px] font-semibold text-[var(--ichigo-navy)]">Manual</span>
              <span className="mt-1 block font-sans text-[13px] text-[var(--slate)]">Someone starts the process by hand.</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => onCreate({ triggerType: "schedule" })}
            className="flex w-full items-start gap-3 rounded-[var(--r-md)] border border-[var(--chalk)] bg-white p-4 text-left hover:border-[var(--ichigo-orange)] hover:bg-[var(--paper)]"
          >
            <ClockIcon />
            <span>
              <span className="block font-sans text-[15px] font-semibold text-[var(--ichigo-navy)]">Schedule</span>
              <span className="mt-1 block font-sans text-[13px] text-[var(--slate)]">Runs on a recurring interval. Default: every 1 day.</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setScreen("apps")}
            className="flex w-full items-start gap-3 rounded-[var(--r-md)] border border-[var(--chalk)] bg-white p-4 text-left hover:border-[var(--ichigo-orange)] hover:bg-[var(--paper)]"
          >
            <Zap className="mt-0.5 h-5 w-5 text-[var(--ichigo-orange)]" />
            <span className="min-w-0 flex-1">
              <span className="block font-sans text-[15px] font-semibold text-[var(--ichigo-navy)]">App event</span>
              <span className="mt-1 block font-sans text-[13px] text-[var(--slate)]">Start when something happens in a company tool.</span>
            </span>
            <span className="font-sans text-[18px] text-[var(--slate)]">→</span>
          </button>
          <button
            type="button"
            onClick={() => onCreate({ triggerType: "event", eventName: "webhook_called", toolName: "Webhook" })}
            className="flex w-full items-start gap-3 rounded-[var(--r-md)] border border-[var(--chalk)] bg-white p-4 text-left hover:border-[var(--ichigo-orange)] hover:bg-[var(--paper)]"
          >
            <GitBranch className="mt-0.5 h-5 w-5 text-[var(--ichigo-orange)]" />
            <span>
              <span className="block font-sans text-[15px] font-semibold text-[var(--ichigo-navy)]">Webhook or form submission</span>
              <span className="mt-1 block font-sans text-[13px] text-[var(--slate)]">Start from an HTTP webhook, form, or intake event.</span>
            </span>
          </button>
          </>
        ) : screen === "apps" ? (
          <>
            <SearchField value={toolSearch} onChange={setToolSearch} placeholder="Search trigger apps..." />
            <ToolListSection
              title="Company stack"
              tools={visibleOrgTools}
              onChooseOrg={(tool) => {
                setPendingTool(tool);
                setScreen("tool");
              }}
            />
            {toolNeedle ? (
              <ToolListSection
                title="Add from catalog"
                tools={visibleCatalogTools.map((tool) => ({ kind: "catalog" as const, catalog: tool }))}
                onChooseCatalog={chooseCatalogTool}
              />
            ) : (
              <p className="rounded-[var(--r-md)] border border-[var(--chalk)] bg-[var(--paper)] p-3 font-sans text-[12px] leading-5 text-[var(--slate)]">
                Search to add another trigger-capable app from the catalog.
              </p>
            )}
          </>
        ) : pendingTool ? (
          <ToolActionChooser
            tool={pendingTool}
            catalog={pendingCatalog}
            actions={triggerActions}
            isLoading={triggerActionsQuery.isLoading}
            capabilityType="trigger"
            onChoose={(action) => onCreate({
              triggerType: "event",
              toolId: pendingTool.id,
              toolName: pendingTool.name,
              eventName: action.trigger_event || action.business_action,
              toolActionId: action.id,
              toolActionName: action.business_action,
            })}
            onUseGeneric={() => undefined}
          />
        ) : null}
      </div>
    </div>
  );
}

function ClockIcon() {
  return <Circle className="h-5 w-5 text-[var(--ichigo-orange)]" />;
}

function NodeToolPicker({
  target,
  tools,
  onClose,
  onChooseKind,
  onChooseTool,
  onAddTrigger,
}: {
  target: NodePickerTarget;
  tools: Array<{ id: string; name: string; category?: string | null; catalog_id?: string | null; data_stored?: string | null; integration_status?: number | null; api_available?: boolean | null }>;
  onClose: () => void;
  onChooseKind: (target: NodePickerTarget, kind: NodeKind, data?: Partial<BuilderData>) => void;
  onChooseTool: (target: NodePickerTarget, tool: { id: string; name: string; catalog_id?: string | null; data_stored?: string | null; integration_status?: number | null; api_available?: boolean | null }, action?: ToolActionCatalogRow | null) => void;
  onAddTrigger: () => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState<DrawerCategory | null>(null);
  const [pendingTool, setPendingTool] = useState<{ id: string; name: string; category?: string | null; catalog_id?: string | null; data_stored?: string | null; integration_status?: number | null; api_available?: boolean | null } | null>(null);
  const [rootSearch, setRootSearch] = useState("");
  const [toolSearch, setToolSearch] = useState("");
  const ensureCatalogTool = useEnsureOrgToolFromCatalog();
  const toolCatalogQuery = useToolCatalog();
  const toolCatalog = toolCatalogQuery.data ?? [];
  const pendingCatalog = pendingTool?.catalog_id ? toolCatalog.find((item) => item.id === pendingTool.catalog_id) : undefined;
  const toolActionsQuery = useToolActions({ toolSlug: pendingCatalog?.slug, capabilityType: "action" });
  const toolActions = toolActionsQuery.data ?? [];
  const chooseCatalog = async (tool: ToolCatalogRow) => {
    const orgTool = await ensureCatalogTool.mutateAsync(tool.id);
    setPendingTool(orgTool);
  };
  const selectedCategoryMeta = drawerRootRows.find((category) => category.id === selectedCategory);
  const selectedActions = selectedCategory && selectedCategory !== "tools" && selectedCategory !== "trigger"
    ? processCategoryActions.filter((action) => selectedCategory === "Core" ? action.category === "Output" : action.category === selectedCategory)
    : [];
  const selectedActionGroups = (["Most common", "More", "Advanced"] as ProcessTemplateGroup[])
    .map((group) => ({ group, actions: selectedActions.filter((action) => action.group === group) }))
    .filter((section) => section.actions.length > 0);
  const rootRows = drawerRootRows.filter((category) => {
    const needle = rootSearch.trim().toLowerCase();
    if (!needle) return true;
    return `${category.label} ${category.description}`.toLowerCase().includes(needle);
  });
  const toolNeedle = toolSearch.trim().toLowerCase();
  const visibleOrgTools = tools.filter((tool) => {
    if (!toolNeedle) return true;
    return `${tool.name} ${tool.category ?? ""}`.toLowerCase().includes(toolNeedle);
  });
  const orgCatalogIds = new Set(tools.map((tool) => tool.catalog_id).filter(Boolean));
  const visibleCatalogTools = toolNeedle
    ? toolCatalog
        .filter((tool) => !orgCatalogIds.has(tool.id))
        .filter((tool) => `${tool.name} ${tool.category ?? ""} ${tool.description ?? ""}`.toLowerCase().includes(toolNeedle))
        .slice(0, 40)
    : [];
  const drawerTitle = pendingTool
    ? pendingTool.name
    : selectedCategory === "tools"
      ? "Action in an app"
      : selectedCategoryMeta?.label ?? "What happens next?";
  const drawerDescription = pendingTool
    ? `Choose what ${pendingTool.name} does in this process step.`
    : selectedCategory === "tools"
      ? "Choose a company tool first, then choose the exact business action."
      : selectedCategoryMeta?.description ?? "Choose a category first, then pick a specific editable step.";
  const drawerIcon = pendingTool
    ? undefined
    : selectedCategory === "tools"
      ? Globe2
      : selectedCategoryMeta?.icon;
  const pendingLogo = pendingCatalog ? toolCatalogLogoUrl(pendingCatalog) ?? pendingCatalog.logo_url : undefined;
  const DrawerIcon = drawerIcon;
  const goBack = () => {
    if (pendingTool) {
      setPendingTool(null);
      return;
    }
    setSelectedCategory(null);
  };

  return (
    <div className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-[410px] flex-col border-l border-[var(--chalk)] bg-white shadow-2xl">
      <div className="border-b border-[var(--chalk)] bg-[var(--paper)] p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ichigo-orange)]">Add to diagram</p>
            <h3 className="mt-1 flex min-w-0 items-center gap-3 font-display text-[26px] font-medium tracking-normal">
              {selectedCategory ? (
                <button
                  type="button"
                  onClick={goBack}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--chalk)] bg-white text-[var(--ichigo-navy)] transition hover:border-[var(--ichigo-orange)] hover:text-[var(--ichigo-orange)]"
                  aria-label="Go back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              ) : null}
              {pendingLogo ? (
                <img src={pendingLogo} alt="" className="h-7 w-7 rounded-[var(--r-sm)] object-contain" />
              ) : DrawerIcon ? (
                <DrawerIcon className="h-6 w-6 shrink-0 text-[var(--ichigo-orange)]" />
              ) : null}
              <span className="truncate">{drawerTitle}</span>
            </h3>
            <p className="mt-1 font-sans text-[13px] text-[var(--slate)]">{drawerDescription}</p>
          </div>
          <div className="flex items-center gap-2">
            <IconButton label="Close picker" onClick={onClose} icon={X} />
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
        {!selectedCategory ? (
          <div className="space-y-4">
            <SearchField value={rootSearch} onChange={setRootSearch} placeholder="Search nodes..." />
            <div className="space-y-1">
            {rootRows.map((category) => {
              const Icon = category.icon;
              return (
                <div key={category.id} className={category.separated ? "border-t border-[var(--chalk)] pt-3" : undefined}>
                <button
                  type="button"
                  onClick={() => category.id === "trigger" ? onAddTrigger() : setSelectedCategory(category.id)}
                  className="flex w-full items-start gap-4 rounded-[var(--r-md)] border border-transparent bg-white p-3 text-left transition hover:border-[var(--ichigo-orange)] hover:bg-[var(--paper)]"
                >
                  <Icon className="mt-0.5 h-5 w-5 text-[var(--ichigo-orange)]" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-sans text-[15px] font-semibold text-[var(--ichigo-navy)]">{category.label}</span>
                    <span className="mt-0.5 block font-sans text-[12px] leading-5 text-[var(--slate)]">{category.description}</span>
                  </span>
                  <span className="mt-1 font-sans text-[18px] leading-none text-[var(--slate)]">→</span>
                </button>
                </div>
              );
            })}
            </div>
          </div>
        ) : selectedCategory === "tools" ? (
          <section className="space-y-3">
            {!pendingTool ? (
              <>
                <SearchField value={toolSearch} onChange={setToolSearch} placeholder="Search apps..." />
                <ToolListSection
                  title="Company stack"
                  tools={visibleOrgTools.map((tool) => ({ kind: "org" as const, tool, catalog: tool.catalog_id ? toolCatalog.find((item) => item.id === tool.catalog_id) : undefined }))}
                  onChooseOrg={(tool) => setPendingTool(tool)}
                />
                {toolNeedle ? (
                  <ToolListSection
                    title="Add from catalog"
                    tools={visibleCatalogTools.map((tool) => ({ kind: "catalog" as const, catalog: tool }))}
                    onChooseCatalog={chooseCatalog}
                  />
                ) : (
                  <p className="rounded-[var(--r-md)] border border-[var(--chalk)] bg-[var(--paper)] p-3 font-sans text-[12px] leading-5 text-[var(--slate)]">
                    Search to add another app from the full catalog. The default list stays focused on this company's selected tools.
                  </p>
                )}
              </>
            ) : (
              <ToolActionChooser
                tool={pendingTool}
                catalog={pendingCatalog}
                actions={toolActions}
                isLoading={toolActionsQuery.isLoading}
                capabilityType="action"
                onChoose={(action) => onChooseTool(target, pendingTool, action)}
                onUseGeneric={() => onChooseTool(target, pendingTool, null)}
              />
            )}
          </section>
        ) : (
          <div className="space-y-5">
            {selectedActionGroups.map((section) => (
              <section key={section.group} className="space-y-2">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--slate)]">{section.group}</p>
                <div className="space-y-2">
                  {section.actions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={`${action.category}-${action.label}`}
                        type="button"
                        onClick={() => onChooseKind(target, action.kind, action.data)}
                        className="flex w-full items-start gap-3 rounded-[var(--r-md)] border border-[var(--chalk)] bg-white p-3 text-left transition hover:border-[var(--ichigo-orange)] hover:bg-[var(--paper)]"
                      >
                        <Icon className="mt-0.5 h-5 w-5 text-[var(--ichigo-orange)]" />
                        <span className="min-w-0">
                          <span className="block font-sans text-[14px] font-semibold text-[var(--ichigo-navy)]">{action.label}</span>
                          <span className="mt-0.5 block font-sans text-[12px] leading-5 text-[var(--slate)]">{action.description}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
        {ensureCatalogTool.isPending ? <p className="mt-3 font-sans text-[12px] text-[var(--slate)]">Adding catalog tool to this company...</p> : null}
      </div>
    </div>
  );
}

function SearchField({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div className="flex h-12 items-center gap-3 rounded-[var(--r-md)] border border-[var(--ichigo-orange)] bg-white px-3">
      <Search className="h-4 w-4 text-[var(--slate)]" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 border-0 bg-transparent px-0 font-sans text-[15px] shadow-none focus-visible:ring-0"
      />
    </div>
  );
}

function ToolListSection({
  title,
  tools,
  onChooseOrg,
  onChooseCatalog,
}: {
  title: string;
  tools: Array<
    | { kind: "org"; tool: { id: string; name: string; category?: string | null; catalog_id?: string | null; data_stored?: string | null; integration_status?: number | null; api_available?: boolean | null }; catalog?: ToolCatalogRow }
    | { kind: "catalog"; catalog: ToolCatalogRow }
  >;
  onChooseOrg?: (tool: { id: string; name: string; category?: string | null; catalog_id?: string | null; data_stored?: string | null; integration_status?: number | null; api_available?: boolean | null }) => void;
  onChooseCatalog?: (tool: ToolCatalogRow) => void;
}) {
  if (!tools.length) {
    return (
      <section className="space-y-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--slate)]">{title}</p>
        <p className="rounded-[var(--r-md)] border border-dashed border-[var(--chalk)] bg-[var(--paper)] p-3 font-sans text-[12px] text-[var(--slate)]">
          No matching tools.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-2">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--slate)]">{title}</p>
      <div className="space-y-1">
        {tools.map((item) => {
          const catalog = item.kind === "org" ? item.catalog : item.catalog;
          const name = item.kind === "org" ? item.tool.name : item.catalog.name;
          const category = item.kind === "org" ? item.tool.category ?? catalog?.category : item.catalog.category;
          const logo = catalog ? toolCatalogLogoUrl(catalog) ?? catalog.logo_url : undefined;
          return (
            <button
              key={item.kind === "org" ? `org-${item.tool.id}` : `catalog-${item.catalog.id}`}
              type="button"
              onClick={() => item.kind === "org" ? onChooseOrg?.(item.tool) : onChooseCatalog?.(item.catalog)}
              className="flex w-full items-center gap-3 rounded-[var(--r-md)] border border-transparent bg-white p-3 text-left transition hover:border-[var(--ichigo-orange)] hover:bg-[var(--paper)]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--r-sm)] border border-[var(--chalk)] bg-[var(--paper)]">
                {logo ? <img src={logo} alt="" className="h-6 w-6 object-contain" /> : <Zap className="h-4 w-4 text-[var(--ichigo-orange)]" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-sans text-[14px] font-semibold text-[var(--ichigo-navy)]">{name}</span>
                <span className="block truncate font-sans text-[12px] text-[var(--slate)]">{category || catalog?.description || "Company tool"}</span>
              </span>
              <span className="font-sans text-[18px] text-[var(--slate)]">→</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ToolActionChooser({
  tool,
  catalog,
  actions,
  isLoading,
  capabilityType = "action",
  onChoose,
  onUseGeneric,
}: {
  tool: { name: string };
  catalog?: ToolCatalogRow;
  actions: ToolActionCatalogRow[];
  isLoading: boolean;
  capabilityType?: "action" | "trigger";
  onChoose: (action: ToolActionCatalogRow) => void;
  onUseGeneric: () => void;
}) {
  const [search, setSearch] = useState("");
  const visibleActions = actions
    .filter((action) => action.capability_type === capabilityType)
    .filter((action) => {
      const needle = search.trim().toLowerCase();
      if (!needle) return true;
      return [
        action.business_action,
        action.business_object,
        action.action_family,
        action.business_use_case,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  const grouped = groupToolActions(visibleActions);
  const familyOrder = ["Create", "Update", "Send", "Receive", "Store", "Read / Retrieve", "Search", "Notify", "Approve", "Export", "Generate", "Analyze", "Other"];
  const families = Object.keys(grouped).sort((a, b) => {
    const ai = familyOrder.indexOf(a);
    const bi = familyOrder.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi) || a.localeCompare(b);
  });
  const logo = catalog ? toolCatalogLogoUrl(catalog) ?? catalog.logo_url : undefined;
  const actionLabel = capabilityType === "trigger" ? "Events" : "Actions";

  return (
    <div className="space-y-4">
      <SearchField value={search} onChange={setSearch} placeholder={`Search ${tool.name} ${capabilityType === "trigger" ? "events" : "actions"}...`} />
      {isLoading ? (
        <div className="rounded-[var(--r-md)] border border-[var(--chalk)] bg-[var(--paper)] p-4 font-sans text-[13px] text-[var(--slate)]">
          Loading {capabilityType === "trigger" ? "events" : "actions"}...
        </div>
      ) : visibleActions.length ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--chalk)] pb-3">
            <div className="flex items-center gap-2">
              <h4 className="font-sans text-[18px] font-semibold text-[var(--ichigo-navy)]">
                {actionLabel} ({visibleActions.length})
              </h4>
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[var(--chalk)] font-sans text-[11px] text-[var(--slate)]">?</span>
            </div>
            <span className="font-sans text-[18px] leading-none text-[var(--slate)]">⌄</span>
          </div>
          {families.map((family) => (
            <section key={family} className="space-y-2">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--slate)]">{formatToolActionGroup(family)}</p>
              <div className="space-y-2">
                {grouped[family].slice(0, 30).map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => onChoose(action)}
                    className="flex w-full items-start gap-3 rounded-[var(--r-md)] border border-transparent bg-white p-3 text-left transition hover:border-[var(--ichigo-orange)] hover:bg-[var(--paper)]"
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--r-sm)] bg-[var(--paper)]">
                      {logo ? <img src={logo} alt="" className="h-5 w-5 object-contain" /> : <Zap className="h-4 w-4 text-[var(--ichigo-orange)]" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-sans text-[14px] font-semibold text-[var(--ichigo-navy)]">{action.business_action}</span>
                      <span className="mt-0.5 block font-sans text-[12px] leading-5 text-[var(--slate)]">
                        {action.business_use_case || `Use ${tool.name} to work with ${action.business_object}.`}
                      </span>
                    </span>
                    {action.needs_manual_review ? (
                      <span className="ml-auto shrink-0 rounded-full bg-[var(--warning)]/15 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--slate)]">review</span>
                    ) : null}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="space-y-3 rounded-[var(--r-md)] border border-dashed border-[var(--chalk)] bg-[var(--paper)] p-4">
          <p className="font-sans text-[13px] text-[var(--slate)]">
            No {capabilityType === "trigger" ? "trigger events" : "action rows"} found for this tool yet. The current import has partial coverage, so you can still continue with a generic tool step.
          </p>
          {capabilityType === "action" ? (
            <Button type="button" onClick={onUseGeneric} className="rounded-[var(--r-md)] bg-[var(--ichigo-orange)] text-white hover:bg-[var(--ichigo-orange)]/90">
              Create blank step with this tool
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}

function formatToolActionGroup(group: string) {
  const cleaned = group.replaceAll("_", " ").replaceAll("/", " / ").replace(/\s+/g, " ").trim();
  const lower = cleaned.toLowerCase();
  if (!cleaned || lower === "other") return "Other actions";
  if (lower.includes("message")) return "Message actions";
  if (lower.includes("label")) return "Label actions";
  if (lower.includes("file") || lower.includes("document")) return "File actions";
  if (lower.includes("record") || lower.includes("database")) return "Record actions";
  if (lower.includes("search")) return "Search actions";
  if (lower.includes("trigger") || lower.includes("event")) return "Event triggers";
  if (lower.endsWith("actions")) return cleaned;
  if (["create", "update", "send", "receive", "store", "read / retrieve", "notify", "approve", "export", "generate", "analyze"].includes(lower)) {
    return `${cleaned} actions`;
  }
  return `${cleaned} actions`;
}

function ToolActionSelect({
  actions,
  selectedActionId,
  isLoading,
  toolName,
  onSelect,
}: {
  actions: ToolActionCatalogRow[];
  selectedActionId: string | null;
  isLoading: boolean;
  toolName: string;
  onSelect: (action: ToolActionCatalogRow) => void;
}) {
  const [search, setSearch] = useState("");
  const visibleActions = actions
    .filter((action) => action.capability_type !== "trigger")
    .filter((action) => {
      const needle = search.trim().toLowerCase();
      if (!needle) return true;
      return `${action.business_action} ${action.business_object} ${action.business_use_case ?? ""}`.toLowerCase().includes(needle);
    })
    .slice(0, 12);

  return (
    <div className="rounded-[var(--r-md)] border border-[var(--chalk)] bg-[var(--paper)] p-3">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--slate)]">Action for this tool</p>
      <p className="mt-1 font-sans text-[12px] text-[var(--slate)]">
        Choose what {toolName} does in this step.
      </p>
      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search actions"
        className="mt-3 h-9 rounded-[var(--r-md)] border-[var(--chalk)] bg-white"
      />
      <div className="mt-3 max-h-56 space-y-1 overflow-y-auto">
        {isLoading ? (
          <p className="font-sans text-[12px] text-[var(--slate)]">Loading actions...</p>
        ) : visibleActions.length ? (
          visibleActions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => onSelect(action)}
              className={`w-full rounded-[var(--r-md)] border p-2 text-left transition ${
                selectedActionId === action.id
                  ? "border-[var(--ichigo-orange)] bg-white"
                  : "border-transparent bg-white/60 hover:border-[var(--ichigo-orange)] hover:bg-white"
              }`}
            >
              <span className="block font-sans text-[12px] font-semibold text-[var(--ichigo-navy)]">{action.business_action}</span>
              <span className="block truncate font-sans text-[11px] text-[var(--slate)]">{action.business_object}</span>
            </button>
          ))
        ) : (
          <p className="font-sans text-[12px] leading-5 text-[var(--slate)]">
            No action rows found yet. Import `tool_action_catalog_enriched.csv` into Supabase to enable tool-specific actions.
          </p>
        )}
      </div>
    </div>
  );
}

function CanvasToolbar({
  canUndo,
  canRedo,
  canDelete,
  layoutDirection,
  showToolTiles,
  onAdd,
  onLayout,
  onFit,
  onUndo,
  onRedo,
  onDelete,
  onToggleToolTiles,
  onToggleLayoutDirection,
}: {
  canUndo: boolean;
  canRedo: boolean;
  canDelete: boolean;
  layoutDirection: LayoutDirection;
  showToolTiles: boolean;
  onAdd: () => void;
  onLayout: () => void;
  onFit: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onToggleToolTiles: () => void;
  onToggleLayoutDirection: () => void;
}) {
  return (
    <div className="absolute left-3 top-3 z-20 flex flex-wrap gap-2 rounded-[var(--r-md)] border border-[var(--chalk)] bg-white/95 p-2 shadow-sm">
      <PlaceholderButton label="Add" onClick={onAdd} />
      <IconButton label="Auto-layout" onClick={onLayout} icon={GitBranch} />
      <IconButton label="Fit view" onClick={onFit} icon={Maximize2} />
      <IconButton label="Undo" onClick={onUndo} icon={Undo2} disabled={!canUndo} />
      <IconButton label="Redo" onClick={onRedo} icon={Redo2} disabled={!canRedo} />
      <IconButton label="Delete" onClick={onDelete} icon={Trash2} disabled={!canDelete} danger />
      <button
        type="button"
        onClick={onToggleToolTiles}
        className={`h-9 rounded-full border px-3 font-mono text-[11px] font-semibold transition ${
          showToolTiles
            ? "border-[var(--ichigo-orange)] bg-[var(--ichigo-orange)] text-white"
            : "border-[var(--chalk)] bg-[var(--paper)] text-[var(--ichigo-navy)]"
        }`}
        title="Toggle tool tiles"
      >
        Tools
      </button>
      <button
        type="button"
        onClick={onToggleLayoutDirection}
        className="h-9 rounded-full border border-[var(--chalk)] bg-[var(--paper)] px-3 font-mono text-[11px] font-semibold text-[var(--ichigo-navy)] transition hover:border-[var(--ichigo-orange)]"
        title="Toggle layout direction"
      >
        {layoutDirection === "RIGHT" ? "LR" : "TB"}
      </button>
    </div>
  );
}

function PlaceholderButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className="flex h-9 items-center gap-2 rounded-full border border-[var(--ichigo-orange)] bg-white px-3 font-sans text-[12px] font-semibold text-[var(--ichigo-orange)] shadow-sm transition hover:bg-[var(--ichigo-orange)] hover:text-white"
    >
      <Plus className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function IconButton({ label, icon: Icon, onClick, disabled, danger }: { label: string; icon: LucideIcon; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={`flex h-9 w-9 items-center justify-center rounded-full border border-[var(--chalk)] bg-white transition hover:border-[var(--ichigo-orange)] disabled:cursor-not-allowed disabled:opacity-40 ${danger ? "text-[var(--danger)]" : "text-[var(--ichigo-navy)]"}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function SidePanel({
  node,
  tools,
  toolCatalog,
  dataSources,
  members,
  onChange,
}: {
  node: ProcessBuilderNode;
  tools: Array<{ id: string; name: string; category?: string | null; catalog_id?: string | null; data_stored: string | null; integration_status: number | null; api_available: boolean | null }>;
  toolCatalog: ToolCatalogRow[];
  dataSources: Array<{ id: string; name: string; tool_id: string | null; data_type: string | null; accessibility: string | null; reliability: string | null; sensitivity_level: string | null; department_owner_id: string | null }>;
  members: MemberSuggestion[];
  onChange: (node: ProcessBuilderNode) => void;
}) {
  const ensureCatalogTool = useEnsureOrgToolFromCatalog();
  const [editToolRole, setEditToolRole] = useState(false);
  const [editDataAssumptions, setEditDataAssumptions] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const update = (patch: Partial<BuilderData>) => onChange({ ...node, data: { ...node.data, ...patch } });
  const selectedTool = node.data.toolId ? tools.find((item) => item.id === node.data.toolId) : undefined;
  const selectedCatalog = selectedTool?.catalog_id ? toolCatalog.find((item) => item.id === selectedTool.catalog_id) : undefined;
  const nodeToolActionsQuery = useToolActions({ toolSlug: selectedCatalog?.slug, capabilityType: "action" });
  const nodeToolActions = nodeToolActionsQuery.data ?? [];
  const schema = getNodeFieldSchema(node.data.kind).filter((field) => !field.showWhen || (field.showWhen === "dataCritical" && node.data.isDataCritical));
  const fieldByKey = (key: NodeFieldDescriptor["key"]) => schema.find((field) => field.key === key);
  const selectTool = (toolId: string) => {
    if (toolId === "manual") {
      update({
        toolId: null,
        toolName: null,
        toolActionId: null,
        toolActionName: null,
        toolActionObject: null,
        toolActionFamily: null,
        dataSourceId: null,
        dataProfile: manualProfile,
        dataQuality: "not_assessed",
      });
      return;
    }
    const tool = tools.find((item) => item.id === toolId);
    const source = dataSources.find((item) => item.tool_id === toolId);
    const catalog = tool?.catalog_id ? toolCatalog.find((item) => item.id === tool.catalog_id) : undefined;
    const catalogProfile = node.data.dataProfile.source !== "overridden" ? catalogProfileDefaults(catalog) : null;
    const profile = catalogProfile ?? profileFrom(tool, source);
    update({
      label: isGenericStepLabel(node.data.label) ? `Choose action for ${tool?.name ?? "tool"}` : node.data.label,
      toolId,
      toolName: tool?.name ?? null,
      toolRole: node.data.toolRole ?? inferToolRole(tool),
      toolActionId: null,
      toolActionName: null,
      toolActionObject: null,
      toolActionFamily: null,
      dataSourceId: source?.id ?? null,
      dataProfile: node.data.dataProfile.source === "overridden" ? node.data.dataProfile : { ...profile, source: catalogProfile ? "ai_suggested" : "inherited" },
      dataQuality: qualityFrom(source?.reliability),
    });
  };
  const selectCatalogTool = async (tool: ToolCatalogRow) => {
    const orgTool = await ensureCatalogTool.mutateAsync(tool.id);
    selectTool(orgTool.id);
  };
  const selectToolAction = (action: ToolActionCatalogRow) => {
    const shouldReplaceLabel =
      isGenericStepLabel(node.data.label) ||
      node.data.label === node.data.toolActionName ||
      node.data.label === `Choose action for ${node.data.toolName ?? "tool"}`;
    update({
      label: shouldReplaceLabel ? action.business_action : node.data.label,
      description: node.data.description?.trim() ? node.data.description : action.business_use_case ?? "",
      toolRole: roleFromToolAction(action),
      toolActionId: action.id,
      toolActionName: action.business_action,
      toolActionObject: action.business_object,
      toolActionFamily: action.action_family,
      output: outputFromToolAction(action),
    });
  };
  const renderField = (field: NodeFieldDescriptor, labelOverride?: string) => {
    const fieldLabel = labelOverride ?? field.label;
    if (field.control === "text" && field.key === "label") {
      return <TextInput key={field.key} label={fieldLabel} value={node.data.label} onChange={(label) => update({ label })} />;
    }
    if (field.control === "textarea" && field.key === "description") {
      return <TextArea key={field.key} label={fieldLabel} value={node.data.description} onChange={(description) => update({ description })} />;
    }
    if (field.control === "ownerMultiSelect" && field.key === "owner") {
      return <OwnerMultiSelect key={field.key} label={fieldLabel} value={node.data.owner ?? []} members={members} onChange={(owner) => update({ owner })} />;
    }
    if (field.control === "text" && field.key === "output") {
      return <TextInput key={field.key} label={fieldLabel} value={node.data.output} onChange={(output) => update({ output })} />;
    }
    if (field.control === "kindSelect") {
      return (
        <SelectField
          key={field.key}
          label={fieldLabel}
          value={node.data.kind}
          onChange={(kind) => update({ kind: kind as NodeKind })}
          options={nodeKinds.filter((kind) => kind !== "trigger").map((kind) => [kind, nodeKindLabel(kind)])}
        />
      );
    }
    if (field.control === "triggerConfig") {
      return <TriggerConfigFields key={field.key} node={node} tools={tools} onUpdate={update} />;
    }
    if (field.control === "toolPicker") {
      return (
        <div key={field.key} className="space-y-2">
          <ToolCatalogPicker
            value={node.data.toolId ?? "manual"}
            label={fieldLabel}
            placeholder="Search company tools or catalog"
            orgTools={tools}
            includeCatalogFallback
            catalogSearchOnly
            onSelectOrgTool={(tool) => selectTool(tool.id)}
            onSelectCatalog={selectCatalogTool}
          />
          <Button type="button" variant="outline" onClick={() => selectTool("manual")} className="rounded-[var(--r-md)] border-[var(--chalk)]">
            Manual / no tool
          </Button>
          {node.data.toolId ? (
            <ToolActionSelect
              actions={nodeToolActions}
              selectedActionId={node.data.toolActionId ?? null}
              isLoading={nodeToolActionsQuery.isLoading}
              toolName={node.data.toolName ?? "tool"}
              onSelect={selectToolAction}
            />
          ) : null}
        </div>
      );
    }
    if (field.control === "toolRoleSelect") {
      return (
        <SelectField
          key={field.key}
          label={fieldLabel}
          value={String(node.data.toolRole ?? inferToolRole({ name: node.data.toolName }))}
          onChange={(toolRole) => update({ toolRole })}
          options={toolRoleOptions}
        />
      );
    }
    if (field.control === "inputTypeSelect") {
      return (
        <SelectField
          key={field.key}
          label={fieldLabel}
          value={node.data.inputType}
          onChange={(inputType) => update({ inputType: inputType as InputType })}
          options={inputTypes.map((type) => [type, type])}
        />
      );
    }
    if (field.control === "automationScale") {
      return (
        <div key={field.key}>
          <div className="mb-2 flex items-center justify-between">
            <Label className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--slate)]">{fieldLabel}</Label>
            <span className="font-mono text-[12px] text-[var(--ichigo-orange)]">L{node.data.automationLevel}</span>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {[0, 1, 2, 3, 4].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => update({ automationLevel: level })}
                className={`h-9 rounded-[var(--r-sm)] font-mono text-[12px] ${node.data.automationLevel === level ? "bg-[var(--ichigo-orange)] text-white" : "bg-[var(--ichigo-mist)] text-[var(--ichigo-navy)]"}`}
              >
                L{level}
              </button>
            ))}
          </div>
        </div>
      );
    }
    if (field.control === "booleanToggle") {
      return (
        <Button key={field.key} type="button" variant="outline" onClick={() => update({ producesData: !node.data.producesData })}>
          {fieldLabel}: {String(node.data.producesData)}
        </Button>
      );
    }
    if (field.control === "dataChips") return <DataChips key={field.key} node={node} onChange={onChange} />;
    if (field.control === "qualityControl") return <QualityControl key={field.key} node={node} onChange={onChange} />;
    return null;
  };
  const issues = nodeIssues(node, []);
  const ownerMissing = node.data.kind !== "trigger" && node.data.kind !== "end" && node.data.kind !== "merge" && !(node.data.owner ?? []).length;
  const outputMissing = node.data.kind !== "trigger" && node.data.kind !== "merge" && !node.data.output?.trim();
  const statusChips = [
    ownerMissing ? "Missing owner" : null,
    outputMissing ? "Missing output" : null,
    node.data.isDataCritical ? "Data-critical" : null,
    node.data.toolName ? "Tool linked" : null,
    node.data.assistantOpportunity ? "Assistant opportunity" : null,
    node.data.kind !== "trigger" && node.data.kind !== "merge" ? `L${node.data.automationLevel}` : null,
  ].filter(Boolean) as string[];
  const isTrigger = node.data.kind === "trigger";
  const isMerge = node.data.kind === "merge";
  const isDecision = node.data.kind === "decision";
  const isApproval = node.data.kind === "approval";
  const labelField = fieldByKey("label");
  const descriptionField = fieldByKey("description");
  const ownerField = fieldByKey("owner");
  const outputField = fieldByKey("output");
  const toolField = fieldByKey("tool");
  const automationField = fieldByKey("automationLevel");
  const toolRoleField = fieldByKey("toolRole");
  const inputTypeField = fieldByKey("inputType");
  const dataQualityField = fieldByKey("dataQuality");
  const dataProfileField = fieldByKey("dataProfile");
  const kindField = fieldByKey("kind");
  const producesDataField = fieldByKey("producesData");
  const triggerConfigField = fieldByKey("triggerConfig");

  return (
    <Card className="flex h-full flex-col rounded-none border-0 bg-white">
      <div className="border-b border-[var(--chalk)] bg-[var(--paper)] p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--r-sm)] bg-[var(--paper)] text-[var(--ichigo-orange)]">
            {(() => {
              const Icon = kindIcon[node.data.kind];
              return <Icon className="h-5 w-5" />;
            })()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ichigo-orange)]">Edit selected step</p>
            <p className="truncate font-display text-[24px] leading-8 text-[var(--ichigo-navy)]">{node.data.label}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge className="rounded-full bg-[var(--ichigo-mist)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ichigo-navy)]">
                {nodeKindLabel(node.data.kind)}
              </Badge>
              {statusChips.map((chip) => (
                <Badge key={chip} className={`rounded-full px-2.5 py-1 font-sans text-[11px] ${
                  chip.startsWith("Missing") ? "bg-[var(--warning)]/15 text-[var(--ichigo-navy)]" : "bg-white text-[var(--slate)]"
                }`}>
                  {chip}
                </Badge>
              ))}
            </div>
          </div>
          {issues.length ? <span title={issues.join("\n")} className="mt-2 h-2.5 w-2.5 rounded-full bg-[var(--warning)] ring-4 ring-[var(--warning)]/15" /> : null}
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
        {isDecision || isApproval ? (
          <div className="rounded-[var(--r-md)] border border-[var(--warning)]/25 bg-[var(--warning)]/10 p-3">
            <p className="font-sans text-[13px] text-[var(--ichigo-navy)]">
              {isDecision
                ? "If steps should have at least two clear branches, such as True and False."
                : "Approval steps should include what is approved and where rejected work goes."}
            </p>
          </div>
        ) : null}

        <PanelSection title={isTrigger ? "Trigger basics" : isMerge ? "Join basics" : "Brief essentials"}>
          {labelField ? renderField(labelField, isTrigger ? "Trigger name" : "Step name") : null}
          {descriptionField ? renderField(descriptionField, "What happens here?") : null}
          {!isTrigger && !isMerge && ownerField ? renderField(ownerField) : null}
          {!isTrigger && !isMerge && outputField ? renderField(outputField, "What should this step produce?") : null}
        </PanelSection>

        {isTrigger && triggerConfigField ? (
          <PanelSection title="Trigger setup">
            {renderField(triggerConfigField)}
          </PanelSection>
        ) : null}

        {!isTrigger && !isMerge ? (
          <>
            <PanelSection title="Tool & automation">
              {toolField ? renderField(toolField, "Tool used") : null}
              {node.data.toolName ? (
                <div className="rounded-[var(--r-md)] border border-[var(--chalk)] bg-[var(--paper)] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--slate)]">Tool role</p>
                      <p className="mt-1 font-sans text-[13px] font-semibold text-[var(--ichigo-navy)]">
                        {node.data.toolName} · {rolePhrase(node.data.toolRole ?? inferToolRole({ name: node.data.toolName })) || "supports this step"}
                      </p>
                    </div>
                    {toolRoleField ? (
                      <button
                        type="button"
                        onClick={() => setEditToolRole((open) => !open)}
                        className="font-sans text-[12px] font-semibold text-[var(--ichigo-orange)]"
                      >
                        {editToolRole ? "Done" : "Edit role"}
                      </button>
                    ) : null}
                  </div>
                  {editToolRole && toolRoleField ? <div className="mt-3">{renderField(toolRoleField)}</div> : null}
                </div>
              ) : null}
              {automationField ? renderField(automationField) : null}
            </PanelSection>

            <PanelSection title="Data & risk">
              {inputTypeField ? renderField(inputTypeField, "What does this step read?") : null}
              {dataQualityField ? renderField(dataQualityField) : null}
              <DataProfileSummary node={node} onEdit={() => setEditDataAssumptions((open) => !open)} expanded={editDataAssumptions} />
              {editDataAssumptions && dataProfileField ? renderField(dataProfileField) : null}
            </PanelSection>

            <details
              open={advancedOpen}
              onToggle={(event) => setAdvancedOpen(event.currentTarget.open)}
              className="rounded-[var(--r-md)] border border-[var(--chalk)] bg-white"
            >
              <summary className="cursor-pointer list-none px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--slate)]">
                Advanced
              </summary>
              <div className="space-y-4 border-t border-[var(--chalk)] p-4">
                {kindField ? renderField(kindField) : null}
                {!node.data.toolName && toolRoleField ? renderField(toolRoleField) : null}
                {producesDataField ? renderField(producesDataField) : null}
                {!editDataAssumptions && dataProfileField ? renderField(dataProfileField) : null}
                {node.data.hitl ? (
                  <div className="rounded-[var(--r-md)] border border-[var(--chalk)] bg-[var(--paper)] p-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--slate)]">Human-in-the-loop</p>
                    <p className="mt-1 font-sans text-[13px] text-[var(--ichigo-navy)]">{node.data.hitl.replaceAll("_", " ")}</p>
                  </div>
                ) : null}
              </div>
            </details>

            <BriefPreview node={node} />
          </>
        ) : null}
      </div>
      <div className="border-t border-[var(--chalk)] p-5">
        <p className="rounded-[var(--r-md)] border border-[var(--chalk)] bg-[var(--paper)] px-3 py-2 text-center font-sans text-[12px] text-[var(--slate)]">
          Step details saved automatically.
        </p>
      </div>
    </Card>
  );
}

function PanelSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--slate)]">{title}</p>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function DataProfileSummary({ node, expanded, onEdit }: { node: ProcessBuilderNode; expanded: boolean; onEdit: () => void }) {
  const profile = node.data.dataProfile;
  const chips = [
    profile.structure.replaceAll("_", " "),
    profile.accessibility.replaceAll("_", " "),
    profile.sensitivity,
    profile.source === "inherited" && node.data.toolName ? `Inherited from ${node.data.toolName}` : profile.source.replaceAll("_", " "),
  ];
  return (
    <div className="rounded-[var(--r-md)] border border-[var(--chalk)] bg-[var(--paper)] p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--slate)]">Structural data profile</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {chips.map((chip) => (
              <Badge key={chip} className="rounded-full bg-white px-2.5 py-1 font-sans text-[11px] text-[var(--ichigo-navy)]">
                {chip}
              </Badge>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="shrink-0 font-sans text-[12px] font-semibold text-[var(--ichigo-orange)]"
        >
          {expanded ? "Hide" : "Edit data assumptions"}
        </button>
      </div>
    </div>
  );
}

function BriefPreview({ node }: { node: ProcessBuilderNode }) {
  const owners = node.data.owner?.length ? node.data.owner.join(", ") : "Someone";
  const tool = node.data.toolName ? ` uses ${node.data.toolName}` : " works manually";
  const action = node.data.label || "this step";
  const output = node.data.output?.trim() ? `, producing ${node.data.output}` : "";
  const data = node.data.isDataCritical
    ? ` Data: ${node.data.dataProfile.sensitivity}, ${node.data.dataQuality.replaceAll("_", " ")}.`
    : ` Data: ${node.data.dataProfile.sensitivity}.`;
  const assistantOpportunity = node.data.assistantOpportunity
    ? " This human step may be suitable for an AI assistant, agent, or skill later."
    : "";
  return (
    <section className="rounded-[var(--r-md)] border border-[var(--chalk)] bg-[var(--paper)] p-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--slate)]">AI brief preview</p>
      <p className="mt-2 font-sans text-[13px] leading-6 text-[var(--ichigo-navy)]">
        {owners}{tool} to {action.toLowerCase()}{output}. Automation: L{node.data.automationLevel}.{data}{assistantOpportunity}
      </p>
    </section>
  );
}

function TriggerConfigFields({
  node,
  tools,
  onUpdate,
}: {
  node: ProcessBuilderNode;
  tools: Array<{ id: string; name: string; category?: string | null; catalog_id?: string | null }>;
  onUpdate: (patch: Partial<BuilderData>) => void;
}) {
  const ensureCatalogTool = useEnsureOrgToolFromCatalog();
  const triggerType = node.data.triggerType ?? "manual";
  const config = node.data.triggerConfig ?? {};
  const selectedToolId = config.toolId ?? "none";
  const knownEvent = eventTriggerOptions.some(([value]) => value === config.eventName);
  const eventSelectValue = knownEvent ? config.eventName! : customEventValue;

  const setTriggerType = (nextType: string) => {
    const next = nextType as TriggerType;
    onUpdate({
      triggerType: next,
      triggerConfig:
        next === "schedule"
          ? { scheduleKind: "interval", interval: config.interval ?? "1 day" }
          : next === "event"
            ? { toolId: null, toolName: null, eventName: config.eventName ?? "message_received" }
            : {},
      label: next === "manual" ? "Manual trigger" : next === "schedule" ? "Schedule trigger" : "Tool event trigger",
      automationLevel: 0,
    });
  };

  const selectEventTool = (toolId: string) => {
    const tool = tools.find((item) => item.id === toolId);
    onUpdate({
      triggerConfig: { ...config, toolId: tool?.id ?? null, toolName: tool?.name ?? null },
      label: tool ? `${tool.name} — ${(config.eventName ?? "message_received").replaceAll("_", " ")}` : "Tool event trigger",
    });
  };
  const selectEventCatalogTool = async (tool: ToolCatalogRow) => {
    const orgTool = await ensureCatalogTool.mutateAsync(tool.id);
    onUpdate({
      triggerConfig: { ...config, toolId: orgTool.id, toolName: orgTool.name },
      label: `${orgTool.name} — ${(config.eventName ?? "message_received").replaceAll("_", " ")}`,
    });
  };
  const setEventName = (eventName: string) => {
    const toolName = config.toolName ?? "Tool";
    onUpdate({ triggerConfig: { ...config, eventName }, label: `${toolName} — ${eventName.replaceAll("_", " ")}` });
  };

  return (
    <div className="space-y-4">
      <SelectField label="Trigger type" value={triggerType} onChange={setTriggerType} options={[["manual", "Manual"], ["schedule", "Schedule"], ["event", "On event"]]} />
      {triggerType === "schedule" ? (
        <>
          <SelectField
            label="Schedule kind"
            value={config.scheduleKind ?? "interval"}
            onChange={(scheduleKind) => onUpdate({ triggerConfig: { ...config, scheduleKind: scheduleKind as "interval" | "cron" } })}
            options={[["interval", "Interval"], ["cron", "Cron"]]}
          />
          {(config.scheduleKind ?? "interval") === "interval" ? (
            <TextInput label="Interval" value={config.interval ?? "1 day"} onChange={(interval) => onUpdate({ triggerConfig: { ...config, interval } })} />
          ) : (
            <TextInput label="Cron" value={config.cron ?? "0 9 * * *"} onChange={(cron) => onUpdate({ triggerConfig: { ...config, cron } })} />
          )}
        </>
      ) : null}
      {triggerType === "event" ? (
        <>
          <ToolCatalogPicker
            label="Trigger tool"
            value={selectedToolId}
            placeholder="Search trigger-capable tools"
            orgTools={tools}
            triggerOnly
            includeCatalogFallback
            catalogSearchOnly
            onSelectOrgTool={(tool) => selectEventTool(tool.id)}
            onSelectCatalog={selectEventCatalogTool}
          />
          <SelectField
            label="Event archetype"
            value={eventSelectValue}
            onChange={(next) => {
              if (next !== customEventValue) setEventName(next);
            }}
            options={[...eventTriggerOptions, [customEventValue, "Custom..."]]}
          />
          {eventSelectValue === customEventValue ? (
            <TextInput
              label="Custom event"
              value={config.eventName ?? ""}
              onChange={setEventName}
            />
          ) : null}
        </>
      ) : null}
      <div className="rounded-[var(--r-md)] border border-[var(--chalk)] bg-[var(--paper)] p-3">
        <p className="font-sans text-[13px] text-[var(--slate)]">
          Triggers start the map and stay out of scoring math.
        </p>
      </div>
    </div>
  );
}

function DataChips({ node, onChange }: { node: ProcessBuilderNode; onChange: (node: ProcessBuilderNode) => void }) {
  const profile = node.data.dataProfile;
  const chips: Array<[keyof Omit<DataProfile, "source">, string, string[]]> = [
    ["structure", "Structure", ["structured", "semi_structured", "unstructured"]],
    ["accessibility", "Access", ["api_accessible", "export_only", "manual"]],
    ["sensitivity", "Sensitivity", ["public", "internal", "personal", "sensitive"]],
    ["ownership", "Owner", ["System owner", "Operations", "Finance", "Data", "Step owner"]],
  ];
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--slate)]">Structural data profile</p>
        <Badge className="rounded-full bg-[var(--ichigo-mist)] px-3 py-1 text-[var(--ichigo-navy)]">{profile.source}</Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        {chips.map(([key, label, options]) => (
          <button
            key={key}
            type="button"
              onClick={() => {
              const current = String(profile[key]);
              const next = options[(options.indexOf(current) + 1) % options.length];
              onChange(hydrateNode({ ...node, data: { ...node.data, dataProfile: { ...profile, [key]: next, source: "overridden" } } }) as ProcessBuilderNode);
            }}
            className="rounded-full border border-[var(--chalk)] bg-[var(--ichigo-mist)] px-3 py-2 text-left font-sans text-[12px] font-medium text-[var(--ichigo-navy)]"
          >
            <span className="text-[var(--slate)]">{label}: </span>
            {String(profile[key]).replaceAll("_", " ")}
          </button>
        ))}
      </div>
    </div>
  );
}

function QualityControl({ node, onChange }: { node: ProcessBuilderNode; onChange: (node: ProcessBuilderNode) => void }) {
  const options: Array<[Exclude<DataQualityRating, "not_assessed">, string]> = [
    ["trusted", "Trusted"],
    ["needs_checking", "Needs checking"],
    ["unreliable", "Unreliable"],
  ];
  return (
    <div>
      <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--slate)]">Is this data reliable in practice?</p>
      <div className="grid grid-cols-3 gap-1">
        {options.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange(hydrateNode({ ...node, data: { ...node.data, dataQuality: value } }) as ProcessBuilderNode)}
            className={`min-h-10 rounded-[var(--r-sm)] px-2 font-sans text-[12px] font-medium ${node.data.dataQuality === value ? "bg-[var(--ichigo-orange)] text-white" : "bg-[var(--ichigo-mist)] text-[var(--ichigo-navy)]"}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

const copilotActions: Array<{ mode: DiagramAssistantMode; label: string; message: string; icon: LucideIcon }> = [
  { mode: "build", label: "Generate from description", message: "Generate a complete process map from this description:", icon: MessageSquare },
  { mode: "improve", label: "Improve map", message: "Review this process map and suggest missing steps or branches.", icon: GitBranch },
  { mode: "complete", label: "Find missing data", message: "Find missing owner, output, tool, data, and automation details.", icon: FileQuestion },
  { mode: "complete", label: "Auto-complete fields", message: "Suggest safe completions for missing process-step fields. Ask questions when uncertain.", icon: ClipboardCheck },
  { mode: "scoring_readiness", label: "Prepare for scoring", message: "Assess readiness for scoring and ask only the most important missing questions.", icon: ShieldCheck },
];

function CopilotDrawer({
  state,
  onApplyPatch,
}: {
  state: DiagramPatchState;
  onApplyPatch: (patch: DiagramPatch) => Promise<{ applied: OperationReport[]; rejected: OperationReport[] }>;
}) {
  const assistant = useDiagramAssistant();
  const [open, setOpen] = useState(true);
  const [mode, setMode] = useState<DiagramAssistantMode>("improve");
  const [message, setMessage] = useState("");
  const [patch, setPatch] = useState<DiagramPatch | null>(null);
  const [reports, setReports] = useState<{ applied: OperationReport[]; rejected: OperationReport[] } | null>(null);

  const request = async () => {
    const prompt = message.trim();
    if (!prompt) return;
    setReports(null);
    const nextPatch = await assistant.mutateAsync({ mode, message: prompt, state });
    setPatch(nextPatch);
  };

  const apply = async () => {
    if (!patch) return;
    const result = await onApplyPatch(patch);
    setReports(result);
  };

  if (!open) {
    return (
      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={() => setOpen(true)} className="rounded-[var(--r-md)] border-[var(--chalk)]">
          <MessageSquare className="mr-2 h-4 w-4" />
          Open copilot
        </Button>
      </div>
    );
  }

  return (
    <Card className="rounded-[var(--r-md)] border-[var(--chalk)] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ichigo-orange)]">Diagram copilot</p>
          <p className="mt-1 font-sans text-[14px] text-[var(--slate)]">Ask for a structured suggestion, preview it, then apply it to the canvas.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-[var(--r-md)] border-[var(--chalk)]">
          Hide
        </Button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {copilotActions.map(({ mode: actionMode, label, message: actionMessage, icon: Icon }) => (
          <button
            key={label}
            type="button"
            onClick={() => {
              setMode(actionMode);
              setMessage(actionMessage);
            }}
            className={`flex items-center gap-2 rounded-full border px-3 py-2 font-sans text-[12px] font-medium ${
              mode === actionMode && message === actionMessage
                ? "border-[var(--ichigo-navy)] bg-[var(--ichigo-navy)] text-white"
                : "border-[var(--chalk)] bg-[var(--ichigo-mist)] text-[var(--ichigo-navy)]"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
        <Textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Ask AI to add a rejection path after approval, find missing fields, or build from a short process description."
          className="min-h-24 rounded-[var(--r-md)] border-[var(--chalk)] bg-white"
        />
        <Button
          type="button"
          disabled={assistant.isPending || !message.trim()}
          onClick={request}
          className="rounded-[var(--r-md)] bg-[var(--ichigo-orange)] text-white hover:bg-[var(--ichigo-orange)]/90"
        >
          {assistant.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquare className="mr-2 h-4 w-4" />}
          Ask AI
        </Button>
      </div>
      {assistant.error ? (
        <p className="mt-3 rounded-[var(--r-md)] bg-[var(--danger)]/10 p-3 font-sans text-[13px] text-[var(--danger)]">
          {assistant.error.message}
        </p>
      ) : null}
      {patch ? (
        <div className="mt-4 rounded-[var(--r-md)] border border-[var(--chalk)] bg-[var(--paper)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Badge className="rounded-full bg-[var(--ichigo-mist)] px-3 py-1 text-[var(--ichigo-navy)]">
                {patch.confidence} confidence
              </Badge>
              <p className="mt-2 font-sans text-[14px] text-[var(--graphite)]">{patch.summary}</p>
            </div>
            <Button type="button" onClick={apply} className="rounded-[var(--r-md)] bg-[var(--ichigo-navy)] text-white hover:bg-[var(--ichigo-navy)]/90">
              Apply patch
            </Button>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {patch.operations.length ? patch.operations.map((operation, index) => (
              <div key={`${operation.op}-${index}`} className="rounded-[var(--r-sm)] border border-[var(--chalk)] bg-white p-3">
                <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--slate)]">{operation.op.replaceAll("_", " ")}</p>
                <p className="mt-1 font-sans text-[13px] text-[var(--ichigo-navy)]">{operationSummary(operation)}</p>
              </div>
            )) : (
              <p className="rounded-[var(--r-sm)] border border-[var(--chalk)] bg-white p-3 font-sans text-[13px] text-[var(--slate)]">
                No graph edits proposed.
              </p>
            )}
          </div>
          {patch.questions?.length ? (
            <div className="mt-3 space-y-2">
              {patch.questions.map((question) => (
                <p key={`${question.field}-${question.question}`} className="rounded-[var(--r-sm)] bg-white p-3 font-sans text-[13px] text-[var(--graphite)]">
                  <span className="font-semibold text-[var(--ichigo-navy)]">{question.field}: </span>
                  {question.question}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
      {reports ? (
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {reports.applied.map((report, index) => (
            <p key={`applied-${index}`} className="rounded-[var(--r-sm)] bg-[var(--success)]/10 p-3 font-sans text-[13px] text-[var(--ichigo-navy)]">
              Applied {report.op.replaceAll("_", " ")}{report.detail ? `: ${report.detail}` : ""}
            </p>
          ))}
          {reports.rejected.map((report, index) => (
            <p key={`rejected-${index}`} className="rounded-[var(--r-sm)] bg-[var(--warning)]/10 p-3 font-sans text-[13px] text-[var(--ichigo-navy)]">
              Could not apply {report.op.replaceAll("_", " ")}: {report.reason}
            </p>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

function operationSummary(operation: DiagramPatch["operations"][number]) {
  if (operation.op === "add_node") return `Add ${nodeKindLabel(operation.node.data.kind)} "${operation.node.data.label}".`;
  if (operation.op === "update_node") return `Update node ${operation.id}.`;
  if (operation.op === "delete_node") return `Delete node ${operation.id}.`;
  if (operation.op === "add_edge") return `Connect ${operation.source} to ${operation.target}.`;
  if (operation.op === "delete_edge") return operation.id ? `Delete edge ${operation.id}.` : `Delete edge ${operation.source} to ${operation.target}.`;
  if (operation.op === "insert_node_after") return `Insert ${nodeKindLabel(operation.node.data.kind)} "${operation.node.data.label}" after ${operation.afterId}.`;
  if (operation.op === "add_branch") return `Add ${operation.label} branch from If ${operation.decisionId}.`;
  if (operation.op === "add_sticky_note") return `Add ${operation.note.data.category.replaceAll("_", " ")} note.`;
  if (operation.op === "update_frame") return "Update Frame fields.";
  return "Update characterization fields.";
}

function SubmitStep(props: {
  frame: Record<string, any>;
  derivedEndpoints: ReturnType<typeof deriveProcessEndpoints>;
  derivedFromDiagram: ReturnType<typeof deriveDiagram>;
  derivedData: ReturnType<typeof deriveStepData>;
  riskTier: ReturnType<typeof classifyRiskTier>;
  scores: Record<string, unknown>;
  readiness: ReturnType<typeof validateScoreReadiness>;
  disabled: boolean;
  blockReason?: string;
  pending: boolean;
  error?: string;
  onSubmit: () => void;
  currentStep: BuilderStep;
  onNavigateStep: (step: BuilderStep) => void;
}) {
  return (
    <Card className="rounded-[var(--r-md)] border-[var(--chalk)] bg-white p-6">
      <div className="mb-5 border-b border-[var(--chalk)] pb-4">
        <BuilderStageStepper current={props.currentStep} onSelect={props.onNavigateStep} />
      </div>
      <div className="mb-5 rounded-[var(--r-md)] border border-[var(--chalk)] bg-[var(--paper)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--slate)]">
              Risk tier preview
            </p>
            <p className="mt-2 font-sans text-[14px] text-[var(--graphite)]">{props.riskTier.reason}</p>
          </div>
          <RiskTierBadge tier={props.riskTier.tier} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Metric label="Overlay" value={props.riskTier.overlayLevel} />
          <Metric label="Approvals" value={props.riskTier.requiredApprovalsCount} />
          <Metric label="Audit cadence" value={`${props.riskTier.auditCadenceDays}d`} />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="stepCount" value={props.derivedFromDiagram.stepCount} />
        <Metric label="decisionPoints" value={props.derivedFromDiagram.decisionPoints} />
        <Metric label="automationCeiling" value={`L${props.derivedFromDiagram.automationCeiling}`} />
        <Metric label="dataClassification" value={props.derivedData.dataClassification.replaceAll("_", " ")} />
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="rounded-[var(--r-md)] border border-[var(--chalk)] bg-white p-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--slate)]">Trigger, from trigger node</p>
          <p className="mt-2 font-sans text-[14px] font-semibold text-[var(--ichigo-navy)]">{props.derivedEndpoints.trigger}</p>
        </div>
        <div className="rounded-[var(--r-md)] border border-[var(--chalk)] bg-white p-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--slate)]">Output, from end/output node</p>
          <p className="mt-2 font-sans text-[14px] font-semibold text-[var(--ichigo-navy)]">{props.derivedEndpoints.output}</p>
        </div>
      </div>
      <div className="mt-5 rounded-[var(--r-md)] border border-[var(--chalk)] bg-[var(--paper)] p-4">
        <Badge className={`${riskTierClass(props.riskTier.tier)} rounded-full px-3 py-1`}>
          {props.riskTier.label}
        </Badge>
        <p className="mt-2 font-sans text-[14px] text-[var(--graphite)]">{props.riskTier.reason}</p>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--slate)]">
          Governance overlay: {props.riskTier.overlay} · {props.riskTier.auditCadence}
        </p>
      </div>
      <div className="mt-5 rounded-[var(--r-md)] border border-[var(--chalk)] bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--slate)]">Scoring readiness</p>
            <p className="mt-1 font-sans text-[14px] text-[var(--graphite)]">
              {props.readiness.passed}/{props.readiness.total} checks passed · {props.readiness.confidence} confidence
            </p>
          </div>
          <Badge className="rounded-full bg-[var(--ichigo-mist)] px-3 py-1 text-[var(--ichigo-navy)]">
            {props.readiness.confidence}
          </Badge>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {props.readiness.checks.map((item) => (
            <div key={item.id} className="rounded-[var(--r-sm)] border border-[var(--chalk)] bg-[var(--paper)] p-3">
              <div className="flex items-center gap-2">
                {item.passed ? <Check className="h-4 w-4 text-[var(--success)]" /> : <FileQuestion className="h-4 w-4 text-[var(--warning)]" />}
                <p className="font-sans text-[13px] font-semibold text-[var(--ichigo-navy)]">{item.label}</p>
              </div>
              {!item.passed ? <p className="mt-1 font-sans text-[12px] text-[var(--slate)]">{item.detail}</p> : null}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {Object.entries(props.scores)
          .filter(([, value]) => typeof value === "number")
          .slice(0, 6)
          .map(([key, value]) => (
          <div key={key}>
            <div className="mb-2 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--slate)]">
              <span>{key}</span>
              <span>{value as number}/100</span>
            </div>
            <Progress value={value as number} className="h-2 bg-[var(--ichigo-mist)] [&>div]:bg-[var(--ichigo-azure)]" />
          </div>
        ))}
      </div>
      {props.error ? <p className="mt-4 rounded-[var(--r-md)] bg-[var(--danger)]/10 p-3 text-[var(--danger)]">{props.error}</p> : null}
      {props.blockReason ? <p className="mt-4 rounded-[var(--r-md)] bg-[var(--warning)]/10 p-3 text-[var(--ichigo-navy)]">{props.blockReason}</p> : null}
      <Button disabled={props.disabled} onClick={props.onSubmit} className="mt-6 rounded-[var(--r-md)] bg-[var(--ichigo-orange)] text-white hover:bg-[var(--ichigo-orange)]/90">
        {props.pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Submit process for review
      </Button>
    </Card>
  );
}

function InsertEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
}: EdgeProps<BuilderEdge>) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const openPicker = () => {
    window.dispatchEvent(
      new CustomEvent<OpenNodePickerDetail>(openNodePickerEvent, {
        detail: {
          mode: "insert",
          edgeId: id,
          source,
          target,
          x: labelX,
          y: labelY,
        },
      }),
    );
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan absolute z-50"
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`, pointerEvents: "all" }}
        >
          <PlaceholderButton label="Add step" onClick={openPicker} />
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

function ProcessNode({ id, data, selected }: NodeProps<ProcessBuilderNode>) {
  const Icon = kindIcon[data.kind];
  const issues = data.ui?.issues ?? [];
  const isTerminal = (data.ui?.outgoingCount ?? 0) === 0;
  const isVertical = data.ui?.layoutDirection === "DOWN";
  const [toolLogoFailed, setToolLogoFailed] = useState(false);
  const targetPosition = isVertical ? Position.Top : Position.Left;
  const sourcePosition = isVertical ? Position.Bottom : Position.Right;
  const handleStyle = {
    width: 14,
    height: 14,
    background: "var(--ichigo-orange)",
    border: "2px solid white",
    boxShadow: "0 0 0 3px color-mix(in srgb, var(--ichigo-orange) 22%, transparent)",
    zIndex: 20,
  };
  const fallbackSubtitle = data.kind === "merge"
    ? "Join branches"
    : [ownerDisplay(data), toolDisplayLine(data) || (data.output && data.output.length < 34 ? data.output : "")].filter(Boolean).join(" · ");
  const subtitle = data.description?.trim() || fallbackSubtitle;
  const triggerChip = data.kind === "trigger" ? triggerLabel({ id, type: "processNode", position: { x: 0, y: 0 }, data }) : "";
  const dataTone =
    data.dataProfile.sensitivity === "sensitive"
      ? "border-[var(--danger)] bg-[var(--danger)]/10 text-[var(--danger)]"
      : data.dataProfile.sensitivity === "personal"
        ? "border-[var(--warning)] bg-[var(--warning)]/10 text-[var(--ichigo-navy)]"
        : "border-[var(--chalk)] bg-[var(--paper)] text-[var(--slate)]";
  const hasIssues = issues.length > 0;
  const openAppendPicker = () => {
    window.dispatchEvent(
      new CustomEvent<OpenNodePickerDetail>(openNodePickerEvent, {
        detail: { mode: "append", sourceId: id },
      }),
    );
  };
  const openBranchPicker = (label = "False") => {
    window.dispatchEvent(
      new CustomEvent<OpenNodePickerDetail>(openNodePickerEvent, {
        detail: { mode: "branch", sourceId: id, label },
      }),
    );
  };

  return (
    <div
      className={`group relative ${data.kind === "merge" ? "w-48" : "w-64"} rounded-[var(--r-md)] border bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md motion-reduce:hover:translate-y-0 ${
        hasIssues
          ? "border-[var(--danger)] ring-2 ring-[var(--danger)]/20"
          : selected
            ? "border-[var(--ichigo-orange)] ring-2 ring-[var(--ichigo-orange)]/25"
            : "border-[var(--chalk)]"
      }`}
    >
      <Handle type="target" position={targetPosition} style={handleStyle} className="transition-transform group-hover:scale-125" />
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--r-sm)] border border-[var(--chalk)] bg-[var(--paper)]">
          {data.toolName && data.ui?.toolLogoUrl && !toolLogoFailed ? (
            <img src={data.ui.toolLogoUrl} alt="" className="h-6 w-6 object-contain" onError={() => setToolLogoFailed(true)} />
          ) : (
            <Icon className="h-4 w-4 text-[var(--ichigo-orange)]" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-display text-[15px] leading-5 text-[var(--ichigo-navy)]">{data.label}</p>
            <span className="shrink-0 rounded-full bg-[var(--ichigo-mist)] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--ichigo-navy)]">
              {nodeKindLabel(data.kind)}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 font-sans text-[12px] text-[var(--slate)]">{subtitle || (data.kind === "merge" ? "Join branches" : "Add owner and output")}</p>
        </div>
        {hasIssues ? (
          <span
            title={issues.join("\n")}
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--danger)] text-white ring-4 ring-[var(--danger)]/15"
          >
            <FileQuestion className="h-3.5 w-3.5" />
          </span>
        ) : null}
      </div>
      {data.templateSuggested && hasIssues ? (
        <div className="mt-2">
          <span className="rounded-full border border-[var(--danger)]/25 bg-[var(--danger)]/10 px-2 py-1 font-sans text-[10px] font-semibold text-[var(--danger)]">
            Needs confirmation
          </span>
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {data.assistantOpportunity ? (
          <span className="rounded-full border border-[var(--ichigo-orange)]/25 bg-[var(--ichigo-orange)]/10 px-2 py-1 font-sans text-[10px] font-semibold text-[var(--ichigo-navy)]">
            Assistant opportunity
          </span>
        ) : null}
        {data.toolName ? (
          <span className="max-w-full truncate rounded-full border border-[var(--ichigo-orange)]/30 bg-[var(--ichigo-orange)]/10 px-2 py-1 font-sans text-[10px] font-semibold text-[var(--ichigo-navy)]">
            {data.toolName}{data.toolActionName ? ` · ${data.toolActionName}` : data.toolRole ? ` · ${rolePhrase(data.toolRole)}` : ""}
          </span>
        ) : null}
        {data.kind !== "trigger" && data.kind !== "merge" ? (
          <span className="rounded-full border border-[var(--chalk)] bg-white px-2 py-1 font-mono text-[10px] text-[var(--ichigo-navy)]">
            L{data.automationLevel}
          </span>
        ) : null}
        {data.kind === "merge" ? (
          <span className="rounded-full border border-[var(--chalk)] bg-[var(--paper)] px-2 py-1 font-sans text-[10px] text-[var(--ichigo-navy)]">
            Join paths
          </span>
        ) : null}
        {data.producesData ? (
          <span className={`rounded-full border px-2 py-1 font-sans text-[10px] font-medium ${dataTone}`}>
            Data: {data.dataProfile.sensitivity}
          </span>
        ) : null}
        {triggerChip ? (
          <span className="max-w-full truncate rounded-full border border-[var(--chalk)] bg-[var(--paper)] px-2 py-1 font-sans text-[10px] text-[var(--ichigo-navy)]">
            {triggerChip}
          </span>
        ) : null}
      </div>
      {data.kind === "decision" ? (
        <div className="mt-3 space-y-1.5 border-t border-[var(--chalk)] pt-2">
          <div className="flex flex-wrap gap-1.5">
            {(data.ui?.branchLabels ?? []).map((label, index) => (
              <span key={`${label}-${index}`} className="rounded-full bg-[var(--paper)] px-2 py-1 font-sans text-[10px] text-[var(--slate)]">
                {label}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              openBranchPicker((data.ui?.branchLabels?.length ?? 0) === 0 ? "True" : "False");
            }}
            className="flex items-center gap-1 rounded-full border border-dashed border-[var(--ichigo-orange)] px-2 py-1 font-sans text-[10px] font-semibold text-[var(--ichigo-orange)]"
          >
            <Plus className="h-3 w-3" />
            Add branch
          </button>
        </div>
      ) : null}
      {data.ui?.showToolTile && data.toolName ? (
        <div className={`nodrag absolute left-1/2 top-full z-10 flex -translate-x-1/2 flex-col items-center ${isVertical ? "mt-8" : "mt-3"}`}>
          <span className="h-4 w-px bg-[var(--chalk)]" />
          <button
            type="button"
            title="Edit tool used by this step"
            className="flex min-w-36 max-w-48 items-center gap-2 rounded-[var(--r-md)] border border-[var(--chalk)] bg-white px-2 py-2 text-left shadow-sm transition hover:border-[var(--ichigo-orange)]"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--r-sm)] bg-[var(--paper)]">
              {data.ui.toolLogoUrl && !toolLogoFailed ? (
                <img src={data.ui.toolLogoUrl} alt="" className="h-5 w-5 object-contain" onError={() => setToolLogoFailed(true)} />
              ) : (
                <Icon className="h-3.5 w-3.5 text-[var(--ichigo-orange)]" />
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-sans text-[11px] font-semibold text-[var(--ichigo-navy)]">{data.toolName}</span>
              <span className="block truncate font-sans text-[10px] text-[var(--slate)]">{data.toolActionName ?? (rolePhrase(data.toolRole) || data.ui.toolCategory || "Tool")}</span>
            </span>
          </button>
        </div>
      ) : null}
      <button
        type="button"
        title="Append after this node"
        onClick={(event) => {
          event.stopPropagation();
          openAppendPicker();
        }}
        className={`absolute z-10 flex h-10 min-w-10 items-center justify-center rounded-full border border-[var(--ichigo-orange)] bg-white px-2 text-[var(--ichigo-orange)] shadow-sm transition hover:bg-[var(--ichigo-orange)] hover:text-white ${
          isVertical ? "-bottom-6 left-[calc(50%+28px)] -translate-x-1/2" : "-right-7 top-[calc(50%+32px)] -translate-y-1/2"
        } ${
          isTerminal || selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        <Plus className="h-4 w-4" />
        {isTerminal ? <span className="ml-1 hidden font-sans text-[11px] font-semibold xl:inline">Add</span> : null}
      </button>
      <Handle type="source" position={sourcePosition} style={handleStyle} className="transition-transform group-hover:scale-125" />
    </div>
  );
}

function StickyNode({ data }: NodeProps<StickyBuilderNode>) {
  return (
    <div className="w-52 rounded-[var(--r-md)] border border-[var(--warning)]/40 bg-[var(--paper)] p-3 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <StickyNote className="h-4 w-4 text-[var(--ichigo-orange)]" />
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--slate)]">
          {data.category.replaceAll("_", " ")}
        </p>
      </div>
      <p className="font-sans text-[13px] text-[var(--ichigo-navy)]">{data.text}</p>
    </div>
  );
}

function hydrateNode(node: BuilderNode): BuilderNode {
  if (!isProcessNode(node)) return node;
  const legacyActor = typeof node.data.actor === "string" ? node.data.actor.trim() : "";
  const owner = Array.isArray(node.data.owner) && node.data.owner.length
    ? node.data.owner.map(String).map((item) => item.trim()).filter(Boolean)
    : legacyActor
      ? [legacyActor]
      : [];
  const rawKind = (node.data as { kind?: string }).kind;
  const legacyMappedData =
    rawKind === "start"
      ? {
          ...node.data,
          kind: "trigger" as NodeKind,
          triggerType: node.data.triggerType ?? "manual",
          triggerConfig: node.data.triggerConfig ?? {},
          label: node.data.label === "Start" ? "Manual trigger" : node.data.label,
          automationLevel: 0,
        }
      : node.data.kind === "trigger"
        ? {
            ...node.data,
            triggerType: node.data.triggerType ?? "manual",
            triggerConfig: node.data.triggerConfig ?? {},
            automationLevel: 0,
          }
        : node.data.kind === "merge"
          ? {
              ...node.data,
              automationLevel: 0,
              producesData: false,
            }
        : node.data;
  const normalizedNode = { ...node, data: legacyMappedData };
  const profile = node.data.dataProfile ?? manualProfile;
  const isDataCritical =
    !["trigger", "merge"].includes(normalizedNode.data.kind) && (
    ["Manual Entry", "Email", "File/PDF", "Call notes"].includes(normalizedNode.data.inputType) ||
    profile.structure === "unstructured" ||
    normalizedNode.data.producesData ||
    normalizedNode.data.automationLevel >= 3);
  const dataQuality = isDataCritical
    ? normalizedNode.data.dataQuality === "not_assessed"
      ? "needs_checking"
      : normalizedNode.data.dataQuality
    : "not_assessed";

  return {
    ...normalizedNode,
    data: {
      ...normalizedNode.data,
      description: normalizedNode.data.description ?? "",
      owner,
      dataProfile: profile,
      isDataCritical,
      dataQuality,
      assistantOpportunity: Boolean(normalizedNode.data.assistantOpportunity),
    },
  };
}

function ownerDisplay(data: Pick<BuilderData, "owner" | "actor">) {
  const owners = Array.isArray(data.owner) ? data.owner.filter(Boolean) : [];
  if (owners.length) return owners.join(", ");
  return data.actor?.trim() ?? "";
}

function isGenericStepLabel(label?: string) {
  const value = (label ?? "").trim().toLowerCase();
  return !value || value === "new task" || value === "task" || value === "use tool" || value === "new step";
}

function inferToolRole(tool?: { name?: string | null; category?: string | null; data_stored?: string | null }): ToolRole {
  const haystack = `${tool?.name ?? ""} ${tool?.category ?? ""} ${tool?.data_stored ?? ""}`.toLowerCase();
  if (/(gmail|mail|outlook|slack|teams|telegram|whatsapp|message|communication|mailchimp)/.test(haystack)) return "sends";
  if (/(drive|dropbox|box|sharepoint|notion|airtable|document|files|storage|content)/.test(haystack)) return "stores";
  if (/(crm|salesforce|hubspot|pipedrive|zendesk|support|customer)/.test(haystack)) return "updates";
  if (/(quickbooks|stripe|xero|invoice|accounting|payment|finance)/.test(haystack)) return "creates";
  if (/(analytics|bi|report|dashboard)/.test(haystack)) return "reads";
  return "updates";
}

function rolePhrase(role?: ToolRole | string) {
  if (!role) return "";
  return role.replaceAll("_", " ");
}

function toolDisplayLine(data: Pick<BuilderData, "toolName" | "toolRole" | "toolActionName" | "output">) {
  if (!data.toolName) return "";
  const role = data.toolActionName ?? rolePhrase(data.toolRole);
  const object = data.output?.trim();
  return [data.toolName, role && object ? `${role} ${object}` : role].filter(Boolean).join(" · ");
}

function edge(source: string, target: string): BuilderEdge {
  return {
    id: `${source}-${target}-${Date.now()}`,
    source,
    target,
    type: "insertEdge",
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: "var(--slate)", strokeWidth: 1.8 },
  };
}

function normalizeEdge(item: BuilderEdge): BuilderEdge {
  return {
    ...item,
    type: item.type ?? "insertEdge",
    markerEnd: item.markerEnd ?? { type: MarkerType.ArrowClosed },
    style: item.style ?? { stroke: "var(--slate)", strokeWidth: 1.8 },
  };
}

function nodeIssues(node: ProcessBuilderNode, edges: BuilderEdge[]) {
  if (node.data.kind === "trigger" || node.data.kind === "end") return [];
  const issues: string[] = [];
  if (node.data.kind === "merge") {
    if (edges.filter((edge) => edge.target === node.id).length < 2) issues.push("Merge needs at least two incoming paths");
    return issues;
  }
  if (!ownerDisplay(node.data)) issues.push("Missing owner");
  if (!node.data.output?.trim()) issues.push("Missing output");
  if (node.data.kind === "decision" && edges.filter((edge) => edge.source === node.id).length < 2) {
    issues.push("If needs at least two branches");
  }
  return issues;
}

function profileFrom(
  tool?: { data_stored?: string | null; integration_status?: number | null; api_available?: boolean | null },
  source?: { data_type: string | null; accessibility: string | null; sensitivity_level: string | null; department_owner_id: string | null },
): Omit<DataProfile, "source"> {
  const dataType = source?.data_type ?? tool?.data_stored ?? "";
  const structure: DataStructure = dataType.includes("unstructured")
    ? "unstructured"
    : dataType.includes("semi")
      ? "semi_structured"
      : "structured";
  const accessibility: DataAccessibility = source?.accessibility === "manual"
    ? "manual"
    : source?.accessibility === "export_only" || !tool?.api_available
      ? "export_only"
      : "api_accessible";
  const sensitivity = (["public", "internal", "personal", "sensitive"].includes(source?.sensitivity_level ?? "")
    ? source?.sensitivity_level
    : "internal") as DataSensitivity;

  return {
    structure,
    accessibility,
    sensitivity,
    ownership: source?.department_owner_id ? "Department owner" : "System owner",
  };
}

function qualityFrom(value?: string | null): DataQualityRating {
  return value === "trusted" || value === "needs_checking" || value === "unreliable" ? value : "needs_checking";
}

function deriveDiagram(nodes: BuilderNode[]) {
  const processNodes = nodes.filter(isProcessNode);
  const workNodes = processNodes.filter((node) => !["trigger", "end", "merge"].includes(node.data.kind));
  return {
    stepCount: workNodes.length,
    decisionPoints: processNodes.filter((node) => node.data.kind === "decision").length,
    automationCeiling: Math.max(0, ...workNodes.map((node) => node.data.automationLevel)),
    tools: new Set(processNodes.map((node) => node.data.toolId).filter(Boolean)).size,
  };
}

function deriveProcessEndpoints(nodes: BuilderNode[]) {
  const processNodes = nodes.filter(isProcessNode);
  const trigger = processNodes.find((node) => node.data.kind === "trigger");
  const end = processNodes.find((node) => node.data.kind === "end");
  const lastOutputNode = [...processNodes].reverse().find((node) => node.data.kind === "output" && node.data.output.trim());
  const sinkNodes = processNodes.filter((node) => node.data.kind !== "trigger");
  const lastSink = [...sinkNodes].reverse().find((node) => node.data.output.trim() || node.data.label.trim());
  const triggerText = trigger ? triggerLabel(trigger) : "No trigger";
  const output = end?.data.output.trim() || lastOutputNode?.data.output.trim() || end?.data.label.trim() || lastSink?.data.output.trim() || lastSink?.data.label.trim() || "No output yet";

  return { trigger: triggerText, output };
}

function isDiagramSubmittable(nodes: BuilderNode[], edges: BuilderEdge[]) {
  const processNodes = nodes.filter(isProcessNode);
  const triggers = processNodes.filter((node) => node.data.kind === "trigger");
  const workNodes = processNodes.filter((node) => !["trigger", "end", "merge"].includes(node.data.kind));
  if (!triggers.length || !workNodes.length) return false;

  const visited = new Set<string>();
  const queue = triggers.map((node) => node.id);
  while (queue.length) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    visited.add(current);
    edges.filter((item) => item.source === current).forEach((item) => queue.push(item.target));
  }

  return workNodes.every((node) => visited.has(node.id));
}

function triggerLabel(node: ProcessBuilderNode) {
  const config = node.data.triggerConfig ?? {};
  if (node.data.triggerType === "schedule") {
    if (config.scheduleKind === "cron" && config.cron) return `Schedule: ${config.cron}`;
    return `Schedule: ${config.interval ?? "1 day"}`;
  }
  if (node.data.triggerType === "event") {
    return `${config.toolName ?? node.data.toolName ?? "Tool"}: ${(config.eventName ?? "message_received").replaceAll("_", " ")}`;
  }
  return node.data.output.trim() || node.data.label.trim() || "Manual trigger";
}

const accessibilityRank: Record<DataAccessibility, number> = { api_accessible: 3, export_only: 2, manual: 1 };
const structureRank: Record<DataStructure, number> = { structured: 3, semi_structured: 2, unstructured: 1 };
const sensitivityRank: Record<DataSensitivity, number> = { public: 1, internal: 2, personal: 3, sensitive: 4 };
const qualityRank: Record<DataQualityRating, number> = { trusted: 3, needs_checking: 2, unreliable: 1, not_assessed: 0 };

function weakest<T extends string>(items: T[], rank: Record<T, number>) {
  return items.reduce((current, item) => (rank[item] < rank[current] ? item : current), items[0]);
}

function strongest<T extends string>(items: T[], rank: Record<T, number>) {
  return items.reduce((current, item) => (rank[item] > rank[current] ? item : current), items[0]);
}

function deriveStepData(nodes: BuilderNode[]) {
  const processNodes = nodes.filter(isProcessNode);
  const evidenceNodes = processNodes.filter((node) => !["trigger", "end", "merge"].includes(node.data.kind));
  const evidence = evidenceNodes.map((node) => ({
    nodeId: node.id,
    label: node.data.label,
    dataSourceId: node.data.dataSourceId ?? undefined,
    accessibility: node.data.dataProfile.accessibility,
    structure: node.data.dataProfile.structure,
    sensitivity: node.data.dataProfile.sensitivity,
    dataQuality: node.data.isDataCritical ? node.data.dataQuality : "not_assessed",
    isDataCritical: node.data.isDataCritical,
  }));
  if (!evidence.length) {
    return {
      source: "steps" as const,
      dataReadiness: 0,
      dataAccessibility: "manual" as DataAccessibility,
      dataStructureType: "unstructured" as DataStructure,
      dataClassification: "internal" as DataSensitivity,
      dataQuality: "needs_checking" as Exclude<DataQualityRating, "not_assessed">,
      evidence,
    };
  }
  const dataAccessibility = weakest(evidence.map((item) => item.accessibility), accessibilityRank);
  const dataStructureType = weakest(evidence.map((item) => item.structure), structureRank);
  const dataClassification = strongest(evidence.map((item) => item.sensitivity), sensitivityRank);
  const criticalQualities = evidence
    .filter((item) => item.isDataCritical)
    .map((item) => (item.dataQuality === "not_assessed" ? "needs_checking" : item.dataQuality));
  const dataQuality = weakest(criticalQualities.length ? criticalQualities : ["needs_checking"], qualityRank) as Exclude<DataQualityRating, "not_assessed">;
  const readiness = Math.min(
    { api_accessible: 95, export_only: 65, manual: 35 }[dataAccessibility],
    { structured: 95, semi_structured: 70, unstructured: 40 }[dataStructureType],
    { trusted: 95, needs_checking: 65, unreliable: 25 }[dataQuality],
  );

  return {
    source: "steps" as const,
    dataReadiness: readiness,
    dataAccessibility,
    dataStructureType,
    dataClassification,
    dataQuality,
    evidence,
  };
}

async function layoutNodes(nodes: BuilderNode[], edges: BuilderEdge[], direction: LayoutDirection = "RIGHT") {
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, string[]>();
  for (const node of nodes) {
    incoming.set(node.id, 0);
    outgoing.set(node.id, []);
  }
  for (const edge of edges) {
    if (!incoming.has(edge.target) || !outgoing.has(edge.source)) continue;
    incoming.set(edge.target, (incoming.get(edge.target) ?? 0) + 1);
    outgoing.get(edge.source)?.push(edge.target);
  }

  const roots = nodes.filter((node) => (incoming.get(node.id) ?? 0) === 0);
  const queue = roots.length ? [...roots] : nodes.slice(0, 1);
  const depth = new Map<string, number>();
  queue.forEach((node, index) => depth.set(node.id, index));

  while (queue.length) {
    const node = queue.shift()!;
    const nextDepth = (depth.get(node.id) ?? 0) + 1;
    for (const target of outgoing.get(node.id) ?? []) {
      if ((depth.get(target) ?? -1) < nextDepth) {
        depth.set(target, nextDepth);
        const targetNode = nodes.find((item) => item.id === target);
        if (targetNode) queue.push(targetNode);
      }
    }
  }

  const layers = new Map<number, BuilderNode[]>();
  nodes.forEach((node, index) => {
    const layer = depth.get(node.id) ?? index;
    const rows = layers.get(layer) ?? [];
    rows.push(node);
    layers.set(layer, rows);
  });

  const primaryGap = 340;
  const secondaryGap = 190;
  return nodes.map((node) => {
    const layer = depth.get(node.id) ?? 0;
    const rows = layers.get(layer) ?? [node];
    const rowIndex = rows.findIndex((item) => item.id === node.id);
    const centeredOffset = (rowIndex - (rows.length - 1) / 2) * secondaryGap;
    const position =
      direction === "DOWN"
        ? { x: centeredOffset, y: layer * primaryGap }
        : { x: layer * primaryGap, y: centeredOffset };
    return { ...node, position };
  });
}

function TextInput({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <div className="space-y-2">
      <Label className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--slate)]">{label}</Label>
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-[var(--r-md)] border-[var(--chalk)] bg-white" />
    </div>
  );
}

function OwnerMultiSelect({
  label,
  value,
  members,
  onChange,
}: {
  label: string;
  value: string[];
  members: MemberSuggestion[];
  onChange: (value: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const normalized = new Set(value.map((item) => item.toLowerCase()));
  const suggestions = members
    .filter((member) => !normalized.has(member.name.toLowerCase()))
    .filter((member) => {
      const needle = draft.trim().toLowerCase();
      if (!needle) return true;
      return `${member.name} ${member.role} ${member.department}`.toLowerCase().includes(needle);
    })
    .slice(0, 5);
  const addOwner = (owner: string) => {
    const next = owner.trim();
    if (!next || normalized.has(next.toLowerCase())) return;
    onChange([...value, next]);
    setDraft("");
  };
  const removeOwner = (owner: string) => onChange(value.filter((item) => item !== owner));

  return (
    <div className="space-y-2">
      <Label className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--slate)]">{label}</Label>
      <div className="rounded-[var(--r-md)] border border-[var(--chalk)] bg-white p-2">
        <div className="flex flex-wrap gap-2">
          {value.map((owner) => (
            <button
              key={owner}
              type="button"
              onClick={() => removeOwner(owner)}
              className="rounded-full bg-[var(--ichigo-mist)] px-3 py-1 font-sans text-[12px] text-[var(--ichigo-navy)]"
              title="Remove owner"
            >
              {owner} ×
            </button>
          ))}
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addOwner(draft);
              }
              if (event.key === "Backspace" && !draft && value.length) {
                removeOwner(value[value.length - 1]);
              }
            }}
            placeholder={value.length ? "Add another owner" : "Person, team, or role"}
            className="h-8 min-w-40 flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
          />
        </div>
      </div>
      {suggestions.length ? (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => addOwner(member.name)}
              className="rounded-full border border-[var(--chalk)] bg-[var(--paper)] px-3 py-1 text-left font-sans text-[11px] text-[var(--ichigo-navy)]"
            >
              {member.name}
              {member.role ? <span className="ml-1 text-[var(--slate)]">· {member.role}</span> : null}
            </button>
          ))}
        </div>
      ) : draft.trim() ? (
        <Button type="button" variant="outline" onClick={() => addOwner(draft)} className="h-8 rounded-[var(--r-md)] border-[var(--chalk)] text-[12px]">
          Add “{draft.trim()}”
        </Button>
      ) : null}
    </div>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2 md:col-span-2">
      <Label className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--slate)]">{label}</Label>
      <Textarea value={value} onChange={(event) => onChange(event.target.value)} className="min-h-24 rounded-[var(--r-md)] border-[var(--chalk)] bg-white" />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<[string, string]> }) {
  return (
    <div className="space-y-2">
      <Label className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--slate)]">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-11 rounded-[var(--r-md)] border-[var(--chalk)] bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([optionValue, optionLabel]) => (
            <SelectItem key={optionValue} value={optionValue}>
              {optionLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[var(--r-md)] border border-[var(--chalk)] bg-white p-3">
      <p className="font-display text-[28px] leading-none text-[var(--ichigo-orange)]">{value}</p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--slate)]">{label}</p>
    </div>
  );
}

function StateCard({ title, detail }: { title: string; detail: string }) {
  return (
    <Card className="rounded-[var(--r-md)] border-[var(--chalk)] bg-white p-8 text-center">
      <p className="font-display text-[30px] text-[var(--ichigo-navy)]">{title}</p>
      <p className="mt-2 font-sans text-[15px] text-[var(--slate)]">{detail}</p>
    </Card>
  );
}
