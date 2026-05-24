import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("user_settings")
    .select("website, marketplace_links")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json(data ?? { website: "", marketplace_links: [] });
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { website, marketplace_links } = await request.json();

  const admin = createAdminClient();
  const { error } = await admin.from("user_settings").upsert({
    user_id: user.id,
    website: website?.trim() ?? null,
    marketplace_links: marketplace_links ?? [],
    updated_at: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
