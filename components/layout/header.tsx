"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

function Avatar({ email }: { email: string }) {
  const initial = email.charAt(0).toUpperCase();
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
      {initial}
    </div>
  );
}

export function Header() {
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth/signin";
  };

  if (!user) return <div className="h-12 border-b border-border" />;

  return (
    <header className="flex h-12 items-center justify-end gap-3 border-b border-border bg-background/80 px-5 backdrop-blur-sm">
      <div className="flex items-center gap-2.5">
        <Avatar email={user.email ?? "?"} />
        <span className="text-sm text-muted-foreground">{user.email}</span>
      </div>
      <div className="h-4 w-px bg-border" />
      <button
        onClick={handleSignOut}
        className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <LogOut className="h-3.5 w-3.5" />
        Sign out
      </button>
    </header>
  );
}
