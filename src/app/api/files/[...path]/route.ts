import path from "node:path";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/** Redireciona para um link temporário (60 s) da fatura. Só funciona com sessão válida (RLS). */
export async function GET(_: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await ctx.params;
  const s = await supabaseServer();
  const { data } = await s.storage.from("casa-invoices").createSignedUrl(path.basename(parts.join("/")), 60);
  if (!data?.signedUrl) return new NextResponse("Not found", { status: 404 });
  return NextResponse.redirect(data.signedUrl);
}
