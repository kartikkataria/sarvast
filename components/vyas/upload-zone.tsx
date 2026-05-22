"use client";

import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { onUploaded: () => void };

export function UploadZone({ onUploaded }: Props) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/vyas/upload", { method: "POST", body: form });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Upload failed");
    } else {
      onUploaded();
    }
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  };

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragging ? "border-primary bg-orange-50" : "border-border hover:border-primary/40 hover:bg-muted/40"
        )}
      >
        {uploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        ) : (
          <Upload className="h-8 w-8 text-muted-foreground/40" />
        )}
        <div>
          <p className="text-sm font-medium">
            {uploading ? "Uploading…" : "Drop a file or click to browse"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">PDF, TXT, MD, DOCX · max 10MB</p>
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.txt,.md,.docx,.doc"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }}
      />
    </div>
  );
}
