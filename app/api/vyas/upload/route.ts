import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const ALLOWED_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const form = await request.formData();
  const file = form.get("file") as File;
  const description = (form.get("description") as string) ?? "";
  const tags = ((form.get("tags") as string) ?? "").split(",").map((t) => t.trim()).filter(Boolean);

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "File type not supported. Use PDF, TXT, MD, or DOCX." }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large. Max 10MB." }, { status: 400 });
  }

  const filePath = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const bytes = await file.arrayBuffer();

  const admin = createAdminClient();

  const { error: uploadError } = await admin.storage
    .from("context-library")
    .upload(filePath, bytes, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data, error: dbError } = await admin
    .from("context_documents")
    .insert({
      user_id: user.id,
      name: file.name,
      description,
      file_path: filePath,
      file_type: file.type,
      file_size: file.size,
      tags,
    })
    .select()
    .single();

  if (dbError) {
    await admin.storage.from("context-library").remove([filePath]);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
