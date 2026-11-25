"use client";

import { useCallback, useEffect, useState } from "react";

/** Carrega dados no browser. `reload()` volta a pedir sem piscar o ecrã. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<{ data?: T; error?: string; loading: boolean }>({ loading: true });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    fn()
      .then((data) => live && setState({ data, loading: false }))
      .catch((e) => live && setState({ loading: false, error: e instanceof Error ? e.message : String(e) }));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}
