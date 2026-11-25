"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, CATEGORY_KEYS } from "@/lib/categories";
import { db } from "@/lib/db";
import type { Category, UserId } from "@/lib/types";

export interface ExpenseDefaults {
  id?: string;
  file?: string;
  description?: string;
  amount?: string;
  date?: string;
  category?: string;
  paidBy: UserId;
  splitPct?: number;
}

export function ExpenseForm({
  d,
  users,
  submitLabel,
}: {
  d: ExpenseDefaults;
  users: Record<UserId, { name: string }>;
  submitLabel: string;
}) {
  const router = useRouter();
  const [erro, setErro] = useState("");
  const [busy, setBusy] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const split = d.splitPct ?? 50;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const str = (k: string) => String(f.get(k) ?? "").trim();
    const amount = Number(str("amount").replace(",", "."));
    const category = str("category") as Category;
    if (!str("description") || !(amount > 0)) return setErro("Faltam a descrição ou um valor válido.");

    const data = {
      description: str("description"),
      category: CATEGORY_KEYS.includes(category) ? category : ("outros" as Category),
      amount,
      date: str("date") || today,
      paidBy: (str("paidBy") === "b" ? "b" : "a") as UserId,
      splitPct: Math.min(100, Math.max(0, Number(str("splitPct") || 50))),
    };
    setBusy(true);
    setErro("");
    try {
      if (d.id) await db.updateExpense(d.id, data);
      else await db.addExpense({ ...data, file: d.file, source: "manual" });
      router.push("/despesas/");
    } catch (err) {
      console.error(err);
      setErro("Não foi possível guardar. Tenta de novo.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card p-5 space-y-4">
      {erro && <p className="text-sm text-red-500">{erro}</p>}
      <div>
        <label className="label" htmlFor="description">Fornecedor / descrição</label>
        <input id="description" name="description" className="input" defaultValue={d.description} placeholder="Ex.: EDP" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="amount">Valor (€)</label>
          <input id="amount" name="amount" inputMode="decimal" className="input" defaultValue={d.amount} placeholder="0,00" required />
        </div>
        <div>
          <label className="label" htmlFor="date">Data</label>
          <input id="date" name="date" type="date" className="input" defaultValue={d.date ?? today} required />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="category">Categoria</label>
        <select id="category" name="category" className="input" defaultValue={d.category ?? "outros"}>
          {CATEGORY_KEYS.map((k) => (
            <option key={k} value={k}>
              {CATEGORIES[k].emoji} {CATEGORIES[k].label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="paidBy">Quem pagou</label>
          <select id="paidBy" name="paidBy" className="input" defaultValue={d.paidBy}>
            <option value="a">{users.a.name}</option>
            <option value="b">{users.b.name}</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="splitPct">Parte de quem pagou</label>
          <select id="splitPct" name="splitPct" className="input" defaultValue={String(split)}>
            <option value="50">50% (a meias)</option>
            <option value="0">0% (a outra pessoa deve o valor todo)</option>
            <option value="100">100% (sem divisão, despesa só de quem pagou)</option>
            <option value="60">60%</option>
            <option value="40">40%</option>
            {![0, 40, 50, 60, 100].includes(split) && <option value={String(split)}>{split}%</option>}
          </select>
        </div>
      </div>
      <button className="btn w-full" disabled={busy}>{busy ? "A guardar…" : submitLabel}</button>
    </form>
  );
}
