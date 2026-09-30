"use client";

import { useMemo, useSyncExternalStore } from "react";
import { PROVIDERS, type Connection, type ProviderId } from "./providers";

/**
 * The user's own AI key lives only in this browser: sessionStorage by default (gone when the tab closes),
 * localStorage when they tick "Remember on this device". It is never sent to our server.
 */
const KEY = "pp-ai-v1";
const EVENT = "pp-ai-change";

type Stored = Connection & { remember: boolean; method: "paste" | "oauth" };

function read(): Stored | null {
  for (const store of [sessionStorage, localStorage]) {
    try {
      const raw = store.getItem(KEY);
      if (!raw) continue;
      const v = JSON.parse(raw) as Stored;
      if (v && typeof v.key === "string" && v.provider in PROVIDERS) return v;
    } catch {}
  }
  return null;
}

export function getConnection(): Stored | null {
  if (typeof window === "undefined") return null;
  return read();
}

export function saveConnection(c: Connection, opts: { remember: boolean; method: "paste" | "oauth" }) {
  const v: Stored = { ...c, ...opts };
  try {
    sessionStorage.removeItem(KEY);
    localStorage.removeItem(KEY);
    (opts.remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(v));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export function setModel(model: string) {
  const c = read();
  if (c) saveConnection({ ...c, model }, c);
}

export function disconnect() {
  try {
    sessionStorage.removeItem(KEY);
    localStorage.removeItem(KEY);
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

const subscribe = (cb: () => void) => {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
};
const snapshot = () => {
  try {
    return sessionStorage.getItem(KEY) ?? localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
};

/** The saved connection, kept in sync across tabs. Null before hydration and when not connected. */
export function useConnection(): Stored | null {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "");
  return useMemo(() => {
    if (!raw) return null;
    try {
      const v = JSON.parse(raw) as Stored;
      return v.provider in PROVIDERS ? v : null;
    } catch {
      return null;
    }
  }, [raw]);
}

export const providerName = (p: ProviderId) => PROVIDERS[p].name;
