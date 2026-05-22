import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/shared/page-header";
import { ChannelCard } from "@/components/chitra/channel-card";
import { ActionItems } from "@/components/chitra/action-items";
import { getValidAccessToken, listSites, querySearchAnalyticsWithTrend } from "@/agents/guru/gsc";

function pctDelta(curr: number, prev: number) {
  if (prev === 0) return null;
  return ((curr - prev) / prev) * 100;
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

  // Fetch GSC metrics
  type GscState = { metrics?: { label: string; value: string; trend?: number | null; inverseGood?: boolean }[]; error?: boolean };
  let gsc: GscState = {};

  if (connMap.google_search_console) {
    try {
      const conn = connMap.google_search_console;
      const token = await getValidAccessToken({ ...conn, user_id: user!.id });
      const sites = await listSites(token);
      if (sites.length > 0) {
        const { current, previous } = await querySearchAnalyticsWithTrend(token, sites[0].siteUrl, 28);
        const c = current.totals;
        const p = previous.totals;
        gsc = {
          metrics: [
            { label: "Organic Clicks", value: c.clicks.toLocaleString(), trend: pctDelta(c.clicks, p.clicks) },
            { label: "Impressions", value: c.impressions.toLocaleString(), trend: pctDelta(c.impressions, p.impressions) },
            { label: "Avg. CTR", value: `${(c.ctr * 100).toFixed(1)}%`, trend: pctDelta(c.ctr, p.ctr) },
            { label: "Avg. Position", value: c.position.toFixed(1), trend: pctDelta(c.position, p.position), inverseGood: true },
          ],
        };
      }
    } catch {
      gsc = { error: true };
    }
  }

  const connectedCount = Object.keys(connMap).length;

  return (
    <div className="flex h-full flex-col px-6 pt-5 pb-4">
      <PageHeader
        title="Dashboard"
        description={`${connectedCount} integration${connectedCount !== 1 ? "s" : ""} connected · Last 28 days`}
        agent="Chitra"
      />

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Left — channel performance */}
        <div className="flex-1 overflow-y-auto">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Channel Performance
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <ChannelCard
              title="Google Search Console"
              agent="Guru"
              initials="GSC"
              color="bg-blue-500"
              href="/search"
              connected={!!connMap.google_search_console}
              connectHref="/connections"
              metrics={gsc.metrics}
              error={gsc.error}
            />
            <ChannelCard
              title="Google Analytics 4"
              agent="Chitra"
              initials="GA4"
              color="bg-orange-500"
              href="/dashboard"
              connected={!!connMap.google_analytics}
              connectHref="/connections"
            />
            <ChannelCard
              title="Google Ads"
              agent="Karma"
              initials="GAd"
              color="bg-green-600"
              href="/ads"
              connected={!!connMap.google_ads}
              connectHref="/connections"
            />
            <ChannelCard
              title="Google Business Profile"
              agent="Mitra"
              initials="GBP"
              color="bg-yellow-500"
              href="/feedback"
              connected={!!connMap.google_business}
              connectHref="/connections"
            />
            <ChannelCard
              title="Meta Ads Manager"
              agent="Karma"
              initials="Meta"
              color="bg-blue-700"
              href="/ads"
              connected={!!connMap.meta_ads}
              connectHref="/connections"
            />
            <ChannelCard
              title="Instagram"
              agent="Narad"
              initials="IG"
              color="bg-pink-600"
              href="/social"
              connected={!!connMap.instagram}
              connectHref="/connections"
            />
          </div>
        </div>

        {/* Right — AI action items */}
        <div className="w-80 shrink-0 overflow-hidden">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Prioritised Actions
          </h2>
          <div className="h-[calc(100%-28px)]">
            <ActionItems />
          </div>
        </div>
      </div>
    </div>
  );
}
