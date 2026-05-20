"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { IntegrationCard } from "./integration-card";
import { CATEGORIES, getIntegrationsByCategory } from "@/lib/integrations";
import type { Integration } from "@/lib/integrations";

type ConnectedInfo = {
  provider_account_id: string | null;
  connected_at: string;
};

type Props = {
  integrations: Integration[];
  connectedMap: Record<string, ConnectedInfo>;
};

export function ConnectionsList({ integrations, connectedMap }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");
    if (connected || error) {
      router.replace("/connections");
      router.refresh();
    }
  }, [searchParams, router]);

  const handleDisconnect = async (provider: string) => {
    await fetch("/api/connections", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider }),
    });
    router.refresh();
  };

  return (
    <div className="space-y-8">
      {CATEGORIES.map((category) => {
        const items = getIntegrationsByCategory(category);
        return (
          <section key={category}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {category}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((integration) => (
                <IntegrationCard
                  key={integration.provider}
                  integration={integration}
                  connected={connectedMap[integration.provider] ?? null}
                  onDisconnect={handleDisconnect}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
