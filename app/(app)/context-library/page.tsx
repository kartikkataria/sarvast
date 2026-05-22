import { PageHeader } from "@/components/shared/page-header";
import { ContextLibrary } from "@/components/vyas/context-library";

export default function ContextLibraryPage() {
  return (
    <>
      <PageHeader
        title="Context Library"
        description="Upload brand documents, tone guidelines, and campaign briefs. Your library is private and used by Agni when creating briefs."
        agent="Vyas"
      />
      <ContextLibrary />
    </>
  );
}
