import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { HoiAdminRole } from "@/hooks/useHoiAdmin";

const db = supabaseAdmin as any;

const BRIEF_CATEGORIES = [
  "Communication","Email","Calendar and scheduling","Team chat","Video meetings",
  "Documents and office suites","File storage","Knowledge base / wiki",
  "Project management","Task management","CRM","Sales enablement",
  "Marketing automation","Email marketing","Social media management",
  "Customer support / ticketing","Call center / telephony","Forms and surveys",
  "Ecommerce","POS / retail","Payments","Accounting","Invoicing",
  "Expense management","Payroll","HRIS","Recruiting / ATS","Learning / LMS",
  "Legal / contracts","E-signature","Procurement","Vendor management",
  "Inventory","Warehouse / WMS","ERP","Manufacturing / MRP",
  "Logistics / shipping","Fleet / delivery","Field service",
  "Booking / reservations","Property / real estate management",
  "Healthcare / clinic management","Analytics / BI","Databases and storage",
  "Data integration / ETL","Automation / workflow","AI assistants",
  "AI writing / content","AI meeting notes","Design / creative",
  "Developer tools","Security / identity","Compliance / GRC",
  "Backup / disaster recovery","Finance / banking","Tax / VAT",
  "Industry-specific tools",
] as const;

export const BRIEF_CATEGORY_LIST = BRIEF_CATEGORIES;

const CONTENT_ROLES: HoiAdminRole[] = ["owner", "admin", "content_editor", "read_only"];
const WRITE_ROLES: HoiAdminRole[] = ["owner", "admin", "content_editor"];

async function requireAdmin(userId: string, roles: HoiAdminRole[] = CONTENT_ROLES) {
  const { data, error } = await db
    .from("hoi_admin_users")
    .select("role,status")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || !roles.includes(data.role)) {
    throw new Error("House of Ichigo admin access required");
  }
  return data;
}

export type CatalogOverview = {
  totals: {
    toolsActive: number;
    toolsInactive: number;
    toolsNeedsReview: number;
    toolsWithBriefCategory: number;
    actionsTotal: number;
    actionsNeedsReview: number;
    actionsArchived: number;
    mergeClusters: number;
    reviewQueueOpen: number;
  };
  briefCategoryCoverage: Array<{ category: string; count: number }>;
  emptyBriefCategories: string[];
};

export const getCatalogOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CatalogOverview> => {
    await requireAdmin(context.userId);
    const totalsQueries = await Promise.all([
      db.from("tool_catalog").select("id", { count: "exact", head: true }).eq("is_active", true),
      db.from("tool_catalog").select("id", { count: "exact", head: true }).eq("is_active", false),
      db.from("tool_catalog").select("id", { count: "exact", head: true }).eq("needs_review", true).eq("is_active", true),
      db.from("tool_catalog").select("id", { count: "exact", head: true })
        .eq("is_active", true).neq("category", "review").not("category", "is", null),
      db.from("tool_action_catalog").select("id", { count: "exact", head: true }),
      db.from("tool_action_catalog").select("id", { count: "exact", head: true }).eq("needs_review", true),
      db.from("tool_action_deleted_log").select("id", { count: "exact", head: true }),
      db.from("tool_catalog_merge_log").select("id", { count: "exact", head: true }),
      db.from("tool_review_queue").select("id", { count: "exact", head: true }).eq("status", "open"),
    ]);
    const c = totalsQueries.map((r: any) => r.count ?? 0);

    const { data: catRows, error: catErr } = await db
      .from("tool_catalog").select("category").eq("is_active", true);
    if (catErr) throw new Error(catErr.message);
    const tally = new Map<string, number>();
    for (const r of (catRows ?? []) as Array<{ category: string | null }>) {
      const k = r.category ?? "(none)";
      tally.set(k, (tally.get(k) ?? 0) + 1);
    }
    const briefCategoryCoverage = BRIEF_CATEGORIES.map((c) => ({
      category: c, count: tally.get(c) ?? 0,
    })).sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));
    const emptyBriefCategories = briefCategoryCoverage.filter((x) => x.count === 0).map((x) => x.category);

    return {
      totals: {
        toolsActive: c[0], toolsInactive: c[1], toolsNeedsReview: c[2],
        toolsWithBriefCategory: c[3], actionsTotal: c[4], actionsNeedsReview: c[5],
        actionsArchived: c[6], mergeClusters: c[7], reviewQueueOpen: c[8],
      },
      briefCategoryCoverage,
      emptyBriefCategories,
    };
  });

export type ToolReviewRow = {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  subcategory: string | null;
  description: string | null;
  homepage_url: string | null;
  logo_url: string | null;
  notes: string | null;
  confidence_score: number | null;
  region_relevance: string[] | null;
  countries_relevant: string[] | null;
  departments: string[] | null;
  business_criticality_default: string | null;
  needs_review: boolean;
};

const ListInput = z.object({
  search: z.string().optional(),
  limit: z.number().min(1).max(200).default(50),
  offset: z.number().min(0).default(0),
});

