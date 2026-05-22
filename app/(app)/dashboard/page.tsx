import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/shared/page-header";
import { IntegrationSummaryCard } from "@/components/chitra/integration-summary-card";
import { getValidAccessToken, querySearchAnalytics, listSites } from "@/agents/guru/gsc";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const { data: connections } = await admin
    .from("connections")
    .select("provider, access_token, refresh_token, expires_at")
    .eq("user_id", user!.id);

  const connMap = Object.fromEntries((connections ?? []).map((c: { provider: string; access_token: string; refresh_token: string | null; expires_at: string | null }) => [c.provider, c]));

  // Fetch GSC data if connected
  let gscMetrics: { label: string; value: string }[] | undefined;
  if (connMap.google_search_console) {
    try {
      const conn = connMap.google_search_console;
      const token = await getValidAccessToken({ ...conn, user_id: user!.id });
      const sites = await listSites(token);
      if (sites.length > 0) {
        const { totals } = await querySearchAnalytics(token, sites[0].siteUrl, "query", 28);
        gscMetrics = [
          { label: "Clicks (28d)", value: totals.clicks.toLocaleString() },
          { label: "Impressions", value: totals.impressions.toLocaleString() },
          { label: "Avg CTR", value: `${(totals.ctr * 100).toFixed(1)}%` },
          { label: "Avg Position", value: totals.position.toFixed(1) },
        ];
      }
    } catch {
      // silent — show card without metrics
    }
  }

  const connectedCount = (connections ?? []).length;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={
          connectedCount > 0
            ? `${connectedCount} integration${connectedCount > 1 ? "s" : ""} connected`
            : "Connect integrations to see your marketing data"
        }
        agent="Chitra"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <IntegrationSummaryCard
          title="Google Search Console"
          agent="Guru"
          connected={!!connMap.google_search_console}
          href="/search"
          connectHref="/connections"
          color="bg-blue-500"
          initials="GSC"
          metrics={gscMetrics}
        />
        <IntegrationSummaryCard
          title="Google Analytics 4"
          agent="Chitra"
          connected={!!connMap.google_analytics}
          href="/dashboard"
          connectHref="/connections"
          color="bg-orange-500"
          initials="GA4"
        />
        <IntegrationSummaryCard
          title="Google Ads"
          agent="Karma"
          connected={!!connMap.google_ads}
          href="/ads"
          connectHref="/connections"
          color="bg-green-600"
          initials="GAd"
        />
        <IntegrationSummaryCard
          title="Google Business Profile"
          agent="Mitra"
          connected={!!connMap.google_business}
          href="/feedback"
          connectHref="/connections"
          color="bg-yellow-500"
          initials="GBP"
        />
        <IntegrationSummaryCard
          title="Meta Ads Manager"
          agent="Karma"
          connected={!!connMap.meta_ads}
          href="/ads"
          connectHref="/connections"
          color="bg-blue-700"
          initials="Meta"
        />
        <IntegrationSummaryCard
          title="Instagram"
          agent="Narad"
          connected={!!connMap.instagram}
          href="/social"
          connectHref="/connections"
          color="bg-pink-600"
          initials="IG"
        />
      </div>
    </>
  );
}
