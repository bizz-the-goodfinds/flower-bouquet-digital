"use client";

type Params = Record<string, string | number | boolean | undefined>;
type Clarity = ((...args: unknown[]) => void) & { q?: unknown[] };

declare global {
  interface Window {
    clarity?: Clarity;
  }
}

let started = false;
let send: ((name: string, params?: Params) => void) | null = null;
const queue: [string, Params?][] = [];

/** Fire an analytics event to Firebase (GA4) and Clarity. Queued until consent/load. */
export function track(name: string, params?: Params) {
  if (typeof window === "undefined") return;
  if (send) send(name, params);
  else if (queue.length < 50) queue.push([name, params]);
}

/**
 * Tag a bouquet link with where it was shared, so opens from WhatsApp, Telegram, etc. show up as
 * their own traffic source in GA instead of "direct" (in-app browsers send no referrer).
 * The plain link is kept for copy/paste.
 */
export function withUtm(url: string, source: string) {
  try {
    const u = new URL(url);
    u.searchParams.set("utm_source", source);
    u.searchParams.set("utm_medium", "share");
    return u.toString();
  } catch {
    return url;
  }
}

function loadClarity(id: string) {
  if (window.clarity) return;
  const c: Clarity = (...args: unknown[]) => {
    (c.q = c.q || []).push(args);
  };
  window.clarity = c;
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.clarity.ms/tag/${id}`;
  document.head.appendChild(s);
  c("consent");
}

/** Session replay and heatmaps. Only after a real interaction: it sets third-party cookies. */
export function startAnalytics() {
  if (typeof window === "undefined") return;
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;
  if (clarityId) loadClarity(clarityId);
  void startFirebase();
}

/** GA4 through Firebase (first-party cookies). Safe to start without an interaction, so visits that bounce still count. */
export async function startFirebase() {
  if (started || typeof window === "undefined") return;
  started = true;

  let firebaseLog: ((name: string, params?: Params) => void) | null = null;
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
  if (config.apiKey && config.measurementId) {
    try {
      const [{ initializeApp }, { getAnalytics, isSupported, logEvent }] = await Promise.all([
        import("firebase/app"),
        import("firebase/analytics"),
      ]);
      if (await isSupported()) {
        const analytics = getAnalytics(initializeApp(config));
        firebaseLog = (name, params) => logEvent(analytics, name, params);
      }
    } catch (err) {
      console.warn("Firebase analytics failed to load", err);
    }
  }

  send = (name, params) => {
    firebaseLog?.(name, params);
    window.clarity?.("event", name);
  };
  for (const [name, params] of queue.splice(0)) send(name, params);
}
