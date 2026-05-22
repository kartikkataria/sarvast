"use client";

import { useEffect, useState, useCallback } from "react";
import { Upload, Globe } from "lucide-react";
import { UploadZone } from "./upload-zone";
import { UrlImport } from "./url-import";
import { DocumentList } from "./document-list";
import { cn } from "@/lib/utils";

type Doc = {
  id: string;
  name: string;
  description: string | null;
  file_type: string;
  file_size: number;
  tags: string[];
  created_at: string;
};

const TABS = [
  { key: "upload", label: "Upload file", icon: Upload },
  { key: "url", label: "Import from URL", icon: Globe },
] as const;

type Tab = typeof TABS[number]["key"];

export function ContextLibrary() {
  const [tab, setTab] = useState<Tab>("upload");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocs = useCallback(async () => {
    const res = await fetch("/api/vyas/documents");
    const data = await res.json();
    setDocs(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-border bg-muted/40 p-1 w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              tab === key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {tab === "upload" && <UploadZone onUploaded={fetchDocs} />}
      {tab === "url" && <UrlImport onImported={fetchDocs} />}

      {!loading && (
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Library · {docs.length} {docs.length === 1 ? "document" : "documents"}
          </h2>
          <DocumentList docs={docs} onDeleted={fetchDocs} />
        </div>
      )}
    </div>
  );
}