export const listToolsToReview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ListInput.parse(d ?? {}))
  .handler(async ({ data, context }): Promise<{ rows: ToolReviewRow[]; total: number }> => {
    await requireAdmin(context.userId);
    let q = db
      .from("tool_catalog")
      .select(
        "id,slug,name,category,subcategory,description,homepage_url,logo_url,notes,confidence_score,region_relevance,countries_relevant,departments,business_criticality_default,needs_review",
        { count: "exact" },
      )
      .eq("is_active", true)
      .eq("needs_review", true)
      .order("name");
    if (data.search) q = q.ilike("name", `%${data.search}%`);
    q = q.range(data.offset, data.offset + data.limit - 1);
    const { data: rows, count, error } = await q;
    if (error) throw new Error(error.message);
    return { rows: (rows ?? []) as ToolReviewRow[], total: count ?? 0 };
  });

const ApproveInput = z.object({
  id: z.string().uuid(),
  category: z.string().optional(),
  subcategory: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  homepage_url: z.string().nullable().optional(),
  business_criticality_default: z.string().nullable().optional(),
  region_relevance: z.array(z.string()).optional(),
  countries_relevant: z.array(z.string()).optional(),
  departments: z.array(z.string()).optional(),
  clearReview: z.boolean().default(true),
});

export const approveToolReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ApproveInput.parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.userId, WRITE_ROLES);
    const patch: any = {};
    if (data.category) patch.category = data.category;
    if (data.subcategory !== undefined) patch.subcategory = data.subcategory || null;
    if (data.description !== undefined) patch.description = data.description || null;
    if (data.homepage_url !== undefined) patch.homepage_url = data.homepage_url || null;
    if (data.business_criticality_default !== undefined)
      patch.business_criticality_default = data.business_criticality_default || null;
    if (data.region_relevance) patch.region_relevance = data.region_relevance;
    if (data.countries_relevant) patch.countries_relevant = data.countries_relevant;
    if (data.departments) patch.departments = data.departments;
    if (data.clearReview) {
      patch.needs_review = false;
      patch.review_reason = null;
    }
    const { error } = await db.from("tool_catalog").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type MergeClusterRow = {
  id: string;
  cluster_id: string;
  canonical_slug: string;
  merged_slug: string;
  decision: string;
  reason: string | null;
  similarity: string | null;
  member_names: string | null;
  member_categories: string | null;
  merged_at: string;
};

export const listMergeClusters = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      decision: z.enum(["auto_merged", "needs_review"]).optional(),
      limit: z.number().min(1).max(200).default(50),
      offset: z.number().min(0).default(0),
    }).parse(d ?? {}),
  )
  .handler(async ({ data, context }): Promise<{ rows: MergeClusterRow[]; total: number }> => {
    await requireAdmin(context.userId);
    let q = db.from("tool_catalog_merge_log").select("*", { count: "exact" }).order("cluster_id");
    if (data.decision) q = q.eq("decision", data.decision);
    q = q.range(data.offset, data.offset + data.limit - 1);
    const { data: rows, count, error } = await q;
    if (error) throw new Error(error.message);
    return { rows: (rows ?? []) as MergeClusterRow[], total: count ?? 0 };
  });

export type ActionReviewRow = {
  id: string;
  tool_name: string;
  tool_slug: string;
  capability_type: string | null;
  business_action: string;
  business_object: string | null;
  action_family: string | null;
  operation_group: string | null;
  review_reason: string | null;
};

export const listActionsToReview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ListInput.parse(d ?? {}))
  .handler(async ({ data, context }): Promise<{ rows: ActionReviewRow[]; total: number }> => {
    await requireAdmin(context.userId);
    let q = db
      .from("tool_action_catalog")
      .select(
        "id,tool_name,tool_slug,capability_type,business_action,business_object,action_family,operation_group,review_reason",
        { count: "exact" },
      )
      .eq("needs_review", true)
      .order("tool_name");
    if (data.search) q = q.or(`tool_name.ilike.%${data.search}%,business_action.ilike.%${data.search}%`);
    q = q.range(data.offset, data.offset + data.limit - 1);
    const { data: rows, count, error } = await q;
    if (error) throw new Error(error.message);
    return { rows: (rows ?? []) as ActionReviewRow[], total: count ?? 0 };
  });

export const resolveActionReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), action: z.enum(["approve", "delete"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context.userId, WRITE_ROLES);
    if (data.action === "approve") {
      const { error } = await db
        .from("tool_action_catalog")
        .update({ needs_review: false, review_reason: null })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { data: row } = await db
        .from("tool_action_catalog")
        .select(
          "id,tool_name,tool_slug,capability_type,business_action,business_object,business_use_case,action_family,operation_group,integration_source,evidence_url,evidence_notes",
        )
        .eq("id", data.id)
        .maybeSingle();
      if (row) {
        await db.from("tool_action_deleted_log").insert({
          original_id: row.id,
          tool_slug: row.tool_slug,
          tool_name: row.tool_name,
          capability_type: row.capability_type,
          business_action: row.business_action,
          business_object: row.business_object,
          business_use_case: row.business_use_case,
          action_family: row.action_family,
          operation_group: row.operation_group,
          source_platform: row.integration_source,
          source_url: row.evidence_url,
          notes: row.evidence_notes,
          removed_reason: "manual_review_delete",
        });
      }
      const { error } = await db.from("tool_action_catalog").delete().eq("id", data.id);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });