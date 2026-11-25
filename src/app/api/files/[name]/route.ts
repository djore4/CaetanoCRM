import fs from "node:fs";
import path from "node:path";
import { UPLOADS } from "@/lib/db";

const TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

export async function GET(_: Request, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  const safe = path.basename(name); // impede path traversal
  const file = path.join(UPLOADS, safe);
  if (!fs.existsSync(file)) return new Response("Not found", { status: 404 });
  return new Response(fs.readFileSync(file), {
    headers: { "Content-Type": TYPES[path.extname(safe).toLowerCase()] ?? "application/octet-stream" },
  });
}
