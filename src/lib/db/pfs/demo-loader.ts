// @ts-nocheck
import maisonAtlas from "@/lib/mock-data-maison-atlas.json";
import { supabase } from "@/integrations/supabase/client";
import { saveAudience } from "@/lib/db/pfs/audiences";
import { saveClient } from "@/lib/db/pfs/clients";
import { saveKnowledgeSource } from "@/lib/db/pfs/knowledge-sources";
import {
  advanceOnboardingPhase,
  getOnboardingContext,
  saveCompanyProfile,
  saveDataSource,
  saveDepartment,
  saveProduct,
  saveReadiness,
  saveRegulatoryPosture,
  saveStrategicPriority,
  saveTool,
} from "@/lib/db/pfs/onboarding";
import { db, requireActiveOrg } from "@/lib/db/pfs/shared";
import { persistVaults } from "@/lib/db/pfs/vaults";
import { deriveVaults } from "@/lib/vault-derivation";

type DemoData = typeof maisonAtlas;

function lower(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function byName<T extends { name: string | null }>(rows: T[]) {
  return new Map(rows.map((row) => [lower(row.name), row]));
}

async function catalogBySlug(slugs: string[]) {
  const { data, error } = await db.from("tool_catalog").select("id, slug").in("slug", slugs);
  if (error) throw error;
  return new Map((data ?? []).map((row: any) => [row.slug, row.id]));
}

async function seedMembers(organizationId: string, data: DemoData) {
  const context = await getOnboardingContext();
  const departments = byName(context.departments);
  const { error } = await supabase.functions.invoke("seed-demo-members", {
    body: {
      organizationId,
      members: data.members.map((member) => ({
        ...member,
        departmentId: departments.get(lower(member.department))?.id ?? null,
      })),
    },
  });
  if (error) throw error;
}

export async function loadMaisonAtlasDemo() {
  const gate = await requireActiveOrg();
  if (gate.role !== "admin") throw new Error("Only admins can load the demo company.");
  const data = maisonAtlas;

  await saveCompanyProfile(data.profile);
  await saveRegulatoryPosture(data.regulatory);
  await saveReadiness(data.readiness as any);
  await advanceOnboardingPhase("foundation");

  let context = await getOnboardingContext();
  let products = byName(context.products);
  for (const product of data.products) {
    if (!products.has(lower(product.name))) await saveProduct(product);
  }

  context = await getOnboardingContext();
  let audiences = byName(context.audiences);
  for (const audience of data.audiences) {
    if (!audiences.has(lower(audience.name))) await saveAudience(audience as any);
  }

  context = await getOnboardingContext();
  let clients = byName(context.clients);
  for (const client of data.clients) {
    if (!clients.has(lower(client.name))) await saveClient(client as any);
  }

  context = await getOnboardingContext();
  let departments = byName(context.departments);
  for (const department of data.departments) {
    if (departments.has(lower(department.name))) continue;
    await saveDepartment({
      name: department.name,
      description: `${department.name} team led by ${department.lead}.`,
      headcount: 8,
      responsibilities: ["Approvals", "Reporting", "Exception handling"],
      goals: ["Reduce cycle time", "Improve visibility", "Improve data quality"],
      painPoints: ["Manual re-entry", "Email handoffs", "Reporting delays"],
      holdsSensitiveData: department.holds_sensitive_data,
      distinctAudience: department.holds_sensitive_data,
    });
  }

  context = await getOnboardingContext();
  departments = byName(context.departments);
  await seedMembers(gate.organizationId, data);

  context = await getOnboardingContext();
  const tools = byName(context.tools);
  const catalogIds = await catalogBySlug(data.tools.map((tool) => tool.catalog_slug));
  for (const tool of data.tools) {
    if (tools.has(lower(tool.name))) continue;
    await saveTool({
      name: tool.name,
      catalogId: (catalogIds.get(tool.catalog_slug) as string | undefined) ?? null,
      category: tool.category,
      mainUseCase: "Core business workflow support",
      dataStored: tool.category === "Accounting" || tool.category === "Commerce" ? "Financial data" : tool.category === "Human Resources" ? "Employee data" : "Operational data",
      integrationStatus: 4,
      apiAvailable: tool.api_available,
      criticality: tool.criticality,
    });
  }

  context = await getOnboardingContext();
  const refreshedTools = byName(context.tools);
  const refreshedDepartments = byName(context.departments);
  const dataSourceSeeds = [
    { name: "Customer and sales records", tool: "Salesforce", department: "Sales", dataType: "structured", sensitivity: "personal" },
    { name: "Finance ledger", tool: "Quickbooks Online", department: "Finance", dataType: "structured", sensitivity: "sensitive" },
    { name: "People records", tool: "BambooHR", department: "Human Resources", dataType: "structured", sensitivity: "sensitive" },
    { name: "Support tickets", tool: "Zendesk", department: "Customer Success", dataType: "semi_structured", sensitivity: "personal" },
    { name: "Shared documents", tool: "Google Drive", department: "Operations", dataType: "documents/files", sensitivity: "internal" },
  ];
  const existingDataSources = byName(context.dataSources);
  for (const source of dataSourceSeeds) {
    if (existingDataSources.has(lower(source.name))) continue;
    await saveDataSource({
      name: source.name,
      toolId: refreshedTools.get(lower(source.tool))?.id ?? null,
      departmentOwnerId: refreshedDepartments.get(lower(source.department))?.id ?? null,
      dataType: source.dataType,
      accessibility: "api_accessible",
      reliability: "trusted",
      sensitivityLevel: source.sensitivity,
      updateFrequency: "daily",
    });
  }

  context = await getOnboardingContext();
  const existingKnowledge = byName(context.knowledgeSources);
  const knowledgeSeeds = [
    { name: "Company handbook", sourceType: "gdrive", ownerDepartmentId: refreshedDepartments.get("human resources")?.id, sensitivityLevel: "internal" },
    { name: "Finance SOPs", sourceType: "gdrive", ownerDepartmentId: refreshedDepartments.get("finance")?.id, sensitivityLevel: "sensitive" },
    { name: "Customer support macros", sourceType: "notion", ownerDepartmentId: refreshedDepartments.get("customer success")?.id, sensitivityLevel: "personal" },
  ];
  for (const source of knowledgeSeeds) {
    if (existingKnowledge.has(lower(source.name))) continue;
    await saveKnowledgeSource({
      name: source.name,
      sourceType: source.sourceType as any,
      locationUri: "",
      ownerDepartmentId: source.ownerDepartmentId ?? null,
      ownerClientId: null,
      sensitivityLevel: source.sensitivityLevel as any,
      dataResidency: "EU",
    });
  }

  await saveStrategicPriority(data.priorities);
  await advanceOnboardingPhase("knowledge");

  context = await getOnboardingContext();
  const proposed = deriveVaults(context);
  await persistVaults(proposed);
  await advanceOnboardingPhase("activation");

  return { organizationId: gate.organizationId };
}
