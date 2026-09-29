"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Check, Copy, Eye, Flower2, MessageCircle, Pencil, Share, Trash2, Undo2, X } from "lucide-react";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Tooltip } from "@/components/ui/tooltip";
import { BloomLoader, BouquetCardSkeleton, MiniBloom } from "@/components/ui/bloom-loader";
import { BouquetSvg } from "@/components/bouquet/bouquet-svg";
import { EnvelopeArt } from "@/components/reveal/envelope";
import type { Design } from "@/lib/bouquet/composition";
import type { CardStyle } from "@/lib/bouquet/card";
import type { EnvelopeLook } from "@/lib/bouquet/envelope";
import { chatKey, conversationNames, type ChatMessage, type Conversation } from "@/lib/bouquet/chat";
import { getMine, getReceived, getSeen, removeMine, removeReceived, useMine } from "@/lib/local";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { inboxChannel, useInbox } from "@/lib/realtime";
import { track } from "@/lib/analytics/track";
import { SenderPreview } from "./sender-preview";

type Sent = {
  slug: string;
  design: Design;
  card: { to: string; from: string; message: string; style: CardStyle };
  occasion: string | null;
  createdAt: string;
  expiresAt: string | null;
  revealAt: string | null;
  views: number;
  deleted: boolean;
  owned: boolean;
  thread: string;
  replyTo: string | null;
  conversations: Conversation[];
  replies: { slug: string; from: string; createdAt: string }[];
};

type Received = {
  slug: string;
  link: string | null;
  conversation: string;
  thread: string;
  replyTo: string | null;
  from: string;
  to: string;
  createdAt: string;
  locked: boolean;
  revealAt: string | null;
  envelope: EnvelopeLook;
  design: Design | null;
  chat: { count: number; last: ChatMessage | null };
};

type Entry = { kind: "sent"; at: string; thread: string; item: Sent } | { kind: "received"; at: string; thread: string; item: Received };
type Tab = "all" | "sent" | "received";

const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_AUTH_GOOGLE === "1";

const post = (url: string, body: unknown) =>
  fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => (r.ok ? r.json() : null));

const lastRecipientMsg = (c: Conversation) => [...c.messages].reverse().find((m) => m.author === "recipient");
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });

