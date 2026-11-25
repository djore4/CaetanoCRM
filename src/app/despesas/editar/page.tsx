"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { db } from "@/lib/db";
import { useHousehold } from "@/components/AppShell";
import { ExpenseForm } from "@/components/ExpenseForm";
import { useAsync } from "@/lib/useAsync";

export default function Editar() {
  return (
    <Suspense>
      <EditarInner />
    </Suspense>
  );
}

function EditarInner() {
  const id = useSearchParams().get("id") ?? "";
  const { users } = useHousehold();
  const { data: e, loading, error } = useAsync(() => db.expense(id), [id]);
  if (error) return <div className="card p-4 text-sm text-red-500">Erro a carregar: {error}</div>;
  if (loading) return <p className="text-muted">A carregar…</p>;
  if (!e)
    return (
      <div className="card p-6 text-center">
        Despesa não encontrada. <Link href="/despesas/" className="text-accent font-semibold">Voltar</Link>
      </div>
    );

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <Link href="/despesas/" className="text-sm text-muted">← Voltar</Link>
      <h1 className="text-2xl font-bold">Editar despesa</h1>
      <ExpenseForm
        users={users}
        submitLabel="Guardar alterações"
        d={{
          id: e.id,
          file: e.file,
          description: e.description,
          amount: String(e.amount).replace(".", ","),
          date: e.date,
          category: e.category,
          paidBy: e.paidBy,
          splitPct: e.splitPct,
        }}
      />
    </div>
  );
}
