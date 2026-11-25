"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { db } from "@/lib/db";
import { useAsync } from "@/lib/useAsync";
import { useHousehold } from "@/components/AppShell";
import { BackButton } from "@/components/BackButton";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ErrorCard, Skeleton } from "@/components/Skeleton";

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

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <BackButton href="/despesas/" label="Despesas" />
      <h1 className="text-3xl font-bold tracking-tight">Editar despesa</h1>
      {error ? (
        <ErrorCard message={error} />
      ) : loading ? (
        <div className="space-y-4">
          <Skeleton className="h-56" />
          <Skeleton className="h-48" />
          <Skeleton className="h-64" />
        </div>
      ) : !e ? (
        <div className="card p-8 text-center text-muted">Esta despesa já não existe.</div>
      ) : (
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
      )}
    </div>
  );
}
