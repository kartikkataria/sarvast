import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { parse } from "node-html-parser";

export type ExtractedAsset = {
  id: string;
  type: "page-text" | "image" | "document";
  name: string;
  url: string;
  preview?: string;
  mimeType?: string;
};

function toAbsolute(href: string, base: string): string | null {
  try {
    return new URL(href, base).href;
  } catch {
    return null;
  }
}

const DOC_EXTS = [".pdf", ".docx", ".doc", ".xlsx", ".xls", ".csv", ".pptx", ".ppt", ".txt", ".md"];

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { url } = await request.json();
  if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

  let pageUrl: URL;
  try {
    pageUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  let html: string;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Sarvast/1.0 (marketing platform; asset extraction)" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    html = await res.text();
  } catch (e) {
    return NextResponse.json({ error: `Could not fetch page: ${e}` }, { status: 422 });
  }

  const root = parse(html);

  // Page metadata
  const title = root.querySelector("title")?.text?.trim()
    ?? root.querySelector('meta[property="og:title"]')?.getAttribute("content")
    ?? pageUrl.hostname;
  const description = root.querySelector('meta[name="description"]')?.getAttribute("content")
    ?? root.querySelector('meta[property="og:description"]')?.getAttribute("content")
    ?? "";

  // Strip scripts/styles, get body text
  root.querySelectorAll("script, style, nav, footer, header").forEach((el) => el.remove());
  const bodyText = (root.querySelector("main") ?? root.querySelector("body") ?? root)
    .text
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 50000);

  const assets: ExtractedAsset[] = [];

  // 1. Page text content
  if (bodyText.length > 100) {
    assets.push({
      id: "page-text",
      type: "page-text",
      name: `${title} — page content`,
      url: url,
      preview: description || bodyText.slice(0, 200),
    });
  }

  // 2. Images
  const seenImages = new Set<string>();
  root.querySelectorAll("img").forEach((img) => {
    const src = img.getAttribute("src") ?? img.getAttribute("data-src");
    if (!src) return;
    const abs = toAbsolute(src, url);
    if (!abs || seenImages.has(abs)) return;
    seenImages.add(abs);
    const alt = img.getAttribute("alt") ?? "";
    const name = abs.split("/").pop()?.split("?")[0] ?? "image";
    assets.push({
      id: `img-${assets.length}`,
      type: "image",
      name: alt || name,
      url: abs,
      preview: abs,
      mimeType: abs.endsWith(".svg") ? "image/svg+xml" : abs.endsWith(".png") ? "image/png" : "image/jpeg",
    });
  });

  // og:image
  const ogImage = root.querySelector('meta[property="og:image"]')?.getAttribute("content");
  if (ogImage) {
    const abs = toAbsolute(ogImage, url);
    if (abs && !seenImages.has(abs)) {
      seenImages.add(abs);
      assets.push({ id: `img-og`, type: "image", name: "og:image", url: abs, preview: abs });
    }
  }

  // 3. Document links
  const seenDocs = new Set<string>();
  root.querySelectorAll("a[href]").forEach((a) => {
    const href = a.getAttribute("href") ?? "";
    const isDoc = DOC_EXTS.some((ext) => href.toLowerCase().includes(ext));
    if (!isDoc) return;
    const abs = toAbsolute(href, url);
    if (!abs || seenDocs.has(abs)) return;
    seenDocs.add(abs);
    const name = abs.split("/").pop()?.split("?")[0] ?? href;
    const ext = DOC_EXTS.find((e) => abs.toLowerCase().includes(e)) ?? "";
    assets.push({
      id: `doc-${assets.length}`,
      type: "document",
      name: a.text.trim() || name,
      url: abs,
      mimeType: ext === ".pdf" ? "application/pdf" : "application/octet-stream",
    });
  });

  return NextResponse.json({ title, assets, pageUrl: url });
}
