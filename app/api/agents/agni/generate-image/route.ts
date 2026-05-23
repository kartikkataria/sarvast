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
      model: "gpt-image-1",
      prompt,
      n: 1,
      size: "1024x1024",
    });

    const image = response.data?.[0];

    // gpt-image-1 returns base64
    if (image?.b64_json) {
      return NextResponse.json({ url: `data:image/png;base64,${image.b64_json}` });
    }

    // dall-e-* returns a URL
    if (image?.url) {
      return NextResponse.json({ url: image.url });
    }

    throw new Error("No image returned from API");
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Image generation failed";
    console.error("[generate-image]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
