import { supabaseBrowser } from "./supabase/client";
import type { Category, Expense, HomeList, ListItem, Recurrence, Settlement, UserId } from "./types";

/** Intervalo em dias entre repetições: "a cada N dias" ou "N vezes por semana/mês" (espaçadas por igual). */
export function recurDays(r: Recurrence): number {
  const period = r.kind === "days" ? r.n : (r.kind === "week" ? 7 : 30) / r.n;
  return Math.max(1, Math.round(period));
}

/** Camada de dados (Supabase). As políticas RLS garantem que só os 2 membros acedem. */

function check<T>(res: { data: T | null; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return res.data as T;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const toExpense = (r: any): Expense => ({
  id: r.id,
  description: r.description,
  category: r.category as Category,
  amount: Number(r.amount),
  date: r.date,
  paidBy: r.paid_by,
  splitPct: r.split_pct,
  file: r.file_path ?? undefined,
  source: r.source,
  createdAt: r.created_at,
});

const toSettlement = (r: any): Settlement => ({
  id: r.id,
  from: r.from_slot,
  to: r.to_slot,
  amount: Number(r.amount),
  date: r.date,
});

export const db = {
  /* ----- perfis ----- */
  async me(): Promise<{ slot: UserId; name: string; email: string } | null> {
    const s = supabaseBrowser();
    const { data: sess } = await s.auth.getSession();
    const email = sess.session?.user.email?.toLowerCase();
    if (!email) return null;
    const { data } = await s.from("casa_members").select("slot,name").eq("email", email).maybeSingle();
    return data ? { slot: data.slot as UserId, name: data.name, email } : null;
  },
  /** Só altera a linha do próprio utilizador (função casa_set_my_name). */
  async setMyName(name: string) {
    const s = supabaseBrowser();
    check(await s.rpc("casa_set_my_name", { p_name: name }), "setMyName");
  },
  async profiles(): Promise<{ slot: UserId; name: string }[]> {
    const s = supabaseBrowser();
    return check(await s.from("casa_members").select("slot,name"), "members") as any;
  },

  /* ----- despesas ----- */
  async expenses(): Promise<Expense[]> {
    const s = supabaseBrowser();
    const rows = check(await s.from("casa_expenses").select("*").order("date", { ascending: false }), "expenses");
    return (rows as any[]).map(toExpense);
  },
  async expense(id: string): Promise<Expense | null> {
    const s = supabaseBrowser();
    const { data } = await s.from("casa_expenses").select("*").eq("id", id).maybeSingle();
    return data ? toExpense(data) : null;
  },
  async addExpense(e: Omit<Expense, "id" | "createdAt">) {
    const s = supabaseBrowser();
    check(
      await s.from("casa_expenses").insert({
        description: e.description,
        category: e.category,
        amount: e.amount,
        date: e.date,
        paid_by: e.paidBy,
        split_pct: e.splitPct,
        file_path: e.file ?? null,
        source: e.source,
      }),
      "addExpense",
    );
  },
  async updateExpense(id: string, e: Partial<Omit<Expense, "id" | "createdAt">>) {
    const s = supabaseBrowser();
    const patch: Record<string, unknown> = {};
    if (e.description !== undefined) patch.description = e.description;
    if (e.category !== undefined) patch.category = e.category;
    if (e.amount !== undefined) patch.amount = e.amount;
    if (e.date !== undefined) patch.date = e.date;
    if (e.paidBy !== undefined) patch.paid_by = e.paidBy;
    if (e.splitPct !== undefined) patch.split_pct = e.splitPct;
    check(await s.from("casa_expenses").update(patch).eq("id", id), "updateExpense");
  },
  async removeExpense(id: string) {
    const s = supabaseBrowser();
    const { data } = await s.from("casa_expenses").select("file_path").eq("id", id).maybeSingle();
    check(await s.from("casa_expenses").delete().eq("id", id), "removeExpense");
    if (data?.file_path) await s.storage.from("casa-invoices").remove([data.file_path]);
  },

  /* ----- acertos de contas ----- */
  async settlements(): Promise<Settlement[]> {
    const s = supabaseBrowser();
    return (check(await s.from("casa_settlements").select("*"), "settlements") as any[]).map(toSettlement);
  },
  async addSettlement(x: { from: UserId; to: UserId; amount: number }) {
    const s = supabaseBrowser();
    check(
      await s.from("casa_settlements").insert({ from_slot: x.from, to_slot: x.to, amount: x.amount }),
      "addSettlement",
    );
  },

  /* ----- listas ----- */
  /** Itens recorrentes feitos cujo prazo passou voltam a "por fazer". */
  async reviveDue() {
    const s = supabaseBrowser();
    await s
      .from("casa_list_items")
      .update({ done: false, reappear_at: null })
      .eq("done", true)
      .not("recur_kind", "is", null)
      .lte("reappear_at", new Date().toISOString());
  },
  async lists(): Promise<HomeList[]> {
    await db.reviveDue();
    const s = supabaseBrowser();
    const rows = check(
      await s
        .from("casa_lists")
        .select("id,name,emoji,created_at,casa_list_items(id,text,done,created_at,recur_kind,recur_n,reappear_at)")
        .order("created_at"),
      "lists",
    ) as any[];
    return rows.map(toList);
  },
  async list(id: string): Promise<HomeList | null> {
    await db.reviveDue();
    const s = supabaseBrowser();
    const { data } = await s
      .from("casa_lists")
      .select("id,name,emoji,created_at,casa_list_items(id,text,done,created_at,recur_kind,recur_n,reappear_at)")
      .eq("id", id)
      .maybeSingle();
    return data ? toList(data) : null;
  },
  async addList(name: string, emoji: string): Promise<string> {
    const s = supabaseBrowser();
    const row = check(await s.from("casa_lists").insert({ name, emoji }).select("id").single(), "addList");
    return (row as any).id;
  },
  async updateList(id: string, patch: { name: string; emoji: string }) {
    const s = supabaseBrowser();
    check(await s.from("casa_lists").update(patch).eq("id", id), "updateList");
  },
  async removeList(id: string) {
    const s = supabaseBrowser();
    check(await s.from("casa_lists").delete().eq("id", id), "removeList");
  },
  async addItems(listId: string, texts: string[], recur?: Recurrence | null) {
    const s = supabaseBrowser();
    check(
      await s
        .from("casa_list_items")
        .insert(texts.map((text) => ({ list_id: listId, text, recur_kind: recur?.kind ?? null, recur_n: recur?.n ?? null }))),
      "addItems",
    );
  },
  async updateItem(itemId: string, patch: { text?: string; done?: boolean; recur?: Recurrence | null }) {
    const s = supabaseBrowser();
    const row: Record<string, unknown> = {};
    if (patch.text !== undefined) row.text = patch.text;
    if (patch.done !== undefined) row.done = patch.done;
    if (patch.recur !== undefined) {
      row.recur_kind = patch.recur?.kind ?? null;
      row.recur_n = patch.recur?.n ?? null;
      if (!patch.recur) row.reappear_at = null;
    }
    check(await s.from("casa_list_items").update(row).eq("id", itemId), "updateItem");
  },
  /** Marca/desmarca. Se for recorrente, ao concluir agenda o regresso a "por fazer". */
  async toggleItem(item: ListItem, done: boolean) {
    const s = supabaseBrowser();
    const reappear =
      done && item.recur ? new Date(Date.now() + recurDays(item.recur) * 86_400_000).toISOString() : null;
    check(await s.from("casa_list_items").update({ done, reappear_at: reappear }).eq("id", item.id), "toggleItem");
  },
  async removeItem(itemId: string) {
    const s = supabaseBrowser();
    check(await s.from("casa_list_items").delete().eq("id", itemId), "removeItem");
  },
  async clearDone(listId: string) {
    const s = supabaseBrowser();
    check(await s.from("casa_list_items").delete().eq("list_id", listId).eq("done", true), "clearDone");
  },
};

function toList(r: any): HomeList {
  const items: ListItem[] = [...r.casa_list_items]
    .sort((a: any, b: any) => a.created_at.localeCompare(b.created_at))
    .map(
      (i: any): ListItem => ({
        id: i.id,
        text: i.text,
        done: i.done,
        recur: i.recur_kind ? { kind: i.recur_kind, n: i.recur_n } : undefined,
        reappearAt: i.reappear_at ?? undefined,
      }),
    );
  return { id: r.id, name: r.name, emoji: r.emoji, items, createdAt: r.created_at };
}

export function recurLabel(r: Recurrence): string {
  if (r.kind === "days") return r.n === 1 ? "Todos os dias" : `A cada ${r.n} dias`;
  return `${r.n}× por ${r.kind === "week" ? "semana" : "mês"}`;
}
