import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Megaphone } from "lucide-react";

export default function AdsPage() {
  return (
    <>
      <PageHeader
        title="Ads"
        description="Monitor and optimize paid advertising campaigns"
        agent="Karma"
      />
      <EmptyState
        icon={Megaphone}
        title="No ad accounts connected"
        description="Connect Google Ads or Meta Ads Manager to see campaign performance and AI-powered recommendations."
      />
    </>
  );
}
