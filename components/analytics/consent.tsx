"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { startAnalytics } from "@/lib/analytics/track";

const KEY = "pp-consent";

function readConsent() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}
function saveConsent(v: "granted" | "denied") {
  try {
    localStorage.setItem(KEY, v);
  } catch {}
}

/** Opt-in in Europe/UK (GDPR), notice with opt-out elsewhere. */
export function Consent() {
  const [mode, setMode] = useState<"hidden" | "optin" | "notice">("hidden");

  useEffect(() => {
    const stored = readConsent();
    // Analytics load on the first real interaction, so they never compete with page load
    // (and bots/Lighthouse never trigger third-party cookies).
    const later = (fn: () => void) => {
      const events = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
      const run = () => {
        events.forEach((e) => window.removeEventListener(e, run));
        fn();
      };
      events.forEach((e) => window.addEventListener(e, run, { once: true, passive: true }));
    };
    let eu = false;
    try {
      eu = Intl.DateTimeFormat().resolvedOptions().timeZone.startsWith("Europe/");
    } catch {}

    if (stored === "granted") later(startAnalytics);
    else if (stored === "denied") return;
    else if (eu) later(() => setMode("optin"));
    else
      later(() => {
        startAnalytics();
        setMode("notice");
      });
  }, []);

  useEffect(() => {
    if (mode !== "notice") return;
    const t = setTimeout(() => setMode("hidden"), 12000);
    return () => clearTimeout(t);
  }, [mode]);

  if (mode === "hidden") return null;

  return (
    <div role="dialog" aria-label="Cookie preferences" className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 mx-auto max-w-md [body:has([data-bottom-bar])_&]:top-20 [body:has([data-bottom-bar])_&]:bottom-auto lg:[body:has([data-bottom-bar])_&]:top-auto lg:[body:has([data-bottom-bar])_&]:bottom-3 rounded-2xl border-[1.5px] border-ink bg-paper p-4 text-sm shadow-[3px_3px_0_0_var(--color-ink)] sm:left-auto sm:right-4">
      <p className="text-ink/85">
        {mode === "optin"
          ? "We'd like to use analytics cookies (Microsoft Clarity & Google Analytics) to see what works. Your bouquet notes are never recorded."
          : "We use privacy-friendly analytics to improve Flower Bouquet Digital. Your notes are never recorded."}{" "}
        <Link href="/privacy" className="underline underline-offset-2">
          Privacy
        </Link>
      </p>
      <div className="mt-3 flex gap-2">
        {mode === "optin" ? (
          <>
            <button
              className="btn-primary !py-2"
              onClick={() => {
                saveConsent("granted");
                startAnalytics();
                setMode("hidden");
              }}
            >
              Accept
            </button>
            <button
              className="btn-ghost"
              onClick={() => {
                saveConsent("denied");
                setMode("hidden");
              }}
            >
              Decline
            </button>
          </>
        ) : (
          <>
            <button
              className="btn-primary !py-2"
              onClick={() => {
                saveConsent("granted");
                setMode("hidden");
              }}
            >
              Got it
            </button>
            <button
              className="btn-ghost"
              onClick={() => {
                saveConsent("denied");
                window.location.reload();
              }}
            >
              Opt out
            </button>
          </>
        )}
      </div>
    </div>
  );
}