export function Garden() {
  const mine = useMine();
  const [confirmDialog, confirm] = useConfirm();
  const [copied, setCopied] = useState<string | null>(null);
  const [remote, setRemote] = useState<Sent[] | null>(null);
  const [received, setReceived] = useState<Received[] | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [previewing, setPreviewing] = useState<Sent | null>(null);
  const [seen, setSeen] = useState<Record<string, string>>({});
  const [pingTick, setPingTick] = useState(0);
  const slugs = mine?.map((m) => m.slug).join(",");
  const claimed = useRef(false);

  /** Loads (or silently reloads) sent + received. Errors keep what's on screen. */
  const load = useCallback(async (initial: boolean) => {
    const items = getMine().map((m) => ({ slug: m.slug, token: m.token }));
    const recv = getReceived().map((r) => ({ slug: r.slug, conversation: r.conversation, link: r.link }));
    const [rec, data] = await Promise.all([
      post("/api/bouquets/received", { items: recv }).catch(() => null) as Promise<{ bouquets: Received[] } | null>,
      post("/api/bouquets/mine", { items }).catch(() => null) as Promise<{ bouquets: Sent[]; signedIn: boolean } | null>,
    ]);
    if (rec || initial) setReceived(rec?.bouquets ?? []);
    if (data || initial) {
      setSignedIn(Boolean(data?.signedIn));
      setRemote(data?.bouquets ?? []);
    }
    setSeen(getSeen());
    // First visit after signing in: attach this device's bouquets to the account.
    if (!claimed.current && data?.signedIn && data.bouquets.some((b) => !b.owned && !b.deleted)) {
      claimed.current = true;
      const claim = await post("/api/bouquets/claim", { items }).catch(() => null);
      if (claim?.claimed > 0) setRemote(data.bouquets.map((b) => ({ ...b, owned: true })));
    }
  }, []);

  useEffect(() => {
    if (mine === null) return;
    const t = setTimeout(() => load(true), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugs]);

  // Stay fresh without a refresh: poll while visible, reload when the tab comes back.
  useEffect(() => {
    const tick = () => document.visibilityState === "visible" && load(false);
    const id = setInterval(tick, 30_000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [load]);

  // Live: recipients ping a bouquet's inbox when they react or write, so new chats land right away.
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useInbox((remote ?? []).filter((b) => !b.deleted).slice(0, 30).map((b) => inboxChannel(b.slug)), () => {
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      load(false);
      setPingTick((n) => n + 1);
    }, 400);
  });

  useEffect(() => {
    if (!signedIn) return;
    supabaseBrowser()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email ?? null));
    if (new URLSearchParams(location.search).has("signedin")) track("signup_completed", { method: "magic_link_or_oauth" });
  }, [signedIn]);

  if (mine === null || remote === null || received === null)
    return (
      <div className="mt-6 min-h-[30rem]" aria-busy="true">
        <BloomLoader label="Gathering your bouquets…" className="mb-6" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <BouquetCardSkeleton />
          <BouquetCardSkeleton />
          <BouquetCardSkeleton />
        </div>
      </div>
    );

  const sent = remote.filter((b) => !b.deleted);

  const remove = async (b: Sent) => {
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

  const forget = async (r: Received) => {
    const ok = await confirm({
      title: `Remove the bouquet from ${r.from || "someone"}?`,
      description: "It disappears from your list. The link itself keeps working, so you can open it again from the original message.",
      confirmLabel: "Remove",
      cancelLabel: "Keep it",
    });
    if (!ok) return;
    removeReceived(r.slug);
    if (signedIn) await fetch(`/api/bouquets/received?slug=${r.slug}`, { method: "DELETE" }).catch(() => {});
    setReceived((list) => list?.filter((x) => x.slug !== r.slug) ?? null);
  };

  /** Native share sheet where the device has one (like any other app), else copy the link. */
  const share = async (b: Sent) => {
    const url = `${window.location.origin}/b/${b.slug}`;
    if ("share" in navigator) {
      try {
        await navigator.share({ title: "Something special for you 💌", text: b.card.to ? `${b.card.to}, I sealed something special for you 💌 Open it:` : "I sealed something special for you 💌 Open it:", url });
        track("share_clicked", { channel: "native", where: "garden" });
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
      }
    }
    const slug = b.slug;
    await navigator.clipboard?.writeText(url).catch(() => {});
    setCopied(slug);
    setTimeout(() => setCopied((c) => (c === slug ? null : c)), 1600);
  };

  const unreadSent = (b: Sent) => b.conversations.filter((c) => {
    const last = lastRecipientMsg(c);
    return last && last.at > (seen[chatKey(b.slug, c.id)] ?? "");
  }).length;
  const unreadReceived = (r: Received) => Boolean(r.chat.last && r.chat.last.author === "sender" && r.chat.last.at > (seen[chatKey(r.slug, r.conversation)] ?? ""));

  const lastActivity = (e: Entry) => {
    const msgs = e.kind === "sent" ? e.item.conversations.map((c) => c.messages.at(-1)?.at ?? "") : [e.item.chat.last?.at ?? ""];
    return [e.at, ...msgs].sort().at(-1)!;
  };

  const entries: Entry[] = [
    ...(tab === "received" ? [] : sent.map((b): Entry => ({ kind: "sent", at: b.createdAt, thread: b.thread, item: b }))),
    ...(tab === "sent" ? [] : received.map((r): Entry => ({ kind: "received", at: r.createdAt, thread: r.thread, item: r }))),
  ];
  const groups = new Map<string, Entry[]>();
  for (const e of entries) groups.set(e.thread, [...(groups.get(e.thread) ?? []), e]);
  const ordered = [...groups.values()]
    .map((g) => g.sort((a, b) => a.at.localeCompare(b.at)))
    .sort((a, b) => Math.max(...b.map((e) => Date.parse(lastActivity(e)))) - Math.max(...a.map((e) => Date.parse(lastActivity(e)))));

  const card = (e: Entry) =>
    e.kind === "sent" ? (
      <SentCard key={e.item.slug} b={e.item} unread={unreadSent(e.item)} copied={copied === e.item.slug} onCopy={() => share(e.item)} onDelete={() => remove(e.item)} onPreview={() => setPreviewing(e.item)} />
    ) : (
      <ReceivedCard key={e.item.slug} r={e.item} unread={unreadReceived(e.item)} onRemove={() => forget(e.item)} />
    );

  const counts = { all: sent.length + received.length, sent: sent.length, received: received.length };

  return (
    <div className="min-h-[30rem]">
      {confirmDialog}
      <Account signedIn={signedIn} email={email} count={sent.length} />

      <div role="tablist" aria-label="Show" className="mt-6 inline-flex rounded-full border border-line bg-paper p-1 text-sm">
        {(
          [
            ["all", "All"],
            ["sent", "Sent"],
            ["received", "Received"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`min-h-10 rounded-full px-4 font-medium transition ${tab === id ? "bg-ink text-cream" : "text-ink-soft hover:text-ink"}`}
          >
            {label} <span className="font-mono text-xs opacity-70">{counts[id]}</span>
          </button>
        ))}
      </div>

      {!ordered.length ? (
        <div className="mt-6 rounded-[var(--radius-card)] border border-dashed border-line bg-paper p-8 text-center sm:p-10">
          <p className="font-display text-3xl">{tab === "received" ? "Nothing received yet 💌" : "Your garden is empty 🌱"}</p>
          <p className="mt-2 text-ink/70">
            {tab === "received" ? "Bouquets people send you show up here once you open them." : "Bouquets you send and receive will show up here."}
          </p>
          <Link href="/create" className="btn-primary mt-6">
            {tab === "received" ? "Send one first" : "Make your first bouquet"}
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ordered.map((g) =>
            g.length === 1 ? (
              <li key={g[0].thread} className="min-w-0">
                {card(g[0])}
              </li>
            ) : (
              <li key={g[0].thread} className="min-w-0 sm:col-span-2 lg:col-span-3">
                <ThreadGroup entries={g}>{g.map(card)}</ThreadGroup>
              </li>
            ),
          )}
        </ul>
      )}

      {previewing && (
        <SenderPreview
          bouquet={{
            slug: previewing.slug,
            design: previewing.design,
            to: previewing.card.to,
            from: previewing.card.from,
            message: previewing.card.message,
            style: previewing.card.style,
            occasion: previewing.occasion,
            revealAt: previewing.revealAt,
            createdAt: previewing.createdAt,
          }}
          token={getMine().find((m) => m.slug === previewing.slug)?.token ?? null}
          conversations={previewing.conversations}
          refreshKey={pingTick}
          onConversations={(next) => setRemote((list) => list?.map((b) => (b.slug === previewing.slug ? { ...b, conversations: next } : b)) ?? null)}
          onClose={() => {
            setPreviewing(null);
            setSeen(getSeen());
          }}
        />
      )}
    </div>
  );
}

