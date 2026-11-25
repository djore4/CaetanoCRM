import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ItemRow } from "@/components/ItemRow";
import { ConfirmButton } from "@/components/DeleteButton";
import { addItem, clearDone, deleteList, renameList } from "../../actions";

export const dynamic = "force-dynamic";

export default async function Lista({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const list = await db.list(id);
  if (!list) notFound();

  const todo = list.items.filter((i) => !i.done);
  const done = list.items.filter((i) => i.done);

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <Link href="/listas" className="text-sm text-muted">← Listas</Link>

      <div className="flex items-center gap-3">
        <span className="text-4xl">{list.emoji}</span>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate">{list.name}</h1>
          <p className="text-sm text-muted">
            {todo.length} por fazer · {done.length} feitos
          </p>
        </div>
      </div>

      <form action={addItem.bind(null, list.id)} className="flex gap-2">
        <input name="text" className="input" placeholder="Adicionar item…" autoComplete="off" required />
        <button className="btn shrink-0">＋</button>
      </form>

      {list.items.length === 0 ? (
        <div className="card p-10 text-center text-muted">Lista vazia. Adiciona o primeiro item ☝️</div>
      ) : (
        <>
          <ul className="card divide-y divide-line">
            {todo.map((i) => <ItemRow key={i.id} item={i} />)}
            {todo.length === 0 && <li className="p-4 text-center text-muted text-sm">Tudo feito 🎉</li>}
          </ul>
          {done.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-muted">Feitos</h2>
                <form action={clearDone.bind(null, list.id)}>
                  <button className="text-sm text-accent font-semibold">Limpar feitos</button>
                </form>
              </div>
              <ul className="card divide-y divide-line">
                {done.map((i) => <ItemRow key={i.id} item={i} />)}
              </ul>
            </>
          )}
        </>
      )}

      <details className="card p-4">
        <summary className="cursor-pointer text-sm font-semibold text-muted">Definições da lista</summary>
        <form action={renameList.bind(null, list.id)} className="flex gap-2 mt-3">
          <input name="emoji" defaultValue={list.emoji} className="input !w-16 text-center" maxLength={4} />
          <input name="name" defaultValue={list.name} className="input" required />
          <button className="btn shrink-0">Guardar</button>
        </form>
        <ConfirmButton
          action={deleteList.bind(null, list.id)}
          message={`Apagar a lista "${list.name}" e todos os itens?`}
          className="mt-3 text-sm text-red-500 font-semibold"
        >
          Apagar lista
        </ConfirmButton>
      </details>
    </div>
  );
}
