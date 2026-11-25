import Link from "next/link";
import { Icon } from "./Icons";

export function BackButton({ href, label = "Voltar" }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2 rounded-full border border-line bg-card py-1.5 pl-1.5 pr-4 text-sm font-semibold text-muted shadow-[var(--shadow)] transition hover:text-ink hover:border-accent/40 active:scale-[0.97]"
    >
      <span className="grid h-7 w-7 place-items-center rounded-full bg-soft text-ink transition group-hover:-translate-x-0.5 group-hover:bg-accent group-hover:text-white">
        <Icon name="chevronLeft" className="h-4 w-4" strokeWidth={2.4} />
      </span>
      {label}
    </Link>
  );
}
