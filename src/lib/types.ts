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
  createdAt: string;
}

export interface Settlement {
  id: string;
  from: UserId; // quem pagou
  to: UserId; // quem recebeu
  amount: number;
  date: string;
}

export type RecurUnit = "day" | "week" | "month";

/** "every": a cada N dias/semanas/meses · "times": N vezes por semana/mês. */
export interface Recurrence {
  mode: "every" | "times";
  unit: RecurUnit;
  n: number;
}

export interface ListItem {
  id: string;
  text: string;
  done: boolean;
  note?: string;
  recur?: Recurrence;
  /** Quando um item recorrente feito volta a "por fazer". */
  reappearAt?: string;
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
