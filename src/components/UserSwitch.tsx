"use client";

import { useTransition } from "react";
import { switchUser } from "@/app/actions";
import type { UserId } from "@/lib/types";

export function UserSwitch({
  current,
  users,
}: {
  current: UserId;
  users: Record<UserId, { name: string; color: string }>;
}) {
  const [pending, start] = useTransition();
  return (
    <div className={`inline-flex rounded-full border border-line bg-card p-1 ${pending ? "opacity-60" : ""}`}>
      {(["a", "b"] as UserId[]).map((u) => (
        <button
          key={u}
          onClick={() => start(() => switchUser(u))}
          className="flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold transition"
          style={current === u ? { background: users[u].color, color: "#fff" } : { color: "var(--muted)" }}
        >
          {users[u].name}
        </button>
      ))}
    </div>
  );
}
