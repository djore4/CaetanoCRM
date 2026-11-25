import Link from "next/link";
import { db } from "@/lib/db";
import { createList } from "../actions";

export const dynamic = "force-dynamic";

const EMOJIS = ["🛒", "🎄", "📌", "🎁", "🧹", "✈️", "🍽️", "🔧", "📝"];

export default async function Listas() {
  const lists = await db.lists();
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Listas</h1>

      {lists.length === 0 && (
        <div className="card p-6 text-center space-y-4">
          <p className="text-4xl">✅</p>
          <p className="text-muted text-sm">Ainda não há listas. Começa por uma destas:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              ["🛒", "Supermercado"],
              ["🎄", "Compras de Natal"],
              ["📌", "Pendentes"],
            ].map(([emoji, name]) => (
              <form key={name} action={createList}>
                <input type="hidden" name="emoji" value={emoji} />
                <input type="hidden" name="name" value={name} />
                <button className="btn btn-ghost">{emoji} {name}</button>
              </form>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {lists.map((l) => {
          const open = l.items.filter((i) => !i.done).length;
          const pct = l.items.length ? ((l.items.length - open) / l.items.length) * 100 : 0;
          return (
            <Link key={l.id} href={`/listas/${l.id}`} className="card p-5 hover:border-accent transition">
              <div className="text-3xl">{l.emoji}</div>
              <p className="font-bold mt-2 truncate">{l.name}</p>
              <p className="text-sm text-muted">
                {l.items.length === 0 ? "Vazia" : open === 0 ? "Tudo feito ✓" : `${open} por fazer`}
              </p>
              <div className="h-1.5 rounded-full bg-bg mt-3 overflow-hidden">
                <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </Link>
          );
        })}
      </div>

      <form action={createList} className="card p-4 flex gap-2 items-center">
        <select name="emoji" className="input !w-20 text-xl" aria-label="Ícone">
          {EMOJIS.map((e) => (
            <option key={e}>{e}</option>
          ))}
        </select>
        <input name="name" className="input" placeholder="Nova lista (ex.: Férias)" required />
        <button className="btn shrink-0">Criar</button>
      </form>
    </div>
  );
}
