import type { Metadata } from "next";
import { DM_Sans, Nunito } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });
const nunito = Nunito({ weight: "900", subsets: ["latin"], variable: "--font-nunito" });

export const metadata: Metadata = {
  title: "Sarvast — AI Marketing Platform",
  description: "Multi-agent AI marketing platform for SMB and enterprise teams",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${dmSans.variable} ${nunito.variable}`}>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
