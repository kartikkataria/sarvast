import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { parse } from "node-html-parser";
import { PARA_MODEL, PARA_MAX_TOKENS, PARA_ANALYSIS_PROMPT } from "@/agents/para";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function fetchPageText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Sarvast/1.0 (competitive analysis)" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const root = parse(html);
  root.querySelectorAll("script, style, nav, footer, header, svg").forEach((el) => el.remove());
  const title = root.querySelector("title")?.text?.trim() ?? "";
  const meta = root.querySelector('meta[name="description"]')?.getAttribute("content") ?? "";
  const h1s = root.querySelectorAll("h1, h2").map((el) => el.text.trim()).join(" | ");
  const body = (root.querySelector("main") ?? root.querySelector("body") ?? root)
    .text.replace(/\s+/g, " ").trim().slice(0, 6000);
  return `TITLE: ${title}\nMETA: ${meta}\nHEADINGS: ${h1s}\n\nCONTENT:\n${body}`;
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { id, domain } = await request.json();
  if (!id || !domain) return NextResponse.json({ error: "id and domain required" }, { status: 400 });

  // Fetch website content
  let content: string;
  try {
    content = await fetchPageText(`https://${domain}`);
  } catch {
    try {
      content = await fetchPageText(`https://www.${domain}`);
    } catch (e) {
      return NextResponse.json({ error: `Could not fetch ${domain}: ${e}` }, { status: 422 });
    }
  }

  // Run Claude analysis
  const response = await anthropic.messages.create({
    model: PARA_MODEL,
    max_tokens: PARA_MAX_TOKENS,
    messages: [{ role: "user", content: PARA_ANALYSIS_PROMPT(content, domain) }],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text : "";
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

  let analysis: Record<string, unknown>;
  try {
    analysis = JSON.parse(cleaned);
  } catch {
    return NextResponse.json({ error: "Failed to parse analysis" }, { status: 500 });
  }

  // Store in DB
  const admin = createAdminClient();
  await admin.from("competitors").update({
    name: (analysis.name as string) ?? domain,
    analysis,
    analyzed_at: new Date().toISOString(),
  }).eq("id", id).eq("user_id", user.id);

  return NextResponse.json({ analysis });
}
