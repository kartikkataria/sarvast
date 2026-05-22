"use client";

import { useEffect, useState, useCallback } from "react";
import { UploadZone } from "./upload-zone";
import { DocumentList } from "./document-list";

type Doc = {
  id: string;
  name: string;
  description: string | null;
  file_type: string;
  file_size: number;
  tags: string[];
  created_at: string;
};

export function ContextLibrary() {
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
      <UploadZone onUploaded={fetchDocs} />
      {!loading && <DocumentList docs={docs} onDeleted={fetchDocs} />}
    </div>
  );
}
