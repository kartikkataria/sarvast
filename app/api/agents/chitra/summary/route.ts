import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { getValidAccessToken, querySearchAnalytics, listSites } from "@/agents/guru/gsc";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const admin = createAdminClient();
  const { data: connections } = await admin
    .from("connections")
    .select("provider, access_token, refresh_token, expires_at")
    .eq("user_id", user.id);

  const connMap = Object.fromEntries((connections ?? []).map((c) => [c.provider, c]));
  const summary: Record<string, unknown> = {};

  // Google Search Console
  if (connMap.google_search_console) {
    try {
      const conn = connMap.google_search_console;
      const token = await getValidAccessToken({ ...conn, user_id: user.id });
      const sites = await listSites(token);
      if (sites.length > 0) {
        const { totals } = await querySearchAnalytics(token, sites[0].siteUrl, "query", 28);
        summary.gsc = { clicks: totals.clicks, impressions: totals.impressions, ctr: totals.ctr, position: totals.position };
      }
    } catch (e) {
      console.error("[chitra] gsc error:", e);
    }
  }

  // Google Ads — fetch spend summary
  if (connMap.google_ads) {
    try {
      const conn = connMap.google_ads;
      const token = await getValidAccessToken({ ...conn, user_id: user.id });
      // List accessible customers
      const res = await fetch(
        "https://googleads.googleapis.com/v17/customers:listAccessibleCustomers",
        { headers: { Authorization: `Bearer ${token}`, "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? "" } }
      );
      if (res.ok) {
        const data = await res.json();
        summary.google_ads = { customerCount: (data.resourceNames ?? []).length };
      }
    } catch (e) {
      console.error("[chitra] google_ads error:", e);
    }
  }

  return NextResponse.json({
    connected: Object.keys(connMap),
    summary,
  });
}
