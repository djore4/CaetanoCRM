"use client";

import { useEffect, useReducer } from "react";

const BP = process.env.NEXT_PUBLIC_BASE_PATH || "";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferred: InstallPrompt | null = null;
let installed = false;
const subs = new Set<() => void>();
const notify = () => subs.forEach((f) => f());

// tem de ser apanhado cedo: o browser só o envia uma vez por carregamento
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as InstallPrompt;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    installed = true;
    notify();
  });
}

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register(`${BP}/sw.js`, { scope: `${BP}/` }).catch((e) => console.warn("sw", e));
}

export type InstallState = "installed" | "prompt" | "ios" | "manual";

function isStandalone() {
  return (
    installed ||
    matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function useInstall() {
  const [, rerender] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    subs.add(rerender);
    return () => {
      subs.delete(rerender);
    };
  }, []);

  const state: InstallState = isStandalone() ? "installed" : deferred ? "prompt" : isIOS() ? "ios" : "manual";

  async function install(): Promise<boolean> {
    if (!deferred) return false;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    deferred = null;
    notify();
    return outcome === "accepted";
  }

  return { state, install };
}
