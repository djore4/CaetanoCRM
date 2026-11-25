import { supabaseServer } from "./supabase/server";
import type { Category, Expense, HomeList, ListItem, Settlement, UserId } from "./types";

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
  async me(): Promise<{ slot: UserId; name: string } | null> {
    const s = await supabaseServer();
    const { data: claims } = await s.auth.getClaims();
    const id = claims?.claims.sub;
    if (!id) return null;
    const { data } = await s.from("profiles").select("slot,name").eq("id", id).maybeSingle();
    return data ? { slot: data.slot as UserId, name: data.name } : null;
  },
  async profiles(): Promise<{ slot: UserId; name: string }[]> {
    const s = await supabaseServer();
    return check(await s.from("profiles").select("slot,name"), "profiles") as any;
  },

  /* ----- despesas ----- */
  async expenses(): Promise<Expense[]> {
    const s = await supabaseServer();
    const rows = check(await s.from("expenses").select("*").order("date", { ascending: false }), "expenses");
    return (rows as any[]).map(toExpense);
  },
  async expense(id: string): Promise<Expense | null> {
    const s = await supabaseServer();
    const { data } = await s.from("expenses").select("*").eq("id", id).maybeSingle();
    return data ? toExpense(data) : null;
  },
  async addExpense(e: Omit<Expense, "id" | "createdAt">) {
    const s = await supabaseServer();
    check(
      await s.from("expenses").insert({
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
    const s = await supabaseServer();
    const patch: Record<string, unknown> = {};
    if (e.description !== undefined) patch.description = e.description;
    if (e.category !== undefined) patch.category = e.category;
    if (e.amount !== undefined) patch.amount = e.amount;
    if (e.date !== undefined) patch.date = e.date;
    if (e.paidBy !== undefined) patch.paid_by = e.paidBy;
    if (e.splitPct !== undefined) patch.split_pct = e.splitPct;
    check(await s.from("expenses").update(patch).eq("id", id), "updateExpense");
  },
  async removeExpense(id: string) {
    const s = await supabaseServer();
    const { data } = await s.from("expenses").select("file_path").eq("id", id).maybeSingle();
    check(await s.from("expenses").delete().eq("id", id), "removeExpense");
    if (data?.file_path) await s.storage.from("invoices").remove([data.file_path]);
  },

  /* ----- acertos de contas ----- */
  async settlements(): Promise<Settlement[]> {
    const s = await supabaseServer();
    return (check(await s.from("settlements").select("*"), "settlements") as any[]).map(toSettlement);
  },
  async addSettlement(x: { from: UserId; to: UserId; amount: number }) {
    const s = await supabaseServer();
    check(
      await s.from("settlements").insert({ from_slot: x.from, to_slot: x.to, amount: x.amount }),
      "addSettlement",
    );
  },

  /* ----- listas ----- */
  async lists(): Promise<HomeList[]> {
    const s = await supabaseServer();
    const rows = check(
      await s
        .from("lists")
        .select("id,name,emoji,created_at,list_items(id,text,done,created_at)")
        .order("created_at"),
      "lists",
    ) as any[];
    return rows.map(toList);
  },
  async list(id: string): Promise<HomeList | null> {
    const s = await supabaseServer();
    const { data } = await s
      .from("lists")
      .select("id,name,emoji,created_at,list_items(id,text,done,created_at)")
      .eq("id", id)
      .maybeSingle();
    return data ? toList(data) : null;
  },
  async addList(name: string, emoji: string): Promise<string> {
    const s = await supabaseServer();
    const row = check(await s.from("lists").insert({ name, emoji }).select("id").single(), "addList");
    return (row as any).id;
  },
  async updateList(id: string, patch: { name: string; emoji: string }) {
    const s = await supabaseServer();
    check(await s.from("lists").update(patch).eq("id", id), "updateList");
  },
  async removeList(id: string) {
    const s = await supabaseServer();
    check(await s.from("lists").delete().eq("id", id), "removeList");
  },
  async addItems(listId: string, texts: string[]) {
    const s = await supabaseServer();
    check(await s.from("list_items").insert(texts.map((text) => ({ list_id: listId, text }))), "addItems");
  },
  async updateItem(itemId: string, patch: { text?: string; done?: boolean }) {
    const s = await supabaseServer();
    check(await s.from("list_items").update(patch).eq("id", itemId), "updateItem");
  },
  async removeItem(itemId: string) {
    const s = await supabaseServer();
    check(await s.from("list_items").delete().eq("id", itemId), "removeItem");
  },
  async clearDone(listId: string) {
    const s = await supabaseServer();
    check(await s.from("list_items").delete().eq("list_id", listId).eq("done", true), "clearDone");
  },
};

function toList(r: any): HomeList {
  const items: ListItem[] = [...r.list_items]
    .sort((a: any, b: any) => a.created_at.localeCompare(b.created_at))
    .map((i: any) => ({ id: i.id, text: i.text, done: i.done }));
  return { id: r.id, name: r.name, emoji: r.emoji, items, createdAt: r.created_at };
}
