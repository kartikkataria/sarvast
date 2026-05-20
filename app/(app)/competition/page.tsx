import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Swords } from "lucide-react";

export default function CompetitionPage() {
  return (
    <>
      <PageHeader
        title="Competition"
        description="Monitor competitors and track market positioning"
        agent="Para"
      />
      <EmptyState
        icon={Swords}
        title="No competitors tracked"
        description="Add competitor domains to start tracking their SEO, ads, and social activity."
      />
    </>
  );
}
