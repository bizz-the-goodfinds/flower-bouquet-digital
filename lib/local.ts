"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { Design } from "./bouquet/composition";

export type MineEntry = { slug: string; token: string; to: string; from: string; createdAt: string; design: Design };

const KEY = "pp-mine-v1";

export function getMine(): MineEntry[] {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function addMine(entry: MineEntry) {
  try {
    localStorage.setItem(KEY, JSON.stringify([entry, ...getMine().filter((e) => e.slug !== entry.slug)].slice(0, 100)));
  } catch {}
}

export function removeMine(slug: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify(getMine().filter((e) => e.slug !== slug)));
    window.dispatchEvent(new Event(EVENT));
  } catch {}
}

const EVENT = "pp-mine-change";
const subscribe = (cb: () => void) => {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENT, cb);
  };
};
const readRaw = () => {
  try {
    return localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
};

/** Bouquets sent from this device; null during server render. */
export function useMine(): MineEntry[] | null {
  const raw = useSyncExternalStore(subscribe, readRaw, () => null);
  return useMemo(() => {
    if (raw === null) return null;
    try {
      const list = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }, [raw]);
}

export const isMine = (slug: string) => getMine().some((e) => e.slug === slug);
