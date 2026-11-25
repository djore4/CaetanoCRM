"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { db } from "@/lib/db";
import { household, type Household } from "@/lib/users";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Nav } from "./Nav";

type Status = "loading" | "out" | "nomember" | "in";

const Ctx = createContext<Household | null>(null);
export function useHousehold(): Household {
  const h = useContext(Ctx);
  if (!h) throw new Error("useHousehold fora do AppShell");
  return h;
}

const signOut = () => supabaseBrowser().auth.signOut();

/** Em site estático não há servidor a proteger as páginas: o acesso aos dados é garantido pela RLS;
 *  aqui só decidimos o que mostrar (login, sem acesso, ou a app). */
export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = (usePathname() || "/").replace(/\/$/, "") || "/";
  const onLogin = path === "/login";
  const [status, setStatus] = useState<Status>("loading");
  const [hh, setHh] = useState<Household | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    const s = supabaseBrowser();
    let live = true;
    async function sync(hasSession: boolean) {
      if (!hasSession) {
        if (live) {
          setHh(null);
          setStatus("out");
        }
        return;
      }
      try {
        const me = await db.me();
        if (!live) return;
        if (!me) return setStatus("nomember");
        const h = await household();
        if (!live) return;
        setName(me.name);
        setHh(h);
        setStatus("in");
      } catch (e) {
        console.error(e);
        if (live) setStatus("out");
      }
    }
    s.auth.getSession().then(({ data }) => sync(!!data.session));
    const { data: sub } = s.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") return;
      setTimeout(() => sync(!!session), 0); // não fazer chamadas ao Supabase dentro do callback
    });
    return () => {
      live = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (status === "out" && !onLogin) router.replace("/login/");
    if (status === "in" && onLogin) router.replace("/");
  }, [status, onLogin, router]);

  if (status === "loading") return <p className="min-h-dvh grid place-items-center text-muted">A carregar…</p>;
  if (status === "out") return onLogin ? <>{children}</> : null;
  if (status === "nomember")
    return (
      <div className="min-h-dvh grid place-items-center px-4">
        <div className="card p-7 max-w-sm text-center space-y-3">
          <p className="text-4xl">🔒</p>
          <p className="font-semibold">Esta conta ainda não tem acesso.</p>
          <p className="text-sm text-muted">O email tem de estar em casa_members (ver README).</p>
          <button onClick={signOut} className="btn btn-ghost">Sair</button>
        </div>
      </div>
    );
  if (!hh || onLogin) return null;

  return (
    <Ctx.Provider value={hh}>
      <Nav />
      <div className="md:pl-56">
        <header className="flex items-center justify-between px-4 md:px-8 pt-4">
          <span className="md:hidden font-bold text-lg">🏡 Casa</span>
          <span className="hidden md:block text-sm text-muted">Olá, {name}</span>
          <button onClick={signOut} className="text-sm text-muted font-semibold">Sair</button>
        </header>
        <main className="mx-auto max-w-5xl px-4 md:px-8 py-5 pb-28 md:pb-10">{children}</main>
      </div>
    </Ctx.Provider>
  );
}
