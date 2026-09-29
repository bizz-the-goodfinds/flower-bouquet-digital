"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy, Eye, Pencil, Trash2, X } from "lucide-react";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Tooltip } from "@/components/ui/tooltip";
import { BouquetSvg } from "@/components/bouquet/bouquet-svg";
import type { Design } from "@/lib/bouquet/composition";
import { getMine, removeMine, useMine } from "@/lib/local";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { track } from "@/lib/analytics/track";

type Remote = {
  slug: string;
  design: Design;
  card: { to: string; from: string };
  createdAt: string;
  expiresAt: string | null;
  revealAt: string | null;
  views: number;
  deleted: boolean;
  owned: boolean;
  reactions: { emoji: string; reply: string | null; created_at: string }[];
};

const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_AUTH_GOOGLE === "1";

export function Garden() {
  const mine = useMine();
  const [confirmDialog, confirm] = useConfirm();
  const [copied, setCopied] = useState<string | null>(null);
  const [remote, setRemote] = useState<Remote[] | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const slugs = mine?.map((m) => m.slug).join(",");

  useEffect(() => {
    if (mine === null) return;
    let cancelled = false;
    const items = getMine().map((m) => ({ slug: m.slug, token: m.token }));
    const post = (url: string) =>
      fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }) }).then((r) => (r.ok ? r.json() : null));
    post("/api/bouquets/mine")
      .catch(() => null)
      .then(async (data: { bouquets: Remote[]; signedIn: boolean } | null) => {
        if (cancelled) return;
        setSignedIn(Boolean(data?.signedIn));
        setRemote(data?.bouquets ?? []);
        // First visit after signing in: attach this device's bouquets to the account.
        if (data?.signedIn && data.bouquets.some((b) => !b.owned && !b.deleted)) {
          const claim = await post("/api/bouquets/claim").catch(() => null);
          if (!cancelled && claim?.claimed > 0) setRemote(data.bouquets.map((b) => ({ ...b, owned: true })));
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugs]);

  useEffect(() => {
    if (!signedIn) return;
    supabaseBrowser()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email ?? null));
    if (new URLSearchParams(location.search).has("signedin")) track("signup_completed", { method: "magic_link_or_oauth" });
  }, [signedIn]);

  if (mine === null || remote === null)
    return (
      <div className="min-h-[30rem]" aria-busy="true">
        <div className="mt-6 h-56 animate-pulse rounded-[var(--radius-card)] bg-paper sm:h-44" />
        <div className="mt-8 h-52 animate-pulse rounded-[var(--radius-card)] bg-paper/70" />
      </div>
    );

  const list = remote.filter((b) => !b.deleted);

  const remove = async (b: Remote) => {
    const ok = await confirm({
      title: `Delete the bouquet for ${b.card.to || "them"}?`,
      description: "The link will stop working for everyone right away. This can't be undone.",
      preview: <BouquetSvg design={b.design} className="h-auto w-full rounded-2xl" label="Bouquet to delete" />,
      confirmLabel: "Delete bouquet",
      cancelLabel: "Keep it",
      tone: "danger",
    });
    if (!ok) return;
    const token = getMine().find((m) => m.slug === b.slug)?.token;
    const res = await fetch(`/api/bouquets/${b.slug}`, { method: "DELETE", headers: token ? { "x-edit-token": token } : {} });
    if (res.ok || res.status === 404) {
      removeMine(b.slug);
      setRemote((r) => r?.filter((x) => x.slug !== b.slug) ?? null);
    }
  };

  return (
    <div className="min-h-[30rem]">
      {confirmDialog}
      <Account signedIn={signedIn} email={email} count={list.length} />

      {!list.length ? (
        <div className="mt-8 rounded-[var(--radius-card)] border border-dashed border-line bg-paper p-8 text-center sm:p-10">
          <p className="font-display text-3xl">Your garden is empty 🌱</p>
          <p className="mt-2 text-ink/70">Bouquets you send will show up here.</p>
          <Link href="/create" className="btn-primary mt-6">
            Make your first bouquet
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((b) => (
            <li key={b.slug} className="flex min-w-0 flex-col rounded-[var(--radius-card)] border border-line bg-paper p-4">
              <div className="flex gap-4">
                <BouquetSvg design={b.design} className="w-24 shrink-0 rounded-xl" label={`Bouquet for ${b.card.to || "someone"}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-2xl leading-tight" data-clarity-mask="true">
                    for {b.card.to || "someone"}
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">{new Date(b.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}</p>
                  <p className="mt-2 flex items-center gap-1.5 text-sm">
                    <Eye className="size-4" aria-hidden /> {b.views} {b.views === 1 ? "open" : "opens"}
                  </p>
                  {b.expiresAt && <p className="mt-1 text-xs text-ink-soft">Expires {new Date(b.expiresAt).toLocaleDateString(undefined, { dateStyle: "medium" })}</p>}
                </div>
              </div>
              {b.reactions.length > 0 && (
                <ul className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm" data-clarity-mask="true">
                  {b.reactions.slice(0, 3).map((r) => (
                    <li key={r.created_at} className="flex gap-2">
                      <span className="text-lg leading-none">{r.emoji}</span>
                      <span className="min-w-0 text-ink/80 [overflow-wrap:anywhere]">{r.reply}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-auto flex flex-wrap items-center gap-1 pt-4">
                <Link href={`/b/${b.slug}`} className="btn-ghost min-h-11 border border-line !py-1.5 text-sm">
                  Open
                </Link>
                <Link href={`/create?edit=${b.slug}`} className="btn-ghost min-h-11 border border-line !py-1.5 text-sm">
                  <Pencil className="size-3.5" aria-hidden /> Edit
                </Link>
                <button
                  className="btn-ghost min-h-11 border border-line !py-1.5 text-sm"
                  aria-live="polite"
                  onClick={async () => {
                    await navigator.clipboard?.writeText(`${window.location.origin}/b/${b.slug}`).catch(() => {});
                    setCopied(b.slug);
                    setTimeout(() => setCopied((c) => (c === b.slug ? null : c)), 1600);
                  }}
                >
                  {copied === b.slug ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
                  {copied === b.slug ? "Copied" : "Copy"}
                </button>
                <button className="btn-ghost ml-auto min-h-11 !py-1.5 text-sm text-petal-deep" onClick={() => remove(b)} aria-label={`Delete bouquet for ${b.card.to || "someone"}`}>
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const HIDE_KEY = "pp-hide-sync";

function Account({ signedIn, email, count }: { signedIn: boolean; email: string | null; count: number }) {
  const [expanded, setExpanded] = useState(false);
  const [hidden, setHidden] = useState(() => {
    try {
      return typeof window !== "undefined" && localStorage.getItem(HIDE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [mode, setMode] = useState<"signup" | "signin" | "forgot">("signup");
  const [form, setForm] = useState({ email: "", password: "" });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (signedIn)
    return (
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-paper px-4 py-2 text-sm">
        <span className="min-w-0 [overflow-wrap:anywhere]">
          ☁️ Synced{email ? <> as <strong>{email}</strong></> : null}
        </span>
        <form action="/auth/signout" method="post">
          <button className="btn-ghost min-h-10 !py-1 text-sm">Sign out</button>
        </form>
      </div>
    );

  const dismiss = (v: boolean) => {
    setHidden(v);
    setExpanded(false);
    try {
      if (v) localStorage.setItem(HIDE_KEY, "1");
      else localStorage.removeItem(HIDE_KEY);
    } catch {}
  };

  if (hidden)
    return (
      <p className="mt-4 text-sm text-ink-soft">
        <button className="underline underline-offset-2 hover:text-ink" onClick={() => (dismiss(false), setExpanded(true))}>
          Sign in to sync across devices
        </button>
      </p>
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const sb = supabaseBrowser();
      if (mode === "forgot") {
        const { error: err } = await sb.auth.resetPasswordForEmail(form.email.trim(), {
          redirectTo: `${window.location.origin}/auth/callback?next=/account/reset`,
        });
        if (err) throw new Error("Couldn't send the reset email. Try again in a minute.");
        setNotice("If that email has an account, a reset link is on its way. Check your inbox (and spam).");
        setBusy(false);
        return;
      }
      if (mode === "signup") {
        const res = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (res.status === 409) setMode("signin");
          throw new Error(data.error ?? "Couldn't create your account.");
        }
      }
      const { error: err } = await sb.auth.signInWithPassword({ email: form.email.trim(), password: form.password });
      if (err) throw new Error(mode === "signin" ? "Wrong email or password." : err.message);
      track(mode === "signup" ? "signup_completed" : "login", { method: "password" });
      window.location.reload();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="mt-5 rounded-2xl border border-line bg-paper">
      <div className="flex items-center gap-2 px-4 py-2.5">
        <p className="min-w-0 flex-1 text-sm">
          <span aria-hidden>☁️</span> <strong className="font-medium">Sync across devices</strong>
          <span className="hidden text-ink-soft sm:inline">{count ? " · these only live in this browser for now" : " · free and optional"}</span>
        </p>
        {!expanded && (
          <button className="btn-primary min-h-10 !px-4 !py-1.5 text-sm" onClick={() => setExpanded(true)}>
            Sign in
          </button>
        )}
        <Tooltip label="Hide this">
          <button className="grid size-10 place-items-center rounded-full text-ink-soft hover:bg-ink/5 hover:text-ink" onClick={() => dismiss(true)} aria-label="Hide sync prompt">
            <X className="size-4" aria-hidden />
          </button>
        </Tooltip>
      </div>

      {expanded && (
        <div className="border-t border-line px-4 pt-3 pb-4">
          {mode !== "forgot" && (
            <div role="tablist" aria-label="Account" className="inline-flex rounded-full bg-cream p-1 text-sm">
              {(
                [
                  ["signup", "Create account"],
                  ["signin", "Sign in"],
                ] as const
              ).map(([m, label]) => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => {
                    setMode(m);
                    setError(null);
                  }}
                  className={`min-h-9 rounded-full px-4 font-medium transition ${mode === m ? "bg-ink text-cream" : "text-ink-soft"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          {mode === "forgot" && <p className="text-sm font-medium">Reset your password</p>}

          <form className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]" onSubmit={submit}>
            <label className="sr-only" htmlFor="acc-email">
              Email
            </label>
            <input
              id="acc-email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              className={`field !py-2.5 ${mode === "forgot" ? "sm:col-span-2" : ""}`}
              placeholder="you@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            {mode !== "forgot" && (
              <div className="relative">
                <label className="sr-only" htmlFor="acc-password">
                  Password
                </label>
                <input
                  id="acc-password"
                  type={show ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  className="field !py-2.5 pr-16"
                  placeholder={mode === "signup" ? "Password (8+ characters)" : "Password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute inset-y-0 right-2 my-auto h-9 rounded-lg px-2 text-xs font-medium text-ink-soft hover:text-ink"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? "Hide" : "Show"}
                </button>
              </div>
            )}
            <button className="btn-primary shrink-0 !py-2.5" disabled={busy}>
              {busy ? "One sec…" : mode === "signup" ? "Create account" : mode === "signin" ? "Sign in" : "Send reset link"}
            </button>
          </form>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-soft">
            {mode === "signin" && (
              <button className="underline underline-offset-2 hover:text-ink" onClick={() => (setMode("forgot"), setError(null))}>
                Forgot password?
              </button>
            )}
            {mode === "forgot" && (
              <button className="underline underline-offset-2 hover:text-ink" onClick={() => (setMode("signin"), setError(null), setNotice(null))}>
                Back to sign in
              </button>
            )}
            {GOOGLE_ENABLED && mode !== "forgot" && (
              <button
                className="btn-secondary !py-1.5 text-sm"
                onClick={() =>
                  supabaseBrowser().auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback?next=/garden` } })
                }
              >
                Continue with Google
              </button>
            )}
          </div>
          {error && (
            <p className="mt-2 text-sm text-petal-deep" role="alert">
              {error}
            </p>
          )}
          {notice && (
            <p className="mt-2 rounded-xl bg-sage/25 px-3 py-2 text-sm" role="status">
              {notice}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
