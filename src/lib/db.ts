import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { DB, Expense, HomeList, Settlement } from "./types";
import { currentMonth, shiftMonth, round2 } from "./format";

/**
 * Camada de dados do rascunho: um ficheiro JSON local (data/db.json).
 * Tudo passa por aqui, por isso trocar por Supabase/Postgres mais tarde
 * é mexer só neste ficheiro.
 */
const DIR = path.join(process.cwd(), "data");
const FILE = path.join(DIR, "db.json");
export const UPLOADS = path.join(DIR, "uploads");

export const uid = () => randomUUID();

function seed(): DB {
  const db: DB = { expenses: [], settlements: [], lists: [] };
  if (process.env.DEMO_DATA === "false") return db;

  const now = currentMonth();
  const recurring: [string, Expense["category"], number, number, "a" | "b"][] = [
    ["EDP Comercial", "luz", 62, 14, "a"],
    ["Galp Gás", "gas", 28, 9, "b"],
    ["Águas do Porto", "agua", 24, 18, "a"],
    ["NOS Internet + TV", "internet", 49.99, 5, "b"],
    ["Condomínio", "condominio", 55, 2, "a"],
    ["Seguro Multirriscos", "seguros", 31.4, 11, "b"],
  ];
  for (let i = 5; i >= 0; i--) {
    const m = shiftMonth(now, -i);
    recurring.forEach(([description, category, base, day, paidBy], idx) => {
      // pequena variação determinística para o gráfico não ser plano
      const wobble = 1 + (((i * 7 + idx * 5) % 11) - 5) / 40;
      const winter = category === "luz" || category === "gas" ? 1 + (i % 3) * 0.12 : 1;
      db.expenses.push({
        id: uid(),
        description,
        category,
        amount: round2(base * wobble * winter),
        date: `${m}-${String(day).padStart(2, "0")}`,
        paidBy,
        splitPct: 50,
        source: "ia",
        createdAt: new Date().toISOString(),
      });
    });
    db.expenses.push({
      id: uid(),
      description: "Compras Continente",
      category: "supermercado",
      amount: round2(180 + ((i * 37) % 60)),
      date: `${m}-20`,
      paidBy: i % 2 ? "a" : "b",
      splitPct: 50,
      source: "manual",
      createdAt: new Date().toISOString(),
    });
  }
  db.expenses = db.expenses.filter((e) => e.date <= new Date().toISOString().slice(0, 10));

  const item = (text: string, done = false) => ({ id: uid(), text, done });
  db.lists = [
    {
      id: uid(),
      name: "Supermercado",
      emoji: "🛒",
      createdAt: new Date().toISOString(),
      items: [item("Leite"), item("Ovos"), item("Café", true), item("Detergente loiça"), item("Fruta da época")],
    },
    {
      id: uid(),
      name: "Compras de Natal",
      emoji: "🎄",
      createdAt: new Date().toISOString(),
      items: [item("Prenda mãe"), item("Prenda pai"), item("Papel de embrulho", true)],
    },
    {
      id: uid(),
      name: "Pendentes",
      emoji: "📌",
      createdAt: new Date().toISOString(),
      items: [item("Marcar revisão do carro"), item("Renovar seguro auto"), item("Ligar à EDP (tarifa)")],
    },
  ];
  return db;
}

let cache: DB | null = null;

function load(): DB {
  if (cache) return cache;
  fs.mkdirSync(UPLOADS, { recursive: true });
  if (fs.existsSync(FILE)) {
    cache = JSON.parse(fs.readFileSync(FILE, "utf8")) as DB;
  } else {
    cache = seed();
    save();
  }
  return cache;
}

function save() {
  fs.mkdirSync(DIR, { recursive: true });
  const tmp = FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(cache, null, 2));
  fs.renameSync(tmp, FILE); // escrita atómica
}

export const db = {
  expenses: () => load().expenses,
  settlements: () => load().settlements,
  lists: () => load().lists,

  addExpense(e: Omit<Expense, "id" | "createdAt">): Expense {
    const exp: Expense = { ...e, id: uid(), createdAt: new Date().toISOString() };
    load().expenses.push(exp);
    save();
    return exp;
  },
  updateExpense(id: string, patch: Partial<Expense>) {
    const e = load().expenses.find((x) => x.id === id);
    if (e) Object.assign(e, patch);
    save();
  },
  removeExpense(id: string) {
    const d = load();
    const e = d.expenses.find((x) => x.id === id);
    d.expenses = d.expenses.filter((x) => x.id !== id);
    if (e?.file) fs.rmSync(path.join(UPLOADS, e.file), { force: true });
    save();
  },

  addSettlement(s: Omit<Settlement, "id">) {
    load().settlements.push({ ...s, id: uid() });
    save();
  },

  addList(name: string, emoji: string): HomeList {
    const l: HomeList = { id: uid(), name, emoji, items: [], createdAt: new Date().toISOString() };
    load().lists.push(l);
    save();
    return l;
  },
  updateList(id: string, patch: Partial<Pick<HomeList, "name" | "emoji">>) {
    const l = load().lists.find((x) => x.id === id);
    if (l) Object.assign(l, patch);
    save();
  },
  removeList(id: string) {
    const d = load();
    d.lists = d.lists.filter((x) => x.id !== id);
    save();
  },
  addItem(listId: string, text: string) {
    load().lists.find((l) => l.id === listId)?.items.push({ id: uid(), text, done: false });
    save();
  },
  updateItem(listId: string, itemId: string, patch: { text?: string; done?: boolean }) {
    const it = load().lists.find((l) => l.id === listId)?.items.find((i) => i.id === itemId);
    if (it) Object.assign(it, patch);
    save();
  },
  removeItem(listId: string, itemId: string) {
    const l = load().lists.find((x) => x.id === listId);
    if (l) l.items = l.items.filter((i) => i.id !== itemId);
    save();
  },
  clearDone(listId: string) {
    const l = load().lists.find((x) => x.id === listId);
    if (l) l.items = l.items.filter((i) => !i.done);
    save();
  },
};
