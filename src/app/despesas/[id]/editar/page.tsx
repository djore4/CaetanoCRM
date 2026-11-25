import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { household } from "@/lib/users";
import { ExpenseForm } from "@/components/ExpenseForm";

export const dynamic = "force-dynamic";

export default async function Editar({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const { id } = await params;
  const { erro } = await searchParams;
  const [e, { users }] = await Promise.all([db.expense(id), household()]);
  if (!e) notFound();

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <Link href="/despesas" className="text-sm text-muted">← Voltar</Link>
      <h1 className="text-2xl font-bold">Editar despesa</h1>
      {erro && <div className="card p-4 text-sm">Faltam a descrição ou um valor válido.</div>}
      <ExpenseForm
        users={users}
        submitLabel="Guardar alterações"
        d={{
          id: e.id,
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
