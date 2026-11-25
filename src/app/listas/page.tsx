"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db";
import { useAsync } from "@/lib/useAsync";

const EMOJIS = ["🛒", "🎄", "📌", "🎁", "🧹", "✈️", "🍽️", "🔧", "📝"];

export default function Listas() {
  const router = useRouter();
  const { data: lists, error } = useAsync(() => db.lists(), []);
  async function create(name: string, emoji: string) {
    if (!name.trim()) return;
    const id = await db.addList(name.trim(), emoji || "📝");
    router.push(`/listas/ver/?id=${id}`);
  }
  if (error) return <div className="card p-4 text-sm text-red-500">Erro a carregar: {error}</div>;
  if (!lists) return <p className="text-muted">A carregar…</p>;
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
              <button key={name} onClick={() => create(name, emoji)} className="btn btn-ghost">
                {emoji} {name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {lists.map((l) => {
          const open = l.items.filter((i) => !i.done).length;
          const pct = l.items.length ? ((l.items.length - open) / l.items.length) * 100 : 0;
          return (
            <Link key={l.id} href={`/listas/ver/?id=${l.id}`} className="card p-5 hover:border-accent transition">
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

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          create(String(f.get("name") ?? ""), String(f.get("emoji") ?? ""));
        }}
        className="card p-4 flex gap-2 items-center"
      >
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
