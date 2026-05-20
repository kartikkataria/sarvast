import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Share2 } from "lucide-react";

export default function SocialPage() {
  return (
    <>
      <PageHeader
        title="Social"
        description="Manage and schedule social media content across platforms"
        agent="Narad"
      />
      <EmptyState
        icon={Share2}
        title="No social accounts connected"
        description="Connect Instagram, LinkedIn, X, or Facebook to manage your social presence."
      />
    </>
  );
}
