"use client";

import { useState, type FormEvent } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function Login() {
  const [erro, setErro] = useState(false);
  const [busy, setBusy] = useState(false);

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
    <div className="min-h-dvh grid place-items-center px-4">
      <form onSubmit={onSubmit} className="card p-7 w-full max-w-sm space-y-4">
        <div className="text-center">
          <div className="text-5xl">🏡</div>
          <h1 className="text-2xl font-bold mt-2">Casa</h1>
          <p className="text-sm text-muted">Entra para ver as contas e as listas.</p>
        </div>
        {erro && <p className="text-sm text-red-500 text-center">Email ou palavra-passe incorretos.</p>}
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="password">Palavra-passe</label>
          <input id="password" name="password" type="password" autoComplete="current-password" className="input" required />
        </div>
        <button className="btn w-full" disabled={busy}>{busy ? "A entrar…" : "Entrar"}</button>
      </form>
    </div>
  );
}
