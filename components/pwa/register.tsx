"use client";

import { useEffect } from "react";
import { captureInstallPrompt, registerServiceWorker } from "@/lib/pwa/client";

/** Registers the service worker (production builds) and catches the browser's install prompt for later. */
export function PwaRegister() {
  useEffect(() => {
    captureInstallPrompt();
    if (process.env.NODE_ENV !== "production") return;
    // After load, so it never competes with the first paint.
    const go = () => void registerServiceWorker();
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go, { once: true });
  }, []);
  return null;
}
