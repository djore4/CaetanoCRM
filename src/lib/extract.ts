import Anthropic from "@anthropic-ai/sdk";
import { CATEGORY_KEYS, CATEGORIES } from "./categories";
import type { Category } from "./types";

export interface Extracted {
  description: string;
  category: Category;
  amount: number;
  date: string;
}

export const aiEnabled = () => !!process.env.ANTHROPIC_API_KEY;

const TOOL: Anthropic.Tool = {
  name: "registar_fatura",
  description: "Regista os dados extraídos de uma fatura doméstica.",
  input_schema: {
    type: "object",
    properties: {
      description: { type: "string", description: "Nome do fornecedor (ex.: EDP, NOS, Galp)." },
      category: { type: "string", enum: CATEGORY_KEYS, description: "Tipo de despesa." },
      amount: { type: "number", description: "Total a pagar em euros, com IVA." },
      date: { type: "string", description: "Data de emissão da fatura, formato yyyy-mm-dd." },
    },
    required: ["description", "category", "amount", "date"],
  },
};

export async function extractInvoice(
  data: Buffer,
  mime: string,
): Promise<Extracted | null> {
  if (!aiEnabled()) return null;
  const client = new Anthropic();
  const b64 = data.toString("base64");

  const source =
    mime === "application/pdf"
      ? ({
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: b64 },
        } as const)
      : ({
          type: "image",
          source: {
            type: "base64",
            media_type: mime as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
            data: b64,
          },
        } as const);

  const categories = CATEGORY_KEYS.map((k) => `${k} (${CATEGORIES[k].label})`).join(", ");
  const res = await client.messages.create({
    model: "claude-sonnet-5-5",
    max_tokens: 1024,
    tools: [TOOL],
    tool_choice: { type: "tool", name: TOOL.name },
    messages: [
      {
        role: "user",
        content: [
          source,
          {
            type: "text",
            text: `Extrai os dados desta fatura portuguesa. Categorias possíveis: ${categories}. Usa o valor TOTAL a pagar (com IVA), não o valor sem imposto. Se for uma fatura de várias linhas (ex.: electricidade + gás), escolhe a categoria dominante.`,
          },
        ],
      },
    ],
  });

  const block = res.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") return null;
  const r = block.input as Partial<Extracted>;
  if (!r.amount || !r.date || !r.description) return null;
  return {
    description: r.description,
    category: CATEGORY_KEYS.includes(r.category as Category) ? (r.category as Category) : "outros",
    amount: Number(r.amount),
    date: r.date,
  };
}
