"use server";

import path from "node:path";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { extractInvoice } from "@/lib/extract";
import { CATEGORY_KEYS } from "@/lib/categories";
import { supabaseServer } from "@/lib/supabase/server";
import { other } from "@/lib/users";
import type { Category, UserId } from "@/lib/types";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const refresh = () => revalidatePath("/", "layout");

/* ---------- sessão ---------- */
export async function signIn(form: FormData) {
  const s = await supabaseServer();
  const { error } = await s.auth.signInWithPassword({
    email: str(form, "email"),
    password: str(form, "password"),
  });
  if (error) redirect("/login?erro=1");
  redirect("/");
}

export async function signOut() {
  const s = await supabaseServer();
  await s.auth.signOut();
  redirect("/login");
}

/* ---------- despesas ---------- */
const MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

/** O ficheiro já foi carregado pelo browser para o Storage; aqui só o lemos e analisamos. */
export async function analyzeInvoice(filePath: string) {
  const safe = path.basename(filePath);
  const mime = MIME[path.extname(safe).toLowerCase()];
  if (!mime) redirect("/despesas/nova?erro=formato");

  const s = await supabaseServer();
  const { data, error } = await s.storage.from("invoices").download(safe);
  if (error || !data) redirect("/despesas/nova?erro=ficheiro");

  const q = new URLSearchParams({ file: safe });
  try {
    const r = await extractInvoice(Buffer.from(await data.arrayBuffer()), mime);
    if (r) {
      q.set("description", r.description);
      q.set("category", r.category);
      q.set("amount", String(r.amount));
      q.set("date", r.date);
      q.set("ia", "1");
    } else {
      q.set("erro", process.env.ANTHROPIC_API_KEY ? "ilegivel" : "sem-ia");
    }
  } catch (err) {
    console.error("extractInvoice", err);
    q.set("erro", "ia-falhou");
  }
  redirect(`/despesas/nova?${q}`);
}

export async function saveExpense(form: FormData) {
  const id = str(form, "id");
  const amount = Number(str(form, "amount").replace(",", "."));
  const category = str(form, "category") as Category;
  const back = id ? `/despesas/${id}/editar` : "/despesas/nova";
  if (!str(form, "description") || !(amount > 0)) redirect(`${back}?erro=campos`);

  const data = {
    description: str(form, "description"),
    category: CATEGORY_KEYS.includes(category) ? category : ("outros" as Category),
    amount,
    date: str(form, "date") || new Date().toISOString().slice(0, 10),
    paidBy: (str(form, "paidBy") === "b" ? "b" : "a") as UserId,
    splitPct: Math.min(100, Math.max(0, Number(str(form, "splitPct") || 50))),
  };

  if (id) await db.updateExpense(id, data);
  else
    await db.addExpense({
      ...data,
      file: str(form, "file") || undefined,
      source: str(form, "ia") ? "ia" : "manual",
    });
  refresh();
  redirect("/despesas");
}

export async function deleteExpense(id: string) {
  await db.removeExpense(id);
  refresh();
}

export async function settleUp(form: FormData) {
  const amount = Number(str(form, "amount").replace(",", "."));
  if (!(amount > 0)) return;
  // "from" = quem tem a dívida e entrega o dinheiro ao outro
  const from: UserId = str(form, "from") === "b" ? "b" : "a";
  await db.addSettlement({ from, to: other(from), amount });
  refresh();
}

/* ---------- listas ---------- */
export async function createList(form: FormData) {
  const name = str(form, "name");
  if (!name) return;
  const id = await db.addList(name, str(form, "emoji") || "📝");
  revalidatePath("/listas");
  redirect(`/listas/${id}`);
}
export async function renameList(id: string, form: FormData) {
  const name = str(form, "name");
  if (name) await db.updateList(id, { name, emoji: str(form, "emoji") || "📝" });
  revalidatePath("/listas", "layout");
}
export async function deleteList(id: string) {
  await db.removeList(id);
  revalidatePath("/listas", "layout");
  redirect("/listas");
}
export async function addItem(listId: string, form: FormData) {
  // permite colar várias linhas de uma vez
  const lines = str(form, "text").split("\n").map((s) => s.trim()).filter(Boolean);
  if (lines.length) await db.addItems(listId, lines);
  revalidatePath("/listas", "layout");
}
export async function toggleItem(itemId: string, done: boolean) {
  await db.updateItem(itemId, { done });
  revalidatePath("/listas", "layout");
}
export async function editItem(itemId: string, form: FormData) {
  const text = str(form, "text");
  if (text) await db.updateItem(itemId, { text });
  revalidatePath("/listas", "layout");
}
export async function deleteItem(itemId: string) {
  await db.removeItem(itemId);
  revalidatePath("/listas", "layout");
}
export async function clearDone(listId: string) {
  await db.clearDone(listId);
  revalidatePath("/listas", "layout");
}
