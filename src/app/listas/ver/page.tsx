"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/db";
import { ItemRow } from "@/components/ItemRow";
import { ConfirmButton } from "@/components/DeleteButton";
import { useAsync } from "@/lib/useAsync";

export default function Lista() {
  return (
    <Suspense>
      <ListaInner />
    </Suspense>
  );
}

function ListaInner() {
  const router = useRouter();
  const id = useSearchParams().get("id") ?? "";
  const { data: list, error, loading, reload } = useAsync(() => db.list(id), [id]);
  if (error) return <div className="card p-4 text-sm text-red-500">Erro a carregar: {error}</div>;
  if (loading) return <p className="text-muted">A carregar…</p>;
  if (!list)
    return (
      <div className="card p-6 text-center">
        Lista não encontrada. <Link href="/listas/" className="text-accent font-semibold">Voltar às listas</Link>
      </div>
    );

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

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          // permite colar várias linhas de uma vez
          const lines = String(new FormData(form).get("text") ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
          if (!lines.length) return;
          await db.addItems(list.id, lines);
          form.reset();
          reload();
        }}
        className="flex gap-2"
      >
        <input name="text" className="input" placeholder="Adicionar item…" autoComplete="off" required />
        <button className="btn shrink-0">＋</button>
      </form>

      {list.items.length === 0 ? (
        <div className="card p-10 text-center text-muted">Lista vazia. Adiciona o primeiro item ☝️</div>
      ) : (
        <>
          <ul className="card divide-y divide-line">
            {todo.map((i) => <ItemRow key={i.id + String(i.done)} item={i} onChange={reload} />)}
            {todo.length === 0 && <li className="p-4 text-center text-muted text-sm">Tudo feito 🎉</li>}
          </ul>
          {done.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-muted">Feitos</h2>
                <button
                  onClick={async () => {
                    await db.clearDone(list.id);
                    reload();
                  }}
                  className="text-sm text-accent font-semibold"
                >
                  Limpar feitos
                </button>
              </div>
              <ul className="card divide-y divide-line">
                {done.map((i) => <ItemRow key={i.id + String(i.done)} item={i} onChange={reload} />)}
              </ul>
            </>
          )}
        </>
      )}

      <details className="card p-4">
        <summary className="cursor-pointer text-sm font-semibold text-muted">Definições da lista</summary>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const name = String(f.get("name") ?? "").trim();
            if (name) await db.updateList(list.id, { name, emoji: String(f.get("emoji") ?? "").trim() || "📝" });
            reload();
          }}
          className="flex gap-2 mt-3"
        >
          <input name="emoji" defaultValue={list.emoji} className="input !w-16 text-center" maxLength={4} />
          <input name="name" defaultValue={list.name} className="input" required />
          <button className="btn shrink-0">Guardar</button>
        </form>
        <ConfirmButton
          action={async () => {
            await db.removeList(list.id);
            router.push("/listas/");
          }}
          message={`Apagar a lista "${list.name}" e todos os itens?`}
          className="mt-3 text-sm text-red-500 font-semibold"
        >
          Apagar lista
        </ConfirmButton>
      </details>
    </div>
  );
}
