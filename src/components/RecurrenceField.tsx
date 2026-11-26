"use client";

import { useState } from "react";
import { recurExplain, recurLabel } from "@/lib/db";
import type { Recurrence, RecurUnit } from "@/lib/types";
import { Icon } from "./Icons";
import { Modal } from "./Modal";

const PRESETS: { label: string; value: Recurrence | null }[] = [
  { label: "Não repete", value: null },
  { label: "Todos os dias", value: { mode: "every", unit: "day", n: 1 } },
  { label: "Todas as semanas", value: { mode: "every", unit: "week", n: 1 } },
  { label: "Todos os meses", value: { mode: "every", unit: "month", n: 1 } },
];

const same = (a: Recurrence | null, b: Recurrence | null) => JSON.stringify(a) === JSON.stringify(b);
const UNIT_LABEL: Record<RecurUnit, string> = { day: "Dias", week: "Semanas", month: "Meses" };

function Stepper({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-2xl bg-soft p-1">
      <button type="button" className="icon-btn !h-10 !w-10 disabled:opacity-30" disabled={value <= min} onClick={() => onChange(value - 1)} aria-label="Menos">
        <Icon name="minus" className="h-4 w-4" strokeWidth={2.4} />
      </button>
      <span className="w-10 text-center text-lg font-bold tabular-nums">{value}</span>
      <button type="button" className="icon-btn !h-10 !w-10 disabled:opacity-30" disabled={value >= max} onClick={() => onChange(value + 1)} aria-label="Mais">
        <Icon name="plus" className="h-4 w-4" strokeWidth={2.4} />
      </button>
    </div>
  );
}

/** Folha "Repetir": predefinições + personalizado ("a cada N …" ou "N vezes por …"). */
function RecurrenceSheet({ value, onApply, onClose }: { value: Recurrence | null; onApply: (r: Recurrence | null) => void; onClose: () => void }) {
  const [draft, setDraft] = useState<Recurrence | null>(value);
  const isPreset = PRESETS.some((p) => same(p.value, draft));
  const [custom, setCustom] = useState(!isPreset);
  const c: Recurrence = draft && !isPreset ? draft : draft ?? { mode: "every", unit: "week", n: 2 };

  const setMode = (mode: Recurrence["mode"]) =>
    setDraft(mode === "every" ? { mode, unit: c.unit, n: Math.min(c.n, 30) } : { mode, unit: c.unit === "day" ? "week" : c.unit, n: Math.min(c.n, c.unit === "month" ? 31 : 7) });
  const setUnit = (unit: RecurUnit) => setDraft({ ...c, unit, n: c.mode === "times" ? Math.min(c.n, unit === "week" ? 7 : 31) : c.n });
  const max = c.mode === "times" ? (c.unit === "week" ? 7 : 31) : 30;

  return (
    <>
      <ul className="overflow-hidden rounded-2xl border border-line">
        {PRESETS.map((p) => {
          const on = !custom && same(p.value, draft);
          return (
            <li key={p.label} className="border-b border-line last:border-b-0">
              <button
                type="button"
                onClick={() => {
                  setDraft(p.value);
                  setCustom(false);
                }}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-soft"
              >
                <span className={on ? "font-semibold" : ""}>{p.label}</span>
                {on && <Icon name="check" className="h-4 w-4 text-accent" strokeWidth={2.6} />}
              </button>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={() => {
              setCustom(true);
              setDraft(isPreset ? { mode: "every", unit: "week", n: 2 } : draft);
            }}
            className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-soft"
          >
            <span className={custom ? "font-semibold" : ""}>Personalizado</span>
            {custom ? <Icon name="check" className="h-4 w-4 text-accent" strokeWidth={2.6} /> : <Icon name="chevronRight" className="h-4 w-4 text-muted" />}
          </button>
        </li>
      </ul>

      {custom && draft && (
        <div className="mt-4 space-y-3">
          <div className="seg" role="group" aria-label="Tipo de repetição">
            <button type="button" aria-pressed={draft.mode === "every"} onClick={() => setMode("every")}>A cada…</button>
            <button type="button" aria-pressed={draft.mode === "times"} onClick={() => setMode("times")}>Vezes por…</button>
          </div>
          <div className="flex items-center gap-3">
            <Stepper value={draft.n} min={1} max={max} onChange={(n) => setDraft({ ...draft, n })} />
            <div className="seg flex-1" role="group" aria-label="Unidade">
              {(draft.mode === "every" ? (["day", "week", "month"] as const) : (["week", "month"] as const)).map((u) => (
                <button key={u} type="button" aria-pressed={draft.unit === u} onClick={() => setUnit(u)}>
                  {UNIT_LABEL[u]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <p className="mt-4 min-h-10 rounded-2xl bg-accent-soft px-4 py-2.5 text-sm text-ink">
        {draft ? recurExplain(draft) : "O item não volta a aparecer depois de concluído."}
      </p>
      <button
        type="button"
        className="btn mt-4 w-full"
        onClick={() => {
          onApply(draft);
          onClose();
        }}
      >
        Aplicar
      </button>
    </>
  );
}

/** Botão "Repetir" que abre a folha de recorrência. */
export function RecurrenceField({ value, onChange }: { value: Recurrence | null; onChange: (r: Recurrence | null) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`chip !px-3 !py-1.5 ${value ? "!bg-accent-soft !text-accent" : "hover:text-ink"}`}
      >
        <Icon name="repeat" className="h-3.5 w-3.5" strokeWidth={2.2} />
        {value ? recurLabel(value) : "Repetir"}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Repetir">
        <RecurrenceSheet value={value} onApply={onChange} onClose={() => setOpen(false)} />
      </Modal>
    </>
  );
}
