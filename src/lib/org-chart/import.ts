import * as XLSX from "xlsx";

import { supabase } from "@/integrations/supabase/client";
import { db, requireActiveOrg } from "@/lib/db/pfs/shared";

// HOI workspace_members.role union (no Postgres enum in this project).
type Role = "owner" | "admin" | "member" | "viewer";
const VALID_ROLES: Role[] = ["owner", "admin", "member", "viewer"];

export type ParsedDepartmentRow = {
  name: string;
  parent_name?: string | null;
  description?: string | null;
  headcount?: number | null;
};

export type ParsedPeopleRow = {
  first_name: string;
  last_name: string;
  email: string;
  position?: string | null;
  department_name?: string | null;
  manager_email?: string | null;
  role?: Role;
};

export type ParsedImport = {
  departments: ParsedDepartmentRow[];
  people: ParsedPeopleRow[];
  errors: string[];
};

export type ImportDiff = {
  departments: { create: number; update: number; skip: number };
  people: { create: number; update: number; skip: number };
  errors: string[];
};

const norm = (v: unknown) => (v == null ? "" : String(v).trim());
const emailNorm = (v: unknown) => norm(v).toLowerCase();

function readSheetObjects(wb: XLSX.WorkBook, name: string): Record<string, unknown>[] {
  const sheet = wb.Sheets[name];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet, { defval: "", raw: true });
}

export async function parseOrgChartFile(file: File): Promise<ParsedImport> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });

  const errors: string[] = [];
  // Tolerant lookup: case-insensitive, supports a single flat sheet
  const sheetNames = wb.SheetNames;
  const findSheet = (label: string) =>
    sheetNames.find((s) => s.toLowerCase() === label.toLowerCase()) ?? "";

  const depsRows = readSheetObjects(wb, findSheet("Departments"));
  const ppRows = readSheetObjects(wb, findSheet("People"));

  const departments: ParsedDepartmentRow[] = [];
  depsRows.forEach((row, idx) => {
    const name = norm(row["name"] ?? row["Name"]);
    if (!name) return; // blank row
    const headcountRaw = row["headcount"] ?? row["Headcount"];
    const hc =
      headcountRaw === "" || headcountRaw == null ? null : Number(headcountRaw);
    if (hc != null && Number.isNaN(hc)) {
      errors.push(`Departments row ${idx + 2}: headcount "${String(headcountRaw)}" is not a number.`);
    }
    departments.push({
      name,
      parent_name: norm(row["parent_name"] ?? row["Parent"]) || null,
      description: norm(row["description"] ?? row["Description"]) || null,
      headcount: hc != null && !Number.isNaN(hc) ? hc : null,
    });
  });

  const people: ParsedPeopleRow[] = [];
  ppRows.forEach((row, idx) => {
    const email = emailNorm(row["email"] ?? row["Email"]);
    const first = norm(row["first_name"] ?? row["First Name"]);
    const last = norm(row["last_name"] ?? row["Last Name"]);
    if (!email && !first && !last) return; // blank row
    if (!email) {
      errors.push(`People row ${idx + 2}: email is required.`);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push(`People row ${idx + 2}: "${email}" is not a valid email.`);
      return;
    }
    const roleRaw = norm(row["role"] ?? row["Role"]).toLowerCase();
    const role: Role = (VALID_ROLES as string[]).includes(roleRaw)
      ? (roleRaw as Role)
      : ("employee" as Role);
    if (roleRaw && !(VALID_ROLES as string[]).includes(roleRaw)) {
      errors.push(`People row ${idx + 2}: unknown role "${roleRaw}" – defaulted to employee.`);
    }
    people.push({
      first_name: first,
      last_name: last,
      email,
      position: norm(row["position"] ?? row["Position"]) || null,
      department_name: norm(row["department_name"] ?? row["Department"]) || null,
      manager_email: emailNorm(row["manager_email"] ?? row["Manager"]) || null,
      role,
    });
  });

  return { departments, people, errors };
}

