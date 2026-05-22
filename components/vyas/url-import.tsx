"use client";

import { useState } from "react";
import { Globe, Loader2, FileText, Image, FileType, Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExtractedAsset } from "@/app/api/vyas/extract-url/route";

type Props = { onImported: () => void };

type GroupedAssets = {
  "page-text": ExtractedAsset[];
  image: ExtractedAsset[];
  document: ExtractedAsset[];
};

function AssetIcon({ type }: { type: ExtractedAsset["type"] }) {
  if (type === "page-text") return <FileText className="h-4 w-4 text-blue-500" />;
  if (type === "image") return <Image className="h-4 w-4 text-purple-500" />;
  return <FileType className="h-4 w-4 text-red-500" />;
}

export function UrlImport({ onImported }: Props) {
  const [url, setUrl] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [assets, setAssets] = useState<ExtractedAsset[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState("");

  const handleExtract = async () => {
    setError(null);
    setAssets(null);
    setSelected(new Set());
    setExtracting(true);

    // Auto-add https:// if missing
    const normalised = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    if (normalised !== url) setUrl(normalised);

    try {
      const res = await fetch("/api/vyas/extract-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalised }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setAssets(data.assets);
      setPageTitle(data.title);
      // Pre-select page text and documents by default
      const defaultSelected = new Set<string>(
        data.assets.filter((a: ExtractedAsset) => a.type !== "image").map((a: ExtractedAsset) => a.id)
      );
      setSelected(defaultSelected);
    } catch {
      setError("Failed to extract. Check the URL and try again.");
    } finally {
      setExtracting(false);
    }
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleImport = async () => {
    if (!assets) return;
    const toImport = assets.filter((a) => selected.has(a.id));
    if (!toImport.length) return;
    setImporting(true);
    const res = await fetch("/api/vyas/import-assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assets: toImport, pageUrl: url }),
    });
    const data = await res.json();
    setImporting(false);
    if (data.imported?.length) {
      setAssets(null);
      setUrl("");
      onImported();
    }
    if (data.errors?.length) setError(data.errors.join(", "));
  };

  const grouped: GroupedAssets = {
    "page-text": assets?.filter((a) => a.type === "page-text") ?? [],
    image: assets?.filter((a) => a.type === "image") ?? [],
    document: assets?.filter((a) => a.type === "document") ?? [],
  };

  const SECTIONS: { key: keyof GroupedAssets; label: string }[] = [
    { key: "page-text", label: "Page content" },
    { key: "document", label: "Documents" },
    { key: "image", label: "Images" },
  ];

  return (
    <div className="space-y-4">
      {/* URL input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && url && handleExtract()}
            placeholder="https://example.com/brand-page"
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-4 text-sm outline-none focus:border-primary/50"
          />
        </div>
        <button
          onClick={handleExtract}
          disabled={!url || extracting}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {extracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          {extracting ? "Extracting…" : "Extract"}
        </button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {/* Asset preview */}
      {assets && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-5 py-3">
            <p className="text-sm font-medium">{pageTitle}</p>
            <p className="text-xs text-muted-foreground">{assets.length} assets found · select what to import</p>
          </div>

          <div className="divide-y divide-border">
            {SECTIONS.map(({ key, label }) => {
              const items = grouped[key];
              if (!items.length) return null;
              return (
                <div key={key} className="px-5 py-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {label} ({items.length})
                  </p>
                  <div className="space-y-2">
                    {items.map((asset) => (
                      <label key={asset.id} className="flex cursor-pointer items-start gap-3">
                        <div className={cn(
                          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                          selected.has(asset.id) ? "border-primary bg-primary" : "border-border"
                        )}>
                          {selected.has(asset.id) && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                        </div>
                        <input type="checkbox" className="sr-only" checked={selected.has(asset.id)} onChange={() => toggle(asset.id)} />

                        {asset.type === "image" && asset.preview ? (
                          <img src={asset.preview} alt={asset.name} className="h-10 w-10 rounded object-cover shrink-0" onError={(e) => (e.currentTarget.style.display = "none")} />
                        ) : (
                          <AssetIcon type={asset.type} />
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{asset.name}</p>
                          {asset.preview && asset.type !== "image" && (
                            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{asset.preview}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-border px-5 py-3">
            <button
              onClick={handleImport}
              disabled={selected.size === 0 || importing}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {importing ? "Importing…" : `Import ${selected.size} asset${selected.size !== 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