/** A back-and-forth of bouquets ("send one back" chain), shown as one connected row. */
function ThreadGroup({ entries, children }: { entries: Entry[]; children: React.ReactNode[] }) {
  const people = [...new Set(entries.map((e) => (e.kind === "sent" ? e.item.card.to : e.item.from)).filter(Boolean))];
  return (
    <section className="rounded-[calc(var(--radius-card)+0.5rem)] border-[1.5px] border-ink bg-cream p-3 shadow-[3px_3px_0_0_var(--color-ink)]" aria-label="Bouquet thread">
      <p className="flex items-center gap-2 px-1 text-sm">
        <Undo2 className="size-4" aria-hidden />
        <span className="font-medium" data-clarity-mask="true">
          Thread{people.length ? ` with ${people.slice(0, 2).join(" & ")}${people.length > 2 ? ` +${people.length - 2}` : ""}` : ""}
        </span>
        <span className="text-ink-soft">· {entries.length} bouquets</span>
      </p>
      <ol className="no-scrollbar mt-3 flex snap-x gap-3 overflow-x-auto pb-1">
        {children.map((c, i) => (
          <li key={i} className="flex w-[min(20rem,85vw)] shrink-0 snap-start items-stretch gap-3 [&>*:first-child]:flex-1">
            {c}
            {i < children.length - 1 && <span aria-hidden className="self-center font-display text-2xl text-ink-soft">→</span>}
          </li>
        ))}
      </ol>
    </section>
  );
}

