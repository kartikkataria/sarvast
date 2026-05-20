import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { listSites, getValidAccessToken } from "@/agents/guru/gsc";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const admin = (await import("@/lib/supabase/admin")).createAdminClient();
  const { data: connection } = await admin
    .from("connections")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", user.id)
    .eq("provider", "google_search_console")
    .single();

  if (!connection) return NextResponse.json({ sites: [] });

  try {
    const token = await getValidAccessToken({ ...connection, user_id: user.id });
    const sites = await listSites(token);
    return NextResponse.json({ sites });
  } catch (err) {
    console.error("[guru/sites]", err);
    return NextResponse.json({ sites: [], error: "Failed to fetch sites" });
  }
}
