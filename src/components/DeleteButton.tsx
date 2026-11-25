"use client";

import { useState } from "react";
import { Modal } from "./Modal";

/** Botão que pede confirmação numa janela antes de executar a ação. */
export function ConfirmButton({
  action,
  message,
  title = "Tens a certeza?",
  confirmLabel = "Apagar",
  danger = true,
  className,
  children,
}: {
  action: () => Promise<void>;
  message: string;
  title?: string;
  confirmLabel?: string;
  danger?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {children}
      </button>
      <Modal open={open} onClose={() => !busy && setOpen(false)} title={title}>
        <p className="text-muted">{message}</p>
        <div className="mt-6 grid grid-cols-2 gap-2.5">
          <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)} disabled={busy}>
            Cancelar
          </button>
          <button
            type="button"
            className={`btn ${danger ? "btn-danger" : ""}`}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await action();
                setOpen(false);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Um momento…" : confirmLabel}
          </button>
        </div>
      </Modal>
    </>
  );
}
