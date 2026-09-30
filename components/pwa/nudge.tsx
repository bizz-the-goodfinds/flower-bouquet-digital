"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, Download, X } from "lucide-react";
import { MiniBloom } from "@/components/ui/bloom-loader";
import { IosInstallSheet } from "./install";
import { canPromptInstall, enablePush, isIos, isStandalone, onInstallChange, promptInstall, pushNeedsInstall, pushSupported } from "@/lib/pwa/client";
import { countVisit, nudgeDismissed, nudgeDone, nudgeDue, nudgeEntry, type NudgeKind } from "@/lib/pwa/nudge";
import { getMine } from "@/lib/local";
import { track } from "@/lib/analytics/track";

/** Seconds on a page before asking. Long enough to have looked around, short enough to still be there. */
const DELAY_MS = 12_000;

/**
 * Pages where a prompt would interrupt (the builder, a bouquet being opened, sign-in and callbacks), or would repeat
 * what's already on the page (My bouquets has its own notification and install cards).
 */
const QUIET = [/^\/create/, /^\/b\//, /^\/ai\//, /^\/auth\//, /^\/account\//, /^\/garden/];

/**
 * One gentle, dismissible card per visit asking to turn on notifications (people who've sent a bouquet) or to add
 * the app to the home screen. "Not now" backs off (3, then 10, then 30 days) and stops after four asks; accepting ends it.
 * The browser's own permission prompt only ever appears after a tap here.
 */
export function EngagementNudge() {
  const path = usePathname();
  const [kind, setKind] = useState<NudgeKind | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iosGuide, setIosGuide] = useState(false);

  useEffect(() => {
    const visits = countVisit();
    if (QUIET.some((re) => re.test(path))) return;
    const t = setTimeout(() => {
      // Push: only for people with bouquets to hear about, where the browser can do it and nobody decided yet.
      const pushOk = pushSupported() && !pushNeedsInstall() && Notification.permission === "default" && getMine().length > 0 && nudgeDue("push");
      if (pushSupported() && Notification.permission !== "default") nudgeDone("push");
      // Install: never on a first visit; the browser must offer it (or it's iOS Safari, where we show how).
      const installOk = !isStandalone() && visits >= 2 && (canPromptInstall() || isIos()) && nudgeDue("install");
      if (isStandalone()) nudgeDone("install");
      const next: NudgeKind | null = pushOk ? "push" : installOk ? "install" : null;
      if (next) {
        setKind(next);
        track("nudge_shown", { kind: next, ask: nudgeEntry(next).asks + 1, path });
      }
    }, DELAY_MS);
    const off = onInstallChange(() => isStandalone() && setKind((k) => (k === "install" ? null : k)));
    return () => {
      clearTimeout(t);
      off();
    };
  }, [path]);

  if (!kind) return null;

  const dismiss = () => {
    nudgeDismissed(kind);
    track("nudge_dismissed", { kind, ask: nudgeEntry(kind).asks });
    setKind(null);
  };

  const accept = async () => {
    setError(null);
    track("nudge_accepted", { kind });
    if (kind === "install") {
      if (!canPromptInstall()) return setIosGuide(true);
      const outcome = await promptInstall();
      track("install_prompt_result", { outcome, where: "nudge" });
      if (outcome === "accepted") nudgeDone("install");
      else nudgeDismissed("install");
      return setKind(null);
    }
    setBusy(true);
    try {
      await enablePush();
      nudgeDone("push");
      track("push_enabled", { where: "nudge" });
      setKind(null);
    } catch (err) {
      setError((err as Error).message);
      // Blocked in the browser: asking again won't help.
      if (Notification.permission === "denied") nudgeDone("push");
    } finally {
      setBusy(false);
    }
  };

  const push = kind === "push";
  return (
    <div role="dialog" aria-label={push ? "Turn on notifications" : "Add to home screen"} className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 mx-auto max-w-md animate-[pp-dialog_.25s_ease-out] rounded-2xl border-[1.5px] border-ink bg-paper p-4 shadow-[4px_4px_0_0_var(--color-ink)] sm:right-5 sm:left-auto">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-butter">{push ? <Bell className="size-5" aria-hidden /> : <Download className="size-5" aria-hidden />}</span>
        <div className="min-w-0 flex-1">
          <p className="font-medium">{push ? "Know the moment they open it 💌" : "Keep your bouquets one tap away"}</p>
          <p className="mt-0.5 text-sm text-ink/70">
            {push ? "Get a notification when your bouquet is opened or someone writes back. Only who, never what they wrote." : "Add Flower Bouquet Digital to your home screen. It opens like an app, even on a slow connection."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn-primary !px-4 !py-2 text-sm" onClick={accept} disabled={busy}>
              {busy && <MiniBloom className="size-4" />} {push ? "Turn on" : "Add to home screen"}
            </button>
            <button type="button" className="btn-ghost min-h-10 border border-line !py-2 text-sm" onClick={dismiss}>
              Not now
            </button>
          </div>
          {error && (
            <p role="alert" className="mt-2 text-sm text-petal-deep">
              {error}
            </p>
          )}
        </div>
        <button type="button" onClick={dismiss} className="-mt-1 -mr-1 grid size-10 shrink-0 place-items-center rounded-full hover:bg-cream" aria-label="Not now">
          <X className="size-4" aria-hidden />
        </button>
      </div>
      {iosGuide && (
        <IosInstallSheet
          onClose={() => {
            setIosGuide(false);
            nudgeDone("install");
            setKind(null);
          }}
        />
      )}
    </div>
  );
}
