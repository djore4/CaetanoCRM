import type { NextConfig } from "next";

// Site 100% estático (GitHub Pages). O basePath vem do nome do repositório (ex.: /homi).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const config: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  ...(basePath ? { basePath } : {}),
};

export default config;