function Direction({ kind }: { kind: "sent" | "received" }) {
  return kind === "sent" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 font-mono text-[10px] tracking-wider text-cream uppercase">
      <ArrowUpRight className="size-3" aria-hidden /> Sent
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-petal/50 px-2 py-0.5 font-mono text-[10px] tracking-wider uppercase">
      <ArrowDownLeft className="size-3" aria-hidden /> Received
    </span>
  );
}

function NewDot({ n }: { n?: number }) {
  return <span className="rounded-full bg-petal-deep px-1.5 py-px font-mono text-[10px] text-cream">{n && n > 1 ? `${n} new` : "new"}</span>;
}

function SentCard({ b, unread, copied, onCopy, onDelete, onPreview }: { b: Sent; unread: number; copied: boolean; onCopy: () => void; onDelete: () => void; onPreview: () => void }) {
  const names = conversationNames(b.conversations, b.card.to);
  const reactors = b.conversations.filter((c) => lastRecipientMsg(c)).sort((x, y) => lastRecipientMsg(y)!.at.localeCompare(lastRecipientMsg(x)!.at));
  const latest = reactors[0] ? [...reactors[0].messages].reverse().find((m) => m.author === "recipient" && m.emoji)?.emoji : null;
  const links = b.conversations.filter((c) => c.id.startsWith("l:"));
  const canShare = typeof navigator !== "undefined" && "share" in navigator;
  return (
    <article className="flex h-full min-w-0 flex-col rounded-[var(--radius-card)] border border-line bg-paper p-4">
      <div className="flex gap-4">
        <button type="button" onClick={onPreview} className="w-24 shrink-0 rounded-xl transition hover:-rotate-2" aria-label={`Preview bouquet for ${b.card.to || "someone"}`}>
          <BouquetSvg design={b.design} className="w-full rounded-xl" label="" />
        </button>
        <div className="min-w-0 flex-1">
          <Direction kind="sent" />
          <p className="mt-1 truncate font-display text-2xl leading-tight" data-clarity-mask="true">
            for {b.card.to || "someone"}
          </p>
          <p className="mt-1 text-sm text-ink-soft">{fmtDate(b.createdAt)}</p>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm">
            <Eye className="size-4" aria-hidden /> {b.views} {b.views === 1 ? "open" : "opens"}
            {links.length > 0 && <span className="text-ink-soft">· {links.filter((l) => l.openedAt).length}/{links.length} people</span>}
          </p>
          {b.expiresAt && <p className="mt-1 text-xs text-ink-soft">Expires {fmtDate(b.expiresAt)}</p>}
        </div>
      </div>
      {(reactors.length > 0 || b.replies.length > 0) && (
        <div className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm" data-clarity-mask="true">
          {reactors.length > 0 && (
            <button type="button" onClick={onPreview} className="flex w-full items-center gap-2 rounded-lg text-left hover:text-petal-deep">
              <MessageCircle className="size-4 shrink-0" aria-hidden />
              <span className="min-w-0 flex-1 truncate">
                {names.get(reactors[0].id)}
                {reactors.length > 1 ? ` and ${reactors.length - 1} other${reactors.length > 2 ? "s" : ""}` : ""} reacted {latest ?? ""}
              </span>
              {unread > 0 && <NewDot n={unread} />}
            </button>
          )}
          {b.replies.map((r) => (
            <a key={r.slug} href={`/b/${r.slug}`} className="flex items-center gap-2 hover:text-petal-deep">
              <Flower2 className="size-4 shrink-0" aria-hidden />
              <span className="truncate">{r.from || "They"} sent one back 💐</span>
            </a>
          ))}
        </div>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-1 pt-4">
        <button type="button" onClick={onPreview} className="btn-ghost min-h-11 border border-line !py-1.5 text-sm">
          <Eye className="size-3.5" aria-hidden /> Preview
        </button>
        <Link href={`/create?edit=${b.slug}`} className="btn-ghost min-h-11 border border-line !py-1.5 text-sm">
          <Pencil className="size-3.5" aria-hidden /> Edit
        </Link>
        <button className="btn-ghost min-h-11 border border-line !py-1.5 text-sm" aria-live="polite" onClick={onCopy}>
          {copied ? <Check className="size-3.5" aria-hidden /> : canShare ? <Share className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
          {copied ? "Copied" : canShare ? "Share" : "Copy"}
        </button>
        <Tooltip label="Delete">
          <button className="btn-ghost ml-auto min-h-11 !py-1.5 text-sm text-petal-deep" onClick={onDelete} aria-label={`Delete bouquet for ${b.card.to || "someone"}`}>
            <Trash2 className="size-4" aria-hidden />
          </button>
        </Tooltip>
      </div>
    </article>
  );
}

function ReceivedCard({ r, unread, onRemove }: { r: Received; unread: boolean; onRemove: () => void }) {
  const href = `/b/${r.slug}${r.link ? `?r=${r.link}` : ""}`;
  const last = r.chat.last;
  return (
    <article className="flex h-full min-w-0 flex-col rounded-[var(--radius-card)] border border-line bg-paper p-4">
      <div className="flex gap-4">
        <Link href={href} className="grid w-24 shrink-0 place-items-center rounded-xl transition hover:-rotate-2" aria-label={`Open bouquet from ${r.from || "someone"}`}>
          {r.design ? <BouquetSvg design={r.design} className="w-full rounded-xl" label="" /> : <EnvelopeArt look={r.envelope} initial={r.from} />}
        </Link>
        <div className="min-w-0 flex-1">
          <Direction kind="received" />
          <p className="mt-1 truncate font-display text-2xl leading-tight" data-clarity-mask="true">
            from {r.from || "someone"}
          </p>
          <p className="mt-1 text-sm text-ink-soft">{r.locked && r.revealAt ? `Opens ${fmtDate(r.revealAt)} ⏳` : fmtDate(r.createdAt)}</p>
        </div>
      </div>
      {last && (
        <Link href={href} className="mt-3 flex items-center gap-2 border-t border-line pt-3 text-sm hover:text-petal-deep" data-clarity-mask="true">
          <MessageCircle className="size-4 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1 truncate">
            {last.author === "sender" ? `${r.from || "They"}: ${last.text ?? last.emoji}` : `You: ${last.emoji ?? ""} ${last.text ?? ""}`}
          </span>
          {unread && <NewDot />}
        </Link>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-1 pt-4">
        <Link href={href} className="btn-ghost min-h-11 border border-line !py-1.5 text-sm">
          Open
        </Link>
        <Link
          href={`/create?replyTo=${r.slug}${r.from ? `&to=${encodeURIComponent(r.from)}` : ""}`}
          onClick={() => track("send_back_clicked", { where: "garden" })}
          className="btn-ghost min-h-11 border border-line !py-1.5 text-sm"
        >
          <Flower2 className="size-3.5" aria-hidden /> Send one back
        </Link>
        <Tooltip label="Remove from list">
          <button className="btn-ghost ml-auto min-h-11 !py-1.5 text-sm text-ink-soft" onClick={onRemove} aria-label={`Remove bouquet from ${r.from || "someone"}`}>
            <X className="size-4" aria-hidden />
          </button>
        </Tooltip>
      </div>
    </article>
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
              {busy ? (
                <>
                  <MiniBloom /> One sec…
                </>
              ) : mode === "signup" ? "Create account" : mode === "signin" ? "Sign in" : "Send reset link"}
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
