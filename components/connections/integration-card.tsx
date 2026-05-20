"use client";

import { useState } from "react";
import { CheckCircle, Loader2, Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Integration } from "@/lib/integrations";

type ConnectedInfo = {
  provider_account_id: string | null;
  connected_at: string;
};

type Props = {
  integration: Integration;
  connected: ConnectedInfo | null;
  onDisconnect: (provider: string) => Promise<void>;
};

export function IntegrationCard({ integration, connected, onDisconnect }: Props) {
  const [disconnecting, setDisconnecting] = useState(false);

  const handleDisconnect = async () => {
    setDisconnecting(true);
    await onDisconnect(integration.provider);
    setDisconnecting(false);
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-lg border bg-card p-5 transition-colors",
        connected ? "border-green-200 bg-green-50/30" : "border-border"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white",
            integration.color
          )}
        >
          {integration.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{integration.name}</p>
            {connected && (
              <CheckCircle className="h-3.5 w-3.5 shrink-0 text-green-600" />
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
            {integration.description}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
          {integration.agent}
        </span>

        {connected ? (
          <div className="flex items-center gap-2">
            {connected.provider_account_id && (
              <span className="max-w-[120px] truncate text-xs text-muted-foreground">
                {connected.provider_account_id}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="h-7 text-xs text-destructive hover:text-destructive"
            >
              {disconnecting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Unplug className="mr-1 h-3 w-3" />
              )}
              Disconnect
            </Button>
          </div>
        ) : integration.oauthPath ? (
          <Button size="sm" className="h-7 text-xs" asChild>
            <a href={integration.oauthPath}>Connect</a>
          </Button>
        ) : (
          <Button size="sm" variant="outline" className="h-7 text-xs" disabled>
            Coming soon
          </Button>
        )}
      </div>
    </div>
  );
}
