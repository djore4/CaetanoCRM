"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, CATEGORY_KEYS } from "@/lib/categories";
import { db } from "@/lib/db";
import { money } from "@/lib/format";
import type { Category, UserId } from "@/lib/types";
import { other, type Household } from "@/lib/users";
import { Avatar } from "./Avatar";
import { ConfirmButton } from "./DeleteButton";
import { Icon } from "./Icons";
import { InvoiceLink } from "./InvoiceLink";
import { useToast } from "./Toast";

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

const parseAmount = (s: string) => Number(s.replace(/\s/g, "").replace(",", "."));

export function ExpenseForm({
  d,
  users,
  submitLabel,
}: {
  d: ExpenseDefaults;
  users: Household["users"];
  submitLabel: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const today = new Date().toISOString().slice(0, 10);

  const [description, setDescription] = useState(d.description ?? "");
  const [amount, setAmount] = useState(d.amount ?? "");
  const [date, setDate] = useState(d.date ?? today);
  const [category, setCategory] = useState<Category>(
    CATEGORY_KEYS.includes(d.category as Category) ? (d.category as Category) : "outros",
  );
  const [paidBy, setPaidBy] = useState<UserId>(d.paidBy);
  // a barra mostra sempre a parte da pessoa A (esquerda) vs B (direita); guardamos a parte de quem pagou
  const initial = d.splitPct ?? 50;
  const [aPct, setAPct] = useState(d.paidBy === "a" ? initial : 100 - initial);
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState("");

  const value = parseAmount(amount);
  const valid = value > 0;
  const splitPct = paidBy === "a" ? aPct : 100 - aPct;
  const debtor = other(paidBy);
  const owed = valid ? value * (1 - splitPct / 100) : 0;
  const aShare = valid ? (value * aPct) / 100 : 0;
  const bShare = valid ? value - aShare : 0;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!description.trim() || !valid) return setErro("Indica a descrição e um valor maior que zero.");
    const data = {
      description: description.trim(),
      category,
      amount: Math.round(value * 100) / 100,
      date: date || today,
      paidBy,
      splitPct,
    };
    setBusy(true);
    setErro("");
    try {
      if (d.id) await db.updateExpense(d.id, data);
      else await db.addExpense({ ...data, file: d.file, source: "manual" });
      toast(d.id ? "Alterações guardadas" : "Despesa registada");
      router.push("/despesas/");
    } catch (err) {
      console.error(err);
      setErro("Não foi possível guardar. Tenta de novo.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* valor + descrição */}
      <section className="card overflow-hidden">
        <div className="px-5 pb-5 pt-6 text-center" style={{ background: "linear-gradient(180deg, var(--accent-soft), transparent)" }}>
          <label htmlFor="amount" className="label">Valor</label>
          <div className="flex items-baseline justify-center gap-1.5">
            <input
              id="amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value.replace(/[^\d.,]/g, ""));
                setErro("");
              }}
              placeholder="0,00"
              className="amount-input"
              style={{ width: `${Math.max(4, amount.length + 0.5)}ch` }}
              aria-label="Valor em euros"
            />
            <span className="text-3xl font-bold text-muted">€</span>
          </div>
          {d.file && (
            <div className="mt-3 flex justify-center">
              <InvoiceLink file={d.file} className="chip !bg-card hover:text-ink">
                <Icon name="file" className="h-3.5 w-3.5" /> Fatura anexada · ver
              </InvoiceLink>
            </div>
          )}
        </div>
        <div className="grid gap-4 p-5 pt-1 sm:grid-cols-[1fr_11rem]">
          <div>
            <label className="label" htmlFor="description">Fornecedor / descrição</label>
            <input
              id="description"
              className="input"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setErro("");
              }}
              placeholder="Ex.: EDP, Continente, renda…"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="label" htmlFor="date">Data</label>
            <input id="date" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
      </section>

      {/* categoria */}
      <section className="card p-5">
        <p className="label">Categoria</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {CATEGORY_KEYS.map((k) => {
            const c = CATEGORIES[k];
            const on = category === k;
            return (
              <button
                key={k}
                type="button"
                aria-pressed={on}
                onClick={() => setCategory(k)}
                className={`flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-xs font-semibold transition active:scale-[0.97] ${
                  on ? "text-ink" : "border-line text-muted hover:bg-soft"
                }`}
                style={on ? { borderColor: c.color, background: `color-mix(in srgb, ${c.color} 14%, transparent)` } : undefined}
              >
                <span className="text-xl leading-none">{c.emoji}</span>
                <span className="truncate max-w-full">{c.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* quem pagou + divisão */}
      <section className="card space-y-6 p-5">
        <div>
          <p className="label">Quem pagou</p>
          <div className="seg">
            {(["a", "b"] as UserId[]).map((u) => (
              <button key={u} type="button" aria-pressed={paidBy === u} onClick={() => setPaidBy(u)} className="!py-2.5">
                <Avatar name={users[u].name} color={users[u].color} size="xs" />
                {users[u].name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="split" className="label !mb-0">Divisão</label>
            {aPct !== 50 ? (
              <button type="button" onClick={() => setAPct(50)} className="chip hover:text-ink">
                Repor 50/50
              </button>
            ) : (
              <span className="chip">A meias</span>
            )}
          </div>

          <input
            id="split"
            type="range"
            min={0}
            max={100}
            step={1}
            value={aPct}
            onChange={(e) => {
              const v = Number(e.target.value);
              setAPct(Math.abs(v - 50) <= 2 ? 50 : v); // "íman" nos 50%
            }}
            className="range"
            aria-valuetext={`${users.a.name} ${aPct}%, ${users.b.name} ${100 - aPct}%`}
            style={
              {
                "--p": `${aPct}%`,
                "--ca": users.a.color,
                "--cb": users.b.color,
              } as React.CSSProperties
            }
          />
          <div className="relative -mt-1 h-3">
            {[0, 25, 50, 75, 100].map((t) => (
              <span
                key={t}
                className="absolute h-1.5 w-px bg-line"
                style={{ left: `calc(${t}% + ${(50 - t) * 0.0175}rem)` }}
              />
            ))}
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2.5">
            {(["a", "b"] as UserId[]).map((u) => {
              const pct = u === "a" ? aPct : 100 - aPct;
              const share = u === "a" ? aShare : bShare;
              return (
                <div key={u} className={`rounded-2xl bg-soft p-3 ${u === "b" ? "text-right" : ""}`}>
                  <div className={`flex items-center gap-2 ${u === "b" ? "flex-row-reverse" : ""}`}>
                    <Avatar name={users[u].name} color={users[u].color} size="xs" />
                    <span className="truncate text-xs font-semibold text-muted">{users[u].name}</span>
                  </div>
                  <p className="tnum mt-1.5 text-xl font-bold" style={{ color: users[u].color }}>
                    {pct}%
                  </p>
                  <p className="tnum text-xs text-muted">{valid ? money(share) : "—"}</p>
                </div>
              );
            })}
          </div>

          <p className="mt-3 flex items-center gap-2 text-sm text-muted">
            <Icon name="scale" className="h-4 w-4 shrink-0" />
            {!valid ? (
              "Indica o valor para veres quem fica a dever."
            ) : owed < 0.005 ? (
              "Ninguém fica a dever nada com esta despesa."
            ) : (
              <span>
                <b className="text-ink">{users[debtor].name}</b> fica a dever{" "}
                <b className="tnum text-ink">{money(owed)}</b> a <b className="text-ink">{users[paidBy].name}</b>.
              </span>
            )}
          </p>
        </div>
      </section>

      {erro && (
        <p className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{erro}</p>
      )}

      <button className="btn w-full !py-3.5 text-base" disabled={busy}>
        {busy ? "A guardar…" : submitLabel}
      </button>

      {d.id && (
        <ConfirmButton
          title="Apagar despesa?"
          message={`"${description || "Esta despesa"}" vai ser apagada${d.file ? ", juntamente com a fatura anexada" : ""}. Não dá para desfazer.`}
          action={async () => {
            await db.removeExpense(d.id!);
            toast("Despesa apagada");
            router.push("/despesas/");
          }}
          className="btn btn-ghost-danger w-full"
        >
          <Icon name="trash" className="h-4 w-4" /> Apagar despesa
        </ConfirmButton>
      )}
    </form>
  );
}
