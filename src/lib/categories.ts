import type { Category } from "./types";

export const CATEGORIES: Record<
  Category,
  { label: string; emoji: string; color: string }
> = {
  luz: { label: "Luz", emoji: "💡", color: "#f5b82e" },
  gas: { label: "Gás", emoji: "🔥", color: "#ef6a4c" },
  agua: { label: "Água", emoji: "💧", color: "#3b9ae1" },
  internet: { label: "Internet / TV", emoji: "📡", color: "#7c6cf0" },
  telemovel: { label: "Telemóvel", emoji: "📱", color: "#c25ce0" },
  renda: { label: "Renda / Prestação", emoji: "🏠", color: "#2f9e8f" },
  condominio: { label: "Condomínio", emoji: "🏢", color: "#5b7083" },
  seguros: { label: "Seguros", emoji: "🛡️", color: "#8a6d3b" },
  supermercado: { label: "Supermercado", emoji: "🛒", color: "#4caf50" },
  saude: { label: "Saúde", emoji: "💊", color: "#e0567f" },
  outros: { label: "Outros", emoji: "📦", color: "#9aa5b1" },
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES) as Category[];
