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

// ---------- Received bouquets & chat (this device) ----------

/** A bouquet someone sent to this device: which link it came from and which chat is ours. */
export type ReceivedEntry = { slug: string; link: string | null; conversation: string; to: string; from: string; receivedAt: string };

const RECEIVED_KEY = "pp-received-v1";
const VIEWER_KEY = "pp-viewer-v1";
const SEEN_KEY = "pp-seen-v1";

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const v = JSON.parse(localStorage.getItem(key) ?? "null");
    return v ?? fallback;
  } catch {
    return fallback;
  }
};

/** Random id for this browser, used as the recipient's side of a chat when there's no personal link. */
export function viewerId() {
  try {
    let id = localStorage.getItem(VIEWER_KEY);
    if (!id || !/^[A-Za-z0-9_-]{16,32}$/.test(id)) {
      const bytes = crypto.getRandomValues(new Uint8Array(12));
      id = btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      localStorage.setItem(VIEWER_KEY, id);
    }
    return id;
  } catch {
    return "anonymous-viewer";
  }
}

export function getReceived(): ReceivedEntry[] {
  const list = readJson<ReceivedEntry[]>(RECEIVED_KEY, []);
  return Array.isArray(list) ? list : [];
}

export function addReceived(entry: ReceivedEntry) {
  try {
    const prev = getReceived().find((e) => e.slug === entry.slug);
    const next = { ...entry, receivedAt: prev?.receivedAt ?? entry.receivedAt };
    localStorage.setItem(RECEIVED_KEY, JSON.stringify([next, ...getReceived().filter((e) => e.slug !== entry.slug)].slice(0, 200)));
  } catch {}
}

export function removeReceived(slug: string) {
  try {
    localStorage.setItem(RECEIVED_KEY, JSON.stringify(getReceived().filter((e) => e.slug !== slug)));
  } catch {}
}

/** Last chat message this device has seen, per chat (`<slug>:<conversation>`), for "new" dots. */
export function getSeen(): Record<string, string> {
  return readJson<Record<string, string>>(SEEN_KEY, {});
}

export function markSeen(key: string, at: string) {
  try {
    const seen = getSeen();
    if (seen[key] && seen[key] >= at) return;
    seen[key] = at;
    localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
  } catch {}
}

// ---------- Referral ----------

const REF_KEY = "pp-ref-v1";
const REF_DAYS = 30;

/** Remembers the last bouquet this device opened, so a bouquet made afterwards counts as a referral for its sender. */
export function rememberRef(slug: string) {
  try {
    localStorage.setItem(REF_KEY, JSON.stringify({ slug, at: Date.now() }));
  } catch {}
}

export function getRef(): string | null {
  const v = readJson<{ slug?: string; at?: number } | null>(REF_KEY, null);
  if (!v?.slug || !v.at || Date.now() - v.at > REF_DAYS * 24 * 3600 * 1000) return null;
  return /^[A-Za-z0-9_-]{6,16}$/.test(v.slug) ? v.slug : null;
}
