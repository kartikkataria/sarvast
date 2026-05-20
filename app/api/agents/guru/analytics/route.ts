import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import { querySearchAnalytics, getValidAccessToken } from "@/agents/guru/gsc";

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(request.url);
  const siteUrl = searchParams.get("siteUrl");
  const dimension = (searchParams.get("dimension") ?? "query") as "query" | "page";
  const days = parseInt(searchParams.get("days") ?? "28", 10);

  if (!siteUrl) return NextResponse.json({ error: "siteUrl required" }, { status: 400 });

  const admin = (await import("@/lib/supabase/admin")).createAdminClient();
  const { data: connection } = await admin
    .from("connections")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", user.id)
    .eq("provider", "google_search_console")
    .single();

  if (!connection) return NextResponse.json({ error: "Not connected" }, { status: 404 });

  try {
    const token = await getValidAccessToken({ ...connection, user_id: user.id });
    const result = await querySearchAnalytics(token, siteUrl, dimension, days);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[guru/analytics]", err);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
