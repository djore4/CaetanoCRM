"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icons";

/** Folha inferior no telemóvel, janela centrada no ecrã grande. Fecha com Esc ou toque fora. */
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[3px] anim-fade" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full sm:max-w-md bg-card border border-line rounded-t-[1.75rem] sm:rounded-[1.75rem] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-6 shadow-[var(--shadow-lg)] anim-sheet max-h-[90dvh] overflow-y-auto"
      >
        <div className="sm:hidden mx-auto -mt-2 mb-4 h-1.5 w-10 rounded-full bg-line" />
        {title && (
          <div className="flex items-center justify-between gap-3 mb-5">
            <h2 className="text-lg font-bold tracking-tight">{title}</h2>
            <button type="button" onClick={onClose} className="icon-btn -mr-2" aria-label="Fechar">
              <Icon name="x" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
