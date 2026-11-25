import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = { title: "Casa", description: "Despesas e listas partilhadas" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#4f6bed" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-PT">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
