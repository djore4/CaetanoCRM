export type UserId = "a" | "b";

export type Category =
  | "luz"
  | "gas"
  | "agua"
  | "internet"
  | "telemovel"
  | "renda"
  | "condominio"
  | "seguros"
  | "supermercado"
  | "saude"
  | "outros";

export interface Expense {
  id: string;
  description: string; // fornecedor / descrição
  category: Category;
  amount: number; // EUR, total da fatura
  date: string; // ISO yyyy-mm-dd (data da fatura)
  paidBy: UserId;
  splitPct: number; // % suportada pelo pagador (50 = a meias)
  file?: string; // nome do ficheiro em data/uploads
  source: "manual" | "ia";
  splitwiseId?: string;
  createdAt: string;
}

export interface Settlement {
  id: string;
  from: UserId; // quem pagou
  to: UserId; // quem recebeu
  amount: number;
  date: string;
}

export interface ListItem {
  id: string;
  text: string;
  done: boolean;
  note?: string;
}

export interface HomeList {
  id: string;
  name: string;
  emoji: string;
  items: ListItem[];
  createdAt: string;
}

export interface DB {
  expenses: Expense[];
  settlements: Settlement[];
  lists: HomeList[];
}
