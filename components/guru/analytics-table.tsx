import type { AnalyticsRow } from "@/agents/guru/gsc";

function PositionBadge({ pos }: { pos: number }) {
  const color =
    pos <= 3
      ? "bg-green-100 text-green-700"
      : pos <= 10
      ? "bg-yellow-100 text-yellow-700"
      : "bg-muted text-muted-foreground";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {pos.toFixed(1)}
    </span>
  );
}

export function AnalyticsTable({
  rows,
  dimension,
}: {
  rows: AnalyticsRow[];
  dimension: "query" | "page";
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
        No data available for the selected period.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-muted/40">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              {dimension === "query" ? "Query" : "Page"}
            </th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Clicks</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Impressions</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">CTR</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Position</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-card">
          {rows.map((row, i) => (
            <tr key={i} className="transition-colors hover:bg-muted/30">
              <td className="max-w-xs truncate px-4 py-3 font-medium" title={row.key}>
                {dimension === "page" ? (
                  <a
                    href={row.key}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {row.key.replace(/^https?:\/\/[^/]+/, "") || "/"}
                  </a>
                ) : (
                  row.key
                )}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">{row.clicks.toLocaleString()}</td>
              <td className="px-4 py-3 text-right tabular-nums">{row.impressions.toLocaleString()}</td>
              <td className="px-4 py-3 text-right tabular-nums">{(row.ctr * 100).toFixed(1)}%</td>
              <td className="px-4 py-3 text-right">
                <PositionBadge pos={row.position} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
