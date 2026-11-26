// Edge Function: extrai fornecedor/categoria/valor/data de uma fatura (PDF/imagem no Storage ou texto do email).
// Segredo necessário:  supabase secrets set ANTHROPIC_API_KEY=...
// Só membros da casa (casa_is_member) podem chamar; a chave nunca vai para o browser.
import { createClient } from "npm:@supabase/supabase-js@2";

const MODEL = Deno.env.get("EXTRACT_MODEL") ?? "claude-haiku-5-5";
const CATEGORIES = [
  "luz", "gas", "agua", "internet", "telemovel", "renda",
  "condominio", "seguros", "supermercado", "saude", "outros",
];

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const toBase64 = (buf: ArrayBuffer) => {
  let s = "";
  const b = new Uint8Array(buf);
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: ok } = await sb.rpc("casa_is_member");
    if (ok !== true) return json({ error: "forbidden" }, 403);

    const { file_path, subject, from, received, body_text } = await req.json();
    const content: unknown[] = [];

    if (file_path) {
      // o ficheiro é lido com o JWT do utilizador, por isso a RLS do Storage aplica-se
      const { data, error } = await sb.storage.from("casa-invoices").download(String(file_path));
      if (error || !data) return json({ error: "file_not_found" }, 404);
      const buf = await data.arrayBuffer();
      if (buf.byteLength > 12 * 1024 * 1024) return json({ error: "file_too_large" }, 413);
      const mime = data.type || "application/pdf";
      content.push(
        mime === "application/pdf"
          ? { type: "document", source: { type: "base64", media_type: mime, data: toBase64(buf) } }
          : { type: "image", source: { type: "base64", media_type: mime, data: toBase64(buf) } },
      );
    }

    content.push({
      type: "text",
      text:
        `Email recebido de: ${String(from ?? "").slice(0, 200)}\n` +
        `Assunto: ${String(subject ?? "").slice(0, 300)}\n` +
        `Data de receção: ${String(received ?? "").slice(0, 40)}\n` +
        (body_text ? `Corpo (excerto):\n${String(body_text).slice(0, 3000)}\n` : "") +
        `\nDecide se isto é uma fatura/recibo/aviso de pagamento de despesa doméstica em Portugal ` +
        `(luz, gás, água, internet, telemóvel, renda, condomínio, seguros, supermercado, saúde, etc.) ` +
        `e extrai os dados. Responde APENAS com JSON, sem texto extra:\n` +
        `{"is_invoice": boolean, "supplier": string, "category": one of ${JSON.stringify(CATEGORIES)}, ` +
        `"amount": number (total a pagar em EUR, ponto decimal), "date": "YYYY-MM-DD" (data da fatura; se faltar, a de receção), ` +
        `"confidence": "high"|"medium"|"low"}\n` +
        `Se não for uma fatura de despesa (newsletter, contrato, promoção, extrato sem valor a pagar), is_invoice=false. ` +
        `Se não conseguires ler o valor com certeza, confidence="low". Não inventes valores.`,
    });

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({ model: MODEL, max_tokens: 400, messages: [{ role: "user", content }] }),
    });
    if (!r.ok) return json({ error: "llm_error", status: r.status }, 502);
    const out = await r.json();
    const text: string = out.content?.find((c: { type: string }) => c.type === "text")?.text ?? "";
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return json({ error: "bad_llm_output" }, 502);
    const p = JSON.parse(m[0]);

    const amount = Number(p.amount);
    return json({
      is_invoice: p.is_invoice === true && amount > 0,
      supplier: String(p.supplier ?? "").slice(0, 80),
      category: CATEGORIES.includes(p.category) ? p.category : "outros",
      amount: Number.isFinite(amount) ? Math.round(amount * 100) / 100 : 0,
      date: /^\d{4}-\d{2}-\d{2}$/.test(p.date) ? p.date : null,
      confidence: ["high", "medium", "low"].includes(p.confidence) ? p.confidence : "low",
    });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
