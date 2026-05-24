"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Globe, Loader2, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type ImportStatus = { url: string; status: "pending" | "done" | "error" };

export default function SettingsPage() {
  const [website, setWebsite] = useState("");
  const [marketplaceLinks, setMarketplaceLinks] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [importing, setImporting] = useState<ImportStatus[]>([]);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        setWebsite(d.website ?? "");
        setMarketplaceLinks((d.marketplace_links ?? []).join(", "));
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    const links = marketplaceLinks
      .split(",")
      .map((l) => l.trim())
      .filter(Boolean);

    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ website: website || null, marketplace_links: links }),
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);

    // Auto-import all sources into Context Library
    const sources = [website, ...links].filter(Boolean);
    if (!sources.length) return;

    const statuses: ImportStatus[] = sources.map((url) => ({ url, status: "pending" }));
    setImporting(statuses);

    for (let i = 0; i < sources.length; i++) {
      try {
        // Extract
        const extractRes = await fetch("/api/vyas/extract-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: sources[i] }),
        });
        const extracted = await extractRes.json();
        if (!extractRes.ok || !extracted.assets?.length) throw new Error("No assets");

        // Import page text only (non-images)
        const toImport = extracted.assets.filter(
          (a: { type: string }) => a.type === "page-text" || a.type === "document"
        );
        if (toImport.length) {
          await fetch("/api/vyas/import-assets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assets: toImport, pageUrl: sources[i] }),
          });
        }

        setImporting((prev) =>
          prev.map((s, idx) => (idx === i ? { ...s, status: "done" } : s))
        );
      } catch {
        setImporting((prev) =>
          prev.map((s, idx) => (idx === i ? { ...s, status: "error" } : s))
        );
      }
    }
  };

  return (
    <>
      <PageHeader title="Settings" description="Configure your workspace" />

      <div className="max-w-lg space-y-8">
        {/* Digital presence */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <div className="mb-5">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Digital Presence</h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Agni uses these sources to understand your brand. Content is automatically imported into your Context Library.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">Website</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yourwebsite.com"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary/50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">Marketplace Links</label>
              <textarea
                value={marketplaceLinks}
                onChange={(e) => setMarketplaceLinks(e.target.value)}
                placeholder="https://amazon.in/store/..., https://flipkart.com/..."
                rows={3}
                className="w-full resize-none rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary/50"
              />
              <p className="mt-1 text-xs text-muted-foreground">Comma-separated links to your marketplace stores</p>
            </div>

            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving…</>
              ) : saved ? (
                <><Check className="h-3.5 w-3.5" />Saved</>
              ) : (
                "Save & import"
              )}
            </Button>
          </div>
        </div>

        {/* Import status */}
        {importing.length > 0 && (
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Importing into Context Library
            </p>
            <div className="space-y-2">
              {importing.map((s) => (
                <div key={s.url} className="flex items-center gap-3 text-sm">
                  {s.status === "pending" && <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />}
                  {s.status === "done" && <Check className="h-3.5 w-3.5 text-green-600" />}
                  {s.status === "error" && <span className="h-3.5 w-3.5 text-red-500">✕</span>}
                  <span className="truncate text-muted-foreground">{s.url}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
