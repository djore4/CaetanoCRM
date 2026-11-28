"use client";

import { useState, type FormEvent } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Icon, Logo } from "@/components/Icons";

export default function Login() {
  const [erro, setErro] = useState(false);
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setErro(false);
    const { error } = await supabaseBrowser().auth.signInWithPassword({
      email: String(f.get("email") ?? "").trim(),
      password: String(f.get("password") ?? ""),
    });
    if (error) {
      setErro(true);
      setBusy(false);
    } // se correr bem, o AppShell deteta a sessão e entra
  }

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-4">
      <div
        className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--accent)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full opacity-25 blur-3xl"
        style={{ background: "#ff8f6b" }}
      />
      <form onSubmit={onSubmit} className="card enter relative w-full max-w-sm space-y-5 p-7 shadow-[var(--shadow-lg)]">
        <div className="flex flex-col items-center text-center">
          <Logo className="h-14 w-14" />
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Homi</h1>
          <p className="text-sm text-muted">Despesas, contas e listas da casa, a dois.</p>
        </div>
        {erro && (
          <p className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-center text-sm font-medium text-danger">
            Email ou palavra-passe incorretos.
          </p>
        )}
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="password">Palavra-passe</label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              className="input !pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="icon-btn absolute right-1.5 top-1/2 -translate-y-1/2"
              aria-label={show ? "Esconder palavra-passe" : "Mostrar palavra-passe"}
            >
              <Icon name={show ? "eyeOff" : "eye"} className="h-4 w-4" />
            </button>
          </div>
        </div>
        <button className="btn w-full !py-3.5" disabled={busy}>
          {busy ? "A entrar…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
