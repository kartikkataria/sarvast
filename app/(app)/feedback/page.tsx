import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Star } from "lucide-react";

export default function FeedbackPage() {
  return (
    <>
      <PageHeader
        title="Feedback"
        description="Track reviews, ratings, and customer sentiment"
        agent="Mitra"
      />
      <EmptyState
        icon={Star}
        title="No review sources connected"
        description="Connect Google Business Profile, Trustpilot, or G2 to monitor your reputation."
      />
    </>
  );
}
