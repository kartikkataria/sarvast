import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { getValidAccessToken, listSites, querySearchAnalyticsWithTrend } from "@/agents/guru/gsc";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const admin = createAdminClient();
  const { data: connections } = await admin
    .from("connections")
    .select("provider, access_token, refresh_token, expires_at")
    .eq("user_id", user.id);

  const connMap = Object.fromEntries(
    (connections ?? []).map((c: { provider: string; access_token: string; refresh_token: string | null; expires_at: string | null }) => [c.provider, c])
  );
  const connected = Object.keys(connMap);

  // Gather available metrics context
  const context: string[] = [`Connected channels: ${connected.join(", ") || "none"}`];

  if (connMap.google_search_console) {
    try {
      const conn = connMap.google_search_console;
      const token = await getValidAccessToken({ ...conn, user_id: user.id });
      const sites = await listSites(token);
      if (sites.length > 0) {
        const { current, previous } = await querySearchAnalyticsWithTrend(token, sites[0].siteUrl, 28);
        const curr = current.totals;
        const prev = previous.totals;
        const clicksDelta = prev.clicks > 0 ? ((curr.clicks - prev.clicks) / prev.clicks * 100).toFixed(1) : "N/A";
        const ctrDelta = prev.ctr > 0 ? ((curr.ctr - prev.ctr) / prev.ctr * 100).toFixed(1) : "N/A";
        const posDelta = prev.position > 0 ? (curr.position - prev.position).toFixed(1) : "N/A";

        context.push(`Google Search Console (last 28d vs prior 28d):
  - Clicks: ${curr.clicks.toLocaleString()} (${clicksDelta}% change)
  - Impressions: ${curr.impressions.toLocaleString()}
  - Avg CTR: ${(curr.ctr * 100).toFixed(2)}% (${ctrDelta}% change)
  - Avg Position: ${curr.position.toFixed(1)} (${posDelta} change, lower is better)
  - Top queries: ${current.rows.slice(0, 5).map(r => `"${r.key}" pos ${r.position.toFixed(1)}`).join(", ")}`);
      }
    } catch (e) {
      context.push(`Google Search Console: connected but data fetch failed — ${e}`);
    }
  } else {
    context.push("Google Search Console: not connected");
  }

  if (!connMap.google_analytics) context.push("Google Analytics 4: not connected");
  if (!connMap.google_ads) context.push("Google Ads: not connected");
  if (!connMap.google_business) context.push("Google Business Profile: not connected");

  const prompt = `You are Chitra, the AI analytics agent for Sarvast — a marketing platform.
Based on the data below, generate 6-8 prioritized action items for the marketing team.

${context.join("\n\n")}

Rules:
- P1 = urgent, needs action this week (declining metrics, missed opportunities)
- P2 = important, action within 2 weeks
- P3 = optimisation, action when time permits
- If a channel is not connected, include a P2 or P3 item to connect it
- Be specific — reference actual numbers where available
- Each description must be one sentence, actionable, specific

Return ONLY valid JSON (no markdown, no explanation):
[{"priority":1,"agent":"guru","title":"Short title","description":"One sentence.","href":"/search"}]

Agents: guru=search/SEO, karma=ads, mitra=feedback/reviews, narad=social, chitra=analytics, vani=content, vyas=context, para=competition`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text : "";
    const text = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    const actions = JSON.parse(text);
    return NextResponse.json({ actions });
  } catch (e) {
    console.error("[chitra/actions]", e);
    return NextResponse.json({ actions: [] });
  }
}
