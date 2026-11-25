"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { Icon } from "./Icons";

type Kind = "ok" | "err";
const Ctx = createContext<(msg: string, kind?: Kind) => void>(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<{ id: number; msg: string; kind: Kind }[]>([]);
  const toast = useCallback((msg: string, kind: Kind = "ok") => {
    const id = Date.now() + Math.random();
    setItems((x) => [...x.slice(-2), { id, msg, kind }]);
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 2800);
  }, []);
  return (
    <Ctx.Provider value={toast}>
      {children}
      <div
        aria-live="polite"
        className="fixed z-[60] inset-x-0 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] md:bottom-8 flex flex-col gap-2 items-center pointer-events-none px-4"
      >
        {items.map((i) => (
          <div
            key={i.id}
            className="anim-toast flex items-center gap-2.5 rounded-2xl bg-ink text-bg pl-3 pr-4 py-2.5 text-sm font-semibold shadow-[var(--shadow-lg)]"
          >
            <span
              className={`w-6 h-6 rounded-full grid place-items-center ${i.kind === "ok" ? "bg-success" : "bg-danger"} text-white`}
            >
              <Icon name={i.kind === "ok" ? "check" : "x"} className="w-3.5 h-3.5" strokeWidth={3} />
            </span>
            {i.msg}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
