"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useHousehold } from "@/components/AppShell";
import { BackButton } from "@/components/BackButton";
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
  const { slot, users } = useHousehold();

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <BackButton href="/despesas/" label="Despesas" />
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nova despesa</h1>
        <p className="text-sm text-muted">{file ? "Fatura anexada. Falta preencher os dados." : "Regista o que pagaram e como dividir."}</p>
      </div>
      {!file && <InvoiceUploader />}
      <ExpenseForm key={file ?? "sem-ficheiro"} users={users} submitLabel="Guardar despesa" d={{ file, paidBy: slot }} />
    </div>
  );
}
