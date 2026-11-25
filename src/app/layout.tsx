import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { db } from "@/lib/db";
import { signOut } from "./actions";

export const metadata: Metadata = { title: "Casa", description: "Despesas e listas partilhadas" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#4f6bed" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const me = await db.me(); // null no ecrã de login
  return (
    <html lang="pt-PT">
      <body>
        {me ? (
          <>
            <Nav />
            <div className="md:pl-56">
              <header className="flex items-center justify-between px-4 md:px-8 pt-4">
                <span className="md:hidden font-bold text-lg">🏡 Casa</span>
                <span className="hidden md:block text-sm text-muted">Olá, {me.name}</span>
                <form action={signOut}>
                  <button className="text-sm text-muted font-semibold">Sair</button>
                </form>
              </header>
              <main className="mx-auto max-w-5xl px-4 md:px-8 py-5 pb-28 md:pb-10">{children}</main>
            </div>
          </>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
