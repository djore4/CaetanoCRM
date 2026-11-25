import Link from "next/link";
import { db } from "@/lib/db";
import { balance, byCategory, monthTotal, trend, whoOwes } from "@/lib/stats";
import { currentMonth, money, monthLabel, shiftMonth } from "@/lib/format";
import { CategoryBars, Donut, TrendChart } from "@/components/Charts";
import { USERS } from "@/lib/users";
import { CATEGORIES } from "@/lib/categories";
import { settleUp } from "./actions";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const { mes } = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(mes ?? "") ? mes! : currentMonth();
  const expenses = db.expenses();

  const total = monthTotal(expenses, month);
  const prev = monthTotal(expenses, shiftMonth(month, -1));
  const delta = prev > 0 ? ((total - prev) / prev) * 100 : null;
  const cats = byCategory(expenses, month);
  const top = cats[0];
  const bal = whoOwes(balance(expenses, db.settlements()));
  const perPerson = total / 2;
  const isCurrent = month === currentMonth();

  return (
    <div className="space-y-5">
      {/* seletor de mês */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold first-letter:uppercase">{monthLabel(month)}</h1>
        <div className="flex gap-2">
          <Link href={`/?mes=${shiftMonth(month, -1)}`} className="btn btn-ghost !px-3" aria-label="Mês anterior">←</Link>
          {!isCurrent && <Link href="/" className="btn btn-ghost !px-3">Hoje</Link>}
          <Link
            href={`/?mes=${shiftMonth(month, 1)}`}
            className={`btn btn-ghost !px-3 ${isCurrent ? "pointer-events-none opacity-30" : ""}`}
            aria-label="Mês seguinte"
          >→</Link>
        </div>
      </div>

      {/* destaques */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-5 md:col-span-2 bg-gradient-to-br from-accent to-[#7a4fe0] !border-0 text-white">
          <p className="text-sm opacity-80">Gasto total no mês</p>
          <p className="text-4xl font-bold mt-1">{money(total)}</p>
          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-sm opacity-90">
            <span>≈ {money(perPerson)} por pessoa</span>
            {delta !== null && (
              <span>
                {delta >= 0 ? "▲" : "▼"} {Math.abs(Math.round(delta))}% vs. {monthLabel(shiftMonth(month, -1), false)}
              </span>
            )}
          </div>
        </div>

        <div className="card p-5">
          <p className="text-sm text-muted">Conta corrente</p>
          {bal ? (
            <>
              <p className="mt-1 text-lg font-semibold leading-snug">
                <span style={{ color: USERS[bal.debtor].color }}>{USERS[bal.debtor].name}</span> deve{" "}
                <span className="text-2xl font-bold block">{money(bal.amount)}</span>
                a <span style={{ color: USERS[bal.creditor].color }}>{USERS[bal.creditor].name}</span>
              </p>
              <form action={settleUp} className="mt-3">
                <input type="hidden" name="from" value={bal.debtor} />
                <input type="hidden" name="amount" value={bal.amount} />
                <button className="btn btn-ghost w-full !py-2 text-sm">✓ Marcar como saldado</button>
              </form>
            </>
          ) : (
            <p className="mt-2 text-lg font-semibold">🎉 Tudo certo, ninguém deve nada.</p>
          )}
        </div>
      </div>

      {/* insights */}
      {top && (
        <div className="card p-4 flex items-center gap-3 text-sm">
          <span className="text-2xl">{CATEGORIES[top.category].emoji}</span>
          <p>
            Em {monthLabel(month, false)}, <b>{CATEGORIES[top.category].label}</b> foi onde gastaram mais:{" "}
            <b>{money(top.total)}</b> ({Math.round((top.total / total) * 100)}% do total).
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-bold mb-4">Para onde vai o dinheiro</h2>
          {cats.length > 0 && (
            <div className="flex justify-center mb-5">
              <div className="relative">
                <Donut rows={cats} total={total} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs text-muted">Total</span>
                  <span className="font-bold">{money(total)}</span>
                </div>
              </div>
            </div>
          )}
          <CategoryBars rows={cats} total={total} />
        </section>

        <section className="card p-5">
          <h2 className="font-bold mb-4">Últimos 6 meses</h2>
          <TrendChart data={trend(expenses, currentMonth())} selected={month} />
          <Link href="/despesas/nova" className="btn w-full mt-5">＋ Adicionar fatura</Link>
        </section>
      </div>
    </div>
  );
}
