import Link from "next/link";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type Metric = {
  label: string;
  value: string;
  trend?: number | null; // % change, null = no comparison
  inverseGood?: boolean; // lower = better (e.g. position)
};

type Props = {
  title: string;
  agent: string;
  initials: string;
  color: string;
  href: string;
  connected: boolean;
  connectHref?: string;
  metrics?: Metric[];
  error?: boolean;
};

function TrendBadge({ trend, inverseGood }: { trend: number; inverseGood?: boolean }) {
  const good = inverseGood ? trend < 0 : trend > 0;
  const neutral = Math.abs(trend) < 0.5;
  if (neutral) return <Minus className="h-3 w-3 text-muted-foreground" />;
  return good
    ? <TrendingUp className="h-3 w-3 text-green-600" />
    : <TrendingDown className="h-3 w-3 text-red-500" />;
}

export function ChannelCard({ title, agent, initials, color, href, connected, connectHref, metrics, error }: Props) {
  if (!connected) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-border bg-card/40 p-5">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white/70", color)}>
            {initials}
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <span className="text-[10px] text-muted-foreground/50">Not connected</span>
          </div>
        </div>
        {connectHref && (
          <Link href={connectHref} className="text-xs font-medium text-primary hover:underline">
            Connect to unlock data →
          </Link>
        )}
      </div>
    );
  }

  return (
    <Link href={href} className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-orange-200 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white", color)}>
            {initials}
          </div>
          <div>
            <p className="text-sm font-medium">{title}</p>
            <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-700 capitalize">{agent}</span>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-xs text-muted-foreground">Data unavailable — check API access.</p>
      )}

      {metrics && metrics.length > 0 && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {metrics.map((m) => (
            <div key={m.label}>
              <div className="flex items-center gap-1">
                <span className="text-xl font-semibold tabular-nums">{m.value}</span>
                {m.trend != null && <TrendBadge trend={m.trend} inverseGood={m.inverseGood} />}
              </div>
              <p className="text-xs text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>
      )}

      {!metrics && !error && (
        <p className="text-xs text-muted-foreground">Connected · no data available yet.</p>
      )}
    </Link>
  );
}
