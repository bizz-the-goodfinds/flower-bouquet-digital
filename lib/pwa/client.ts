"use client";

import { getMine } from "@/lib/local";

export type PushPrefs = { opened: boolean; chat: boolean; reveal: boolean };
export const DEFAULT_PUSH_PREFS: PushPrefs = { opened: true, chat: true, reveal: true };

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const PREFS_KEY = "pp-push-prefs-v1";

// ---------- Environment ----------

export const isIos = () => typeof navigator !== "undefined" && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
export const isStandalone = () =>
  typeof window !== "undefined" && (matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);

/** Web Push works here: supported browser, and on iOS only from the home-screen app (16.4+). */
export const pushSupported = () =>
  typeof window !== "undefined" && Boolean(VAPID) && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

/** iPhone/iPad in the browser: push needs the app on the home screen first. */
export const pushNeedsInstall = () => isIos() && !isStandalone();

// ---------- Service worker ----------

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch {
    return null;
  }
}

async function registration() {
  return (await navigator.serviceWorker.getRegistration("/")) ?? (await registerServiceWorker());
}

// ---------- Install prompt (Android, desktop Chrome/Edge) ----------

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
let deferred: InstallEvent | null = null;
const installListeners = new Set<() => void>();

/** Must run early: the browser fires beforeinstallprompt once, shortly after load. */
export function captureInstallPrompt() {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as InstallEvent;
    installListeners.forEach((f) => f());
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    installListeners.forEach((f) => f());
  });
}
export const canPromptInstall = () => deferred !== null;
export function onInstallChange(f: () => void) {
  installListeners.add(f);
  return () => void installListeners.delete(f);
}
export async function promptInstall() {
  if (!deferred) return "unavailable" as const;
  const e = deferred;
  deferred = null;
  await e.prompt();
  const { outcome } = await e.userChoice;
  installListeners.forEach((f) => f());
  return outcome;
}

// ---------- Push ----------

function keyBytes(base64: string) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

const deviceItems = () => getMine().map((m) => ({ slug: m.slug, token: m.token }));

export function localPrefs(): PushPrefs {
  try {
    return { ...DEFAULT_PUSH_PREFS, ...JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}") };
  } catch {
    return DEFAULT_PUSH_PREFS;
  }
}
const storePrefs = (p: PushPrefs) => {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {}
};

export async function currentSubscription() {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration("/");
  return (await reg?.pushManager.getSubscription()) ?? null;
}

async function save(sub: PushSubscription) {
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: sub.toJSON(), items: deviceItems() }),
  });
  if (!res.ok) throw new Error("Couldn't turn on notifications. Try again.");
  const { prefs } = (await res.json()) as { prefs: PushPrefs };
  storePrefs(prefs);
  return prefs;
}

export const isBrave = () => typeof navigator !== "undefined" && "brave" in navigator;

/**
 * Why the browser's push service refused, in words a person can act on. "Registration failed - push service error"
 * comes from browsers without a push service: Brave (off by default), plain Chromium builds, some privacy browsers.
 */
function explainPushError(err: unknown): Error {
  const e = err as DOMException;
  if (e?.name === "NotAllowedError") return new Error("Notifications are blocked. Allow them in your browser's site settings, then try again.");
  if (e?.name === "AbortError" || /push service/i.test(e?.message ?? "")) {
    if (isBrave())
      return new Error("Brave has push notifications switched off. Turn on “Use Google services for push messaging” in brave://settings/privacy, restart Brave, then try again.");
    return new Error("This browser's push service isn't available. Try Chrome, Edge, Firefox or Safari, or check that notifications are allowed for your browser in system settings.");
  }
  return new Error("Couldn't turn on notifications. Try again.");
}

/** Asks for permission (call from a tap) and subscribes this device. */
export async function enablePush() {
  if (!pushSupported()) throw new Error("Notifications aren't supported in this browser.");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error(permission === "denied" ? "Notifications are blocked. Allow them in your browser's site settings, then try again." : "No problem, you can turn them on later.");
  const reg = await registration();
  if (!reg) throw new Error("Couldn't set up notifications in this browser.");
  await navigator.serviceWorker.ready;
  const opts = { userVisibleOnly: true, applicationServerKey: keyBytes(VAPID) };
  let sub = await reg.pushManager.getSubscription();
  // A subscription made with an older key can't be reused: drop it and subscribe again.
  const stale = sub?.options.applicationServerKey && new Uint8Array(sub.options.applicationServerKey).join() !== opts.applicationServerKey.join();
  if (sub && stale) {
    await sub.unsubscribe().catch(() => {});
    sub = null;
  }
  if (!sub) {
    try {
      sub = await reg.pushManager.subscribe(opts);
    } catch (err) {
      throw explainPushError(err);
    }
  }
  return save(sub);
}

/** Links bouquets sent since subscribing (and the account, once signed in). Quiet no-op when push is off. */
export async function syncPush() {
  if (!pushSupported() || Notification.permission !== "granted") return;
  const sub = await currentSubscription();
  if (sub) await save(sub).catch(() => {});
}

export async function disablePush() {
  const sub = await currentSubscription();
  if (!sub) return;
  await fetch("/api/push/subscribe", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) }).catch(() => {});
  await sub.unsubscribe().catch(() => {});
}

export async function updatePushPrefs(prefs: PushPrefs) {
  const sub = await currentSubscription();
  if (!sub) return prefs;
  const res = await fetch("/api/push/prefs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint, prefs }) });
  if (!res.ok) throw new Error("Couldn't save that. Try again.");
  storePrefs(prefs);
  return prefs;
}
