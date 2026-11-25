import Link from "next/link";
import { CATEGORIES, CATEGORY_KEYS } from "@/lib/categories";
import { USERS, currentUser } from "@/lib/users";
import { aiEnabled } from "@/lib/extract";
import { splitwiseEnabled } from "@/lib/splitwise";
import { analyzeInvoice, saveExpense } from "../../actions";

export const dynamic = "force-dynamic";

const ERROS: Record<string, string> = {
  formato: "Formato não suportado. Usa PDF, JPG, PNG ou WebP.",
  "sem-ia": "A leitura automática não está configurada (falta ANTHROPIC_API_KEY). Preenche os dados à mão.",
  ilegivel: "Não consegui ler os dados desta fatura. Confirma-os abaixo.",
  "ia-falhou": "A leitura automática falhou. Preenche os dados à mão.",
  campos: "Faltam a descrição ou um valor válido.",
};

export default async function Nova({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const q = await searchParams;
  const me = await currentUser();
  const hasFile = !!q.file;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <Link href="/despesas" className="text-sm text-muted">← Voltar</Link>
      <h1 className="text-2xl font-bold">{hasFile ? "Confirma os dados" : "Nova despesa"}</h1>

      {q.erro && <div className="card p-4 text-sm">{ERROS[q.erro] ?? "Algo correu mal."}</div>}
      {q.ia && <div className="card p-4 text-sm">✨ Li a fatura automaticamente. Confirma antes de guardar.</div>}

      {!hasFile && (
        <form action={analyzeInvoice} className="card p-5 space-y-3">
          <label
            htmlFor="file"
            className="block border-2 border-dashed border-line rounded-2xl p-8 text-center cursor-pointer hover:border-accent transition"
          >
            <span className="text-4xl block mb-2">📄</span>
            <span className="font-semibold">Carregar fatura</span>
            <span className="block text-sm text-muted mt-1">
              PDF ou foto · {aiEnabled() ? "leitura automática ativa ✨" : "sem leitura automática (preenchimento manual)"}
            </span>
            <input id="file" name="file" type="file" accept=".pdf,image/*" capture={undefined} required className="mt-4 text-sm mx-auto block" />
          </label>
          <button className="btn w-full">Analisar fatura</button>
          <p className="text-center text-xs text-muted">ou preenche à mão em baixo</p>
        </form>
      )}

      <form action={saveExpense} className="card p-5 space-y-4">
        <input type="hidden" name="file" value={q.file ?? ""} />
        <input type="hidden" name="ia" value={q.ia ?? ""} />
        <div>
          <label className="label" htmlFor="description">Fornecedor / descrição</label>
          <input id="description" name="description" className="input" defaultValue={q.description} placeholder="Ex.: EDP" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="amount">Valor (€)</label>
            <input id="amount" name="amount" inputMode="decimal" className="input" defaultValue={q.amount} placeholder="0,00" required />
          </div>
          <div>
            <label className="label" htmlFor="date">Data</label>
            <input id="date" name="date" type="date" className="input" defaultValue={q.date ?? today} required />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="category">Categoria</label>
          <select id="category" name="category" className="input" defaultValue={q.category ?? "outros"}>
            {CATEGORY_KEYS.map((k) => (
              <option key={k} value={k}>
                {CATEGORIES[k].emoji} {CATEGORIES[k].label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="paidBy">Quem pagou</label>
            <select id="paidBy" name="paidBy" className="input" defaultValue={me}>
              <option value="a">{USERS.a.name}</option>
              <option value="b">{USERS.b.name}</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="splitPct">Parte de quem pagou</label>
            <select id="splitPct" name="splitPct" className="input" defaultValue="50">
              <option value="50">50% (a meias)</option>
              <option value="0">0% (a outra pessoa deve o valor todo)</option>
              <option value="100">100% (sem divisão, despesa só de quem pagou)</option>
              <option value="60">60%</option>
              <option value="40">40%</option>
            </select>
          </div>
        </div>
        {splitwiseEnabled() && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="splitwise" defaultChecked className="w-4 h-4" />
            Lançar também no Splitwise
          </label>
        )}
        <button className="btn w-full">Guardar despesa</button>
      </form>
    </div>
  );
}
