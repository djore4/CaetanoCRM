"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/db";
import { useAsync } from "@/lib/useAsync";
import { BackButton } from "@/components/BackButton";
import { ConfirmButton } from "@/components/DeleteButton";
import { Icon } from "@/components/Icons";
import { ItemRow } from "@/components/ItemRow";
import { Modal } from "@/components/Modal";
import { ErrorCard, ListSkeleton, Skeleton } from "@/components/Skeleton";
import { useToast } from "@/components/Toast";

export default function Lista() {
  return (
    <Suspense>
      <ListaInner />
    </Suspense>
  );
}

function ListaInner() {
  const router = useRouter();
  const toast = useToast();
  const id = useSearchParams().get("id") ?? "";
  const { data: list, error, loading, reload } = useAsync(() => db.list(id), [id]);
  const [settings, setSettings] = useState(false);
  const [text, setText] = useState("");

  if (error) return <ErrorCard message={error} />;
  if (loading)
    return (
      <div className="mx-auto max-w-xl space-y-5">
        <BackButton href="/listas/" label="Listas" />
        <Skeleton className="h-20" />
        <ListSkeleton rows={4} />
      </div>
    );
  if (!list)
    return (
      <div className="mx-auto max-w-xl space-y-5">
        <BackButton href="/listas/" label="Listas" />
        <div className="card p-8 text-center text-muted">Esta lista já não existe.</div>
      </div>
    );

  const todo = list.items.filter((i) => !i.done);
  const done = list.items.filter((i) => i.done);
  const pct = list.items.length ? (done.length / list.items.length) * 100 : 0;

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div className="flex items-center justify-between">
        <BackButton href="/listas/" label="Listas" />
        <button type="button" onClick={() => setSettings(true)} className="icon-btn border border-line bg-card" aria-label="Definições da lista">
          <Icon name="more" />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-accent-soft text-3xl">{list.emoji}</span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-3xl font-bold tracking-tight">{list.name}</h1>
          <p className="text-sm text-muted">
            {todo.length} por fazer · {done.length} {done.length === 1 ? "feito" : "feitos"}
          </p>
        </div>
      </div>
      {list.items.length > 0 && (
        <div className="h-2 overflow-hidden rounded-full bg-soft">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--accent), var(--accent-2))" }}
          />
        </div>
      )}

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          // permite colar várias linhas de uma vez
          const lines = text.split("\n").map((s) => s.trim()).filter(Boolean);
          if (!lines.length) return;
          setText("");
          await db.addItems(list.id, lines);
          reload();
        }}
        className="card flex items-center gap-2 p-2 pl-4"
      >
        <Icon name="plus" className="h-5 w-5 shrink-0 text-muted" />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-w-0 flex-1 bg-transparent py-2 text-base outline-none placeholder:text-muted/70"
          placeholder="Adicionar item…"
          autoComplete="off"
          aria-label="Novo item"
        />
        <button className="btn !px-4 !py-2" disabled={!text.trim()}>
          Adicionar
        </button>
      </form>

      {list.items.length === 0 ? (
        <div className="card p-10 text-center text-muted">
          Lista vazia. Escreve o primeiro item em cima.
          <p className="mt-1 text-xs">Dica: podes colar várias linhas de uma vez.</p>
        </div>
      ) : (
        <>
          <ul className="card divide-y divide-line overflow-hidden">
            {todo.map((i) => (
              <ItemRow key={i.id + String(i.done)} item={i} onChange={reload} />
            ))}
            {todo.length === 0 && <li className="p-5 text-center text-sm text-muted">Tudo feito 🎉</li>}
          </ul>
          {done.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold text-muted">Feitos</h2>
                <button
                  onClick={async () => {
                    await db.clearDone(list.id);
                    toast("Feitos removidos");
                    reload();
                  }}
                  className="chip hover:text-ink"
                >
                  Limpar feitos
                </button>
              </div>
              <ul className="card divide-y divide-line overflow-hidden opacity-80">
                {done.map((i) => (
                  <ItemRow key={i.id + String(i.done)} item={i} onChange={reload} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <Modal open={settings} onClose={() => setSettings(false)} title="Definições da lista">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const name = String(f.get("name") ?? "").trim();
            if (name) await db.updateList(list.id, { name, emoji: String(f.get("emoji") ?? "").trim() || "📝" });
            setSettings(false);
            toast("Lista atualizada");
            reload();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-[4.5rem_1fr] gap-2">
            <div>
              <label className="label" htmlFor="lemoji">Ícone</label>
              <input id="lemoji" name="emoji" defaultValue={list.emoji} className="input text-center text-xl" maxLength={4} />
            </div>
            <div>
              <label className="label" htmlFor="lname">Nome</label>
              <input id="lname" name="name" defaultValue={list.name} className="input" required />
            </div>
          </div>
          <button className="btn w-full">Guardar</button>
        </form>
        <div className="my-5 h-px bg-line" />
        <ConfirmButton
          title="Apagar lista?"
          message={`"${list.name}" e os ${list.items.length} itens vão ser apagados. Não dá para desfazer.`}
          action={async () => {
            await db.removeList(list.id);
            toast("Lista apagada");
            router.push("/listas/");
          }}
          className="btn btn-ghost-danger w-full"
        >
          <Icon name="trash" className="h-4 w-4" /> Apagar lista
        </ConfirmButton>
      </Modal>
    </div>
  );
}
