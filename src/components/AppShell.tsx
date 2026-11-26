"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { db } from "@/lib/db";
import { greeting } from "@/lib/format";
import { household, type Household } from "@/lib/users";
import { supabaseBrowser } from "@/lib/supabase/client";
import { applyTheme, getThemePref } from "@/lib/theme";
import { registerServiceWorker } from "@/lib/pwa";
import type { UserId } from "@/lib/types";
import { Fab, Nav } from "./Nav";
import { Logo } from "./Icons";
import { ProfileMenu } from "./ProfileMenu";
import { ToastProvider } from "./Toast";

type Status = "loading" | "out" | "nomember" | "in";

export type AppCtx = Household & { slot: UserId; email: string; refresh: () => Promise<void> };

const Ctx = createContext<AppCtx | null>(null);
export function useHousehold(): AppCtx {
  const h = useContext(Ctx);
  if (!h) throw new Error("useHousehold fora do AppShell");
  return h;
}

const signOut = () => supabaseBrowser().auth.signOut();

/** Em site estático não há servidor a proteger as páginas: o acesso aos dados é garantido pela RLS;
 *  aqui só decidimos o que mostrar (login, sem acesso, ou a app). */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <Shell>{children}</Shell>
    </ToastProvider>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = (usePathname() || "/").replace(/\/$/, "") || "/";
  const onLogin = path === "/login";
  const [status, setStatus] = useState<Status>("loading");
  const [hh, setHh] = useState<Household | null>(null);
  const [me, setMe] = useState<{ slot: UserId; name: string; email: string } | null>(null);
  const [sessionEmail, setSessionEmail] = useState("");

  const load = useCallback(async () => {
    const m = await db.me();
    if (!m) {
      setStatus("nomember");
      return;
    }
    const h = await household();
    setMe(m);
    setHh(h);
    setStatus("in");
  }, []);

  useEffect(() => registerServiceWorker(), []);

  // tema: segue o sistema quando a preferência é "automático"
  useEffect(() => {
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => getThemePref() === "system" && applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const s = supabaseBrowser();
    let live = true;
    async function sync(email: string | null) {
      if (!live) return;
      setSessionEmail(email ?? "");
      if (!email) {
        setHh(null);
        setStatus("out");
        return;
      }
      try {
        await load();
      } catch (e) {
        console.error(e);
        if (live) setStatus("out");
      }
    }
    s.auth.getSession().then(({ data }) => sync(data.session?.user.email ?? null));
    const { data: sub } = s.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") return;
      setTimeout(() => sync(session?.user.email ?? null), 0); // não chamar o Supabase dentro do callback
    });
    return () => {
      live = false;
      sub.subscription.unsubscribe();
    };
  }, [load]);

  useEffect(() => {
    if (status === "out" && !onLogin) router.replace("/login/");
    if (status === "in" && onLogin) router.replace("/");
  }, [status, onLogin, router]);

  if (status === "loading") return <Splash />;
  if (status === "out") return onLogin ? <>{children}</> : <Splash />;
  if (status === "nomember") return <NoAccess email={sessionEmail} />;
  if (!hh || !me || onLogin) return <Splash />;

  const ctx: AppCtx = { ...hh, slot: me.slot, email: me.email, refresh: load };
  const hideFab = path.startsWith("/despesas/nova") || path.startsWith("/despesas/editar") || path.startsWith("/listas");

  return (
    <Ctx.Provider value={ctx}>
      <Nav />
      <div className="md:pl-64">
        <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/75 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 md:px-8">
            <Link href="/" className="flex items-center gap-2.5 md:hidden">
              <Logo className="h-8 w-8" />
              <span className="text-lg font-bold tracking-tight">Homi</span>
            </Link>
            <p className="hidden text-sm text-muted md:block">
              {greeting()}, <b className="font-semibold text-ink">{hh.users[me.slot].name}</b>
            </p>
            <ProfileMenu />
          </div>
        </header>
        <main key={path} className="enter mx-auto max-w-5xl px-4 pb-36 pt-6 md:px-8 md:pb-14">
          {children}
        </main>
      </div>
      {!hideFab && <Fab />}
    </Ctx.Provider>
  );
}

function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <div className="flex flex-col items-center gap-4 anim-fade">
        <div className="animate-pulse">
          <Logo className="h-14 w-14" />
        </div>
      </div>
    </div>
  );
}

function NoAccess({ email }: { email: string }) {
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="card enter w-full max-w-sm p-7 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-soft text-2xl">🔒</div>
        <h1 className="text-lg font-bold">Esta conta ainda não tem acesso</h1>
        {email && (
          <p className="mt-3 rounded-xl bg-soft px-3 py-2 text-sm">
            Entraste como <b className="break-all">{email}</b>
          </p>
        )}
        <p className="mt-3 text-sm text-muted">
          O email tem de estar em <code className="text-ink">casa_members</code>. Se é a conta errada, sai e entra com
          a certa.
        </p>
        <button onClick={signOut} className="btn btn-ghost mt-6 w-full">
          Sair e entrar com outra conta
        </button>
      </div>
    </div>
  );
}
