"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Icon } from "./Icons";

const MAX_PDF = 20 * 1024 * 1024;

/** Reduz fotos grandes (telemóvel) para carregarem depressa. */
async function shrinkImage(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("canvas"))), "image/jpeg", 0.85));
}

export function InvoiceUploader() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState("");

  async function onFile(file: File) {
    setError("");
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf && !file.type.startsWith("image/")) return setError("Usa um PDF ou uma foto (JPG, PNG).");
    if (isPdf && file.size > MAX_PDF) return setError("PDF demasiado grande (máx. 20 MB).");
    try {
      setBusy(true);
      const body: Blob = isPdf ? file : await shrinkImage(file);
      const name = `${crypto.randomUUID()}.${isPdf ? "pdf" : "jpg"}`;
      const { error: upErr } = await supabaseBrowser()
        .storage.from("casa-invoices")
        .upload(name, body, { contentType: isPdf ? "application/pdf" : "image/jpeg" });
      if (upErr) throw upErr;
      router.push(`/despesas/nova/?file=${encodeURIComponent(name)}`);
    } catch (e) {
      console.error(e);
      setBusy(false);
      setError("Não foi possível carregar o ficheiro. Tenta de novo.");
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files?.[0];
          if (f) onFile(f);
        }}
        className={`group flex w-full items-center gap-4 rounded-3xl border-2 border-dashed p-4 text-left transition ${
          drag ? "border-accent bg-accent-soft" : "border-line hover:border-accent/50 hover:bg-card"
        } disabled:opacity-70`}
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent transition group-hover:scale-105">
          {busy ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          ) : (
            <Icon name="upload" />
          )}
        </span>
        <span className="min-w-0">
          <span className="block font-semibold">{busy ? "A carregar…" : "Anexar fatura"}</span>
          <span className="block text-sm text-muted">PDF ou foto · fica guardada com a despesa (opcional)</span>
        </span>
      </button>
      <input
        ref={input}
        type="file"
        accept=".pdf,image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
