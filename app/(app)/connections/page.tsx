import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Plug } from "lucide-react";

export default function ConnectionsPage() {
  return (
    <>
      <PageHeader
        title="Connections"
        description="Manage your integrated data sources and API connections"
      />
      <EmptyState
        icon={Plug}
        title="No connections yet"
        description="Connect your marketing tools — Google, Meta, LinkedIn, and more — to unlock the full platform."
      />
    </>
  );
}
