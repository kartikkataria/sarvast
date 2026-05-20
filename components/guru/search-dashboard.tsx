"use client";

import { useState } from "react";
import { MetricsGrid } from "./metrics-grid";
import { AnalyticsTable } from "./analytics-table";
import type { AnalyticsRow, SearchMetrics, GSCSite } from "@/agents/guru/gsc";

type Props = {
  sites: GSCSite[];
  initialSiteUrl: string;
  initialRows: AnalyticsRow[];
  initialTotals: SearchMetrics;
  days: number;
};

const DAYS_OPTIONS = [
  { label: "7 days", value: 7 },
  { label: "28 days", value: 28 },
  { label: "90 days", value: 90 },
];

export function SearchDashboard({
  sites,
  initialSiteUrl,
  initialRows,
  initialTotals,
  days: initialDays,
}: Props) {
  const [siteUrl, setSiteUrl] = useState(initialSiteUrl);
  const [dimension, setDimension] = useState<"query" | "page">("query");
  const [days, setDays] = useState(initialDays);
  const [rows, setRows] = useState(initialRows);
  const [totals, setTotals] = useState(initialTotals);
  const [loading, setLoading] = useState(false);

  const fetchData = async (site: string, dim: "query" | "page", d: number) => {
    setLoading(true);
    const res = await fetch(
      `/api/agents/guru/analytics?siteUrl=${encodeURIComponent(site)}&dimension=${dim}&days=${d}`
    );
    const data = await res.json();
    if (!data.error) {
      setRows(data.rows);
      setTotals(data.totals);
    }
    setLoading(false);
  };

  const handleSiteChange = (site: string) => {
    setSiteUrl(site);
    fetchData(site, dimension, days);
  };

  const handleDimensionChange = (dim: "query" | "page") => {
    setDimension(dim);
    fetchData(siteUrl, dim, days);
  };

  const handleDaysChange = (d: number) => {
    setDays(d);
    fetchData(siteUrl, dimension, d);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {sites.length > 1 && (
          <select
            value={siteUrl}
            onChange={(e) => handleSiteChange(e.target.value)}
            className="rounded-md border border-border bg-card px-3 py-1.5 text-sm"
          >
            {sites.map((s) => (
              <option key={s.siteUrl} value={s.siteUrl}>
                {s.siteUrl}
              </option>
            ))}
          </select>
        )}
        {sites.length === 1 && (
          <span className="rounded-md border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground">
            {siteUrl}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {DAYS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleDaysChange(opt.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                days === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "border border-border hover:bg-accent"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <MetricsGrid totals={totals} days={days} />

      {/* Tabs */}
      <div>
        <div className="mb-4 flex gap-1 border-b border-border">
          {(["query", "page"] as const).map((dim) => (
            <button
              key={dim}
              onClick={() => handleDimensionChange(dim)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                dimension === dim
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {dim === "query" ? "Top Queries" : "Top Pages"}
            </button>
          ))}
        </div>
        <div className={loading ? "opacity-50 pointer-events-none" : ""}>
          <AnalyticsTable rows={rows} dimension={dimension} />
        </div>
      </div>
    </div>
  );
}
