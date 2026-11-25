import Link from "next/link";
import { db } from "@/lib/db";
import { CATEGORIES } from "@/lib/categories";
import { currentMonth, dayLabel, money, monthKey, monthLabel, shiftMonth } from "@/lib/format";
import { USERS } from "@/lib/users";
import { splitwiseEnabled } from "@/lib/splitwise";
import { ConfirmButton } from "@/components/DeleteButton";
import { deleteExpense, retrySplitwise } from "../actions";

export const dynamic = "force-dynamic";

export default async function Despesas({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; aviso?: string }>;
}) {
  const { mes, aviso } = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(mes ?? "") ? mes! : currentMonth();
  const rows = db
    .expenses()
    .filter((e) => monthKey(e.date) === month)
    .sort((a, b) => b.date.localeCompare(a.date));
  const total = rows.reduce((s, e) => s + e.amount, 0);
  const sw = splitwiseEnabled();

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

      {aviso === "splitwise" && (
        <div className="card p-4 text-sm border-amber-400">
          ⚠️ A despesa foi guardada, mas não foi possível enviá-la para o Splitwise. Podes tentar de novo abaixo.
        </div>
      )}

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
                    <a href={`/api/files/${e.file}`} target="_blank" className="text-xs text-accent font-semibold">
                      Ver fatura
                    </a>
                  )}
                  {sw && !e.splitwiseId && (
                    <form action={retrySplitwise.bind(null, e.id)}>
                      <button className="text-xs text-accent font-semibold">→ Splitwise</button>
                    </form>
                  )}
                  {e.splitwiseId && <span className="text-[11px] text-muted">✓ Splitwise</span>}
                  <ConfirmButton
                    action={deleteExpense.bind(null, e.id)}
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
