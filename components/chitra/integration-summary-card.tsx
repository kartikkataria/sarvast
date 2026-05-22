import Link from "next/link";
import { ArrowRight, Plug } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  agent: string;
  connected: boolean;
  href: string;
  connectHref: string;
  color: string;
  initials: string;
  metrics?: { label: string; value: string }[];
};

export function IntegrationSummaryCard({
  title,
  agent,
  connected,
  href,
  connectHref,
  color,
  initials,
  metrics,
}: Props) {
  if (!connected) {
    return (
      <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-border bg-card/40 p-5">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white opacity-40", color)}>
            {initials}
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-xs text-muted-foreground/60">Not connected</p>
          </div>
        </div>
        <Link
          href={connectHref}
          className="flex items-center gap-1.5 text-xs text-muted-foreground/60 transition-colors hover:text-primary"
        >
          <Plug className="h-3 w-3" />
          Connect in integrations
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white", color)}>
            {initials}
          </div>
          <div>
            <p className="text-sm font-medium">{title}</p>
            <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-700">
              {agent}
            </span>
          </div>
        </div>
        <Link href={href} className="text-muted-foreground transition-colors hover:text-foreground">
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {metrics && metrics.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((m) => (
            <div key={m.label}>
              <p className="text-lg font-semibold tabular-nums">{m.value}</p>
              <p className="text-xs text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
