"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing, Check } from "lucide-react";
import { MiniBloom } from "@/components/ui/bloom-loader";
import { DEFAULT_PUSH_PREFS, currentSubscription, disablePush, enablePush, localPrefs, pushNeedsInstall, pushSupported, syncPush, updatePushPrefs, type PushPrefs } from "@/lib/pwa/client";
import { nudgeDone } from "@/lib/pwa/nudge";
import { track } from "@/lib/analytics/track";

type Status = "loading" | "unsupported" | "needs-install" | "denied" | "off" | "on";

function useStatus() {
  const [status, setStatus] = useState<Status>("loading");
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let s: Status;
      if (pushNeedsInstall()) s = "needs-install";
      else if (!pushSupported()) s = "unsupported";
      else if (Notification.permission === "denied") s = "denied";
      else s = Notification.permission === "granted" && (await currentSubscription()) ? "on" : "off";
      if (!cancelled) setStatus(s);
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return [status, setStatus] as const;
}

/** Asked in context, right after sending: "Want to know when Sam opens it?" */
export function PushPrompt({ to }: { to: string }) {
  const [status, setStatus] = useStatus();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const name = to || "they";

  // Already on: link this new bouquet to the subscription.
  useEffect(() => {
    if (status === "on") void syncPush();
  }, [status]);

  if (status === "loading" || status === "unsupported" || status === "denied") return null;

  if (status === "needs-install")
    return (
      <p className="flex items-start gap-2 rounded-2xl border border-line bg-paper px-4 py-3 text-sm text-ink/80">
        <Bell className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          Want to know when {name} opens it? On iPhone and iPad, add this site to your Home Screen first (iOS 16.4 or later), then turn on notifications from My bouquets.
        </span>
      </p>
    );

  if (status === "on")
    return (
      <p className="flex items-center gap-2 rounded-2xl border border-sage bg-sage/20 px-4 py-3 text-sm">
        <BellRing className="size-4 shrink-0" aria-hidden /> We&rsquo;ll let you know when {name} opens it.
      </p>
    );

  return (
    <div className="rounded-2xl border-[1.5px] border-ink bg-paper p-4 shadow-[2px_2px_0_0_var(--color-ink)]">
      <p className="flex items-center gap-2 font-medium">
        <Bell className="size-4" aria-hidden /> Want to know when {to || "they"} open{to ? "s" : ""} it?
      </p>
      <p className="mt-1 text-sm text-ink/70">Get a notification when it&rsquo;s opened or they write back. Change or turn this off any time in My bouquets.</p>
      <button
        type="button"
        className="btn-primary mt-3 !py-2.5 text-sm"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          track("push_prompt_accepted", { where: "sent" });
          try {
            await enablePush();
            nudgeDone("push");
            setStatus("on");
            track("push_enabled", { where: "sent" });
          } catch (err) {
            setError((err as Error).message);
            if (Notification.permission === "denied") track("push_denied", { where: "sent" });
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? <MiniBloom className="size-4" /> : <BellRing className="size-4" aria-hidden />} Notify me
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-petal-deep">
          {error}
        </p>
      )}
    </div>
  );
}

const PREF_LABELS: [keyof PushPrefs, string][] = [
  ["opened", "Your bouquet is opened"],
  ["chat", "New messages, reactions and flowers sent back"],
  ["reveal", "A scheduled bouquet unlocks"],
];

/** Notification settings in My bouquets. */
export function NotificationSettings() {
  const [status, setStatus] = useStatus();
  const [prefs, setPrefs] = useState<PushPrefs>(DEFAULT_PUSH_PREFS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "on") return;
    const t = setTimeout(() => setPrefs(localPrefs()), 0);
    void syncPush();
    return () => clearTimeout(t);
  }, [status]);

  if (status === "loading" || status === "unsupported") return null;

  const toggle = async (k: keyof PushPrefs) => {
    const next = { ...prefs, [k]: !prefs[k] };
    setPrefs(next);
    try {
      await updatePushPrefs(next);
      track("push_prefs_changed", { kind: k, on: next[k] });
    } catch (err) {
      setPrefs(prefs);
      setError((err as Error).message);
    }
  };

  return (
    // Starts open while notifications are off, so the "Turn on" is right there.
    <details open={status === "off" || undefined} className="group rounded-2xl border border-line bg-paper px-4 py-3 text-sm">
      <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between gap-2 font-medium">
        <span className="flex items-center gap-2">
          {status === "on" ? <BellRing className="size-4" aria-hidden /> : <BellOff className="size-4" aria-hidden />} Notifications
          <span className="font-normal text-ink-soft">{status === "on" ? "on" : "off"}</span>
        </span>
        <span aria-hidden className="text-ink-soft transition group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div className="mt-3 space-y-3">
        {status === "needs-install" && <p className="text-ink/75">On iPhone and iPad, notifications work once this site is on your Home Screen (iOS 16.4 or later). Open it from there, then come back here.</p>}
        {status === "denied" && <p className="text-ink/75">Notifications are blocked for this site. Allow them in your browser&rsquo;s site settings, then reload.</p>}
        {status === "off" && (
          <>
            <p className="text-ink/75">Get told when your bouquets are opened and when people write back, on this device.</p>
            <button
              type="button"
              className="btn-primary !py-2 text-sm"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError(null);
                try {
                  setPrefs(await enablePush());
                  nudgeDone("push");
                  setStatus("on");
                  track("push_enabled", { where: "garden" });
                } catch (err) {
                  setError((err as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? <MiniBloom className="size-4" /> : <Bell className="size-4" aria-hidden />} Turn on
            </button>
          </>
        )}
        {status === "on" && (
          <>
            <ul className="space-y-1">
              {PREF_LABELS.map(([k, label]) => (
                <li key={k}>
                  <label className="flex min-h-10 cursor-pointer items-center justify-between gap-3">
                    <span>{label}</span>
                    <input type="checkbox" role="switch" checked={prefs[k]} onChange={() => toggle(k)} className="size-5 accent-ink" />
                  </label>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="btn-ghost min-h-10 border border-line !py-2 text-sm"
              onClick={async () => {
                await disablePush();
                setStatus("off");
                track("push_disabled");
              }}
            >
              <BellOff className="size-4" aria-hidden /> Turn all off on this device
            </button>
          </>
        )}
        {error && (
          <p role="alert" className="text-petal-deep">
            {error}
          </p>
        )}
        {status === "on" && (
          <p className="flex items-center gap-1.5 text-xs text-ink-soft">
            <Check className="size-3.5" aria-hidden /> Messages stay off your lock screen: notifications only say who, never what they wrote.
          </p>
        )}
      </div>
    </details>
  );
}
