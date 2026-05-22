import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import type { ExtractedAsset } from "../extract-url/route";

const MAX_ASSET_SIZE = 50 * 1024 * 1024;

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { assets, pageUrl }: { assets: ExtractedAsset[]; pageUrl: string } = await request.json();
  if (!assets?.length) return NextResponse.json({ error: "No assets" }, { status: 400 });

  const admin = createAdminClient();
  const imported: string[] = [];
  const errors: string[] = [];

  for (const asset of assets) {
    try {
      if (asset.type === "page-text") {
        // Fetch the page text again and store as .txt
        const res = await fetch(pageUrl, {
          headers: { "User-Agent": "Sarvast/1.0" },
          signal: AbortSignal.timeout(15000),
        });
        const html = await res.text();
        const { parse } = await import("node-html-parser");
        const root = parse(html);
        root.querySelectorAll("script, style, nav, footer, header").forEach((el) => el.remove());
        const text = (root.querySelector("main") ?? root.querySelector("body") ?? root)
          .text.replace(/\s+/g, " ").trim();

        const fileName = `${asset.name.slice(0, 60).replace(/[^a-zA-Z0-9._-]/g, "_")}.txt`;
        const filePath = `${user.id}/${Date.now()}-${fileName}`;
        const bytes = new TextEncoder().encode(text);

        const { error: upErr } = await admin.storage
          .from("context-library")
          .upload(filePath, bytes, { contentType: "text/plain", upsert: false });
        if (upErr) throw upErr;

        await admin.from("context_documents").insert({
          user_id: user.id,
          name: asset.name,
          description: `Imported from ${pageUrl}`,
          file_path: filePath,
          file_type: "text/plain",
          file_size: bytes.byteLength,
          tags: ["web-import"],
        });
        imported.push(asset.name);
      } else {
        // Fetch the remote asset and re-upload
        const res = await fetch(asset.url, {
          headers: { "User-Agent": "Sarvast/1.0" },
          signal: AbortSignal.timeout(30000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const buffer = await res.arrayBuffer();
        if (buffer.byteLength > MAX_ASSET_SIZE) throw new Error("File too large (>50MB)");

        const contentType = res.headers.get("content-type")?.split(";")[0] ?? asset.mimeType ?? "application/octet-stream";
        const rawName = asset.url.split("/").pop()?.split("?")[0] ?? asset.name;
        const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, "_");
        const filePath = `${user.id}/${Date.now()}-${safeName}`;

        const { error: upErr } = await admin.storage
          .from("context-library")
          .upload(filePath, buffer, { contentType, upsert: false });
        if (upErr) throw upErr;

        await admin.from("context_documents").insert({
          user_id: user.id,
          name: asset.name || safeName,
          description: `Imported from ${new URL(asset.url).hostname}`,
          file_path: filePath,
          file_type: contentType,
          file_size: buffer.byteLength,
          tags: ["web-import"],
        });
        imported.push(asset.name);
      }
    } catch (e) {
      errors.push(`${asset.name}: ${e}`);
    }
  }

  return NextResponse.json({ imported, errors });
}
