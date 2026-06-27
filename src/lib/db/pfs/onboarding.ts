// @ts-nocheck — Ported PFS module.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { db, requireActiveOrg, type Row } from "@/lib/db/pfs/shared";
import type { AudienceRow } from "@/lib/db/pfs/audiences";
import type { ClientRow } from "@/lib/db/pfs/clients";
import type { KnowledgeSourceRow } from "@/lib/db/pfs/knowledge-sources";
import type { VaultRow } from "@/lib/db/pfs/vaults";

export type OnboardingStepId =
  | "profile"
  | "regulatory"
  | "readiness"
  | "audiences"
  | "clients"
  | "products"
  | "departments"
  | "orgChart"
  | "tools"
  | "dataSources"
  | "knowledgeSources"
  | "priorities"
  | "vaultPreview"
  | "invitations"
  | "sendInvitations"
  | "campaign";

export type OnboardingPhase = "foundation" | "knowledge" | "activation" | "complete";

export type OnboardingContext = {
  workspaceId: string;
  profile: Row<"company_profile"> | null;
  products: Row<"product_service">[];
  departments: Row<"department">[];
  invitations: Row<"workspace_invitations">[];
  tools: Row<"tool">[];
  dataSources: Row<"data_source">[];
  audiences: AudienceRow[];
  clients: ClientRow[];
  knowledgeSources: KnowledgeSourceRow[];
  vaults: VaultRow[];
  readiness: ReadinessAssessmentRow | null;
  members: Array<{ id: string; user_id: string; role: Role; department_id: string | null; display_name: string | null; job_title: string | null }>;
  priorities: Row<"strategic_priority"> | null;
  campaign: Row<"campaign"> | null;
  onboardingPhase: OnboardingPhase;
};

export type ReadinessStage = "initial" | "developing" | "advanced" | "leading";

export type ReadinessAssessmentRow = {
  workspace_id: string;
  decision_authority: string | null;
  has_ai_owner: boolean | null;
  literacy_coverage: string | null;
  delivery_posture: string | null;
  governance_body: string | null;
  risk_register: string | null;
  canonical_knowledge_owner_user_id: string | null;
  organization_stage: ReadinessStage | null;
  organization_score: number | null;
  culture_stage: ReadinessStage | null;
  culture_score: number | null;
  created_at: string | null;
  updated_at: string | null;
};

type Role = Database["public"]["Enums"]["membership_role"];
type StringList = string | string[];

function toWorkspaceRole(role: string) {
  if (role === "admin" || role === "reviewer") return "admin";
  if (role === "viewer") return "viewer";
  return "member";
}

function asList(value: StringList) {
  if (Array.isArray(value)) return value.map((item) => item.trim()).filter(Boolean);
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

const profileSchema = z.object({
  industry: z.string().default(""),
  subIndustry: z.string().default(""),
  size: z.string().default(""),
  revenueRange: z.string().default(""),
  growthStage: z.string().default(""),
  businessModel: z.string().default(""),
  customerType: z.string().default(""),
  locations: z.union([z.string(), z.array(z.string())]).default([]),
  overview: z.string().default(""),
  mission: z.string().default(""),
  valueProposition: z.string().default(""),
  languages: z.union([z.string(), z.array(z.string())]).default([]),
});

const regulatorySchema = z.object({
  primaryJurisdiction: z.string().default(""),
  dataResidency: z.union([z.string(), z.array(z.string())]).default([]),
  isRegulated: z.boolean().default(false),
  regulatoryRegimes: z.union([z.string(), z.array(z.string())]).default([]),
  sellsTraining: z.boolean().default(false),
});

const readinessSchema = z.object({
  decisionAuthority: z.enum(["none", "bu_led", "central", "federated"]).default("bu_led"),
  hasAiOwner: z.boolean().default(false),
  literacyCoverage: z.enum(["none", "some_leaders", "broad", "embedded"]).default("some_leaders"),
  deliveryPosture: z.enum(["fully_external", "mostly_external", "balanced", "mostly_internal"]).default("balanced"),
  governanceBody: z.enum(["none", "ad_hoc", "standing", "audit_ready"]).default("ad_hoc"),
  riskRegister: z.enum(["no", "partial", "maintained"]).default("partial"),
  canonicalKnowledgeOwnerUserId: z.string().nullable().optional(),
});

const departmentSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().default(""),
  headcount: z.number().default(0),
  responsibilities: z.union([z.string(), z.array(z.string())]).default([]),
  goals: z.union([z.string(), z.array(z.string())]).default([]),
  painPoints: z.union([z.string(), z.array(z.string())]).default([]),
  holdsSensitiveData: z.boolean().default(false),
  distinctAudience: z.boolean().default(false),
  audienceId: z.string().nullable().optional(),
  leadUserId: z.string().nullable().optional(),
  knowledgeOwnerUserId: z.string().nullable().optional(),
});

