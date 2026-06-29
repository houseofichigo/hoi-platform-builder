import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AdminPageHeader,
  AdminShell,
  AdminStat,
} from "@/components/admin/AdminShell";
import {
  approveToolReview,
  BRIEF_CATEGORY_LIST,
  getCatalogOverview,
  listActionsToReview,
  listMergeClusters,
  listToolsToReview,
  resolveActionReview,
  type CatalogOverview,
  type ToolReviewRow,
} from "@/lib/admin/catalog.functions";

export const Route = createFileRoute("/admin/catalog")({
  component: AdminCatalogPage,
});

type Tab = "overview" | "tools" | "merges" | "actions";

function AdminCatalogPage() {
  const [tab, setTab] = useState<Tab>("overview");
  return (
    <AdminShell>
      <AdminPageHeader
        eyebrow="ADMIN · CATALOG"
        title="Tool & action catalog triage."
        lead="Track Phase 1 cleanup coverage and work through the manual review queue produced by the deterministic pipeline."
      />
      <div className="mb-5 flex flex-wrap gap-2">
        {([
          ["overview", "Overview"],
          ["tools", "Tools needing review"],
          ["merges", "Merge log"],
          ["actions", "Actions needing review"],
        ] as Array<[Tab, string]>).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={[
              "rounded-full border px-3 py-1 text-[12px]",
              tab === k
                ? "border-navy bg-navy text-white"
                : "border-chalk bg-white text-navy hover:bg-mist",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "overview" && <OverviewTab />}
      {tab === "tools" && <ToolsTab />}
      {tab === "merges" && <MergesTab />}
      {tab === "actions" && <ActionsTab />}
    </AdminShell>
  );
}

function OverviewTab() {
  const fn = useServerFn(getCatalogOverview);
  const { data, isLoading, error } = useQuery<CatalogOverview>({
    queryKey: ["admin", "catalog", "overview"],
    queryFn: () => fn(),
  });
  if (isLoading) return <p className="text-[13px] text-slate">Loading catalog metrics…</p>;
  if (error) return <ErrorBox error={error as Error} />;
  if (!data) return null;
  const t = data.totals;
  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <AdminStat label="Active tools" value={t.toolsActive} detail={`${t.toolsInactive} merged / archived`} />
        <AdminStat label="Tools needing review" value={t.toolsNeedsReview} detail="Coarse category or low confidence" />
        <AdminStat label="Mapped to brief category" value={t.toolsWithBriefCategory} detail={`of ${t.toolsActive} active`} />
        <AdminStat label="Merge log entries" value={t.mergeClusters} detail="Duplicate clusters" />
        <AdminStat label="Actions total" value={t.actionsTotal} />
        <AdminStat label="Actions needing review" value={t.actionsNeedsReview} />
        <AdminStat label="Archived actions" value={t.actionsArchived} detail="Soft-deleted duplicates" />
        <AdminStat label="Open queue items" value={t.reviewQueueOpen} />
      </section>

      <section className="rounded-md border border-chalk bg-white p-5">
        <p className="eyebrow-muted">Brief category coverage</p>
        <p className="mt-1 text-[12px] text-slate">
          {data.emptyBriefCategories.length} of {BRIEF_CATEGORY_LIST.length} brief categories still have zero mapped tools.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-x-6 md:grid-cols-2 xl:grid-cols-3">
          {data.briefCategoryCoverage.map((c) => (
            <div
              key={c.category}
              className="flex items-center justify-between border-b border-chalk/60 py-1.5 text-[13px]"
            >
              <span className={c.count === 0 ? "text-graphite" : "text-navy"}>{c.category}</span>
              <span
                className={[
                  "font-mono text-[12px]",
                  c.count === 0 ? "text-amber-700" : "text-slate",
                ].join(" ")}
              >
                {c.count}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ToolsTab() {
  const list = useServerFn(listToolsToReview);
  const approve = useServerFn(approveToolReview);
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const limit = 25;
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "catalog", "tools", search, page],
    queryFn: () => list({ data: { search: search || undefined, limit, offset: page * limit } }),
  });
  const approveMutation = useMutation({
    mutationFn: (input: Parameters<typeof approve>[0]["data"]) => approve({ data: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "catalog"] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder="Search by tool name…"
          className="w-full max-w-[320px] rounded-md border border-chalk bg-white px-3 py-1.5 text-[13px]"
        />
        <p className="text-[12px] text-slate">{data?.total ?? 0} flagged</p>
      </div>
      {isLoading ? (
        <p className="text-[13px] text-slate">Loading…</p>
      ) : error ? (
        <ErrorBox error={error as Error} />
      ) : (
        <div className="space-y-3">
          {(data?.rows ?? []).map((row) => (
            <ToolReviewCard
              key={row.id}
              row={row}
              onApprove={(payload) => approveMutation.mutate(payload)}
              pending={approveMutation.isPending}
            />
          ))}
          {(data?.rows ?? []).length === 0 && (
            <p className="text-[13px] text-slate">No tools awaiting review for this query.</p>
          )}
        </div>
      )}
      <Pagination page={page} setPage={setPage} total={data?.total ?? 0} limit={limit} />
    </div>
  );
}

function ToolReviewCard({
  row,
  onApprove,
  pending,
}: {
  row: ToolReviewRow;
  onApprove: (input: { id: string; category?: string; subcategory?: string; description?: string; clearReview?: boolean }) => void;
  pending: boolean;
}) {
  const [category, setCategory] = useState<string>(row.category && row.category !== "review" ? row.category : "");
  const [subcategory, setSubcategory] = useState<string>(row.subcategory ?? "");
  const [description, setDescription] = useState<string>(row.description ?? "");
  const canSave = category && BRIEF_CATEGORY_LIST.includes(category as any);

  return (
    <div className="rounded-md border border-chalk bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {row.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.logo_url} alt="" className="h-8 w-8 rounded-sm border border-chalk object-contain" />
          )}
          <div>
            <p className="text-[14px] font-semibold text-navy">{row.name}</p>
            <p className="font-mono text-[11px] text-slate">{row.slug}</p>
          </div>
        </div>
        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700">
          {row.category ?? "no category"}
        </span>
      </div>
      {row.notes && <p className="mt-2 text-[12px] text-graphite">{row.notes}</p>}
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        <label className="text-[12px] text-slate">
          Brief category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full rounded-md border border-chalk bg-white px-2 py-1.5 text-[13px] text-navy"
          >
            <option value="">Select…</option>
            {BRIEF_CATEGORY_LIST.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="text-[12px] text-slate">
          Subcategory
          <input
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            className="mt-1 w-full rounded-md border border-chalk bg-white px-2 py-1.5 text-[13px]"
          />
        </label>
        <label className="text-[12px] text-slate md:col-span-1">
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-md border border-chalk bg-white px-2 py-1.5 text-[13px]"
          />
        </label>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          disabled={pending}
          onClick={() => onApprove({ id: row.id, clearReview: true })}
          className="rounded-md border border-chalk px-3 py-1.5 text-[12px] text-navy hover:bg-mist"
        >
          Mark reviewed
        </button>
        <button
          disabled={pending || !canSave}
          onClick={() => onApprove({
            id: row.id,
            category,
            subcategory: subcategory || undefined,
            description: description || undefined,
            clearReview: true,
          })}
          className="rounded-md bg-navy px-3 py-1.5 text-[12px] text-white hover:bg-ink disabled:opacity-50"
        >
          Save & clear flag
        </button>
      </div>
    </div>
  );
}

function MergesTab() {
  const list = useServerFn(listMergeClusters);
  const [decision, setDecision] = useState<"" | "auto_merged" | "needs_review">("");
  const [page, setPage] = useState(0);
  const limit = 50;
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "catalog", "merges", decision, page],
    queryFn: () => list({ data: { decision: decision || undefined, limit, offset: page * limit } }),
  });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <select
          value={decision}
          onChange={(e) => { setDecision(e.target.value as any); setPage(0); }}
          className="rounded-md border border-chalk bg-white px-2 py-1.5 text-[13px]"
        >
          <option value="">All decisions</option>
          <option value="auto_merged">Auto merged</option>
          <option value="needs_review">Needs review</option>
        </select>
        <p className="text-[12px] text-slate">{data?.total ?? 0} entries</p>
      </div>
      {isLoading ? (
        <p className="text-[13px] text-slate">Loading…</p>
      ) : error ? (
        <ErrorBox error={error as Error} />
      ) : (
        <div className="overflow-hidden rounded-md border border-chalk bg-white">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-mist text-slate">
              <tr>
                <th className="px-3 py-2">Cluster</th>
                <th className="px-3 py-2">Canonical</th>
                <th className="px-3 py-2">Merged</th>
                <th className="px-3 py-2">Decision</th>
                <th className="px-3 py-2">Categories</th>
              </tr>
            </thead>
            <tbody>
              {(data?.rows ?? []).map((r) => (
                <tr key={r.id} className="border-t border-chalk/60">
                  <td className="px-3 py-2 font-mono">{r.cluster_id}</td>
                  <td className="px-3 py-2 font-mono">{r.canonical_slug}</td>
                  <td className="px-3 py-2 font-mono text-graphite">{r.merged_slug}</td>
                  <td className="px-3 py-2">
                    <span className={[
                      "rounded-full px-2 py-0.5 text-[11px]",
                      r.decision === "auto_merged" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700",
                    ].join(" ")}>{r.decision}</span>
                  </td>
                  <td className="px-3 py-2 text-graphite">{r.member_categories}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} setPage={setPage} total={data?.total ?? 0} limit={limit} />
    </div>
  );
}

function ActionsTab() {
  const list = useServerFn(listActionsToReview);
  const resolve = useServerFn(resolveActionReview);
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const limit = 50;
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "catalog", "actions", search, page],
    queryFn: () => list({ data: { search: search || undefined, limit, offset: page * limit } }),
  });
  const resolveMutation = useMutation({
    mutationFn: (input: { id: string; action: "approve" | "delete" }) => resolve({ data: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "catalog"] }),
  });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder="Search tool or action…"
          className="w-full max-w-[320px] rounded-md border border-chalk bg-white px-3 py-1.5 text-[13px]"
        />
        <p className="text-[12px] text-slate">{data?.total ?? 0} flagged</p>
      </div>
      {isLoading ? (
        <p className="text-[13px] text-slate">Loading…</p>
      ) : error ? (
        <ErrorBox error={error as Error} />
      ) : (
        <div className="overflow-hidden rounded-md border border-chalk bg-white">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-mist text-slate">
              <tr>
                <th className="px-3 py-2">Tool</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Object</th>
                <th className="px-3 py-2">Reason</th>
                <th className="px-3 py-2 text-right">Resolve</th>
              </tr>
            </thead>
            <tbody>
              {(data?.rows ?? []).map((r) => (
                <tr key={r.id} className="border-t border-chalk/60">
                  <td className="px-3 py-2 font-medium text-navy">{r.tool_name}</td>
                  <td className="px-3 py-2">{r.business_action}</td>
                  <td className="px-3 py-2 text-graphite">{r.business_object}</td>
                  <td className="px-3 py-2 text-graphite">{r.review_reason}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        disabled={resolveMutation.isPending}
                        onClick={() => resolveMutation.mutate({ id: r.id, action: "approve" })}
                        className="rounded-md border border-chalk px-2 py-1 text-[11px] text-navy hover:bg-mist"
                      >Keep</button>
                      <button
                        disabled={resolveMutation.isPending}
                        onClick={() => {
                          if (confirm(`Delete action "${r.business_action}" on ${r.tool_name}?`))
                            resolveMutation.mutate({ id: r.id, action: "delete" });
                        }}
                        className="rounded-md border border-red-200 px-2 py-1 text-[11px] text-red-700 hover:bg-red-50"
                      >Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} setPage={setPage} total={data?.total ?? 0} limit={limit} />
    </div>
  );
}

function Pagination({ page, setPage, total, limit }: { page: number; setPage: (n: number) => void; total: number; limit: number }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  return (
    <div className="flex items-center justify-end gap-2 text-[12px] text-slate">
      <button
        disabled={page === 0}
        onClick={() => setPage(Math.max(0, page - 1))}
        className="rounded-md border border-chalk px-2 py-1 disabled:opacity-50"
      >Prev</button>
      <span>Page {page + 1} of {pages}</span>
      <button
        disabled={page + 1 >= pages}
        onClick={() => setPage(page + 1)}
        className="rounded-md border border-chalk px-2 py-1 disabled:opacity-50"
      >Next</button>
    </div>
  );
}

function ErrorBox({ error }: { error: Error }) {
  return (
    <p className="rounded-md border border-red-200 bg-red-50 p-3 text-[13px] text-red-700">
      {error.message}
    </p>
  );
}