"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, Logo, type IconName } from "./Icons";

const ITEMS: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Resumo", icon: "chart" },
  { href: "/despesas/", label: "Despesas", icon: "receipt" },
  { href: "/listas/", label: "Listas", icon: "list" },
];

export function Nav() {
  const raw = usePathname() || "/";
  const path = raw.replace(/\/$/, "") || "/";
  const active = (href: string) => {
    const h = href.replace(/\/$/, "") || "/";
    return h === "/" ? path === "/" : path.startsWith(h);
  };
  return (
    <>
      {/* desktop: barra lateral */}
      <nav className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-card/70 p-5 backdrop-blur-xl md:flex">
        <Link href="/" className="mb-8 flex items-center gap-3 px-2">
          <Logo />
          <span className="text-xl font-bold tracking-tight">Casa</span>
        </Link>
        <div className="space-y-1">
          {ITEMS.map((i) => {
            const on = active(i.href);
            return (
              <Link
                key={i.href}
                href={i.href}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 font-semibold transition ${
                  on ? "bg-accent-soft text-accent" : "text-muted hover:bg-soft hover:text-ink"
                }`}
              >
                <Icon name={i.icon} strokeWidth={on ? 2.2 : 1.8} />
                {i.label}
              </Link>
            );
          })}
        </div>
        <Link href="/despesas/nova/" className="btn mt-6">
          <Icon name="plus" className="h-4 w-4" strokeWidth={2.6} /> Nova despesa
        </Link>
        <p className="mt-auto px-2 text-xs text-muted">Despesas e listas partilhadas</p>
      </nav>

      {/* telemóvel: barra em baixo */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line/70 bg-card/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-3">
          {ITEMS.map((i) => {
            const on = active(i.href);
            return (
              <Link
                key={i.href}
                href={i.href}
                className={`relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition ${
                  on ? "text-accent" : "text-muted"
                }`}
              >
                <span className={`grid h-8 w-14 place-items-center rounded-full transition ${on ? "bg-accent-soft" : ""}`}>
                  <Icon name={i.icon} className="h-[1.3rem] w-[1.3rem]" strokeWidth={on ? 2.2 : 1.8} />
                </span>
                {i.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

/** Botão flutuante para registar uma despesa (só no telemóvel). */
export function Fab() {
  return (
    <Link
      href="/despesas/nova/"
      aria-label="Nova despesa"
      className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] right-5 z-30 grid h-14 w-14 place-items-center rounded-2xl text-white shadow-[0_14px_30px_-10px_var(--accent)] transition active:scale-95 md:hidden"
      style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
    >
      <Icon name="plus" className="h-6 w-6" strokeWidth={2.6} />
    </Link>
  );
}
