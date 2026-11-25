"use client";

import { useRef, useState } from "react";
import { analyzeInvoice } from "@/app/actions";
import { supabaseBrowser } from "@/lib/supabase/client";

const MAX_PDF = 20 * 1024 * 1024;

/** Reduz fotos grandes (telemóvel) para caberem no limite da API de leitura e carregarem depressa. */
async function shrinkImage(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("canvas"))), "image/jpeg", 0.85),
  );
}

export function InvoiceUploader({ aiEnabled }: { aiEnabled: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<"idle" | "uploading" | "reading">("idle");
  const [error, setError] = useState("");

  async function onFile(file: File) {
    setError("");
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf && !file.type.startsWith("image/")) return setError("Usa PDF ou uma foto (JPG/PNG).");
    if (isPdf && file.size > MAX_PDF) return setError("PDF demasiado grande (máx. 20 MB).");

    try {
      setState("uploading");
      const body: Blob = isPdf ? file : await shrinkImage(file);
      const name = `${crypto.randomUUID()}.${isPdf ? "pdf" : "jpg"}`;
      const { error: upErr } = await supabaseBrowser()
        .storage.from("casa-invoices")
        .upload(name, body, { contentType: isPdf ? "application/pdf" : "image/jpeg" });
      if (upErr) throw upErr;
      setState("reading");
      await analyzeInvoice(name); // redireciona para o formulário pré-preenchido
    } catch (e) {
      // o redirect do Next lança uma exceção interna: deixamo-la passar
      if (e && typeof e === "object" && "digest" in e) throw e;
      console.error(e);
      setState("idle");
      setError("Não foi possível carregar o ficheiro. Tenta de novo.");
    }
  }

  const busy = state !== "idle";
  return (
    <div className="card p-5 space-y-3">
      <button
        type="button"
        disabled={busy}
        onClick={() => input.current?.click()}
        className="w-full border-2 border-dashed border-line rounded-2xl p-8 text-center hover:border-accent transition disabled:opacity-70"
      >
        <span className="text-4xl block mb-2">{busy ? "⏳" : "📄"}</span>
        <span className="font-semibold block">
          {state === "uploading" ? "A carregar…" : state === "reading" ? "A ler a fatura…" : "Carregar fatura"}
        </span>
        <span className="block text-sm text-muted mt-1">
          PDF ou foto · {aiEnabled ? "leitura automática ativa ✨" : "sem leitura automática (preenchimento manual)"}
        </span>
      </button>
      <input
        ref={input}
        type="file"
        accept=".pdf,image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <p className="text-center text-xs text-muted">ou preenche à mão em baixo</p>
    </div>
  );
}
