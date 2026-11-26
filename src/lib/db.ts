import { supabaseBrowser } from "./supabase/client";
import type { Category, Expense, HomeList, ListItem, Recurrence, Settlement, UserId } from "./types";

/** Data em que um item concluído em `from` volta a "por fazer". */
export function nextReappear(r: Recurrence, from = new Date()): Date {
  const d = new Date(from);
  if (r.mode === "every") {
    if (r.unit === "day") d.setDate(d.getDate() + r.n);
    else if (r.unit === "week") d.setDate(d.getDate() + 7 * r.n);
    else d.setMonth(d.getMonth() + r.n);
  } else {
    d.setDate(d.getDate() + timesGapDays(r));
  }
  return d;
}

/** "N vezes por semana/mês": intervalo entre repetições, espaçadas por igual. */
export function timesGapDays(r: Recurrence): number {
  return Math.max(1, Math.round((r.unit === "week" ? 7 : 30) / r.n));
}

const UNIT_ONE = { day: "dia", week: "semana", month: "mês" } as const;
const UNIT_MANY = { day: "dias", week: "semanas", month: "meses" } as const;
const EVERY_ONE = { day: "Todos os dias", week: "Todas as semanas", month: "Todos os meses" } as const;

export function recurLabel(r: Recurrence): string {
  if (r.mode === "times") return `${r.n}× por ${UNIT_ONE[r.unit]}`;
  return r.n === 1 ? EVERY_ONE[r.unit] : `A cada ${r.n} ${UNIT_MANY[r.unit]}`;
}

/** Frase que explica quando o item volta. */
export function recurExplain(r: Recurrence): string {
  if (r.mode === "times") {
    const g = timesGapDays(r);
    return `${r.n}× por ${UNIT_ONE[r.unit]}: volta ${g === 1 ? "no dia seguinte" : `${g} dias depois`} de o concluíres.`;
  }
  return `Volta ${r.n === 1 ? `${r.unit === "week" ? "1 semana" : r.unit === "day" ? "1 dia" : "1 mês"}` : `${r.n} ${UNIT_MANY[r.unit]}`} depois de o concluíres.`;
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
      .not("recur_n", "is", null)
      .lte("reappear_at", new Date().toISOString());
  },
  async lists(): Promise<HomeList[]> {
    await db.reviveDue();
    const s = supabaseBrowser();
    const rows = check(
      await s
        .from("casa_lists")
        .select("id,name,emoji,created_at,casa_list_items(id,text,done,created_at,recur_mode,recur_unit,recur_n,reappear_at)")
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
      .select("id,name,emoji,created_at,casa_list_items(id,text,done,created_at,recur_mode,recur_unit,recur_n,reappear_at)")
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
        .insert(texts.map((text) => ({ list_id: listId, text, recur_mode: recur?.mode ?? null, recur_unit: recur?.unit ?? null, recur_n: recur?.n ?? null }))),
      "addItems",
    );
  },
  async updateItem(itemId: string, patch: { text?: string; done?: boolean; recur?: Recurrence | null }) {
    const s = supabaseBrowser();
    const row: Record<string, unknown> = {};
    if (patch.text !== undefined) row.text = patch.text;
    if (patch.done !== undefined) row.done = patch.done;
    if (patch.recur !== undefined) {
      row.recur_mode = patch.recur?.mode ?? null;
      row.recur_unit = patch.recur?.unit ?? null;
      row.recur_n = patch.recur?.n ?? null;
      if (!patch.recur) row.reappear_at = null;
    }
    check(await s.from("casa_list_items").update(row).eq("id", itemId), "updateItem");
  },
  /** Marca/desmarca. Se for recorrente, ao concluir agenda o regresso a "por fazer". */
  async toggleItem(item: ListItem, done: boolean) {
    const s = supabaseBrowser();
    const reappear =
      done && item.recur ? nextReappear(item.recur).toISOString() : null;
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
        recur: i.recur_n ? { mode: i.recur_mode, unit: i.recur_unit, n: i.recur_n } : undefined,
        reappearAt: i.reappear_at ?? undefined,
      }),
    );
  return { id: r.id, name: r.name, emoji: r.emoji, items, createdAt: r.created_at };
}
