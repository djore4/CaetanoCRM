"use client";

import { supabaseBrowser } from "@/lib/supabase/client";

/** Abre a fatura num link temporário (60 s). Só funciona com sessão válida (RLS no Storage). */
export function InvoiceLink({ file, className }: { file: string; className?: string }) {
  async function open() {
    const w = window.open("", "_blank"); // abrir já, para o browser não bloquear o popup
    const { data } = await supabaseBrowser().storage.from("casa-invoices").createSignedUrl(file, 60);
    if (data?.signedUrl && w) w.location.href = data.signedUrl;
    else {
      w?.close();
      alert("Não consegui abrir a fatura.");
    }
  }
  return (
    <button type="button" onClick={open} className={className}>
      Ver fatura
    </button>
  );
}
