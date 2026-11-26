import { db } from "./db";
import { supabaseBrowser } from "./supabase/client";
import { downloadAttachment, listAttachments, listCandidates, type MailMessage } from "./msgraph";
import type { Extracted } from "./types";

export const IMPORT_DAYS = 45;

export interface ImportProgress {
  phase: "scan" | "extract" | "done";
  done: number;
  total: number;
  found: number; // novas faturas para rever
}

async function extract(body: Record<string, unknown>): Promise<Extracted> {
  const { data, error } = await supabaseBrowser().functions.invoke("extract-invoice", { body });
  if (error) throw error;
  if (data?.error) throw new Error(String(data.error));
  return data as Extracted;
}

/** Procura faturas novas no email e põe-nas na fila de revisão. Nada é lançado como despesa aqui. */
export async function runImport(onProgress: (p: ImportProgress) => void): Promise<{ found: number; failed: number }> {
  onProgress({ phase: "scan", done: 0, total: 0, found: 0 });
  const [messages, known] = await Promise.all([listCandidates(IMPORT_DAYS), db.importedMessageIds()]);
  const fresh = messages.filter((m) => !known.has(m.id));

  let done = 0;
  let found = 0;
  let failed = 0;
  const tick = (phase: ImportProgress["phase"] = "extract") => onProgress({ phase, done, total: fresh.length, found });
  tick();

  async function handle(m: MailMessage) {
    const atts = m.hasAttachments ? await listAttachments(m.id) : [];
    const base = { messageId: m.id, sender: m.from, subject: m.subject, receivedAt: m.receivedAt };
    const jobs: { attachmentId: string; blob?: Blob; ext: string }[] = atts.length
      ? await Promise.all(
          atts.map(async (a) => ({
            attachmentId: a.id,
            blob: await downloadAttachment(m.id, a.id),
            ext: a.contentType === "application/pdf" || /\.pdf$/i.test(a.name) ? "pdf" : a.contentType.split("/")[1] === "png" ? "png" : "jpg",
          })),
        )
      : [{ attachmentId: "", ext: "" }];

    for (const j of jobs) {
      let file: string | undefined;
      if (j.blob) {
        file = `${crypto.randomUUID()}.${j.ext}`;
        const { error } = await supabaseBrowser()
          .storage.from("casa-invoices")
          .upload(file, j.blob, { contentType: j.ext === "pdf" ? "application/pdf" : `image/${j.ext === "jpg" ? "jpeg" : j.ext}` });
        if (error) throw error;
      }
      const ex = await extract({
        file_path: file,
        subject: m.subject,
        from: m.from,
        received: m.receivedAt,
        body_text: j.blob ? undefined : m.preview,
      });
      const isInvoice = ex.is_invoice;
      await db.addImportItem({ ...base, attachmentId: j.attachmentId, extracted: ex, file, ignored: !isInvoice });
      if (isInvoice) found++;
      else if (file) await supabaseBrowser().storage.from("casa-invoices").remove([file]);
    }
  }

  // concorrência baixa: respeita limites do Graph e da API
  const queue = [...fresh];
  await Promise.all(
    Array.from({ length: 3 }, async () => {
      for (let m = queue.shift(); m; m = queue.shift()) {
        try {
          await handle(m);
        } catch (e) {
          failed++; // não grava nada: a mensagem volta a ser tentada na próxima execução
          console.error("importação falhou para", m.id, e);
        }
        done++;
        tick();
      }
    }),
  );
  tick("done");
  return { found, failed };
}
