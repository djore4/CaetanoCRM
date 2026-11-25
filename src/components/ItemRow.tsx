"use client";

import { useState } from "react";
import { db } from "@/lib/db";
import type { ListItem } from "@/lib/types";

export function ItemRow({ item, onChange }: { item: ListItem; onChange: () => void }) {
  const [editing, setEditing] = useState(false);
  const [done, setDone] = useState(item.done); // resposta imediata ao toque

  if (editing) {
    return (
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const text = String(new FormData(e.currentTarget).get("text") ?? "").trim();
          if (text) await db.updateItem(item.id, { text });
          setEditing(false);
          onChange();
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
        onClick={async () => {
          setDone(!done);
          await db.updateItem(item.id, { done: !done });
          onChange();
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
        onClick={async () => {
          await db.removeItem(item.id);
          onChange();
        }}
        className="text-muted text-sm px-1 hover:text-red-500"
        aria-label="Remover"
      >
        ✕
      </button>
    </li>
  );
}
