"use client";

import { useState } from "react";
import { Plus, Trash2, RefreshCw, Loader2, Globe, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Analysis = {
  name?: string;
  positioning?: string;
  target_audience?: string;
  key_messages?: string[];
  value_props?: string[];
  strengths?: string[];
  opportunities?: string[];
  keywords?: string[];
  cta?: string;
  tone?: string;
  summary?: string;
};

type Competitor = {
  id: string;
  domain: string;
  name: string | null;
  analysis: Analysis | null;
  analyzed_at: string | null;
  created_at: string;
};

function AnalysisSection({ title, items, color }: { title: string; items: string[]; color: string }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${color}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AnalysisPanel({ competitor, onRefresh }: { competitor: Competitor; onRefresh: () => void }) {
  const [analyzing, setAnalyzing] = useState(false);
  const a = competitor.analysis;

  const runAnalysis = async () => {
    setAnalyzing(true);
    await fetch("/api/para/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: competitor.id, domain: competitor.domain }),
    });
    setAnalyzing(false);
    onRefresh();
  };

  if (!a && !analyzing) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <Globe className="h-10 w-10 text-muted-foreground/30" />
        <div>
          <p className="text-sm font-medium">No analysis yet for {competitor.domain}</p>
          <p className="mt-1 text-xs text-muted-foreground">Para will fetch their website and extract competitive insights using AI.</p>
        </div>
        <button
          onClick={runAnalysis}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
        >
          <RefreshCw className="h-4 w-4" />
          Analyse now
        </button>
      </div>
    );
  }

  if (analyzing) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Fetching {competitor.domain} and running AI analysis…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border px-6 py-4">
        <div>
          <h2 className="text-base font-semibold">{a?.name ?? competitor.domain}</h2>
          {a?.tone && <span className="text-xs text-muted-foreground">Tone: {a.tone}</span>}
        </div>
        <button
          onClick={runAnalysis}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* Summary */}
        {a?.summary && (
          <div className="rounded-xl bg-primary/5 px-4 py-3 text-sm text-foreground leading-relaxed border border-primary/10">
            {a.summary}
          </div>
        )}

        {/* Positioning */}
        {a?.positioning && (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Positioning</p>
            <p className="text-sm">{a.positioning}</p>
          </div>
        )}

        {/* Target */}
        {a?.target_audience && (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Target Audience</p>
            <p className="text-sm">{a.target_audience}</p>
          </div>
        )}

        {/* CTA */}
        {a?.cta && (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Primary CTA</p>
            <span className="inline-block rounded-lg border border-border bg-muted px-3 py-1 text-sm font-medium">{a.cta}</span>
          </div>
        )}

        <AnalysisSection title="Key Messages" items={a?.key_messages ?? []} color="bg-blue-400" />
        <AnalysisSection title="Value Propositions" items={a?.value_props ?? []} color="bg-primary" />
        <AnalysisSection title="Strengths" items={a?.strengths ?? []} color="bg-green-500" />
        <AnalysisSection title="Opportunities for You" items={a?.opportunities ?? []} color="bg-amber-400" />

        {/* Keywords */}
        {a?.keywords?.length ? (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Keywords & Themes</p>
            <div className="flex flex-wrap gap-1.5">
              {a.keywords.map((kw) => (
                <span key={kw} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{kw}</span>
              ))}
            </div>
          </div>
        ) : null}

        {competitor.analyzed_at && (
          <p className="text-[10px] text-muted-foreground/50">
            Last analysed {new Date(competitor.analyzed_at).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}

export function CompetitionDashboard({ initialCompetitors }: { initialCompetitors: Competitor[] }) {
  const [competitors, setCompetitors] = useState(initialCompetitors);
  const [selected, setSelected] = useState<Competitor | null>(initialCompetitors[0] ?? null);
  const [domain, setDomain] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const refresh = async () => {
    const res = await fetch("/api/para/competitors");
    const data = await res.json();
    setCompetitors(data);
    setSelected((prev) => data.find((c: Competitor) => c.id === prev?.id) ?? data[0] ?? null);
  };

  const addCompetitor = async () => {
    if (!domain.trim()) return;
    setAdding(true);
    setError("");
    const res = await fetch("/api/para/competitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: domain.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to add");
    } else {
      setDomain("");
      await refresh();
      setSelected(data);
    }
    setAdding(false);
  };

  const removeCompetitor = async (id: string) => {
    await fetch("/api/para/competitors", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await refresh();
  };

  return (
    <div className="flex gap-5 h-[calc(100vh-180px)]">
      {/* Left — list */}
      <div className="w-64 shrink-0 flex flex-col gap-3">
        {/* Add form */}
        <div className="rounded-2xl border border-border bg-white p-3 shadow-sm">
          <div className="flex gap-2">
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCompetitor()}
              placeholder="competitor.com"
              className="flex-1 min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
            />
            <button
              onClick={addCompetitor}
              disabled={!domain.trim() || adding}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white disabled:opacity-50"
            >
              {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-4 w-4" />}
            </button>
          </div>
          {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
        </div>

        {/* Competitor list */}
        <div className="flex-1 overflow-y-auto space-y-1">
          {competitors.length === 0 && (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">Add a competitor domain to get started</p>
          )}
          {competitors.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelected(c)}
              className={cn(
                "group flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-colors",
                selected?.id === c.id
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-white hover:border-primary/20 hover:bg-muted/40"
              )}
            >
              <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{c.name ?? c.domain}</p>
                {c.name && <p className="truncate text-[10px] text-muted-foreground">{c.domain}</p>}
                {c.analysis && (
                  <span className="text-[10px] text-green-600">Analysed</span>
                )}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); removeCompetitor(c.id); }}
                  className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right — analysis */}
      <div className="flex-1 overflow-hidden rounded-2xl border border-border bg-white shadow-sm flex flex-col">
        {selected ? (
          <AnalysisPanel key={selected.id} competitor={selected} onRefresh={refresh} />
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Add a competitor to start tracking
          </div>
        )}
      </div>
    </div>
  );
}
