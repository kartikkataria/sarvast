import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(`${origin}/connections?error=access_denied`);
  }

  try {
    // 1. Exchange code for short-lived token
    const tokenRes = await fetch("https://graph.facebook.com/v19.0/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.META_APP_ID!,
        client_secret: process.env.META_APP_SECRET!,
        redirect_uri: `${origin}/api/connections/instagram/callback`,
        code,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(tokenData.error?.message ?? "Token exchange failed");

    // 2. Exchange for long-lived token (60 days)
    const longRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&fb_exchange_token=${tokenData.access_token}`
    );
    const longData = await longRes.json();
    const accessToken = longData.access_token ?? tokenData.access_token;
    const expiresIn = longData.expires_in ?? 3600;

    // 3. Get Facebook Pages
    const pagesRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`
    );
    const pagesData = await pagesRes.json();
    const pages = pagesData.data ?? [];

    // 4. Find Instagram Business Account linked to any page
    let instagramUserId: string | null = null;
    let instagramUsername: string | null = null;
    let pageAccessToken: string | null = null;

    for (const page of pages) {
      const igRes = await fetch(
        `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
      );
      const igData = await igRes.json();
      if (igData.instagram_business_account?.id) {
        instagramUserId = igData.instagram_business_account.id;
        pageAccessToken = page.access_token;

        // Get username
        const profileRes = await fetch(
          `https://graph.facebook.com/v19.0/${instagramUserId}?fields=username&access_token=${pageAccessToken}`
        );
        const profile = await profileRes.json();
        instagramUsername = profile.username ?? null;
        break;
      }
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.redirect(`${origin}/auth/signin`);

    const admin = createAdminClient();
    await admin.from("connections").upsert({
      user_id: user.id,
      provider: "instagram",
      provider_account_id: instagramUsername ?? instagramUserId ?? "unknown",
      access_token: pageAccessToken ?? accessToken,
      refresh_token: null,
      expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
      scopes: ["instagram_basic", "instagram_content_publish"],
      metadata: { instagram_user_id: instagramUserId, username: instagramUsername },
    });

    return NextResponse.redirect(`${origin}/connections?connected=instagram`);
  } catch (e) {
    console.error("[instagram callback]", e);
    return NextResponse.redirect(`${origin}/connections?error=instagram_failed`);
  }
}
