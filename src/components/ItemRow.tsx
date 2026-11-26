"use client";

import { useState } from "react";
import { db, recurLabel } from "@/lib/db";
import type { ListItem, Recurrence } from "@/lib/types";
import { Icon } from "./Icons";
import { RecurrenceFields } from "./RecurrenceFields";

export function ItemRow({ item, onChange }: { item: ListItem; onChange: () => void }) {
  const [editing, setEditing] = useState(false);
  const [done, setDone] = useState(item.done); // resposta imediata ao toque
  const [gone, setGone] = useState(false);
  const [recur, setRecur] = useState<Recurrence | null>(item.recur ?? null);

  if (gone) return null;

  if (editing) {
    return (
      <li className="p-2.5">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const text = String(new FormData(e.currentTarget).get("text") ?? "").trim();
            const patch: { text?: string; recur?: Recurrence | null } = {};
            if (text && text !== item.text) patch.text = text;
            if (JSON.stringify(recur) !== JSON.stringify(item.recur ?? null)) patch.recur = recur;
            if (patch.text !== undefined || patch.recur !== undefined) await db.updateItem(item.id, patch);
            setEditing(false);
            onChange();
          }}
          className="space-y-2"
        >
          <input name="text" defaultValue={item.text} autoFocus className="input !py-2" />
          <RecurrenceFields value={recur} onChange={setRecur} />
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost flex-1 !py-2" onClick={() => { setRecur(item.recur ?? null); setEditing(false); }}>
              Cancelar
            </button>
            <button className="btn flex-1 !py-2">Guardar</button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="group flex items-center gap-3 px-4 py-3">
      <button
        aria-label={done ? "Desmarcar" : "Marcar como feito"}
        onClick={async () => {
          setDone(!done);
          await db.toggleItem(item, !done);
          onChange();
        }}
        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition active:scale-90 ${
          done ? "border-transparent text-white" : "border-line hover:border-accent"
        }`}
        style={done ? { background: "linear-gradient(135deg, var(--accent), var(--accent-2))" } : undefined}
      >
        {done && <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} />}
      </button>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={`min-w-0 flex-1 text-left transition ${done ? "text-muted line-through decoration-muted/60" : ""}`}
      >
        {item.text}
        {item.recur && (
          <span className="mt-0.5 flex items-center gap-1 text-xs text-muted no-underline">
            <span aria-hidden>🔁</span>
            {recurLabel(item.recur)}
            {done && item.reappearAt && <> · volta {new Date(item.reappearAt).toLocaleDateString("pt-PT", { day: "numeric", month: "short" })}</>}
          </span>
        )}
      </button>
      <button
        onClick={() => setEditing(true)}
        className="icon-btn !h-8 !w-8 opacity-60 md:opacity-0 md:group-hover:opacity-100"
        aria-label="Editar"
      >
        <Icon name="pencil" className="h-4 w-4" />
      </button>
      <button
        onClick={async () => {
          setGone(true);
          await db.removeItem(item.id);
          onChange();
        }}
        className="icon-btn !h-8 !w-8 opacity-60 hover:!text-danger md:opacity-0 md:group-hover:opacity-100"
        aria-label="Remover"
      >
        <Icon name="trash" className="h-4 w-4" />
      </button>
    </li>
  );
}
