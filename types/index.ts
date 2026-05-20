export type NavItem = {
  label: string;
  href: string;
  agent?: string;
  description?: string;
};

export type Agent =
  | "agni"
  | "guru"
  | "narad"
  | "karma"
  | "mitra"
  | "vani"
  | "chitra"
  | "vyas"
  | "para";

export type Integration = {
  id: string;
  name: string;
  type: string;
  connected: boolean;
  connectedAt?: string;
};