function token() {
  const random = new Uint8Array(24);
  crypto.getRandomValues(random);
  return Array.from(random, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function updateProfileStep(workspaceId: string, step: number) {
  const { data: existing } = await db
    .from("company_profile")
    .select("id, onboarding_step")
    .eq("workspace_id", workspaceId)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!existing) return;

  await db
    .from("company_profile")
    .update({ onboarding_step: Math.max(existing.onboarding_step ?? 0, step) })
    .eq("id", existing.id);
}

function stopToStage(stop: number): { stage: ReadinessStage; score: number } {
  const clamped = Math.max(1, Math.min(4, Math.round(stop)));
  if (clamped <= 1) return { stage: "initial", score: 25 };
  if (clamped === 2) return { stage: "developing", score: 50 };
  if (clamped === 3) return { stage: "advanced", score: 70 };
  return { stage: "leading", score: 90 };
}

export function scoreReadiness(input: z.input<typeof readinessSchema>) {
  const parsed = readinessSchema.parse(input);
  const authorityStops = { none: 1, bu_led: 2, central: 3, federated: 4 } as const;
  const literacyStops = { none: 1, some_leaders: 2, broad: 3, embedded: 4 } as const;
  const deliveryStops = { fully_external: 1, mostly_external: 2, balanced: 3, mostly_internal: 4 } as const;
  const organizationStop = parsed.hasAiOwner ? authorityStops[parsed.decisionAuthority] : Math.min(authorityStops[parsed.decisionAuthority], 2);
  const cultureStop = Math.round((literacyStops[parsed.literacyCoverage] + deliveryStops[parsed.deliveryPosture]) / 2);
  const organization = stopToStage(organizationStop);
  const culture = stopToStage(cultureStop);
  return { parsed, organization, culture };
}

export async function getOnboardingContext(): Promise<OnboardingContext> {
  const gate = await requireActiveOrg();

  const [profile, products, departments, invitations, tools, dataSources, audiences, clients, knowledgeSources, vaults, readiness, members, memberProfiles, priorities, campaign] =
    await Promise.all([
      db
        .from("company_profile")
        .select("*")
        .eq("workspace_id", gate.workspaceId)
        .is("archived_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      db
        .from("product_service")
        .select("*")
        .eq("workspace_id", gate.workspaceId)
        .is("archived_at", null)
        .order("created_at", { ascending: false }),
      db
        .from("department")
        .select("*")
        .eq("workspace_id", gate.workspaceId)
        .is("archived_at", null)
        .order("name"),
      db
        .from("workspace_invitations")
        .select("*")
        .eq("workspace_id", gate.workspaceId)
        .is("archived_at", null)
        .order("created_at", { ascending: false }),
      db
        .from("tool")
        .select("*")
        .eq("workspace_id", gate.workspaceId)
        .is("archived_at", null)
        .order("name"),
      db
        .from("data_source")
        .select("*")
        .eq("workspace_id", gate.workspaceId)
        .is("archived_at", null)
        .order("name"),
      db
        .from("audience")
        .select("*")
        .eq("workspace_id", gate.workspaceId)
        .is("archived_at", null)
        .order("name"),
      db
        .from("client")
        .select("*")
        .eq("workspace_id", gate.workspaceId)
        .is("archived_at", null)
        .order("name"),
      db
        .from("knowledge_source")
        .select("*")
        .eq("workspace_id", gate.workspaceId)
        .is("archived_at", null)
        .order("name"),
      db
        .from("vault")
        .select("*")
        .eq("workspace_id", gate.workspaceId)
        .is("archived_at", null)
        .order("vault_type")
        .order("name"),
      db
        .from("readiness_assessment")
        .select("*")
        .eq("workspace_id", gate.workspaceId)
        .maybeSingle(),
      db
        .from("workspace_members")
        .select("id, user_id, role, department_id")
        .eq("workspace_id", gate.workspaceId)
        .is("archived_at", null),
      db
        .from("profiles")
        .select("user_id, full_name, job_role"),
      db
        .from("strategic_priority")
        .select("*")
        .eq("workspace_id", gate.workspaceId)
        .is("archived_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      db
        .from("campaign")
        .select("*")
        .eq("workspace_id", gate.workspaceId)
        .is("archived_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const firstError = [profile, products, departments, invitations, tools, dataSources, audiences, clients, knowledgeSources, vaults, readiness, members, memberProfiles, priorities, campaign].find(
    (result) => result.error,
  )?.error;
  if (firstError) throw firstError;

  const profileByUser = new Map(
    ((memberProfiles.data ?? []) as Array<{ user_id: string; full_name: string | null; job_role: string | null }>).map(
      (memberProfile) => [memberProfile.user_id, memberProfile] as const,
    ),
  );

  return {
    workspaceId: gate.workspaceId,
    profile: profile.data ?? null,
    products: products.data ?? [],
    departments: departments.data ?? [],
    invitations: invitations.data ?? [],
    tools: tools.data ?? [],
    dataSources: dataSources.data ?? [],
    audiences: audiences.data ?? [],
    clients: clients.data ?? [],
    knowledgeSources: knowledgeSources.data ?? [],
    vaults: vaults.data ?? [],
    readiness: (readiness.data as ReadinessAssessmentRow | null) ?? null,
    members: ((members.data ?? []) as Array<{ id: string; user_id: string; role: Role; department_id: string | null }>).map((member) => ({
      ...member,
      display_name: profileByUser.get(member.user_id)?.full_name ?? null,
      job_title: profileByUser.get(member.user_id)?.job_role ?? null,
    })),
    priorities: priorities.data ?? null,
    campaign: campaign.data ?? null,
    onboardingPhase: ((profile.data as any)?.onboarding_phase ?? "foundation") as OnboardingPhase,
  };
}

export function useOnboardingContext() {
  return useQuery({
    queryKey: ["company-onboarding"],
    queryFn: getOnboardingContext,
  });
}

export async function saveCompanyProfile(input: {
  industry: string;
  subIndustry: string;
  size: string;
  revenueRange: string;
  growthStage: string;
  businessModel: string;
  customerType: string;
  locations: StringList;
  overview?: string;
  mission?: string;
  valueProposition?: string;
  languages?: StringList;
}) {
  const gate = await requireActiveOrg();
  const parsed = profileSchema.parse(input);
  const payload = {
    workspace_id: gate.workspaceId,
    industry: parsed.industry,
    sub_industry: parsed.subIndustry,
    size: parsed.size,
    revenue_range: parsed.revenueRange,
    growth_stage: parsed.growthStage,
    business_model: parsed.businessModel,
    customer_type: parsed.customerType,
    locations: asList(parsed.locations),
    overview: parsed.overview,
    mission: parsed.mission,
    value_proposition: parsed.valueProposition,
    languages: asList(parsed.languages),
    onboarding_step: 1,
    onboarding_phase: "foundation",
  };

  const { data: existing } = await db
    .from("company_profile")
    .select("id")
    .eq("workspace_id", gate.workspaceId)
    .is("archived_at", null)
    .limit(1)
    .maybeSingle();
  const query = existing
    ? db.from("company_profile").update(payload).eq("id", existing.id)
    : db.from("company_profile").insert(payload);
  const { error } = await query;
  if (error) throw error;
}

export async function saveRegulatoryPosture(input: {
  primaryJurisdiction: string;
  dataResidency: StringList;
  isRegulated: boolean;
  regulatoryRegimes: StringList;
  sellsTraining: boolean;
}) {
  const gate = await requireActiveOrg();
  const parsed = regulatorySchema.parse(input);
  const payload = {
    workspace_id: gate.workspaceId,
    primary_jurisdiction: parsed.primaryJurisdiction,
    data_residency: asList(parsed.dataResidency),
    is_regulated: parsed.isRegulated,
    regulatory_regimes: asList(parsed.regulatoryRegimes),
    sells_training: parsed.sellsTraining,
    onboarding_phase: "foundation",
  };
  const { data: existing } = await db
    .from("company_profile")
    .select("id")
    .eq("workspace_id", gate.workspaceId)
    .is("archived_at", null)
    .limit(1)
    .maybeSingle();
  const query = existing
    ? db.from("company_profile").update(payload).eq("id", existing.id)
    : db.from("company_profile").insert(payload);
  const { error } = await query;
  if (error) throw error;
}

export async function saveReadiness(input: z.input<typeof readinessSchema>) {
  const gate = await requireActiveOrg();
  const { parsed, organization, culture } = scoreReadiness(input);
  const { error } = await db.from("readiness_assessment").upsert({
    workspace_id: gate.workspaceId,
    decision_authority: parsed.decisionAuthority,
    has_ai_owner: parsed.hasAiOwner,
    literacy_coverage: parsed.literacyCoverage,
    delivery_posture: parsed.deliveryPosture,
    governance_body: parsed.governanceBody,
    risk_register: parsed.riskRegister,
    canonical_knowledge_owner_user_id: parsed.canonicalKnowledgeOwnerUserId || null,
    organization_stage: organization.stage,
    organization_score: organization.score,
    culture_stage: culture.stage,
    culture_score: culture.score,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export function useReadinessAssessment() {
  return useQuery({
    queryKey: ["readiness-assessment"],
    queryFn: async () => {
      const gate = await requireActiveOrg();
      const { data, error } = await db
        .from("readiness_assessment")
        .select("*")
        .eq("workspace_id", gate.workspaceId)
        .maybeSingle();
      if (error) throw error;
      return (data as ReadinessAssessmentRow | null) ?? null;
    },
  });
}

export async function saveProduct(input: {
  name: string;
  category: string;
  description: string;
  targetCustomer: string;
  revenueContribution: number;
  strategicImportance: number;
  deliveryComplexity: number;
}) {
  const gate = await requireActiveOrg();
  const { error } = await db.from("product_service").insert({
    workspace_id: gate.workspaceId,
    name: input.name,
    category: input.category,
    description: input.description,
    target_customer: input.targetCustomer,
    revenue_contribution: input.revenueContribution,
    strategic_importance: input.strategicImportance,
    delivery_complexity: input.deliveryComplexity,
  });
  if (error) throw error;
  await updateProfileStep(gate.workspaceId, 2);
}

export async function saveDepartment(input: {
  id?: string;
  name: string;
  description: string;
  headcount: number;
  responsibilities: StringList;
  goals: StringList;
  painPoints: StringList;
  holdsSensitiveData?: boolean;
  distinctAudience?: boolean;
  audienceId?: string | null;
  leadUserId?: string | null;
  knowledgeOwnerUserId?: string | null;
}) {
  const gate = await requireActiveOrg();
  const parsed = departmentSchema.parse(input);
  const payload = {
    workspace_id: gate.workspaceId,
    name: parsed.name,
    description: parsed.description,
    headcount: parsed.headcount,
    responsibilities: asList(parsed.responsibilities),
    goals: asList(parsed.goals),
    pain_points: asList(parsed.painPoints),
    holds_sensitive_data: parsed.holdsSensitiveData,
    distinct_audience: parsed.distinctAudience,
    audience_id: parsed.audienceId || null,
    lead_user_id: parsed.leadUserId || null,
    knowledge_owner_user_id: parsed.knowledgeOwnerUserId || null,
  };
  const query = input.id
    ? db.from("department").update(payload).eq("id", input.id).eq("workspace_id", gate.workspaceId)
    : db.from("department").insert(payload);
  if (!input.id) {
    // Idempotent insert: if a non-archived department with the same (case-insensitive) name
    // already exists for this org, update it instead of creating a duplicate.
    const { data: existing } = await db
      .from("department")
      .select("id")
      .eq("workspace_id", gate.workspaceId)
      .is("archived_at", null)
      .ilike("name", parsed.name)
      .limit(1)
      .maybeSingle();
    if (existing?.id) {
      const { error: updateError } = await db
        .from("department")
        .update(payload)
        .eq("id", existing.id)
        .eq("workspace_id", gate.workspaceId);
      if (updateError) throw updateError;
      await updateProfileStep(gate.workspaceId, 3);
      return;
    }
  }
  const { error } = await query;
  if (error) throw error;
  await updateProfileStep(gate.workspaceId, 3);
}

export async function archiveDepartment(id: string) {
  const gate = await requireActiveOrg();
  const { error } = await db
    .from("department")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .eq("workspace_id", gate.workspaceId);
  if (error) throw error;
}

export async function saveInvitation(input: {
  id?: string;
  email: string;
  role: Role;
  departmentId: string | null;
}) {
  const gate = await requireActiveOrg();
  const inviteToken = token();
  const payload = {
    workspace_id: gate.workspaceId,
    email: input.email,
    role: toWorkspaceRole(input.role),
    department_id: input.departmentId,
  };
  if (!input.id) {
    // Idempotent: avoid duplicate pending invites for the same email in this org.
    const { data: existing } = await db
      .from("workspace_invitations")
      .select("id")
      .eq("workspace_id", gate.workspaceId)
      .ilike("email", input.email)
      .eq("status", "pending")
      .is("archived_at", null)
      .limit(1)
      .maybeSingle();
    if (existing?.id) {
      const { error: updateError } = await db
        .from("workspace_invitations")
        .update(payload)
        .eq("id", existing.id)
        .eq("workspace_id", gate.workspaceId);
      if (updateError) throw updateError;
      await updateProfileStep(gate.workspaceId, 4);
      return;
    }
  }
  const query = input.id
    ? db.from("workspace_invitations").update(payload).eq("id", input.id).eq("workspace_id", gate.workspaceId)
    : db
        .from("workspace_invitations")
        .insert({
          ...payload,
          token: inviteToken,
          expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
          status: "pending",
          invited_by: gate.userId,
        })
        .select("id")
        .single();
  const { error } = await query;
  if (error) throw error;
  await updateProfileStep(gate.workspaceId, 4);
}

export async function archiveInvitation(id: string) {
  const gate = await requireActiveOrg();
  const { error } = await db
    .from("workspace_invitations")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .eq("workspace_id", gate.workspaceId)
    .eq("status", "pending");
  if (error) throw error;
}

export async function sendPendingInvitations() {
  const gate = await requireActiveOrg();
  const now = new Date().toISOString();
  const { data: pending, error: readError } = await db
    .from("workspace_invitations")
    .select("id")
    .eq("workspace_id", gate.workspaceId)
    .eq("status", "pending")
    .is("archived_at", null);
  if (readError) throw readError;
  const ids = (pending ?? []).map((invite: { id: string }) => invite.id);
  if (!ids.length) return { queued: 0, failed: 0 };
  const { error } = await db
    .from("workspace_invitations")
    .update({ send_state: "queued", queued_at: now, last_error: null })
    .in("id", ids)
    .eq("workspace_id", gate.workspaceId);
  if (error) throw error;
  return { queued: ids.length, failed: 0 };
}

export async function advanceOnboardingPhase(phase: OnboardingPhase) {
  const gate = await requireActiveOrg();
  const { error } = await db
    .from("company_profile")
    .update({ onboarding_phase: phase })
    .eq("workspace_id", gate.workspaceId)
    .is("archived_at", null);
  if (error) throw error;
}

export async function saveTool(input: {
  name: string;
  catalogId?: string | null;
  category: string;
  mainUseCase: string;
  dataStored: string;
  integrationStatus: number;
  apiAvailable: boolean;
  criticality: string;
}) {
  const gate = await requireActiveOrg();
  const { error } = await db.from("tool").insert({
    workspace_id: gate.workspaceId,
    catalog_id: input.catalogId ?? null,
    name: input.name,
    category: input.category,
    main_use_case: input.mainUseCase,
    data_stored: input.dataStored,
    integration_status: input.integrationStatus,
    api_available: input.apiAvailable,
    criticality: input.criticality,
  });
  if (error) throw error;
  await updateProfileStep(gate.workspaceId, 5);
}

export async function saveDataSource(input: {
  name: string;
  toolId: string | null;
  departmentOwnerId: string | null;
  dataType: string;
  accessibility: string;
  reliability: string;
  sensitivityLevel: string;
  updateFrequency: string;
}) {
  const gate = await requireActiveOrg();
  const { error } = await db.from("data_source").insert({
    workspace_id: gate.workspaceId,
    name: input.name,
    tool_id: input.toolId,
    department_owner_id: input.departmentOwnerId,
    data_type: input.dataType,
    accessibility: input.accessibility,
    reliability: input.reliability,
    sensitivity_level: input.sensitivityLevel,
    update_frequency: input.updateFrequency,
  });
  if (error) throw error;
  await updateProfileStep(gate.workspaceId, 6);
}

export async function saveStrategicPriority(input: {
  primaryReason: string;
  priorities: StringList;
  topGoals: StringList;
  priorityDepartments: StringList;
  tier1AutomationThreshold?: number;
  tier2AutomationThreshold?: number;
  maturityInitialMax?: number;
  maturityDevelopingMax?: number;
  maturityAdvancedMax?: number;
}) {
  const gate = await requireActiveOrg();
  const payload = {
    workspace_id: gate.workspaceId,
    primary_reason: input.primaryReason,
    priorities: asList(input.priorities),
    top_goals: asList(input.topGoals),
    priority_departments: asList(input.priorityDepartments),
    weights: {
      strategic_alignment: 0.4,
      roi: 0.3,
      readiness: 0.2,
      risk: 0.1,
      governance: {
        tier1AutomationThreshold: input.tier1AutomationThreshold ?? 3,
        tier2AutomationThreshold: input.tier2AutomationThreshold ?? 2,
        maturityBands: {
          initialMax: input.maturityInitialMax ?? 39,
          developingMax: input.maturityDevelopingMax ?? 59,
          advancedMax: input.maturityAdvancedMax ?? 79,
        },
      },
    },
  };
  const { data: existing } = await db
    .from("strategic_priority")
    .select("id")
    .eq("workspace_id", gate.workspaceId)
    .is("archived_at", null)
    .limit(1)
    .maybeSingle();
  const query = existing
    ? db.from("strategic_priority").update(payload).eq("id", existing.id)
    : db.from("strategic_priority").insert(payload);
  const { error } = await query;
  if (error) throw error;
  await updateProfileStep(gate.workspaceId, 7);
}

export async function saveCampaign(input: {
  deadline: string;
  workflowsPerEmployee: number;
  requireLeadReview: boolean;
  mergeDuplicatesMode: string;
}) {
  const gate = await requireActiveOrg();
  const payload = {
    workspace_id: gate.workspaceId,
    deadline: input.deadline || null,
    workflows_per_employee: input.workflowsPerEmployee,
    require_lead_review: input.requireLeadReview,
    merge_duplicates_mode: input.mergeDuplicatesMode,
    status: "active",
  };
  const { data: existing } = await db
    .from("campaign")
    .select("id")
    .eq("workspace_id", gate.workspaceId)
    .is("archived_at", null)
    .limit(1)
    .maybeSingle();
  const query = existing ? db.from("campaign").update(payload).eq("id", existing.id) : db.from("campaign").insert(payload);
  const { error } = await query;
  if (error) throw error;

  await db
    .from("company_profile")
    .update({ onboarding_step: 8, onboarding_phase: "complete", onboarding_completed_at: new Date().toISOString() })
    .eq("workspace_id", gate.workspaceId)
    .is("archived_at", null);
}

export function useOnboardingMutation<TInput>(mutationFn: (input: TInput) => Promise<void>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["company-onboarding"] }),
        queryClient.invalidateQueries({ queryKey: ["departments"] }),
        queryClient.invalidateQueries({ queryKey: ["tools"] }),
        queryClient.invalidateQueries({ queryKey: ["data-sources"] }),
        queryClient.invalidateQueries({ queryKey: ["audiences"] }),
        queryClient.invalidateQueries({ queryKey: ["clients"] }),
        queryClient.invalidateQueries({ queryKey: ["knowledge-sources"] }),
        queryClient.invalidateQueries({ queryKey: ["vaults"] }),
        queryClient.invalidateQueries({ queryKey: ["readiness-assessment"] }),
        queryClient.invalidateQueries({ queryKey: ["members"] }),
        queryClient.invalidateQueries({ queryKey: ["company-score"] }),
        queryClient.invalidateQueries({ queryKey: ["onboarding-status"] }),
        queryClient.invalidateQueries({ queryKey: ["org-chart"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["invitations"] }),
      ]);
    },
  });
}
