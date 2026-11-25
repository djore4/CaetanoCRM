import type { Expense, UserId } from "./types";
import { round2 } from "./format";

/**
 * Integração com a API do Splitwise (v3.0).
 * ATENÇÃO: não foi testada contra uma conta real neste rascunho.
 */
const BASE = "https://secure.splitwise.com/api/v3.0";

export const splitwiseEnabled = () =>
  !!(
    process.env.SPLITWISE_API_KEY &&
    process.env.SPLITWISE_GROUP_ID &&
    process.env.SPLITWISE_USER_IDS?.split(",").length === 2
  );

export async function pushToSplitwise(e: Expense): Promise<string> {
  const ids = process.env.SPLITWISE_USER_IDS!.split(",").map((s) => s.trim());
  const idOf = (u: UserId) => ids[u === "a" ? 0 : 1];
  const payer: UserId = e.paidBy;
  const debtor: UserId = payer === "a" ? "b" : "a";

  const cost = round2(e.amount);
  const payerOwes = round2((cost * e.splitPct) / 100);
  const debtorOwes = round2(cost - payerOwes);

  const body = {
    cost: cost.toFixed(2),
    description: e.description,
    date: e.date,
    currency_code: "EUR",
    group_id: Number(process.env.SPLITWISE_GROUP_ID),
    users__0__user_id: Number(idOf(payer)),
    users__0__paid_share: cost.toFixed(2),
    users__0__owed_share: payerOwes.toFixed(2),
    users__1__user_id: Number(idOf(debtor)),
    users__1__paid_share: "0.00",
    users__1__owed_share: debtorOwes.toFixed(2),
  };

  const res = await fetch(`${BASE}/create_expense`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SPLITWISE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as {
    expenses?: { id: number }[];
    errors?: Record<string, string[]>;
  };
  if (!res.ok || (json.errors && Object.keys(json.errors).length)) {
    throw new Error(`Splitwise: ${JSON.stringify(json.errors ?? res.status)}`);
  }
  return String(json.expenses?.[0]?.id ?? "");
}
