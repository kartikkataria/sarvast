import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Library } from "lucide-react";

export default function ContextLibraryPage() {
  return (
    <>
      <PageHeader
        title="Context Library"
        description="Your private knowledge base for brand voice, tone, and guidelines"
        agent="Vyas"
      />
      <EmptyState
        icon={Library}
        title="Library is empty"
        description="Upload brand documents, tone guidelines, or past campaigns. All context is private to your account."
      />
    </>
  );
}
