import type { Category, Expense, Settlement, UserId } from "./types";
import { monthKey, round2, shiftMonth } from "./format";

export function monthTotal(expenses: Expense[], month: string) {
  return round2(
    expenses.filter((e) => monthKey(e.date) === month).reduce((s, e) => s + e.amount, 0),
  );
}

export function byCategory(expenses: Expense[], month: string) {
  const map = new Map<Category, number>();
  for (const e of expenses) {
    if (monthKey(e.date) !== month) continue;
    map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
  }
  return [...map.entries()]
    .map(([category, total]) => ({ category, total: round2(total) }))
    .sort((a, b) => b.total - a.total);
}

export function trend(expenses: Expense[], endMonth: string, months = 6) {
  return Array.from({ length: months }, (_, i) => {
    const m = shiftMonth(endMonth, i - (months - 1));
    return { month: m, total: monthTotal(expenses, m) };
  });
}

/**
 * Saldo entre A e B. Positivo => B deve a A.
 * O pagador adianta o total; a sua parte é splitPct, o resto é dívida do outro.
 */
export function balance(expenses: Expense[], settlements: Settlement[]) {
  let aIsOwed = 0;
  for (const e of expenses) {
    const owedByOther = e.amount * (1 - e.splitPct / 100);
    aIsOwed += e.paidBy === "a" ? owedByOther : -owedByOther;
  }
  // s.from entrega dinheiro a s.to: se B paga a A, a dívida de B diminui
  for (const s of settlements) aIsOwed += s.from === "b" ? -s.amount : s.amount;
  return round2(aIsOwed);
}

export function whoOwes(bal: number): { debtor: UserId; creditor: UserId; amount: number } | null {
  if (Math.abs(bal) < 0.005) return null;
  return bal > 0
    ? { debtor: "b", creditor: "a", amount: bal }
    : { debtor: "a", creditor: "b", amount: -bal };
}
