import { createAdminClient } from "@/lib/supabase/admin";

type GSCConnection = {
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
  user_id: string;
};

type SearchAnalyticsRow = {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type SearchMetrics = {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type AnalyticsRow = {
  key: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type GSCSite = {
  siteUrl: string;
  permissionLevel: string;
};

async function refreshAccessToken(connection: GSCConnection): Promise<string> {
  if (!connection.refresh_token) throw new Error("No refresh token available");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: connection.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Token refresh failed: ${data.error}`);

  const admin = createAdminClient();
  await admin.from("connections").update({
    access_token: data.access_token,
    expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
  }).eq("user_id", connection.user_id).eq("provider", "google_search_console");

  return data.access_token;
}

export async function getValidAccessToken(connection: GSCConnection): Promise<string> {
  const isExpired =
    !connection.expires_at ||
    new Date(connection.expires_at).getTime() < Date.now() + 5 * 60 * 1000;

  if (isExpired) return refreshAccessToken(connection);
  return connection.access_token;
}

export async function listSites(accessToken: string): Promise<GSCSite[]> {
  const res = await fetch("https://www.googleapis.com/webmasters/v3/sites", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[GSC listSites] API error:", JSON.stringify(err));
    throw new Error(`Failed to fetch GSC sites: ${err?.error?.message ?? res.status}`);
  }
  const data = await res.json();
  return data.siteEntry ?? [];
}

async function fetchSearchAnalyticsForRange(
  accessToken: string,
  siteUrl: string,
  dimension: "query" | "page",
  startDate: string,
  endDate: string,
  rowLimit = 10
): Promise<{ rows: AnalyticsRow[]; totals: SearchMetrics }> {
  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ startDate, endDate, dimensions: [dimension], rowLimit }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[GSC analytics] API error:", JSON.stringify(err));
    throw new Error(`Failed to fetch search analytics: ${err?.error?.message ?? res.status}`);
  }
  const data = await res.json();

  const rows: AnalyticsRow[] = (data.rows ?? []).map((r: SearchAnalyticsRow) => ({
    key: r.keys[0],
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: r.position,
  }));

  const totals = rows.reduce(
    (acc, r) => ({ clicks: acc.clicks + r.clicks, impressions: acc.impressions + r.impressions, ctr: 0, position: 0 }),
    { clicks: 0, impressions: 0, ctr: 0, position: 0 }
  );
  if (rows.length > 0) {
    totals.ctr = rows.reduce((s, r) => s + r.ctr, 0) / rows.length;
    totals.position = rows.reduce((s, r) => s + r.position, 0) / rows.length;
  }
  return { rows, totals };
}

const fmt = (d: Date) => d.toISOString().split("T")[0];

export async function querySearchAnalytics(
  accessToken: string,
  siteUrl: string,
  dimension: "query" | "page",
  days: number = 28
): Promise<{ rows: AnalyticsRow[]; totals: SearchMetrics }> {
  const endDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
  return fetchSearchAnalyticsForRange(accessToken, siteUrl, dimension, fmt(startDate), fmt(endDate), 25);
}

export async function querySearchAnalyticsWithTrend(
  accessToken: string,
  siteUrl: string,
  days: number = 28
): Promise<{
  current: { rows: AnalyticsRow[]; totals: SearchMetrics };
  previous: { totals: SearchMetrics };
}> {
  const end = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  const prevEnd = new Date(start.getTime() - 24 * 60 * 60 * 1000);
  const prevStart = new Date(prevEnd.getTime() - days * 24 * 60 * 60 * 1000);

  const [current, previous] = await Promise.all([
    fetchSearchAnalyticsForRange(accessToken, siteUrl, "query", fmt(start), fmt(end), 10),
    fetchSearchAnalyticsForRange(accessToken, siteUrl, "query", fmt(prevStart), fmt(prevEnd), 10),
  ]);

  return { current, previous };
}
