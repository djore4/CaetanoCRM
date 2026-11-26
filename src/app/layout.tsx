import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { THEME_SCRIPT } from "@/lib/theme";

const BP = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  title: "Homi",
  description: "Despesas, conta corrente e listas da casa, a dois.",
  applicationName: "Homi",
  appleWebApp: { capable: true, title: "Homi", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  other: { "apple-mobile-web-app-capable": "yes" },
  icons: {
    icon: [
      { url: `${BP}/icon.svg`, type: "image/svg+xml" },
      { url: `${BP}/icons/favicon-64.png`, type: "image/png", sizes: "64x64" },
    ],
    apple: [{ url: `${BP}/icons/apple-touch-icon.png`, sizes: "180x180" }],
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f4f5f9",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-PT" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
