import { db } from "./db";
import type { UserId } from "./types";

const COLORS: Record<UserId, string> = { a: "#4f6bed", b: "#e0567f" };

export const other = (u: UserId): UserId => (u === "a" ? "b" : "a");

export interface Household {
  me: UserId;
  users: Record<UserId, { name: string; color: string }>;
}

/** Quem está autenticado e os nomes dos dois membros. */
export async function household(): Promise<Household> {
  const [me, profiles] = await Promise.all([db.me(), db.profiles()]);
  const name = (slot: UserId, fallback: string) =>
    profiles.find((p) => p.slot === slot)?.name ?? fallback;
  return {
    me: me?.slot ?? "a",
    users: {
      a: { name: name("a", "Pessoa A"), color: COLORS.a },
      b: { name: name("b", "Pessoa B"), color: COLORS.b },
    },
  };
}
