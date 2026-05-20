import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { CalendarDays } from "lucide-react";

export default function CalendarPage() {
  return (
    <>
      <PageHeader
        title="Calendar"
        description="Content calendar and publishing schedule"
        agent="Vani"
      />
      <EmptyState
        icon={CalendarDays}
        title="No content scheduled"
        description="Create your first content brief with Agni to start populating your content calendar."
      />
    </>
  );
}
