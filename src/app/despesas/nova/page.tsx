"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useHousehold } from "@/components/AppShell";
import { ExpenseForm } from "@/components/ExpenseForm";
import { InvoiceUploader } from "@/components/InvoiceUploader";

export default function Nova() {
  return (
    <Suspense>
      <NovaInner />
    </Suspense>
  );
}

function NovaInner() {
  const file = useSearchParams().get("file") ?? undefined;
  const { me, users } = useHousehold();

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <Link href="/despesas/" className="text-sm text-muted">← Voltar</Link>
      <h1 className="text-2xl font-bold">{file ? "Fatura anexada: preenche os dados" : "Nova despesa"}</h1>

      {!file && <InvoiceUploader />}

      <ExpenseForm users={users} submitLabel="Guardar despesa" d={{ file, paidBy: me }} />
    </div>
  );
}
