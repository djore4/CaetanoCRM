import { CATEGORIES } from "@/lib/categories";
import { money, monthLabel } from "@/lib/format";
import type { Category } from "@/lib/types";

export function TrendChart({ data, selected }: { data: { month: string; total: number }[]; selected: string }) {
  const max = Math.max(...data.map((d) => d.total), 1);
  return (
    <div className="flex gap-2 sm:gap-4">
      {data.map((d) => {
        const on = d.month === selected;
        return (
          <div key={d.month} className="flex-1 flex flex-col items-center gap-1.5">
            <span className={`text-[11px] font-semibold ${on ? "text-ink" : "text-muted"}`}>
              {Math.round(d.total)}€
            </span>
            <div className="h-36 w-full flex items-end">
              <div
                className="w-full rounded-t-lg transition-all"
                style={{
                  height: `${Math.max(3, (d.total / max) * 100)}%`,
                  background: on ? "var(--accent)" : "var(--line)",
                }}
                title={`${monthLabel(d.month)}: ${money(d.total)}`}
              />
            </div>
            <span className={`text-[11px] capitalize ${on ? "font-bold text-ink" : "text-muted"}`}>
              {monthLabel(d.month, false)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function CategoryBars({ rows, total }: { rows: { category: Category; total: number }[]; total: number }) {
  if (!rows.length) return <p className="text-muted text-sm py-6 text-center">Sem despesas neste mês.</p>;
  return (
    <ul className="space-y-3.5">
      {rows.map((r) => {
        const c = CATEGORIES[r.category];
        const pct = (r.total / total) * 100;
        return (
          <li key={r.category}>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="font-medium">
                {c.emoji} {c.label}
              </span>
              <span>
                <b>{money(r.total)}</b> <span className="text-muted">· {Math.round(pct)}%</span>
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-bg overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: c.color }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function Donut({ rows, total }: { rows: { category: Category; total: number }[]; total: number }) {
  const R = 52;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <svg viewBox="0 0 140 140" className="w-40 h-40 shrink-0 -rotate-90">
      <circle cx="70" cy="70" r={R} fill="none" stroke="var(--line)" strokeWidth="16" />
      {rows.map((r) => {
        const len = (r.total / total) * C;
        const el = (
          <circle
            key={r.category}
            cx="70"
            cy="70"
            r={R}
            fill="none"
            stroke={CATEGORIES[r.category].color}
            strokeWidth="16"
            strokeDasharray={`${Math.max(0, len - 1.5)} ${C}`}
            strokeDashoffset={-offset}
          />
        );
        offset += len;
        return el;
      })}
    </svg>
  );
}