function token() {
  const random = new Uint8Array(24);
  crypto.getRandomValues(random);
  return Array.from(random, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Bulk upsert departments + draft invitations.
 * - departments: matched case-insensitive by name within the org
 * - invitations: matched by email within the org; existing pending row is updated, sent rows are skipped
 * No emails are sent. All new invitations are created with send_state = 'draft'.
 */
export async function bulkImportOrg(parsed: ParsedImport): Promise<ImportDiff> {
  const gate = await requireActiveOrg();
  const orgId = gate.workspaceId;
  const errors: string[] = [...parsed.errors];
  const diff: ImportDiff = {
    departments: { create: 0, update: 0, skip: 0 },
    people: { create: 0, update: 0, skip: 0 },
    errors,
  };

  // ---- departments ----
  const { data: existingDeps, error: depFetchErr } = await db
    .from("department")
    .select("id, name, parent_id, description, headcount")
    .eq("workspace_id", orgId)
    .is("archived_at", null);
  if (depFetchErr) throw depFetchErr;

  const byNameLower = new Map<string, { id: string; name: string; parent_id: string | null }>();
  (existingDeps ?? []).forEach((d: any) => {
    byNameLower.set(String(d.name).toLowerCase(), { id: d.id, name: d.name, parent_id: d.parent_id ?? null });
  });

  // First pass: upsert without parent so forward references work
  for (const dep of parsed.departments) {
    const key = dep.name.toLowerCase();
    const existing = byNameLower.get(key);
    if (existing) {
      const patch: Record<string, unknown> = {};
      if (dep.description != null) patch.description = dep.description;
      if (dep.headcount != null) patch.headcount = dep.headcount;
      if (Object.keys(patch).length === 0) {
        diff.departments.skip += 1;
        continue;
      }
      const { error } = await db.from("department").update(patch).eq("id", existing.id);
      if (error) { errors.push(`Department "${dep.name}": ${error.message}`); continue; }
      diff.departments.update += 1;
    } else {
      const insertPayload: Record<string, unknown> = {
        workspace_id: orgId,
        name: dep.name,
        headcount: dep.headcount ?? 0,
        description: dep.description ?? null,
      };
      const { data, error } = await db
        .from("department")
        .insert(insertPayload as any)
        .select("id, name, parent_id")
        .single();
      if (error) { errors.push(`Department "${dep.name}": ${error.message}`); continue; }
      byNameLower.set(key, { id: data.id, name: data.name, parent_id: null });
      diff.departments.create += 1;
    }
  }

  // Second pass: resolve parents
  for (const dep of parsed.departments) {
    if (!dep.parent_name) continue;
    const row = byNameLower.get(dep.name.toLowerCase());
    const parent = byNameLower.get(dep.parent_name.toLowerCase());
    if (!row || !parent) {
      errors.push(`Department "${dep.name}": parent "${dep.parent_name}" not found.`);
      continue;
    }
    if (row.parent_id === parent.id) continue;
    const { error } = await db.from("department").update({ parent_id: parent.id }).eq("id", row.id);
    if (error) errors.push(`Department "${dep.name}" parent: ${error.message}`);
  }

  // ---- people / invitations ----
  const { data: existingInvites, error: invFetchErr } = await db
    .from("invitation")
    .select("id, email, status, send_state, sent_at")
    .eq("workspace_id", orgId)
    .is("archived_at", null);
  if (invFetchErr) throw invFetchErr;

  const inviteByEmail = new Map<string, { id: string; status: string; sent_at: string | null }>();
  (existingInvites ?? []).forEach((i: any) => {
    inviteByEmail.set(String(i.email).toLowerCase(), { id: i.id, status: i.status, sent_at: i.sent_at });
  });

  // Pre-compute email -> deptId for manager lookups created in this batch
  const emailToDeptId = new Map<string, string | null>();

  for (const p of parsed.people) {
    const deptId = p.department_name
      ? byNameLower.get(p.department_name.toLowerCase())?.id ?? null
      : null;
    if (p.department_name && !deptId) {
      errors.push(`Person "${p.email}": department "${p.department_name}" not found.`);
    }
    emailToDeptId.set(p.email, deptId);

    const existing = inviteByEmail.get(p.email);
    const payload: Record<string, unknown> = {
      first_name: p.first_name || null,
      last_name: p.last_name || null,
      position: p.position || null,
      department_id: deptId,
      role: p.role ?? "employee",
    };

    if (existing) {
      // Don't overwrite an already-sent invite — just skip silently
      if (existing.sent_at) { diff.people.skip += 1; continue; }
      const { error } = await db.from("invitation").update(payload as any).eq("id", existing.id);
      if (error) { errors.push(`Person "${p.email}": ${error.message}`); continue; }
      diff.people.update += 1;
    } else {
      const insertPayload = {
        ...payload,
        workspace_id: orgId,
        email: p.email,
        token: token(),
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
        status: "pending",
        send_state: "draft",
      };
      const { data, error } = await db
        .from("invitation")
        .insert(insertPayload as any)
        .select("id")
        .single();
      if (error) { errors.push(`Person "${p.email}": ${error.message}`); continue; }
      inviteByEmail.set(p.email, { id: data.id, status: "pending", sent_at: null });
      diff.people.create += 1;
    }
  }

  return diff;
}

/** Mark all draft invitations for the active org as queued and call the existing send-invitations function. */
export async function sendPendingInvitations(): Promise<{ queued: number; failed: number }> {
  const gate = await requireActiveOrg();
  const orgId = gate.workspaceId;

  const { data: drafts, error } = await db
    .from("invitation")
    .select("id")
    .eq("workspace_id", orgId)
    .eq("status", "pending")
    .eq("send_state", "draft")
    .is("archived_at", null);
  if (error) throw error;

  const ids = (drafts ?? []).map((d: any) => d.id as string);
  if (ids.length === 0) return { queued: 0, failed: 0 };

  const nowIso = new Date().toISOString();
  await db
    .from("invitation")
    .update({ send_state: "queued", queued_at: nowIso } as any)
    .in("id", ids);

  const { error: fnErr } = await supabase.functions.invoke("send-invitations", {
    body: { invitationIds: ids },
  });
  if (fnErr) {
    await db
      .from("invitation")
      .update({ send_state: "failed", last_error: fnErr.message ?? String(fnErr) } as any)
      .in("id", ids);
    return { queued: 0, failed: ids.length };
  }
  await db
    .from("invitation")
    .update({ send_state: "sent", sent_at: nowIso } as any)
    .in("id", ids);
  return { queued: ids.length, failed: 0 };
}