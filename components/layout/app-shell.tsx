"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";

const FULL_HEIGHT_PAGES = ["/chat", "/dashboard"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullHeight = FULL_HEIGHT_PAGES.some((p) => pathname.startsWith(p));

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main
        className={
          isFullHeight
            ? "flex flex-1 flex-col overflow-hidden"
            : "flex-1 overflow-y-auto p-6"
        }
      >
        {children}
      </main>
    </div>
  );
}
