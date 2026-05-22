// Chitra — Analytics & Dashboard agent
// Aggregates key metrics from all connected integrations

export type DashboardMetric = {
  label: string;
  value: string | null;
  sub?: string;
  source: string;
  href: string;
  connected: boolean;
};
