import { db } from "./db";
import type { UserId } from "./types";

export const USER_COLORS: Record<UserId, string> = { a: "#5b6cf0", b: "#e2508a" };

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
      a: { name: name("a", "Pessoa A"), color: USER_COLORS.a },
      b: { name: name("b", "Pessoa B"), color: USER_COLORS.b },
    },
  };
}
