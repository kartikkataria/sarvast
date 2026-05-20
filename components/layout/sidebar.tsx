"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Search,
  Share2,
  Megaphone,
  Star,
  Swords,
  CalendarDays,
  Library,
  Plug,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Briefing", href: "/chat", icon: MessageSquare, agent: "Agni" },
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, agent: "Chitra" },
  { label: "Search", href: "/search", icon: Search, agent: "Guru" },
  { label: "Social", href: "/social", icon: Share2, agent: "Narad" },
  { label: "Ads", href: "/ads", icon: Megaphone, agent: "Karma" },
  { label: "Feedback", href: "/feedback", icon: Star, agent: "Mitra" },
  { label: "Competition", href: "/competition", icon: Swords, agent: "Para" },
  { label: "Calendar", href: "/calendar", icon: CalendarDays, agent: "Vani" },
  { label: "Context Library", href: "/context-library", icon: Library, agent: "Vyas" },
  { label: "Connections", href: "/connections", icon: Plug },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center gap-2 border-b border-border px-4">
        <Zap className="h-6 w-6 text-primary" />
        <span className="text-lg font-semibold tracking-tight">Sarvast</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.agent && (
                <span
                  className={cn(
                    "text-[10px] font-normal opacity-60",
                    active ? "text-primary-foreground" : "text-muted-foreground"
                  )}
                >
                  {item.agent}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
