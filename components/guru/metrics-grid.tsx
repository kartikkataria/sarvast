import type { SearchMetrics } from "@/agents/guru/gsc";

function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function MetricsGrid({ totals, days }: { totals: SearchMetrics; days: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <MetricCard
        label="Total Clicks"
        value={totals.clicks.toLocaleString()}
        sub={`Last ${days} days`}
      />
      <MetricCard
        label="Total Impressions"
        value={totals.impressions.toLocaleString()}
        sub={`Last ${days} days`}
      />
      <MetricCard
        label="Avg. CTR"
        value={`${(totals.ctr * 100).toFixed(1)}%`}
        sub="Across top 25 queries"
      />
      <MetricCard
        label="Avg. Position"
        value={totals.position.toFixed(1)}
        sub="Lower is better"
      />
    </div>
  );
}
