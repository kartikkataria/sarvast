import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { LayoutDashboard } from "lucide-react";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Your unified marketing overview"
        agent="Chitra"
      />
      <EmptyState
        icon={LayoutDashboard}
        title="No data yet"
        description="Connect your integrations to see analytics, performance metrics, and AI-generated insights here."
      />
    </>
  );
}
