"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { db } from "@/lib/db";
import { balance, byCategory, monthTotal, trend, whoOwes } from "@/lib/stats";
import { currentMonth, money, monthLabel, shiftMonth } from "@/lib/format";
import { CATEGORIES } from "@/lib/categories";
import { other } from "@/lib/users";
import type { UserId } from "@/lib/types";
import { useAsync } from "@/lib/useAsync";
import { useHousehold } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { CategoryBars, Donut, TrendChart } from "@/components/Charts";
import { ConfirmButton } from "@/components/DeleteButton";
import { Icon } from "@/components/Icons";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import { ErrorCard, PageSkeleton } from "@/components/Skeleton";
import { useToast } from "@/components/Toast";

export default function Home() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <HomeInner />
    </Suspense>
  );
}

function HomeInner() {
  const mes = useSearchParams().get("mes") ?? "";
  const month = /^\d{4}-\d{2}$/.test(mes) ? mes : currentMonth();
  const { users: USERS } = useHousehold();
  const toast = useToast();
  const { data, error, reload } = useAsync(async () => {
    const [expenses, settlements] = await Promise.all([db.expenses(), db.settlements()]);
    return { expenses, settlements };
  }, []);
  if (error) return <ErrorCard message={error} />;
  if (!data) return <PageSkeleton />;
  const { expenses, settlements } = data;

  const total = monthTotal(expenses, month);
  const prev = monthTotal(expenses, shiftMonth(month, -1));
  const delta = prev > 0 ? ((total - prev) / prev) * 100 : null;
  const cats = byCategory(expenses, month);
  const top = cats[0];
  const bal = whoOwes(balance(expenses, settlements));
  const count = expenses.filter((e) => e.date.startsWith(month)).length;

  async function settle(from: UserId, amount: number) {
    if (!(amount > 0)) return;
    await db.addSettlement({ from, to: other(from), amount }); // "from" = quem deve e entrega o dinheiro
    toast("Contas acertadas");
    reload();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted">Resumo</p>
          <h1 className="text-3xl font-bold tracking-tight first-letter:uppercase">
            {new Date(month + "-15").toLocaleDateString("pt-PT", { month: "long" })}{" "}
            <span className="font-medium text-muted">{month.slice(0, 4)}</span>
          </h1>
        </div>
        <MonthSwitcher month={month} base="/" />
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {/* total do mês */}
        <div
          className="relative overflow-hidden rounded-[1.5rem] p-6 text-white shadow-[0_20px_40px_-20px_var(--accent)] md:col-span-3"
          style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
        >
          <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-20 right-16 h-40 w-40 rounded-full bg-white/5" />
          <p className="text-sm font-medium opacity-85">Gasto total no mês</p>
          <p className="tnum mt-1 text-[2.6rem] font-extrabold leading-tight tracking-tight">{money(total)}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">≈ {money(total / 2)} por pessoa</span>
            <span className="rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">
              {count} {count === 1 ? "despesa" : "despesas"}
            </span>
            {delta !== null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">
                <Icon name={delta >= 0 ? "arrowUp" : "arrowDown"} className="h-3.5 w-3.5" strokeWidth={2.6} />
                {Math.abs(Math.round(delta))}% vs. {monthLabel(shiftMonth(month, -1), false)}
              </span>
            )}
          </div>
        </div>

        {/* conta corrente */}
        <div className="card flex flex-col p-5 md:col-span-2">
          <p className="flex items-center gap-2 text-sm font-semibold text-muted">
            <Icon name="scale" className="h-4 w-4" /> Conta corrente
          </p>
          {bal ? (
            <>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex -space-x-2">
                  <Avatar name={USERS[bal.debtor].name} color={USERS[bal.debtor].color} ring />
                  <Avatar name={USERS[bal.creditor].name} color={USERS[bal.creditor].color} ring />
                </div>
                <p className="text-sm leading-snug">
                  <b>{USERS[bal.debtor].name}</b> deve a <b>{USERS[bal.creditor].name}</b>
                </p>
              </div>
              <p className="tnum mt-3 text-3xl font-extrabold tracking-tight">{money(bal.amount)}</p>
              <ConfirmButton
                title="Acertar contas?"
                message={`Regista que ${USERS[bal.debtor].name} pagou ${money(bal.amount)} a ${USERS[bal.creditor].name}. O saldo fica a zero.`}
                confirmLabel="Marcar como pago"
                danger={false}
                action={() => settle(bal.debtor, bal.amount)}
                className="btn btn-ghost mt-auto w-full !py-2.5 text-sm"
              >
                <Icon name="check" className="h-4 w-4" strokeWidth={2.4} /> Marcar como saldado
              </ConfirmButton>
            </>
          ) : (
            <div className="my-auto py-4 text-center">
              <p className="text-3xl">🎉</p>
              <p className="mt-2 font-semibold">Contas em dia</p>
              <p className="text-sm text-muted">Ninguém deve nada a ninguém.</p>
            </div>
          )}
        </div>
      </div>

      {expenses.length === 0 && (
        <div className="card p-8 text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-accent-soft text-2xl">🧾</div>
          <p className="text-lg font-bold">Ainda não há despesas</p>
          <p className="mb-5 text-sm text-muted">Regista a primeira e o resumo aparece aqui.</p>
          <Link href="/despesas/nova/" className="btn">
            <Icon name="plus" className="h-4 w-4" strokeWidth={2.6} /> Nova despesa
          </Link>
        </div>
      )}

      {top && (
        <div className="card flex items-center gap-4 p-4">
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xl"
            style={{ background: `color-mix(in srgb, ${CATEGORIES[top.category].color} 16%, transparent)` }}
          >
            {CATEGORIES[top.category].emoji}
          </span>
          <p className="text-sm">
            <b>{CATEGORIES[top.category].label}</b> foi onde gastaram mais em {monthLabel(month, false)}:{" "}
            <b className="tnum">{money(top.total)}</b>{" "}
            <span className="text-muted">({Math.round((top.total / total) * 100)}% do total)</span>
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-5 font-bold">Para onde vai o dinheiro</h2>
          {cats.length > 0 && (
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <Donut rows={cats} total={total} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs text-muted">Total</span>
                  <span className="tnum font-bold">{money(total)}</span>
                </div>
              </div>
            </div>
          )}
          <CategoryBars rows={cats} total={total} />
        </section>

        <section className="card flex flex-col p-5">
          <h2 className="mb-5 font-bold">Últimos 6 meses</h2>
          <TrendChart data={trend(expenses, month)} selected={month} />
        </section>
      </div>
    </div>
  );
}
