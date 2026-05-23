import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { prompt } = await request.json();
  if (!prompt) return NextResponse.json({ error: "Prompt required" }, { status: 400 });

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    const image = response.data?.[0];
    const url = image?.url;
    if (!url) throw new Error("No image URL returned");

    return NextResponse.json({ url, revisedPrompt: image?.revised_prompt });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Image generation failed";
    console.error("[generate-image]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
