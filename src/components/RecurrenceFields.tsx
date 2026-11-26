"use client";

import type { RecurKind, Recurrence } from "@/lib/types";

/** Escolha de recorrência: não repete · a cada N dias · N vezes por semana · N vezes por mês. */
export function RecurrenceFields({
  value,
  onChange,
}: {
  value: Recurrence | null;
  onChange: (r: Recurrence | null) => void;
}) {
  const max = value?.kind === "week" ? 7 : value?.kind === "month" ? 31 : 60;
  return (
    <div className="flex items-center gap-2">
      <select
        aria-label="Repetição"
        className="input !py-2"
        value={value?.kind ?? ""}
        onChange={(e) => {
          const kind = e.target.value as RecurKind | "";
          onChange(kind ? { kind, n: Math.min(value?.n ?? (kind === "days" ? 7 : 1), kind === "week" ? 7 : kind === "month" ? 31 : 60) } : null);
        }}
      >
        <option value="">Não repete</option>
        <option value="days">A cada N dias</option>
        <option value="week">N vezes por semana</option>
        <option value="month">N vezes por mês</option>
      </select>
      {value && (
        <input
          aria-label="Quantidade"
          type="number"
          inputMode="numeric"
          min={1}
          max={max}
          value={value.n}
          onChange={(e) => {
            const n = Math.min(max, Math.max(1, Math.round(Number(e.target.value) || 1)));
            onChange({ ...value, n });
          }}
          className="input !w-20 shrink-0 !py-2 text-center"
        />
      )}
    </div>
  );
}
