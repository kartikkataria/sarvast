"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import {
  LayoutDashboard, Search, Share2, Megaphone, Star, Swords,
  CalendarDays, Library, Plug, MessageSquare, Settings,
  LogOut, ChevronUp,
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

function AccountMenu({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initial = user.email?.charAt(0).toUpperCase() ?? "?";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const signOut = async () => {
    await createClient().auth.signOut();
    window.location.href = "/auth/signin";
  };

  return (
    <div ref={ref} className="relative">
      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1.5 overflow-hidden rounded-xl border border-border bg-white shadow-lg">
          <div className="border-b border-border px-4 py-3">
            <p className="text-xs font-medium text-foreground">{user.email}</p>
          </div>
          <div className="p-1">
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
            <div className="my-1 border-t border-border" />
            <button
              onClick={signOut}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors hover:bg-accent"
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
          {initial}
        </div>
        <span className="flex-1 truncate text-left text-sm font-medium text-foreground">{user.email}</span>
        <ChevronUp className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", !open && "rotate-180")} />
      </button>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  return (
    <aside
      className="flex h-screen w-56 shrink-0 flex-col border-r"
      style={{ backgroundColor: "hsl(var(--sidebar))", borderColor: "hsl(var(--sidebar-border))" }}
    >
      {/* Logo */}
      <div className="flex h-14 items-center border-b px-5" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
        <span className="font-logo text-xl leading-none tracking-tight text-foreground">
          sarvast<span className="text-primary">.</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                active ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:bg-white/60 hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0 transition-colors", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")}
                strokeWidth={active ? 2.25 : 1.75} />
              <span className="flex-1 font-medium">{item.label}</span>
              {item.agent && (
                <span className={cn("text-[10px]", active ? "text-muted-foreground" : "text-muted-foreground/50")}>{item.agent}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom — account drawer */}
      <div className="border-t px-2 py-2" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
        {user && <AccountMenu user={user} />}
      </div>
    </aside>
  );
}
