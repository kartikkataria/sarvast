import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { ConnectionsList } from "@/components/connections/connections-list";
import { INTEGRATIONS } from "@/lib/integrations";

export default async function ConnectionsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: connections } = await supabase
    .from("connections")
    .select("provider, provider_account_id, connected_at")
    .eq("user_id", user!.id);

  const connectedMap = Object.fromEntries(
    (connections ?? []).map((c) => [
      c.provider,
      { provider_account_id: c.provider_account_id, connected_at: c.connected_at },
    ])
  );

  const connectedCount = (connections ?? []).length;

  return (
    <>
      <PageHeader
        title="Connections"
        description={
          connectedCount > 0
            ? `${connectedCount} of ${INTEGRATIONS.length} integrations connected`
            : "Connect your marketing tools to unlock real data across all agents"
        }
      />
      <Suspense>
        <ConnectionsList integrations={INTEGRATIONS} connectedMap={connectedMap} />
      </Suspense>
    </>
  );
}
