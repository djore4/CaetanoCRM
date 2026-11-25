import { cookies } from "next/headers";
import type { UserId } from "./types";

export const USERS: Record<UserId, { name: string; color: string }> = {
  a: { name: process.env.USER_A_NAME || "João", color: "#4f6bed" },
  b: { name: process.env.USER_B_NAME || "Parceira", color: "#e0567f" },
};

export const other = (u: UserId): UserId => (u === "a" ? "b" : "a");

export async function currentUser(): Promise<UserId> {
  const c = await cookies();
  return c.get("user")?.value === "b" ? "b" : "a";
}
