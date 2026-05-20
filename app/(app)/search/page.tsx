import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Search } from "lucide-react";

export default function SearchPage() {
  return (
    <>
      <PageHeader
        title="Search"
        description="SEO analysis, keyword research, and search visibility"
        agent="Guru"
      />
      <EmptyState
        icon={Search}
        title="No search data"
        description="Connect Google Search Console or SEMrush to start tracking your search performance."
      />
    </>
  );
}
