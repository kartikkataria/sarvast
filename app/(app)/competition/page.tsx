import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/shared/page-header";
import { CompetitionDashboard } from "@/components/para/competition-dashboard";

export default async function CompetitionPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const { data: competitors } = await admin
    .from("competitors")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader
        title="Competition"
        description="Track and analyse your competitors"
        agent="Para"
      />
      <CompetitionDashboard initialCompetitors={competitors ?? []} />
    </>
  );
}
