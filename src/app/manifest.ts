import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const BP = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: `${BP}/`,
    name: "Casa · despesas e listas",
    short_name: "Casa",
    description: "Despesas, conta corrente e listas partilhadas.",
    lang: "pt-PT",
    start_url: `${BP}/`,
    scope: `${BP}/`,
    display: "standalone",
    orientation: "portrait",
    background_color: "#f4f5f9",
    theme_color: "#5b6cf0",
    icons: [
      { src: `${BP}/icons/icon-192.png`, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: `${BP}/icons/icon-512.png`, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: `${BP}/icons/maskable-512.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Nova despesa", url: `${BP}/despesas/nova/`, icons: [{ src: `${BP}/icons/icon-192.png`, sizes: "192x192" }] },
      { name: "Listas", url: `${BP}/listas/`, icons: [{ src: `${BP}/icons/icon-192.png`, sizes: "192x192" }] },
    ],
  };
}
