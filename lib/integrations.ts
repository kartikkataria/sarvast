export type IntegrationCategory = "Search" | "Social" | "Ads" | "Analytics" | "Feedback";

export type Integration = {
  provider: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  agent: string;
  color: string;
  initials: string;
  oauthPath: string | null; // null = coming soon
};

export const INTEGRATIONS: Integration[] = [
  // Search
  {
    provider: "google_search_console",
    name: "Google Search Console",
    description: "Track keyword rankings, search impressions, and click-through rates.",
    category: "Search",
    agent: "Guru",
    color: "bg-blue-500",
    initials: "GSC",
    oauthPath: "/api/connections/google_search_console/auth",
  },
  // Analytics
  {
    provider: "google_analytics",
    name: "Google Analytics 4",
    description: "Website traffic, conversions, and audience insights.",
    category: "Analytics",
    agent: "Chitra",
    color: "bg-orange-500",
    initials: "GA4",
    oauthPath: "/api/connections/google_analytics/auth",
  },
  // Ads
  {
    provider: "google_ads",
    name: "Google Ads",
    description: "Search and display campaign performance and spend data.",
    category: "Ads",
    agent: "Karma",
    color: "bg-green-600",
    initials: "GAd",
    oauthPath: "/api/connections/google_ads/auth",
  },
  {
    provider: "meta_ads",
    name: "Meta Ads Manager",
    description: "Facebook and Instagram paid campaign performance.",
    category: "Ads",
    agent: "Karma",
    color: "bg-blue-700",
    initials: "Meta",
    oauthPath: null,
  },
  // Social
  {
    provider: "instagram",
    name: "Instagram",
    description: "Post reach, engagement, and follower growth.",
    category: "Social",
    agent: "Narad",
    color: "bg-pink-600",
    initials: "IG",
    oauthPath: "/api/connections/instagram/auth",
  },
  {
    provider: "linkedin",
    name: "LinkedIn",
    description: "Page analytics, post performance, and audience data.",
    category: "Social",
    agent: "Narad",
    color: "bg-blue-600",
    initials: "Li",
    oauthPath: null,
  },
  {
    provider: "x_twitter",
    name: "X (Twitter)",
    description: "Tweet performance, impressions, and follower metrics.",
    category: "Social",
    agent: "Narad",
    color: "bg-neutral-800",
    initials: "X",
    oauthPath: null,
  },
  // Feedback
  {
    provider: "google_business",
    name: "Google Business Profile",
    description: "Reviews, ratings, and local search visibility.",
    category: "Feedback",
    agent: "Mitra",
    color: "bg-yellow-500",
    initials: "GBP",
    oauthPath: "/api/connections/google_business/auth",
  },
];

export const CATEGORIES: IntegrationCategory[] = [
  "Search",
  "Analytics",
  "Ads",
  "Social",
  "Feedback",
];

export function getIntegrationsByCategory(category: IntegrationCategory) {
  return INTEGRATIONS.filter((i) => i.category === category);
}
