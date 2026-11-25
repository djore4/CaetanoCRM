"use client";

import { useState } from "react";
import { db } from "@/lib/db";
import type { ListItem } from "@/lib/types";
import { Icon } from "./Icons";

export function ItemRow({ item, onChange }: { item: ListItem; onChange: () => void }) {
  const [editing, setEditing] = useState(false);
  const [done, setDone] = useState(item.done); // resposta imediata ao toque
  const [gone, setGone] = useState(false);

  if (gone) return null;

  if (editing) {
    return (
      <li className="p-2.5">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const text = String(new FormData(e.currentTarget).get("text") ?? "").trim();
            if (text && text !== item.text) await db.updateItem(item.id, { text });
            setEditing(false);
            onChange();
          }}
          className="flex gap-2"
        >
          <input name="text" defaultValue={item.text} autoFocus className="input !py-2" onBlur={(e) => e.currentTarget.form?.requestSubmit()} />
          <button className="btn !px-3.5 !py-2" aria-label="Guardar">
            <Icon name="check" className="h-4 w-4" strokeWidth={2.6} />
          </button>
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
          await db.updateItem(item.id, { done: !done });
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
