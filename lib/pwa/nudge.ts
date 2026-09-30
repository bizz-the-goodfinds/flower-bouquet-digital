"use client";

/**
 * When to ask for notifications and for "Add to home screen" again after someone says "Not now".
 * Each ask waits longer (backoff), and we stop after a few tries or once they accept.
 */
export type NudgeKind = "push" | "install";

const KEY = "pp-nudge-v1";
const DAY = 24 * 3600 * 1000;
/** Wait before the 1st, 2nd, 3rd and 4th ask, counted from the previous "Not now". */
const BACKOFF_DAYS = [0, 3, 10, 30];
export const MAX_ASKS = BACKOFF_DAYS.length;

type Entry = { asks: number; last: number; done?: boolean };
type State = Partial<Record<NudgeKind, Entry>>;

function read(): State {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") ?? {};
  } catch {
    return {};
  }
}
function write(s: State) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}

export function nudgeEntry(kind: NudgeKind): Entry {
  return read()[kind] ?? { asks: 0, last: 0 };
}

/** Whether we may ask about `kind` now. */
export function nudgeDue(kind: NudgeKind, now = Date.now()) {
  const e = nudgeEntry(kind);
  if (e.done || e.asks >= MAX_ASKS) return false;
  return now - e.last >= BACKOFF_DAYS[e.asks] * DAY;
}

/** They said "Not now": count it and push the next ask further out. */
export function nudgeDismissed(kind: NudgeKind) {
  const s = read();
  const e = s[kind] ?? { asks: 0, last: 0 };
  s[kind] = { ...e, asks: e.asks + 1, last: Date.now() };
  write(s);
}

/** They accepted (or it no longer applies): never ask again. */
export function nudgeDone(kind: NudgeKind) {
  const s = read();
  s[kind] = { ...(s[kind] ?? { asks: 0, last: 0 }), done: true, last: Date.now() };
  write(s);
}

// ---------- Visits ----------

const VISITS_KEY = "pp-visits-v1";
/** Counts page loads (one per tab session), so first-time visitors aren't asked on their very first page. */
export function countVisit() {
  try {
    if (sessionStorage.getItem(VISITS_KEY)) return Number(localStorage.getItem(VISITS_KEY) ?? 1);
    sessionStorage.setItem(VISITS_KEY, "1");
    const n = Number(localStorage.getItem(VISITS_KEY) ?? 0) + 1;
    localStorage.setItem(VISITS_KEY, String(n));
    return n;
  } catch {
    return 1;
  }
}
