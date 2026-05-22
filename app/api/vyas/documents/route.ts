import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("context_documents")
    .select("id, name, description, file_type, file_size, tags, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await request.json();

  const admin = createAdminClient();

  // Get file path first
  const { data: doc } = await admin
    .from("context_documents")
    .select("file_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete from storage
  await admin.storage.from("context-library").remove([doc.file_path]);

  // Delete metadata
  const { error } = await admin
    .from("context_documents")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
