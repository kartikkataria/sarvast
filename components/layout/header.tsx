"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { User, LogOut, LogIn } from "lucide-react";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="flex h-16 items-center justify-end gap-3 border-b border-border bg-card px-6">
      {session ? (
        <>
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            {session.user?.email}
          </span>
          <Button variant="outline" size="sm" onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </>
      ) : (
        <Button size="sm" onClick={() => signIn("google")}>
          <LogIn className="mr-2 h-4 w-4" />
          Sign in with Google
        </Button>
      )}
    </header>
  );
}
