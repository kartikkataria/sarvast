"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  Share2,
  Megaphone,
  Star,
  Swords,
  CalendarDays,
  Library,
  Plug,
  MessageSquare,
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
  { label: "Connections", href: "/connections", icon: Plug, agent: undefined },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col bg-[#1C1917]">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-white/8 px-4">
        <div style={{ width: 140, height: 36, overflow: "hidden" }}>
          <img
            src="/logo.png"
            alt="Sarvast"
            style={{
              height: 220,
              width: "auto",
              marginTop: -82,
              mixBlendMode: "screen",
            }}
          />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-white/12 text-white"
                  : "text-white/45 hover:bg-white/6 hover:text-white/80"
              )}
            >
              <Icon
                className={cn("h-4 w-4 shrink-0", active ? "text-orange-400" : "")}
                strokeWidth={active ? 2 : 1.75}
              />
              <span className="flex-1 font-medium">{item.label}</span>
              {item.agent && (
                <span
                  className={cn(
                    "text-[10px] font-normal",
                    active ? "text-white/40" : "text-white/20"
                  )}
                >
                  {item.agent}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/8 px-4 py-3">
        <p className="text-[10px] text-white/20">Sarvast · AI Marketing</p>
      </div>
    </aside>
  );
}
