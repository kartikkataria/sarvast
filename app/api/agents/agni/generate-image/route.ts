import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { prompt } = await request.json();
  if (!prompt) return NextResponse.json({ error: "Prompt required" }, { status: 400 });

  try {
    const encoded = encodeURIComponent(prompt);
    const seed = Math.floor(Math.random() * 999999);
    const url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&seed=${seed}&enhance=true`;

    // Verify the image is reachable before returning
    const check = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(30000) });
    if (!check.ok) throw new Error("Image generation failed");

    return NextResponse.json({ url });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Image generation failed";
    console.error("[generate-image]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
