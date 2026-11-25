"use client";

import { useState, useTransition } from "react";
import { deleteItem, editItem, toggleItem } from "@/app/actions";
import type { ListItem } from "@/lib/types";

export function ItemRow({ listId, item }: { listId: string; item: ListItem }) {
  const [editing, setEditing] = useState(false);
  const [done, setDone] = useState(item.done); // resposta imediata ao toque
  const [, start] = useTransition();

  if (editing) {
    return (
      <form
        action={async (f) => {
          await editItem(listId, item.id, f);
          setEditing(false);
        }}
        className="flex gap-2 p-3"
      >
        <input name="text" defaultValue={item.text} autoFocus className="input" />
        <button className="btn !px-4">OK</button>
      </form>
    );
  }

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <button
        aria-label={done ? "Desmarcar" : "Marcar como feito"}
        onClick={() => {
          setDone(!done);
          start(() => toggleItem(listId, item.id, !done));
        }}
        className={`w-6 h-6 rounded-full border-2 grid place-items-center shrink-0 transition ${
          done ? "bg-accent border-accent text-white" : "border-line"
        }`}
      >
        {done && <span className="text-xs">✓</span>}
      </button>
      <span className={`flex-1 ${done ? "line-through text-muted" : ""}`}>{item.text}</span>
      <button onClick={() => setEditing(true)} className="text-muted text-sm px-1" aria-label="Editar">✎</button>
      <button
        onClick={() => start(() => deleteItem(listId, item.id))}
        className="text-muted text-sm px-1 hover:text-red-500"
        aria-label="Remover"
      >
        ✕
      </button>
    </li>
  );
}
