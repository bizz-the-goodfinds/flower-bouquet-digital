"use client";

import { useEffect } from "react";
import { captureInstallPrompt, isStandalone, registerServiceWorker } from "@/lib/pwa/client";
import { track } from "@/lib/analytics/track";

/** Registers the service worker (production builds) and catches the browser's install prompt for later. */
export function PwaRegister() {
  useEffect(() => {
    captureInstallPrompt();
    window.addEventListener("appinstalled", () => track("app_installed"), { once: true });
    // Once per session: how many visits come from the installed app.
    try {
      if (isStandalone() && !sessionStorage.getItem("pp-standalone-tracked")) {
        sessionStorage.setItem("pp-standalone-tracked", "1");
        track("app_opened_installed", { notification: new URLSearchParams(location.search).get("utm_source") === "push" });
      }
    } catch {}
    if (process.env.NODE_ENV !== "production") return;
    // After load, so it never competes with the first paint.
    const go = () => void registerServiceWorker();
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go, { once: true });
  }, []);
  return null;
}
