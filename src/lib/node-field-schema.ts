import type { NodeKind } from "@/lib/process-data";

export type NodeFieldSection = "identity" | "execution" | "data";

export type NodeFieldDescriptor = {
  key:
    | "label"
    | "description"
    | "kind"
    | "owner"
    | "tool"
    | "toolRole"
    | "triggerConfig"
    | "inputType"
    | "output"
    | "automationLevel"
    | "producesData"
    | "dataProfile"
    | "dataQuality";
  label: string;
  section: NodeFieldSection;
  control:
    | "text"
    | "textarea"
    | "ownerMultiSelect"
    | "kindSelect"
    | "toolPicker"
    | "toolRoleSelect"
    | "triggerConfig"
    | "inputTypeSelect"
    | "automationScale"
    | "booleanToggle"
    | "dataChips"
    | "qualityControl";
  showWhen?: "dataCritical";
};

const baseFields: NodeFieldDescriptor[] = [
  { key: "label", label: "Label", section: "identity", control: "text" },
  { key: "description", label: "Description", section: "identity", control: "textarea" },
  { key: "owner", label: "Owner(s)", section: "execution", control: "ownerMultiSelect" },
  { key: "kind", label: "Kind", section: "identity", control: "kindSelect" },
  { key: "tool", label: "Tool", section: "execution", control: "toolPicker" },
  { key: "toolRole", label: "Tool role", section: "execution", control: "toolRoleSelect" },
  { key: "inputType", label: "Input type", section: "execution", control: "inputTypeSelect" },
  { key: "output", label: "Output", section: "execution", control: "text" },
  { key: "automationLevel", label: "Automation level", section: "execution", control: "automationScale" },
  { key: "producesData", label: "Produces data", section: "data", control: "booleanToggle" },
  { key: "dataProfile", label: "Structural data profile", section: "data", control: "dataChips" },
  { key: "dataQuality", label: "Data reliability", section: "data", control: "qualityControl", showWhen: "dataCritical" },
];

const triggerFields: NodeFieldDescriptor[] = [
  { key: "label", label: "Label", section: "identity", control: "text" },
  { key: "description", label: "Description", section: "identity", control: "textarea" },
  { key: "triggerConfig", label: "Trigger configuration", section: "execution", control: "triggerConfig" },
];

const mergeFields: NodeFieldDescriptor[] = [
  { key: "label", label: "Label", section: "identity", control: "text" },
  { key: "description", label: "Description", section: "identity", control: "textarea" },
];

export function getNodeFieldSchema(kind: NodeKind): NodeFieldDescriptor[] {
  if (kind === "merge") return mergeFields;
  return kind === "trigger" ? triggerFields : baseFields;
}
