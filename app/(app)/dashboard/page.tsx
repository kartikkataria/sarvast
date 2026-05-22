import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { LayoutDashboard, Plug, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getValidAccessToken, listSites, querySearchAnalyticsWithTrend } from "@/agents/guru/gsc";
import type { SearchMetrics, AnalyticsRow } from "@/agents/guru/gsc";

function pct(curr: number, prev: number) {
  if (prev === 0) return null;
  return ((curr - prev) / prev) * 100;
}

function Trend({ curr, prev, inverse = false }: { curr: number; prev: number; inverse?: boolean }) {
  const delta = pct(curr, prev);
  if (delta === null) return null;
  const good = inverse ? delta < 0 : delta > 0;
  const neutral = Math.abs(delta) < 0.5;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${neutral ? "text-muted-foreground" : good ? "text-green-600" : "text-red-500"}`}>
      {neutral ? <Minus className="h-3 w-3" /> : good ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {neutral ? "—" : `${delta > 0 ? "+" : ""}${delta.toFixed(1)}%`}
    </span>
  );
}

function KPICard({ label, value, source, curr, prev, inverse = false, format }: {
  label: string; value: string; source: string;
  curr: number; prev: number; inverse?: boolean;
  format?: (n: number) => string;
}) {
  void format;
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">{value}</p>
      <div className="mt-1.5 flex items-center justify-between">
        <Trend curr={curr} prev={prev} inverse={inverse} />
        <span className="text-[10px] text-muted-foreground/60">{source}</span>
      </div>
    </div>
  );
}

function PositionBadge({ pos }: { pos: number }) {
  const color = pos <= 3 ? "bg-green-100 text-green-700" : pos <= 10 ? "bg-yellow-100 text-yellow-700" : "bg-muted text-muted-foreground";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>{pos.toFixed(1)}</span>;
}

function TopQueriesTable({ rows }: { rows: AnalyticsRow[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-5 py-3.5">
        <h2 className="text-sm font-semibold">Top Queries</h2>
        <p className="text-xs text-muted-foreground">Last 28 days · Google Search Console</p>
      </div>
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-muted/30">
          <tr>
            <th className="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground">Query</th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Clicks</th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Impressions</th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">CTR</th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Position</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, i) => (
            <tr key={i} className="transition-colors hover:bg-muted/20">
              <td className="max-w-xs truncate px-5 py-3 font-medium" title={row.key}>{row.key}</td>
              <td className="px-4 py-3 text-right tabular-nums">{row.clicks.toLocaleString()}</td>
              <td className="px-4 py-3 text-right tabular-nums">{row.impressions.toLocaleString()}</td>
              <td className="px-4 py-3 text-right tabular-nums">{(row.ctr * 100).toFixed(1)}%</td>
              <td className="px-4 py-3 text-right"><PositionBadge pos={row.position} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-border px-5 py-3">
        <Link href="/search" className="text-xs font-medium text-primary hover:underline">
          View all queries →
        </Link>
      </div>
    </div>
  );
}

function ConnectedSourcesBadges({ connected }: { connected: string[] }) {
  const sources = [
    { key: "google_search_console", label: "GSC" },
    { key: "google_analytics", label: "GA4" },
    { key: "google_ads", label: "Google Ads" },
    { key: "google_business", label: "GBP" },
    { key: "meta_ads", label: "Meta Ads" },
    { key: "instagram", label: "Instagram" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">Connected:</span>
      {sources.map((s) => (
        <span key={s.key} className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
          connected.includes(s.key) ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground/50"
        }`}>
          {s.label}
        </span>
      ))}
      <Link href="/connections" className="text-[11px] text-muted-foreground hover:text-primary ml-1">
        Manage →
      </Link>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const { data: connections } = await admin
    .from("connections")
    .select("provider, access_token, refresh_token, expires_at")
    .eq("user_id", user!.id);

  const connMap = Object.fromEntries(
    (connections ?? []).map((c: { provider: string; access_token: string; refresh_token: string | null; expires_at: string | null }) => [c.provider, c])
  );
  const connected = Object.keys(connMap);

  if (connected.length === 0) {
    return (
      <>
        <PageHeader title="Dashboard" description="Your marketing performance at a glance" agent="Chitra" />
        <EmptyState
          icon={Plug}
          title="No integrations connected"
          description="Connect Google Search Console, GA4, or Google Ads to see your real marketing performance here."
          action={<Button asChild size="sm"><Link href="/connections">Connect integrations</Link></Button>}
        />
      </>
    );
  }

  // Fetch GSC data with trend comparison
  let current: { rows: AnalyticsRow[]; totals: SearchMetrics } | null = null;
  let previous: { totals: SearchMetrics } | null = null;
  let siteUrl = "";

  if (connMap.google_search_console) {
    try {
      const conn = connMap.google_search_console;
      const token = await getValidAccessToken({ ...conn, user_id: user!.id });
      const sites = await listSites(token);
      if (sites.length > 0) {
        siteUrl = sites[0].siteUrl;
        const result = await querySearchAnalyticsWithTrend(token, siteUrl, 28);
        current = result.current;
        previous = result.previous;
      }
    } catch {
      // show dashboard without GSC data
    }
  }

  const prev = previous?.totals ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  const curr = current?.totals ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 };

  return (
    <>
      <PageHeader title="Dashboard" description="Last 28 days · updates every few hours" agent="Chitra" />

      {/* KPI strip */}
      {current && (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KPICard label="Organic Clicks" value={curr.clicks.toLocaleString()} source="Search Console"
            curr={curr.clicks} prev={prev.clicks} />
          <KPICard label="Impressions" value={curr.impressions.toLocaleString()} source="Search Console"
            curr={curr.impressions} prev={prev.impressions} />
          <KPICard label="Avg. CTR" value={`${(curr.ctr * 100).toFixed(1)}%`} source="Search Console"
            curr={curr.ctr} prev={prev.ctr} />
          <KPICard label="Avg. Position" value={curr.position.toFixed(1)} source="Search Console"
            curr={curr.position} prev={prev.position} inverse />
        </div>
      )}

      {/* Not connected warning for GSC */}
      {!connMap.google_search_console && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-5 py-4">
          <LayoutDashboard className="h-5 w-5 text-muted-foreground/40" />
          <div>
            <p className="text-sm font-medium">Connect Google Search Console for search metrics</p>
            <Link href="/connections" className="text-xs text-primary hover:underline">Connect now →</Link>
          </div>
        </div>
      )}

      {/* Top queries */}
      {current && current.rows.length > 0 && (
        <div className="mb-6">
          <TopQueriesTable rows={current.rows} />
        </div>
      )}

      {/* Connected sources */}
      <ConnectedSourcesBadges connected={connected} />
    </>
  );
}
