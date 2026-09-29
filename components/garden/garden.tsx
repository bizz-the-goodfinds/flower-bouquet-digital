"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Eye, Mail, Pencil, Trash2 } from "lucide-react";
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
    if (!window.confirm(`Delete the bouquet for ${b.card.to || "them"}? The link will stop working. This can't be undone.`)) return;
    const token = getMine().find((m) => m.slug === b.slug)?.token;
    const res = await fetch(`/api/bouquets/${b.slug}`, { method: "DELETE", headers: token ? { "x-edit-token": token } : {} });
    if (res.ok || res.status === 404) {
      removeMine(b.slug);
      setRemote((r) => r?.filter((x) => x.slug !== b.slug) ?? null);
    }
  };

  return (
    <div className="min-h-[30rem]">
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
                  onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/b/${b.slug}`)}
                >
                  <Copy className="size-3.5" aria-hidden /> Copy
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

function Account({ signedIn, email, count }: { signedIn: boolean; email: string | null; count: number }) {
  const [value, setValue] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [failed] = useState(() => typeof window !== "undefined" && new URLSearchParams(location.search).get("auth") === "failed");
  const redirect = () => `${window.location.origin}/auth/callback?next=/garden`;

  if (signedIn)
    return (
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-paper px-4 py-3 text-sm">
        <span>
          Signed in{email ? <> as <strong className="break-all">{email}</strong></> : null}. Your bouquets sync across devices.
        </span>
        <form action="/auth/signout" method="post">
          <button className="btn-ghost min-h-11 border border-line !py-1.5 text-sm">Sign out</button>
        </form>
      </div>
    );

  return (
    <div className="mt-6 rounded-[var(--radius-card)] border-[1.5px] border-ink bg-paper p-5 shadow-[3px_3px_0_0_var(--color-ink)]">
      <p className="font-display text-2xl">Keep your bouquets everywhere</p>
      <p className="mt-1 text-sm text-ink/70">
        {count ? "Right now they only live in this browser. " : ""}Sign in with your email to see bouquets and reactions on any device. Totally optional.
      </p>
      {state === "sent" ? (
        <p className="mt-4 rounded-xl bg-sage/30 px-4 py-3 text-sm" role="status">
          Check your inbox for a sign-in link ✨ You can close this tab.
        </p>
      ) : (
        <form
          className="mt-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={async (e) => {
            e.preventDefault();
            setState("sending");
            const { error } = await supabaseBrowser().auth.signInWithOtp({ email: value, options: { emailRedirectTo: redirect() } });
            setState(error ? "error" : "sent");
          }}
        >
          <label className="sr-only" htmlFor="garden-email">
            Email
          </label>
          <input id="garden-email" type="email" required autoComplete="email" inputMode="email" className="field" placeholder="you@email.com" value={value} onChange={(e) => setValue(e.target.value)} />
          <button className="btn-primary shrink-0" disabled={state === "sending"}>
            <Mail className="size-4" aria-hidden /> {state === "sending" ? "Sending…" : "Email me a link"}
          </button>
        </form>
      )}
      {GOOGLE_ENABLED && state !== "sent" && (
        <button
          className="btn-secondary mt-2 w-full sm:w-auto"
          onClick={() => supabaseBrowser().auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirect() } })}
        >
          Continue with Google
        </button>
      )}
      {(state === "error" || failed) && (
        <p className="mt-2 text-sm text-petal-deep" role="alert">
          That didn&rsquo;t work. Try again in a minute.
        </p>
      )}
    </div>
  );
}
