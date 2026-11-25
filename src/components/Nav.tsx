"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Resumo", icon: "📊" },
  { href: "/despesas", label: "Despesas", icon: "🧾" },
  { href: "/listas", label: "Listas", icon: "✅" },
];

export function Nav() {
  const path = usePathname();
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  return (
    <>
      {/* desktop: barra lateral */}
      <nav className="hidden md:flex fixed inset-y-0 left-0 w-56 flex-col gap-1 p-4 border-r border-line bg-card">
        <div className="px-3 py-4 text-xl font-bold">🏡 Casa</div>
        {ITEMS.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            className={`px-3 py-2.5 rounded-xl font-medium ${
              active(i.href) ? "bg-accent text-white" : "text-muted hover:bg-bg"
            }`}
          >
            <span className="mr-2">{i.icon}</span>
            {i.label}
          </Link>
        ))}
      </nav>
      {/* telemóvel: barra em baixo */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 grid grid-cols-3 border-t border-line bg-card pb-[env(safe-area-inset-bottom)]">
        {ITEMS.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            className={`flex flex-col items-center py-2.5 text-xs font-semibold ${
              active(i.href) ? "text-accent" : "text-muted"
            }`}
          >
            <span className="text-xl leading-none mb-0.5">{i.icon}</span>
            {i.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
