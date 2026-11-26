"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/db";
import { CATEGORIES, CATEGORY_KEYS } from "@/lib/categories";
import { money } from "@/lib/format";
import { runImport, IMPORT_DAYS, type ImportProgress } from "@/lib/importInvoices";
import { msCompleteRedirect, msConfigured, msLogin, msLogout } from "@/lib/msgraph";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Category, Expense, ImportItem, UserId } from "@/lib/types";
import { useAsync } from "@/lib/useAsync";
import { useHousehold } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icons";
import { InvoiceLink } from "@/components/InvoiceLink";
import { ErrorCard, ListSkeleton } from "@/components/Skeleton";
import { useToast } from "@/components/Toast";

const parseAmount = (s: string) => Number(s.replace(/\s/g, "").replace(",", "."));
const dayDiff = (a: string, b: string) => Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 864e5;

export default function Importar() {
  const toast = useToast();
  const [account, setAccount] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [err, setErr] = useState("");
  const pending = useAsync(() => db.importItems("pending"), []);
  const expenses = useAsync(() => db.expenses(), []);

  useEffect(() => {
    msCompleteRedirect()
      .then(setAccount)
      .catch((e) => setErr(String(e?.message ?? e)))
      .finally(() => setReady(true));
  }, []);

  async function run() {
    setErr("");
    setProgress({ phase: "scan", done: 0, total: 0, found: 0 });
    try {
      const r = await runImport(setProgress);
      pending.reload();
      toast(r.found ? `${r.found} fatura(s) para rever` : "Sem faturas novas");
      if (r.failed) setErr(`${r.failed} email(s) falharam e serão tentados de novo na próxima vez.`);
    } catch (e) {
      console.error(e);
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setProgress(null);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-muted">Importar</p>
        <h1 className="text-3xl font-bold tracking-tight">Faturas do email</h1>
      </div>

      <section className="card space-y-3 p-5">
        {!msConfigured() ? (
          <p className="text-sm text-muted">
            Falta configurar <code>NEXT_PUBLIC_MS_CLIENT_ID</code> (registo de app no Azure). Ver README.
          </p>
        ) : !ready ? (
          <p className="text-sm text-muted">A verificar sessão…</p>
        ) : !account ? (
          <>
            <p className="text-sm text-muted">
              Liga o teu Hotmail/Outlook (só leitura). A ligação dura enquanto o separador estiver aberto; nada fica
              guardado no servidor.
            </p>
            <button className="btn" onClick={() => msLogin().catch((e) => setErr(String(e)))}>
              Ligar email
            </button>
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm">
                Ligado como <b>{account}</b>
              </p>
              <button className="chip hover:text-ink" onClick={() => msLogout()}>
                Terminar sessão
              </button>
            </div>
            <button className="btn" disabled={!!progress} onClick={run}>
              {progress ? "A procurar…" : `Procurar faturas (últimos ${IMPORT_DAYS} dias)`}
            </button>
            {progress && (
              <p className="text-sm text-muted">
                {progress.phase === "scan"
                  ? "A ler a caixa de correio…"
                  : `A analisar ${progress.done}/${progress.total} · ${progress.found} fatura(s) encontrada(s)`}
              </p>
            )}
          </>
        )}
        {err && <p className="text-sm text-danger break-words">{err}</p>}
      </section>

      {pending.error ? (
        <ErrorCard message={pending.error} />
      ) : !pending.data || !expenses.data ? (
        <ListSkeleton rows={3} />
      ) : (
        <Queue items={pending.data} existing={expenses.data} onChange={() => { pending.reload(); expenses.reload(); }} />
      )}
    </div>
  );
}

function Queue({ items, existing, onChange }: { items: ImportItem[]; existing: Expense[]; onChange: () => void }) {
  if (items.length === 0)
    return <p className="px-1 text-sm text-muted">Nada por rever. Corre a procura quando quiseres novas faturas.</p>;
  return (
    <div className="space-y-3">
      <p className="px-1 text-sm font-semibold text-muted">Para rever ({items.length})</p>
      {items.map((it) => (
        <Card key={it.id} item={it} existing={existing} onChange={onChange} />
      ))}
    </div>
  );
}

function Card({ item, existing, onChange }: { item: ImportItem; existing: Expense[]; onChange: () => void }) {
  const { me, users } = useHousehold();
  const toast = useToast();
  const x = item.extracted;
  const [description, setDescription] = useState(x.supplier);
  const [amount, setAmount] = useState(String(x.amount).replace(".", ","));
  const [date, setDate] = useState(x.date ?? item.receivedAt.slice(0, 10));
  const [category, setCategory] = useState<Category>(x.category);
  const [paidBy, setPaidBy] = useState<UserId>(me);
  const [busy, setBusy] = useState(false);

  const value = parseAmount(amount);
  const dup = useMemo(
    () => existing.find((e) => Math.abs(e.amount - value) < 0.005 && dayDiff(e.date, date) <= 5),
    [existing, value, date],
  );

  async function approve() {
    if (!description.trim() || !(value > 0)) return toast("Indica fornecedor e valor", "err");
    setBusy(true);
    try {
      const id = await db.addExpense({
        description: description.trim(),
        category,
        amount: Math.round(value * 100) / 100,
        date,
        paidBy,
        splitPct: 50,
        file: item.file,
        source: "email",
      });
      await db.setImportStatus(item.id, "approved", id);
      toast("Despesa lançada");
      onChange();
    } catch (e) {
      console.error(e);
      toast("Não foi possível guardar", "err");
      setBusy(false);
    }
  }

  async function ignore() {
    setBusy(true);
    try {
      await db.setImportStatus(item.id, "ignored");
      if (item.file) await supabaseBrowser().storage.from("casa-invoices").remove([item.file]);
      onChange();
    } catch (e) {
      console.error(e);
      toast("Não foi possível ignorar", "err");
      setBusy(false);
    }
  }

  return (
    <div className="card space-y-3 p-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <span className="truncate">{item.sender}</span>
        <span>·</span>
        <span className="truncate">{item.subject}</span>
        {x.confidence !== "high" && <span className="chip !text-danger">confiança {x.confidence === "low" ? "baixa" : "média"}</span>}
        {dup && <span className="chip !text-danger">possível duplicado: {dup.description} · {money(dup.amount)}</span>}
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_7rem_9rem]">
        <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} aria-label="Fornecedor" />
        <input className="input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))} aria-label="Valor" />
        <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Data" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select className="input !w-auto" value={category} onChange={(e) => setCategory(e.target.value as Category)} aria-label="Categoria">
          {CATEGORY_KEYS.map((k) => (
            <option key={k} value={k}>
              {CATEGORIES[k].emoji} {CATEGORIES[k].label}
            </option>
          ))}
        </select>
        <div className="seg !w-auto">
          {(["a", "b"] as UserId[]).map((u) => (
            <button key={u} type="button" aria-pressed={paidBy === u} onClick={() => setPaidBy(u)} className="!py-1.5">
              <Avatar name={users[u].name} color={users[u].color} size="xs" />
              {users[u].name}
            </button>
          ))}
        </div>
        {item.file && <InvoiceLink file={item.file} />}
      </div>

      <div className="flex justify-end gap-2">
        <button className="btn btn-ghost" disabled={busy} onClick={ignore}>
          Ignorar
        </button>
        <button className="btn" disabled={busy} onClick={approve}>
          <Icon name="check" className="h-4 w-4" strokeWidth={2.6} /> Lançar (50/50)
        </button>
      </div>
    </div>
  );
}
