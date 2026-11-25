"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { db } from "@/lib/db";
import { CATEGORIES } from "@/lib/categories";
import { currentMonth, dayLabel, money, monthKey, monthLabel, shiftMonth } from "@/lib/format";
import { useHousehold } from "@/components/AppShell";
import { InvoiceLink } from "@/components/InvoiceLink";
import { useAsync } from "@/lib/useAsync";
import { ConfirmButton } from "@/components/DeleteButton";

export default function Despesas() {
  return (
    <Suspense>
      <DespesasInner />
    </Suspense>
  );
}

function DespesasInner() {
  const mes = useSearchParams().get("mes") ?? "";
  const month = /^\d{4}-\d{2}$/.test(mes) ? mes : currentMonth();
  const { users: USERS } = useHousehold();
  const { data, error, reload } = useAsync(() => db.expenses(), []);
  if (error) return <div className="card p-4 text-sm text-red-500">Erro a carregar: {error}</div>;
  if (!data) return <p className="text-muted">A carregar…</p>;
  const rows = data.filter((e) => monthKey(e.date) === month);
  const total = rows.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold first-letter:uppercase">{monthLabel(month)}</h1>
          <p className="text-muted text-sm">
            {rows.length} despesas · {money(total)}
          </p>
        </div>
        <Link href="/despesas/nova" className="btn">＋ Nova</Link>
      </div>

      <div className="flex gap-2">
        <Link href={`/despesas?mes=${shiftMonth(month, -1)}`} className="btn btn-ghost !px-3">←</Link>
        <Link href={`/despesas?mes=${shiftMonth(month, 1)}`} className="btn btn-ghost !px-3">→</Link>
      </div>

      {rows.length === 0 ? (
        <div className="card p-10 text-center text-muted">
          <p className="text-4xl mb-2">🧾</p>
          Ainda não há despesas neste mês.
        </div>
      ) : (
        <ul className="card divide-y divide-line overflow-hidden">
          {rows.map((e) => {
            const c = CATEGORIES[e.category];
            const mine = e.amount * (e.splitPct / 100);
            return (
              <li key={e.id} className="flex items-center gap-3 p-4">
                <div
                  className="w-11 h-11 rounded-2xl grid place-items-center text-xl shrink-0"
                  style={{ background: c.color + "26" }}
                >
                  {c.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{e.description}</p>
                  <p className="text-xs text-muted truncate">
                    {dayLabel(e.date)} · pago por{" "}
                    <span style={{ color: USERS[e.paidBy].color }} className="font-semibold">
                      {USERS[e.paidBy].name}
                    </span>
                    {e.splitPct !== 50 && ` · ${e.splitPct}/${100 - e.splitPct}`}
                    {e.source === "ia" && " · ✨"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold">{money(e.amount)}</p>
                  <p className="text-xs text-muted">{money(mine)} cada</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {e.file && (
                    <InvoiceLink file={e.file} className="text-xs text-accent font-semibold" />
                  )}
                  <Link href={`/despesas/editar/?id=${e.id}`} className="text-xs text-accent font-semibold">
                    Editar
                  </Link>
                  <ConfirmButton
                    action={async () => {
                      await db.removeExpense(e.id);
                      reload();
                    }}
                    message={`Apagar "${e.description}"?`}
                    className="text-xs text-red-500 font-semibold"
                  >
                    Apagar
                  </ConfirmButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
