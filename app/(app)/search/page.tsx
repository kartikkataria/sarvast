import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/shared/page-header";
import { SearchDashboard } from "@/components/guru/search-dashboard";
import { EmptyState } from "@/components/shared/empty-state";
import { Search, Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  listSites,
  querySearchAnalytics,
  getValidAccessToken,
} from "@/agents/guru/gsc";

export default async function SearchPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const { data: connection } = await admin
    .from("connections")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", user!.id)
    .eq("provider", "google_search_console")
    .single();

  if (!connection) {
    return (
      <>
        <PageHeader title="Search" description="SEO analysis and keyword performance" agent="Guru" />
        <EmptyState
          icon={Plug}
          title="Google Search Console not connected"
          description="Connect Google Search Console to see your keyword rankings, impressions, and click-through rates."
          action={
            <Button asChild size="sm">
              <Link href="/connections">Go to Connections</Link>
            </Button>
          }
        />
      </>
    );
  }

  try {
    const token = await getValidAccessToken({ ...connection, user_id: user!.id });
    const sites = await listSites(token);

    if (sites.length === 0) {
      return (
        <>
          <PageHeader title="Search" description="SEO analysis and keyword performance" agent="Guru" />
          <EmptyState
            icon={Search}
            title="No accessible Search Console properties"
            description="Your Google account doesn't have Full User or Owner access to any Search Console properties. Add your own website at search.google.com/search-console, or ask the property owner to grant you Full access."
          />
        </>
      );
    }

    const defaultSite = sites[0].siteUrl;
    const { rows, totals } = await querySearchAnalytics(token, defaultSite, "query", 28);

    return (
      <>
        <PageHeader
          title="Search"
          description="Keyword rankings and search performance"
          agent="Guru"
        />
        <SearchDashboard
          sites={sites}
          initialSiteUrl={defaultSite}
          initialRows={rows}
          initialTotals={totals}
          days={28}
        />
      </>
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    const isPermission = msg.includes("permission") || msg.includes("forbidden") || msg.includes("403");
    console.error("[search page]", err);
    return (
      <>
        <PageHeader title="Search" description="SEO analysis and keyword performance" agent="Guru" />
        <EmptyState
          icon={Search}
          title={isPermission ? "Insufficient permissions" : "Failed to load search data"}
          description={
            isPermission
              ? "Your Google account has Restricted access to this Search Console property. Ask the property owner to upgrade your permission to Full User at search.google.com/search-console → Settings → Users and permissions."
              : "There was an error fetching data from Google Search Console. Try refreshing the page."
          }
        />
      </>
    );
  }
}
