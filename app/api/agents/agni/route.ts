import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { AGNI_SYSTEM_PROMPT, AGNI_MODEL, AGNI_MAX_TOKENS } from "@/agents/agni";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MAX_QUESTIONS = 2;

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { messages } = await request.json();

  // Count how many times Agni has already responded
  const agniTurns = messages.filter((m: { role: string }) => m.role === "assistant").length;

  // If Agni has asked enough questions, force generation now
  const forceNow = agniTurns >= MAX_QUESTIONS
    ? `\n\nSYSTEM OVERRIDE: You have already asked ${agniTurns} question(s). You MUST now produce the final output immediately — either the structured brief OR the [[GENERATE_IMAGE:...]] marker. Do NOT ask any more questions.`
    : "";

  const stream = anthropic.messages.stream({
    model: AGNI_MODEL,
    max_tokens: AGNI_MAX_TOKENS,
    system: AGNI_SYSTEM_PROMPT + forceNow,
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
