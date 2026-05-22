"use client";

import { useState } from "react";
import { FileText, Trash2, Loader2, FileType, FileImage, FileVideo, FileSpreadsheet, FileArchive } from "lucide-react";

type Doc = {
  id: string;
  name: string;
  description: string | null;
  file_type: string;
  file_size: number;
  tags: string[];
  created_at: string;
};

function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ type, name }: { type: string; name: string }) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (type.startsWith("image/")) return <FileImage className="h-5 w-5 shrink-0 text-purple-500" />;
  if (type.startsWith("video/")) return <FileVideo className="h-5 w-5 shrink-0 text-pink-500" />;
  if (type.includes("pdf")) return <FileText className="h-5 w-5 shrink-0 text-red-500" />;
  if (type.includes("word") || ext === "docx" || ext === "doc") return <FileText className="h-5 w-5 shrink-0 text-blue-500" />;
  if (type.includes("sheet") || ext === "xlsx" || ext === "xls" || ext === "csv") return <FileSpreadsheet className="h-5 w-5 shrink-0 text-green-600" />;
  if (type.includes("zip") || type.includes("archive") || ext === "zip" || ext === "rar") return <FileArchive className="h-5 w-5 shrink-0 text-yellow-600" />;
  return <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />;
}

export function DocumentList({ docs, onDeleted }: { docs: Doc[]; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await fetch("/api/vyas/documents", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setDeleting(null);
    onDeleted();
  };

  if (docs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-12 text-center">
        <FileType className="h-8 w-8 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">No documents yet. Upload your first one above.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="divide-y divide-border">
        {docs.map((doc) => (
          <div key={doc.id} className="flex items-start gap-4 px-5 py-4">
            <FileIcon type={doc.file_type} name={doc.name} />
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium" title={doc.name}>{doc.name}</p>
              {doc.description && (
                <p className="mt-0.5 text-xs text-muted-foreground">{doc.description}</p>
              )}
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-muted-foreground">{fileSize(doc.file_size)}</span>
                <span className="text-muted-foreground/30">·</span>
                <span className="text-[11px] text-muted-foreground">
                  {new Date(doc.created_at).toLocaleDateString()}
                </span>
                {doc.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-700">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => handleDelete(doc.id)}
              disabled={deleting === doc.id}
              className="shrink-0 text-muted-foreground/40 transition-colors hover:text-destructive"
            >
              {deleting === doc.id
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Trash2 className="h-4 w-4" />
              }
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
