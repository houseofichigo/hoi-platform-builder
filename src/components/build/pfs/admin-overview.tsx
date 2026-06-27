import { Card } from "@/components/ui/card";
import { useBuildOverview } from "@/lib/db/build-analytics";

export function AdminOverview() {
  const overview = useBuildOverview();
  if (overview.isLoading) return <p className="text-[13px] text-slate">Loading process analytics...</p>;
  if (overview.isError) return <p className="text-[13px] text-red-700">{overview.error.message}</p>;
  const data = overview.data;
  return (
    <div className="grid gap-3 md:grid-cols-4">
      <Card className="border-chalk bg-white p-4">
        <p className="eyebrow-muted">Total</p>
        <p className="mt-2 text-[28px] font-semibold text-navy">{data?.total ?? 0}</p>
      </Card>
      <Card className="border-chalk bg-white p-4">
        <p className="eyebrow-muted">Submitted</p>
        <p className="mt-2 text-[28px] font-semibold text-navy">{data?.submitted ?? 0}</p>
      </Card>
      <Card className="border-chalk bg-white p-4">
        <p className="eyebrow-muted">Under review</p>
        <p className="mt-2 text-[28px] font-semibold text-navy">{data?.under_review ?? 0}</p>
      </Card>
      <Card className="border-chalk bg-white p-4">
        <p className="eyebrow-muted">Approved</p>
        <p className="mt-2 text-[28px] font-semibold text-navy">{data?.approved ?? 0}</p>
      </Card>
    </div>
  );
}
