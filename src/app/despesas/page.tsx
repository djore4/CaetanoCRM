"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { db } from "@/lib/db";
import { CATEGORIES } from "@/lib/categories";
import { currentMonth, dayHeading, money, monthKey } from "@/lib/format";
import type { Expense } from "@/lib/types";
import { useAsync } from "@/lib/useAsync";
import { useHousehold } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icons";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import { ErrorCard, ListSkeleton } from "@/components/Skeleton";

export default function Despesas() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <DespesasInner />
    </Suspense>
  );
}

function DespesasInner() {
  const mes = useSearchParams().get("mes") ?? "";
  const month = /^\d{4}-\d{2}$/.test(mes) ? mes : currentMonth();
  const { users: USERS } = useHousehold();
  const { data, error } = useAsync(() => db.expenses(), []);

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-muted">Despesas</p>
        <h1 className="text-3xl font-bold tracking-tight">
          {data ? money(data.filter((e) => monthKey(e.date) === month).reduce((s, e) => s + e.amount, 0)) : "…"}
        </h1>
      </div>
      <MonthSwitcher month={month} base="/despesas/" />
    </div>
  );

  if (error) return <ErrorCard message={error} />;
  if (!data)
    return (
      <div className="space-y-5">
        {header}
        <ListSkeleton />
      </div>
    );

  const rows = data.filter((e) => monthKey(e.date) === month);
  const groups = new Map<string, Expense[]>();
  for (const e of rows) groups.set(e.date, [...(groups.get(e.date) ?? []), e]);

  return (
    <div className="space-y-5">
      {header}

      {rows.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-soft text-2xl">🧾</div>
          <p className="font-semibold">Sem despesas neste mês</p>
          <p className="mb-5 text-sm text-muted">Quando registarem alguma, aparece aqui.</p>
          <Link href="/despesas/nova/" className="btn">
            <Icon name="plus" className="h-4 w-4" strokeWidth={2.6} /> Nova despesa
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {[...groups.entries()].map(([date, list]) => (
            <section key={date}>
              <div className="mb-2 flex items-baseline justify-between px-1">
                <h2 className="text-sm font-semibold text-muted first-letter:uppercase">{dayHeading(date)}</h2>
                <span className="tnum text-xs font-semibold text-muted">
                  {money(list.reduce((s, e) => s + e.amount, 0))}
                </span>
              </div>
              <ul className="card divide-y divide-line overflow-hidden">
                {list.map((e) => {
                  const c = CATEGORIES[e.category];
                  const payer = USERS[e.paidBy];
                  return (
                    <li key={e.id}>
                      <Link
                        href={`/despesas/editar/?id=${e.id}`}
                        className="flex items-center gap-3.5 p-4 pr-5 transition hover:bg-soft/60"
                      >
                        <span
                          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-xl"
                          style={{ background: `color-mix(in srgb, ${c.color} 16%, transparent)` }}
                        >
                          {c.emoji}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">{e.description}</p>
                          <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted">
                            <Avatar name={payer.name} color={payer.color} size="xs" />
                            {payer.name}
                            <span className="opacity-50">·</span>
                            {e.splitPct === 50
                              ? "a meias"
                              : e.splitPct === 100
                                ? "sem divisão"
                                : e.splitPct === 0
                                  ? `tudo por conta de ${USERS[e.paidBy === "a" ? "b" : "a"].name}`
                                  : `${e.splitPct}/${100 - e.splitPct}`}
                            {e.file && (
                              <>
                                <span className="opacity-50">·</span>
                                <Icon name="file" className="h-3.5 w-3.5" />
                              </>
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="tnum font-bold">{money(e.amount)}</p>
                          <p className="text-xs text-muted">{c.label}</p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
