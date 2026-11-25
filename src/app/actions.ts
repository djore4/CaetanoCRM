"use server";

import fs from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, uid, UPLOADS } from "@/lib/db";
import { extractInvoice } from "@/lib/extract";
import { pushToSplitwise, splitwiseEnabled } from "@/lib/splitwise";
import { CATEGORY_KEYS } from "@/lib/categories";
import { other } from "@/lib/users";
import type { Category, UserId } from "@/lib/types";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

/* ---------- utilizador ---------- */
export async function switchUser(u: UserId) {
  (await cookies()).set("user", u, { maxAge: 60 * 60 * 24 * 365, path: "/" });
  revalidatePath("/", "layout");
}

/* ---------- despesas ---------- */
const MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

export async function analyzeInvoice(form: FormData) {
  const file = form.get("file") as File | null;
  if (!file || file.size === 0) redirect("/despesas/nova");

  const ext = path.extname(file.name).toLowerCase();
  const mime = MIME[ext];
  if (!mime) redirect("/despesas/nova?erro=formato");

  const buf = Buffer.from(await file.arrayBuffer());
  const stored = `${uid()}${ext}`;
  fs.mkdirSync(UPLOADS, { recursive: true });
  fs.writeFileSync(path.join(UPLOADS, stored), buf);

  const q = new URLSearchParams({ file: stored });
  try {
    const r = await extractInvoice(buf, mime);
    if (r) {
      q.set("description", r.description);
      q.set("category", r.category);
      q.set("amount", String(r.amount));
      q.set("date", r.date);
      q.set("ia", "1");
    } else if (!process.env.ANTHROPIC_API_KEY) {
      q.set("erro", "sem-ia");
    } else {
      q.set("erro", "ilegivel");
    }
  } catch (err) {
    console.error("extractInvoice", err);
    q.set("erro", "ia-falhou");
  }
  redirect(`/despesas/nova?${q}`);
}

export async function saveExpense(form: FormData) {
  const category = str(form, "category") as Category;
  const amount = Number(str(form, "amount").replace(",", "."));
  const splitPct = Number(str(form, "splitPct") || 50);
  if (!str(form, "description") || !(amount > 0)) redirect("/despesas/nova?erro=campos");

  const exp = db.addExpense({
    description: str(form, "description"),
    category: CATEGORY_KEYS.includes(category) ? category : "outros",
    amount,
    date: str(form, "date") || new Date().toISOString().slice(0, 10),
    paidBy: (str(form, "paidBy") as UserId) === "b" ? "b" : "a",
    splitPct: Math.min(100, Math.max(0, splitPct)),
    file: str(form, "file") || undefined,
    source: str(form, "ia") ? "ia" : "manual",
  });

  if (str(form, "splitwise") && splitwiseEnabled()) {
    try {
      db.updateExpense(exp.id, { splitwiseId: await pushToSplitwise(exp) });
    } catch (err) {
      console.error(err);
      revalidatePath("/", "layout");
      redirect("/despesas?aviso=splitwise");
    }
  }
  revalidatePath("/", "layout");
  redirect("/despesas");
}

export async function deleteExpense(id: string) {
  db.removeExpense(id);
  revalidatePath("/", "layout");
}

export async function retrySplitwise(id: string) {
  const e = db.expenses().find((x) => x.id === id);
  if (!e || e.splitwiseId || !splitwiseEnabled()) return;
  db.updateExpense(id, { splitwiseId: await pushToSplitwise(e) });
  revalidatePath("/", "layout");
}

export async function settleUp(form: FormData) {
  const amount = Number(str(form, "amount").replace(",", "."));
  if (!(amount > 0)) return;
  // "from" = quem tem a dívida e entrega o dinheiro ao outro
  const from: UserId = str(form, "from") === "b" ? "b" : "a";
  db.addSettlement({
    from,
    to: other(from),
    amount,
    date: new Date().toISOString().slice(0, 10),
  });
  revalidatePath("/", "layout");
}

/* ---------- listas ---------- */
export async function createList(form: FormData) {
  const name = str(form, "name");
  if (!name) return;
  const l = db.addList(name, str(form, "emoji") || "📝");
  revalidatePath("/listas");
  redirect(`/listas/${l.id}`);
}
export async function renameList(id: string, form: FormData) {
  const name = str(form, "name");
  if (name) db.updateList(id, { name, emoji: str(form, "emoji") || "📝" });
  revalidatePath("/listas", "layout");
}
export async function deleteList(id: string) {
  db.removeList(id);
  revalidatePath("/listas", "layout");
  redirect("/listas");
}
export async function addItem(listId: string, form: FormData) {
  const raw = str(form, "text");
  // permite colar várias linhas de uma vez
  for (const line of raw.split("\n").map((s) => s.trim()).filter(Boolean)) db.addItem(listId, line);
  revalidatePath("/listas", "layout");
}
export async function toggleItem(listId: string, itemId: string, done: boolean) {
  db.updateItem(listId, itemId, { done });
  revalidatePath("/listas", "layout");
}
export async function editItem(listId: string, itemId: string, form: FormData) {
  const text = str(form, "text");
  if (text) db.updateItem(listId, itemId, { text });
  revalidatePath("/listas", "layout");
}
export async function deleteItem(listId: string, itemId: string) {
  db.removeItem(listId, itemId);
  revalidatePath("/listas", "layout");
}
export async function clearDone(listId: string) {
  db.clearDone(listId);
  revalidatePath("/listas", "layout");
}
