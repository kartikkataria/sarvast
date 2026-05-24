import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { post_id } = await request.json();
  const admin = createAdminClient();

  // Get the post
  const { data: post } = await admin
    .from("content_posts")
    .select("*")
    .eq("id", post_id)
    .eq("user_id", user.id)
    .single();

  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  // Get Instagram connection
  const { data: conn } = await admin
    .from("connections")
    .select("access_token, metadata")
    .eq("user_id", user.id)
    .eq("provider", "instagram")
    .single();

  if (!conn) return NextResponse.json({ error: "Instagram not connected" }, { status: 400 });

  const igUserId = conn.metadata?.instagram_user_id;
  const pageToken = conn.access_token;

  try {
    // Step 1 — Create media container
    const containerBody: Record<string, string> = {
      caption: post.caption,
      access_token: pageToken,
    };

    if (post.media_url) {
      containerBody.image_url = post.media_url;
    } else {
      // Text-only posts require a placeholder — use a simple approach
      containerBody.media_type = "REELS"; // fallback
    }

    const containerRes = await fetch(
      `https://graph.facebook.com/v19.0/${igUserId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(containerBody),
      }
    );
    const container = await containerRes.json();
    if (!containerRes.ok) throw new Error(container.error?.message ?? "Failed to create media container");

    // Step 2 — Publish
    const publishRes = await fetch(
      `https://graph.facebook.com/v19.0/${igUserId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          creation_id: container.id,
          access_token: pageToken,
        }),
      }
    );
    const published = await publishRes.json();
    if (!publishRes.ok) throw new Error(published.error?.message ?? "Failed to publish");

    // Update post status
    await admin.from("content_posts").update({
      status: "published",
      published_at: new Date().toISOString(),
      platform_post_id: published.id,
    }).eq("id", post_id);

    return NextResponse.json({ success: true, platform_post_id: published.id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Publish failed";
    await admin.from("content_posts").update({ status: "failed", error_message: msg }).eq("id", post_id);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
