import Link from "next/link";
import { currentMonth, monthLabel, shiftMonth } from "@/lib/format";

const short = (m: string) => `${monthLabel(m, false).replace(".", "")} ${m.slice(0, 4)}`;
import { Icon } from "./Icons";

export function MonthSwitcher({ month, base }: { month: string; base: string }) {
  const cur = currentMonth();
  const isCur = month === cur;
  const href = (m: string) => (m === cur ? base : `${base}?mes=${m}`);
  return (
    <div className="flex items-center gap-2">
      <div className="inline-flex items-center gap-0.5 rounded-full border border-line bg-card p-1 shadow-[var(--shadow)]">
        <Link href={href(shiftMonth(month, -1))} className="icon-btn !w-8 !h-8" aria-label="Mês anterior">
          <Icon name="chevronLeft" className="h-4 w-4" strokeWidth={2.4} />
        </Link>
        <span className="tnum min-w-[5.5rem] px-1 text-center text-sm font-semibold">{short(month)}</span>
        <Link
          href={href(shiftMonth(month, 1))}
          aria-label="Mês seguinte"
          className={`icon-btn !w-8 !h-8 ${isCur ? "pointer-events-none opacity-25" : ""}`}
          aria-disabled={isCur}
        >
          <Icon name="chevronRight" className="h-4 w-4" strokeWidth={2.4} />
        </Link>
      </div>
      {!isCur && (
        <Link href={base} className="chip !py-1.5 hover:text-ink">
          Hoje
        </Link>
      )}
    </div>
  );
}
