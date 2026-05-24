import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("competitors")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  let { domain } = await request.json();
  if (!domain) return NextResponse.json({ error: "Domain required" }, { status: 400 });

  // Normalise — strip protocol/www, keep bare domain
  domain = domain.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].toLowerCase();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("competitors")
    .insert({ user_id: user.id, domain })
    .select()
    .single();

  if (error?.code === "23505") return NextResponse.json({ error: "Already tracking this domain" }, { status: 409 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await request.json();
  const admin = createAdminClient();
  await admin.from("competitors").delete().eq("id", id).eq("user_id", user.id);
  return NextResponse.json({ success: true });
}
