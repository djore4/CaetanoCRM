"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db";
import { useAsync } from "@/lib/useAsync";
import { Icon } from "@/components/Icons";
import { ProgressRing } from "@/components/ProgressRing";
import { ErrorCard, Skeleton } from "@/components/Skeleton";

const EMOJIS = ["🛒", "🎄", "📌", "🎁", "🧹", "✈️", "🍽️", "🔧", "💊", "📚", "🐾", "📝"];
const TEMPLATES: [string, string][] = [
  ["🛒", "Supermercado"],
  ["🎄", "Compras de Natal"],
  ["📌", "Pendentes"],
  ["🧹", "Limpezas"],
];

export default function Listas() {
  const router = useRouter();
  const { data: lists, error } = useAsync(() => db.lists(), []);
  const [emoji, setEmoji] = useState("📝");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function create(n: string, e: string) {
    if (!n.trim() || busy) return;
    setBusy(true);
    const id = await db.addList(n.trim(), e || "📝");
    router.push(`/listas/ver/?id=${id}`);
  }

  if (error) return <ErrorCard message={error} />;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-muted">Listas</p>
        <h1 className="text-3xl font-bold tracking-tight">O que há para fazer</h1>
      </div>

      {!lists ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : lists.length === 0 ? (
        <div className="card p-7 text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-accent-soft text-2xl">✅</div>
          <p className="font-bold">Ainda não há listas</p>
          <p className="mb-5 text-sm text-muted">Começa por uma destas, ou cria a tua em baixo.</p>
          <div className="flex flex-wrap justify-center gap-2">
            {TEMPLATES.map(([e, n]) => (
              <button key={n} onClick={() => create(n, e)} className="btn btn-ghost !py-2 text-sm">
                {e} {n}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((l) => {
            const open = l.items.filter((i) => !i.done).length;
            const pct = l.items.length ? ((l.items.length - open) / l.items.length) * 100 : 0;
            return (
              <Link
                key={l.id}
                href={`/listas/ver/?id=${l.id}`}
                className="card group flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:border-accent/40"
              >
                <div className="relative grid place-items-center">
                  <ProgressRing pct={pct} size={52} />
                  <span className="absolute text-xl">{l.emoji}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{l.name}</p>
                  <p className="text-sm text-muted">
                    {l.items.length === 0 ? "Vazia" : open === 0 ? "Tudo feito ✓" : `${open} por fazer`}
                  </p>
                </div>
                <Icon name="chevronRight" className="h-5 w-5 text-muted transition group-hover:translate-x-0.5" />
              </Link>
            );
          })}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          create(name, emoji);
        }}
        className="card p-4"
      >
        <p className="label px-1">Nova lista</p>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              aria-pressed={emoji === e}
              onClick={() => setEmoji(e)}
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg transition ${
                emoji === e ? "bg-accent-soft ring-2 ring-accent" : "bg-soft hover:scale-105"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="Ex.: Férias, Obras…"
            aria-label="Nome da lista"
          />
          <button className="btn shrink-0" disabled={!name.trim() || busy}>
            Criar
          </button>
        </div>
      </form>
    </div>
  );
}
