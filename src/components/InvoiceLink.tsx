"use client";

import { supabaseBrowser } from "@/lib/supabase/client";
import { Icon } from "./Icons";

/** Abre a fatura num link temporário (60 s). Só funciona com sessão válida (RLS no Storage). */
export function InvoiceLink({
  file,
  className = "chip hover:text-ink",
  children,
}: {
  file: string;
  className?: string;
  children?: React.ReactNode;
}) {
  async function open(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const w = window.open("", "_blank"); // abrir já, para o browser não bloquear o popup
    const { data } = await supabaseBrowser().storage.from("casa-invoices").createSignedUrl(file, 60);
    if (data?.signedUrl && w) w.location.href = data.signedUrl;
    else {
      w?.close();
      alert("Não consegui abrir a fatura.");
    }
  }
  return (
    <button type="button" onClick={open} className={className} title="Ver fatura">
      {children ?? (
        <>
          <Icon name="file" className="h-3.5 w-3.5" /> Ver fatura
        </>
      )}
    </button>
  );
}
