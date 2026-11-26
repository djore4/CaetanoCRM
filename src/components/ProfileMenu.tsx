"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { db } from "@/lib/db";
import { supabaseBrowser } from "@/lib/supabase/client";
import { getThemePref, setThemePref, type ThemePref } from "@/lib/theme";
import { useInstall } from "@/lib/pwa";
import { useHousehold } from "./AppShell";
import { Avatar } from "./Avatar";
import { Icon, type IconName } from "./Icons";
import { Modal } from "./Modal";
import { useToast } from "./Toast";

const THEMES: { value: ThemePref; label: string; icon: IconName }[] = [
  { value: "light", label: "Dia", icon: "sun" },
  { value: "dark", label: "Noite", icon: "moon" },
  { value: "system", label: "Auto", icon: "monitor" },
];

export function ProfileMenu() {
  const { users, slot, email } = useHousehold();
  const me = users[slot];
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState<"name" | "password" | "install" | null>(null);
  const { state: installState, install } = useInstall();
  const toast = useToast();
  const [theme, setTheme] = useState<ThemePref>("system");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setTheme(getThemePref()), []);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function onInstall() {
    if (installState === "prompt") {
      setOpen(false);
      if (await install()) toast("App instalada");
    } else openModal("install");
  }

  const openModal = (m: "name" | "password" | "install") => {
    setOpen(false);
    setModal(m);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-line bg-card py-1 pl-1 pr-2.5 shadow-[var(--shadow)] transition hover:border-accent/40 active:scale-[0.97]"
      >
        <Avatar name={me.name} color={me.color} size="sm" />
        <span className="hidden max-w-[8rem] truncate text-sm font-semibold sm:block">{me.name}</span>
        <Icon name="chevronDown" className={`h-4 w-4 text-muted transition ${open ? "rotate-180" : ""}`} strokeWidth={2.2} />
      </button>

      {open && (
        <div
          role="menu"
          className="anim-pop absolute right-0 top-[calc(100%+0.6rem)] z-40 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-line bg-card shadow-[var(--shadow-lg)]"
        >
          <div className="flex items-center gap-3 border-b border-line bg-soft/60 p-4">
            <Avatar name={me.name} color={me.color} size="lg" />
            <div className="min-w-0">
              <p className="truncate font-bold">{me.name}</p>
              <p className="truncate text-sm text-muted">{email}</p>
            </div>
          </div>

          <div className="p-2">
            <MenuItem icon="pencil" label="Alterar nome" hint={me.name} onClick={() => openModal("name")} />
            <MenuItem icon="lock" label="Alterar palavra-passe" onClick={() => openModal("password")} />
            {installState === "installed" ? (
              <div className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-muted">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-success/15 text-success">
                  <Icon name="check" className="h-4 w-4" strokeWidth={2.4} />
                </span>
                App instalada neste dispositivo
              </div>
            ) : (
              <MenuItem icon="download" label="Instalar app" hint="ecrã principal" onClick={onInstall} />
            )}
          </div>

          <div className="border-t border-line p-3">
            <p className="label !mb-2 px-1">Aparência</p>
            <div className="seg">
              {THEMES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  aria-pressed={theme === t.value}
                  onClick={() => {
                    setTheme(t.value);
                    setThemePref(t.value);
                  }}
                >
                  <Icon name={t.icon} className="h-4 w-4" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-line p-2">
            <MenuItem icon="logout" label="Terminar sessão" danger onClick={() => supabaseBrowser().auth.signOut()} />
          </div>
        </div>
      )}

      <Modal open={modal === "name"} onClose={() => setModal(null)} title="Alterar nome">
        <NameForm onDone={() => setModal(null)} />
      </Modal>
      <Modal open={modal === "install"} onClose={() => setModal(null)} title="Instalar a app">
        <InstallHelp ios={installState === "ios"} onDone={() => setModal(null)} />
      </Modal>
      <Modal open={modal === "password"} onClose={() => setModal(null)} title="Alterar palavra-passe">
        <PasswordForm onDone={() => setModal(null)} />
      </Modal>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  hint,
  danger,
  onClick,
}: {
  icon: IconName;
  label: string;
  hint?: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition hover:bg-soft ${
        danger ? "text-danger" : ""
      }`}
    >
      <span className={`grid h-8 w-8 place-items-center rounded-xl ${danger ? "bg-danger/10" : "bg-soft"}`}>
        <Icon name={icon} className="h-4 w-4" />
      </span>
      <span className="flex-1">{label}</span>
      {hint && <span className="max-w-[6rem] truncate text-xs font-medium text-muted">{hint}</span>}
      {!danger && <Icon name="chevronRight" className="h-4 w-4 text-muted" />}
    </button>
  );
}

function NameForm({ onDone }: { onDone: () => void }) {
  const { users, slot, refresh } = useHousehold();
  const toast = useToast();
  const [name, setName] = useState(users[slot].name);
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    const v = name.trim();
    if (!v) return setErro("O nome não pode ficar vazio.");
    setBusy(true);
    try {
      await db.setMyName(v);
      await refresh();
      toast("Nome atualizado");
      onDone();
    } catch (err) {
      console.error(err);
      setErro("Não foi possível guardar o nome.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex justify-center">
        <Avatar name={name || "?"} color={users[slot].color} size="lg" />
      </div>
      <div>
        <label className="label" htmlFor="pname">Como te chamamos</label>
        <input
          id="pname"
          className="input"
          value={name}
          maxLength={40}
          autoFocus
          onChange={(e) => {
            setName(e.target.value);
            setErro("");
          }}
        />
        <p className="mt-2 text-xs text-muted">Aparece nas despesas e no saldo, para os dois.</p>
      </div>
      {erro && <p className="text-sm text-danger">{erro}</p>}
      <button className="btn w-full" disabled={busy}>
        {busy ? "A guardar…" : "Guardar"}
      </button>
    </form>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  autoFocus,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  autoFocus?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          className="input !pr-12"
          value={value}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          required
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="icon-btn absolute right-1.5 top-1/2 -translate-y-1/2"
          aria-label={show ? "Esconder" : "Mostrar"}
        >
          <Icon name={show ? "eyeOff" : "eye"} className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function strength(p: string) {
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return Math.min(4, s);
}
const STRENGTH = [
  { label: "Muito fraca", color: "var(--danger)" },
  { label: "Fraca", color: "var(--danger)" },
  { label: "Razoável", color: "#e5a23a" },
  { label: "Boa", color: "var(--success)" },
  { label: "Forte", color: "var(--success)" },
];

function PasswordForm({ onDone }: { onDone: () => void }) {
  const { email } = useHousehold();
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState("");
  const st = strength(next);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErro("");
    if (next.length < 8) return setErro("A nova palavra-passe precisa de pelo menos 8 caracteres.");
    if (next !== confirm) return setErro("As duas palavras-passe novas não coincidem.");
    if (next === current) return setErro("A nova palavra-passe tem de ser diferente da atual.");
    setBusy(true);
    const s = supabaseBrowser();
    // confirma a palavra-passe atual antes de trocar
    const { error: authErr } = await s.auth.signInWithPassword({ email, password: current });
    if (authErr) {
      setBusy(false);
      return setErro("A palavra-passe atual não está correta.");
    }
    const { error } = await s.auth.updateUser({ password: next });
    setBusy(false);
    if (error) return setErro(error.message);
    toast("Palavra-passe alterada");
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <input type="email" autoComplete="username" value={email} readOnly hidden />
      <PasswordField id="pw-cur" label="Palavra-passe atual" value={current} onChange={setCurrent} autoComplete="current-password" autoFocus />
      <PasswordField id="pw-new" label="Nova palavra-passe" value={next} onChange={setNext} autoComplete="new-password" />
      {next && (
        <div className="-mt-1">
          <div className="flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="h-1.5 flex-1 rounded-full bg-soft transition-colors"
                style={i < st ? { background: STRENGTH[st].color } : undefined}
              />
            ))}
          </div>
          <p className="mt-1.5 text-xs text-muted">{STRENGTH[st].label}</p>
        </div>
      )}
      <PasswordField id="pw-conf" label="Confirmar nova" value={confirm} onChange={setConfirm} autoComplete="new-password" />
      {erro && <p className="text-sm text-danger">{erro}</p>}
      <button className="btn w-full" disabled={busy}>
        {busy ? "A alterar…" : "Alterar palavra-passe"}
      </button>
    </form>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-bold text-accent">{n}</span>
      <span className="pt-0.5 text-sm leading-relaxed">{children}</span>
    </li>
  );
}

function InstallHelp({ ios, onDone }: { ios: boolean; onDone: () => void }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 rounded-2xl bg-soft p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/icons/icon-192.png`} alt="" className="h-14 w-14 rounded-2xl" />
        <div>
          <p className="font-bold">Homi</p>
          <p className="text-sm text-muted">Abre em ecrã inteiro, como uma app, a partir do ecrã principal.</p>
        </div>
      </div>
      {ios ? (
        <ol className="space-y-3.5">
          <Step n={1}>
            Abre esta página no <b>Safari</b>.
          </Step>
          <Step n={2}>
            Toca em <b>Partilhar</b>{" "}
            <Icon name="share" className="inline h-4 w-4 -translate-y-0.5 text-accent" /> na barra do Safari.
          </Step>
          <Step n={3}>
            Escolhe <b>Adicionar ao ecrã principal</b>{" "}
            <Icon name="squarePlus" className="inline h-4 w-4 -translate-y-0.5 text-accent" /> e confirma em <b>Adicionar</b>.
          </Step>
        </ol>
      ) : (
        <ol className="space-y-3.5">
          <Step n={1}>
            Abre o menu do browser (<b>⋮</b> no Chrome, ou o ícone{" "}
            <Icon name="download" className="inline h-4 w-4 -translate-y-0.5 text-accent" /> na barra de endereço).
          </Step>
          <Step n={2}>
            Escolhe <b>Instalar app</b> ou <b>Adicionar ao ecrã principal</b>.
          </Step>
          <Step n={3}>
            Confirma. A app <b>Homi</b> aparece junto das outras.
          </Step>
        </ol>
      )}
      <button type="button" className="btn btn-ghost w-full" onClick={onDone}>
        Percebido
      </button>
    </div>
  );
}
