import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AGNI_SYSTEM_PROMPT, AGNI_MODEL, AGNI_MAX_TOKENS } from "@/agents/agni";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MAX_QUESTIONS = 2;

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { messages } = await request.json();

  // Fetch user's digital presence
  const admin = createAdminClient();
  const { data: settings } = await admin
    .from("user_settings")
    .select("website, marketplace_links")
    .eq("user_id", user.id)
    .single();

  const digitalContext = settings?.website || settings?.marketplace_links?.length
    ? `\n\n## User's Digital Presence (use this as brand context)\n${settings.website ? `- Website: ${settings.website}` : ""}${settings.marketplace_links?.length ? `\n- Marketplace: ${settings.marketplace_links.join(", ")}` : ""}`
    : "";

  // Count how many times Agni has already responded
  const agniTurns = messages.filter((m: { role: string }) => m.role === "assistant").length;
  const forceNow = agniTurns >= MAX_QUESTIONS
    ? `\n\nSYSTEM OVERRIDE: You have already asked ${agniTurns} question(s). Produce the final output NOW — either the structured brief or the [[GENERATE_IMAGE:...]] marker. Do NOT ask any more questions.`
    : "";

  const stream = anthropic.messages.stream({
    model: AGNI_MODEL,
    max_tokens: AGNI_MAX_TOKENS,
    system: AGNI_SYSTEM_PROMPT + digitalContext + forceNow,
    messages,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      stream.on("text", (text) => controller.enqueue(encoder.encode(text)));
      await stream.finalMessage();
      controller.close();
    },
    cancel() { stream.abort(); },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "X-Accel-Buffering": "no",
    },
  });
}
