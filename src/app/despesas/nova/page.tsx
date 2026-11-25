import Link from "next/link";
import { household } from "@/lib/users";
import { aiEnabled } from "@/lib/extract";
import { ExpenseForm } from "@/components/ExpenseForm";
import { InvoiceUploader } from "@/components/InvoiceUploader";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // a leitura da fatura pode demorar alguns segundos

const ERROS: Record<string, string> = {
  formato: "Formato não suportado. Usa PDF, JPG, PNG ou WebP.",
  ficheiro: "Não consegui abrir o ficheiro carregado. Tenta de novo.",
  "sem-ia": "A leitura automática não está configurada (falta ANTHROPIC_API_KEY). Preenche os dados à mão.",
  ilegivel: "Não consegui ler os dados desta fatura. Confirma-os abaixo.",
  "ia-falhou": "A leitura automática falhou. Preenche os dados à mão.",
  campos: "Faltam a descrição ou um valor válido.",
};

export default async function Nova({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const q = await searchParams;
  const { me, users } = await household();

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <Link href="/despesas" className="text-sm text-muted">← Voltar</Link>
      <h1 className="text-2xl font-bold">{q.file ? "Confirma os dados" : "Nova despesa"}</h1>

      {q.erro && <div className="card p-4 text-sm">{ERROS[q.erro] ?? "Algo correu mal."}</div>}
      {q.ia && <div className="card p-4 text-sm">✨ Li a fatura automaticamente. Confirma antes de guardar.</div>}

      {!q.file && <InvoiceUploader aiEnabled={aiEnabled()} />}

      <ExpenseForm
        users={users}
        submitLabel="Guardar despesa"
        d={{
          file: q.file,
          ia: q.ia,
          description: q.description,
          amount: q.amount,
          date: q.date,
          category: q.category,
          paidBy: me,
        }}
      />
    </div>
  );
}
