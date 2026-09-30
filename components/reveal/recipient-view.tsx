"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Clapperboard, Download, Film, Flag, Flower2, History } from "lucide-react";
import { BouquetSvg } from "@/components/bouquet/bouquet-svg";
import { useExport } from "@/components/share/use-export";
import { Logo } from "@/components/ui/logo";
import { Tooltip } from "@/components/ui/tooltip";
import { BACKGROUNDS } from "@/lib/bouquet/catalog";
import type { Conversation } from "@/lib/bouquet/chat";
import { normalizeEnvelope } from "@/lib/bouquet/envelope";
import { addReceived, getReceived, isMine, rememberRef, viewerId } from "@/lib/local";
import { MiniBloom } from "@/components/ui/bloom-loader";
import { track } from "@/lib/analytics/track";
import type { PublicBouquet, ThreadItem } from "@/lib/server/bouquets";
import { PreviewChat, RecipientChat, SenderChat } from "./chat";
import { ChatDock } from "./chat-dock";
import { NoteTag, OpenNote, PinnedNote } from "./note-pick";

const PIN_KEY = "pp-note-pin-v1";
/** The recipient's own pin choice for a bouquet, or null when they haven't chosen. */
function readPinPref(slug: string): boolean | null {
  try {
    const v = (JSON.parse(localStorage.getItem(PIN_KEY) ?? "{}") as Record<string, boolean>)[slug];
    return typeof v === "boolean" ? v : null;
  } catch {
    return null;
  }
}
function writePinPref(slug: string, v: boolean) {
  try {
    const all = JSON.parse(localStorage.getItem(PIN_KEY) ?? "{}") as Record<string, boolean>;
    all[slug] = v;
    localStorage.setItem(PIN_KEY, JSON.stringify(all));
  } catch {}
}

/** Chat height inside the dock: compact, and never taller than the screen allows. */
const DOCK_CHAT_H = "h-[min(20rem,calc(100dvh-15rem))]";
import { Envelope } from "./envelope";

/** The sender's own preview (My bouquets): shows every recipient's chat and never counts as an open. */
export type SenderPreview = { token: string | null; conversations: Conversation[]; refreshKey?: number; extra?: ReactNode };

/**
 * The recipient's experience: envelope → unwrap → bloom → card, with actions in a top bar.
 * `preview` renders the exact same flow for the sender before sending (no tracking, no writes).
 */
export function RecipientView({
  bouquet,
  preview,
  previewActions,
  link = null,
  thread = [],
  sender,
}: {
  bouquet: PublicBouquet;
  preview?: boolean;
  previewActions?: ReactNode;
  /** Personal link key this page was opened with. */
  link?: string | null;
  /** Earlier bouquets in the send-one-back chain, oldest first. */
  thread?: ThreadItem[];
  sender?: SenderPreview;
}) {
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState<string | null>(null);
  const [mine, setMine] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteRead, setNoteRead] = useState(false);
  // Sender's choice by default; the recipient can switch it and we remember that per bouquet.
  const [pinned, setPinnedState] = useState(bouquet.style.note === "pinned");
  // The sender opening their preview came to see chats: start with the dock open when there are any.
  const [dock, setDock] = useState(() => Boolean(sender?.conversations.some((c) => c.messages.length)));
  const [unread, setUnread] = useState(0);
  const shownAt = useRef(0);
  const reduce = useReducedMotion();
  const bg = BACKGROUNDS[bouquet.design.background] ?? BACKGROUNDS.cream;
  const dark = Boolean(bg.dark) && open;
  const exp = useExport({ design: bouquet.design, to: bouquet.to, from: bouquet.from, message: bouquet.message, style: bouquet.style, song: bouquet.song }, "recipient");
  const hasNote = Boolean(bouquet.to || bouquet.from || bouquet.message || bouquet.song || bouquet.voice);
  const sendBack = `/create?replyTo=${bouquet.slug}${bouquet.from ? `&to=${encodeURIComponent(bouquet.from)}` : ""}`;

  useEffect(() => {
    shownAt.current = performance.now();
    if (preview) return;
    const own = isMine(bouquet.slug);
    track("bouquet_viewed", {
      is_creator: own,
      personal_link: Boolean(link),
      occasion: bouquet.occasion ?? "none",
      flower_count: bouquet.design.items.length,
      source: new URLSearchParams(location.search).get("utm_source") ?? (document.referrer ? new URL(document.referrer).hostname : "direct"),
    });
    let cancelled = false;
    const t = setTimeout(async () => {
      setMine(own);
      if (own) return;
      // If they go on to make their own bouquet, it counts toward this sender's referral stats.
      rememberRef(bouquet.slug);
      // Our side of the chat: the personal link, else the chat this device already has, else this device.
      const known = getReceived().find((e) => e.slug === bouquet.slug);
      let conv = link ? `l:${link}` : (known?.conversation ?? `d:${viewerId()}`);
      const res = await fetch(`/api/bouquets/${bouquet.slug}/receive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation: conv, link }),
      }).catch(() => null);
      const data = res?.ok ? ((await res.json()) as { conversation: string; own?: boolean }) : null;
      if (cancelled) return;
      if (data?.own) return setMine(true);
      if (data?.conversation) conv = data.conversation;
      setConversation(conv);
      addReceived({ slug: bouquet.slug, link, conversation: conv, to: bouquet.to, from: bouquet.from, receivedAt: new Date().toISOString() });
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [bouquet.slug, bouquet.to, bouquet.from, bouquet.occasion, bouquet.design.items.length, preview, link]);

  useEffect(() => {
    if (preview) return;
    const t = setTimeout(() => {
      const pref = readPinPref(bouquet.slug);
      if (pref !== null) setPinnedState(pref);
    }, 0);
    return () => clearTimeout(t);
  }, [bouquet.slug, preview]);

  const setPinned = (v: boolean) => {
    setPinnedState(v);
    if (!preview) {
      writePinPref(bouquet.slug, v);
      track("note_pinned", { pinned: v });
    }
  };

  // Pinned notes are read without a tap, so bring up the chat a little after the bloom instead.
  useEffect(() => {
    if (!open || !pinned || !hasNote || noteRead || mine || sender || preview) return;
    const t = setTimeout(() => {
      setNoteRead(true);
      setDock(true);
    }, 4200);
    return () => clearTimeout(t);
  }, [open, pinned, hasNote, noteRead, mine, sender, preview]);

  const unwrap = () => {
    setOpen(true);
    if (preview) return;
    track("bouquet_unwrapped", { time_to_unwrap_ms: Math.round(performance.now() - shownAt.current) });
    if (!isMine(bouquet.slug))
      fetch(`/api/bouquets/${bouquet.slug}/view`, { method: "POST", keepalive: true, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ link }) }).catch(() => {});
  };

  const openNote = () => {
    setNoteOpen(true);
    setDock(false);
    if (!preview) track("note_opened", { first: !noteRead, pinned });
  };
  const closeNote = () => {
    setNoteOpen(false);
    // Just read it: that's the moment to react.
    if (!noteRead && !mine && !sender) setTimeout(() => setDock(true), 450);
    setNoteRead(true);
  };

  const iconBtn = `flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-full border px-3 text-sm transition disabled:opacity-40 ${dark ? "border-cream/30 text-cream hover:bg-cream/10" : "border-line bg-paper/80 text-ink hover:bg-paper"}`;

  return (
    <div
      className={`relative flex flex-col transition-colors duration-700 ${open ? `${preview ? "h-[calc(100dvh-1.75rem)]" : "h-dvh"} overflow-hidden` : preview ? "min-h-full" : "min-h-dvh"}`}
      style={{ background: open ? bg.fill : "var(--color-cream)" }}
    >
      {/* Top bar: brand + actions, always reachable without scrolling */}
      <header className={`sticky z-30 flex items-center justify-between gap-2 px-3 py-2.5 backdrop-blur-md sm:px-5 ${preview ? "top-7" : "top-0"} ${dark ? "bg-black/10" : "bg-cream/60"}`}>
        {preview ? (
          <span className="rounded-full bg-paper/80 py-1 pr-2 pl-2 min-[440px]:pr-3">
            <Logo compact collapse />
          </span>
        ) : (
          <Link href="/" aria-label="Flower Bouquet Digital home" className="rounded-full bg-paper/80 py-1 pr-2 pl-2 min-[440px]:pr-3">
            <Logo compact collapse={open} />
          </Link>
        )}
        {preview
          ? previewActions
          : open && (
              <div className="flex items-center gap-1.5">
                {(
                  [
                    ["story", "Save as image", "Image", Download],
                    ["video", "Save the opening as a video", "Video", Clapperboard],
                    ["gif", "Save the opening as a GIF", "GIF", Film],
                  ] as const
                ).map(([kind, label, short, Icon]) => (
                  <Tooltip key={kind} label={label} side="bottom">
                    <button className={iconBtn} aria-label={label} onClick={() => exp.run(kind)} disabled={exp.busy !== null}>
                      {exp.busy === kind ? (
                        <span className="flex items-center gap-1 font-mono text-[10px]">
                          <MiniBloom className="size-5" />
                          {kind !== "story" && `${Math.round(exp.progress * 100)}%`}
                        </span>
                      ) : (
                        <>
                          <Icon className="size-[18px]" aria-hidden />
                          <span className="hidden lg:inline">{short}</span>
                        </>
                      )}
                    </button>
                  </Tooltip>
                ))}
                <Link href={sendBack} onClick={() => track("send_back_clicked")} className="btn-primary ml-1 !px-3 !py-2.5 text-sm whitespace-nowrap min-[400px]:!px-4">
                  <Flower2 className="size-4" aria-hidden /> <span className="hidden min-[400px]:inline">Send one back</span>
                  <span className="sr-only min-[400px]:hidden">Send one back</span>
                </Link>
              </div>
            )}
      </header>
      {exp.error && (
        <p role="alert" className="mx-auto mt-2 rounded-xl bg-paper px-4 py-2 text-sm text-petal-deep">
          {exp.error}
        </p>
      )}

      <AnimatePresence mode="wait">
        {!open ? (
          <motion.div
            key="wrapped"
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.08, y: -30 }}
            transition={{ duration: 0.45 }}
            className="grid flex-1 place-items-center px-4 pt-6 pb-16"
          >
            <Envelope to={bouquet.to} from={bouquet.from} look={normalizeEnvelope(bouquet.style.envelope)} onOpen={unwrap} as={preview ? "h2" : "h1"} />
          </motion.div>
        ) : (
          <motion.div
            key="open"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`relative flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-4 pt-1 pb-20 transition-[padding] duration-500 sm:pb-6 ${pinned && hasNote ? `lg:flex-row lg:gap-12 ${dock ? "lg:pr-[24rem]" : ""}` : ""}`}
          >
            {!reduce && <PetalRain dark={Boolean(bg.dark)} />}
            {/* The bouquet owns the screen; the note hangs off its ribbon like a gift tag, or is pinned beside it (making room for the open chat dock on wide screens). */}
            <div className={`relative aspect-[4/5] max-h-full max-w-full ${pinned && hasNote ? "h-[55%] shrink-0 lg:h-full" : "h-full"}`}>
              <BouquetSvg design={bouquet.design} bloom showBackground={false} label={`A bouquet for ${bouquet.to || "you"}`} className="absolute inset-0 h-full w-full" />
              {hasNote && !pinned && !noteOpen && <NoteTag note={bouquet} wrapper={bouquet.design.wrapper} hint={!noteRead} onOpen={openNote} delay={noteRead ? 0 : 1.5} />}
            </div>
            {hasNote && pinned && !noteOpen && (
              <PinnedNote note={bouquet} onOpen={openNote} onUnpin={() => setPinned(false)} delay={noteRead ? 0 : 1.6} className="z-10 -mt-8 w-full max-w-md shrink lg:mt-0 lg:w-[26rem]" />
            )}
            <AnimatePresence>
              {noteOpen && (
                <OpenNote
                  note={bouquet}
                  preview={preview}
                  pinned={pinned}
                  onTogglePin={() => {
                    setPinned(!pinned);
                    closeNote();
                  }}
                  onClose={closeNote}
                />
              )}
            </AnimatePresence>

            <ChatDock
              expanded={dock}
              onToggle={(next) => {
                setDock(next);
                if (next) setUnread(0);
                if (!preview) track("chat_toggled", { open: next, unread, is_creator: mine || Boolean(sender) });
              }}
              unread={unread}
              label={sender ? "Reactions & chat" : preview ? "Their chat" : mine ? "Your bouquet" : `Chat with ${bouquet.from || "them"}`}
            >
              {sender ? (
                <>
                  <SenderChat slug={bouquet.slug} token={sender.token} to={bouquet.to} conversations={sender.conversations} refreshKey={sender.refreshKey} height={DOCK_CHAT_H} />
                  {sender.extra}
                </>
              ) : preview ? (
                <PreviewChat height={DOCK_CHAT_H} />
              ) : mine ? (
                <p className="rounded-2xl bg-cream px-4 py-3 text-sm">
                  This is your bouquet 💐 See opens and chat with {bouquet.to || "them"} in{" "}
                  <Link href="/garden" className="underline underline-offset-2">
                    My bouquets
                  </Link>
                  .
                </p>
              ) : (
                <RecipientChat slug={bouquet.slug} conversation={conversation} from={bouquet.from} height={DOCK_CHAT_H} onIncoming={() => !dock && setUnread((n) => n + 1)} />
              )}
              {thread.length > 0 && <ThreadStrip thread={thread} dark={false} />}
              <div className="px-1 pb-1 text-center">
                <Footer slug={bouquet.slug} dark={false} hideReport={mine || Boolean(preview)} />
              </div>
            </ChatDock>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Earlier bouquets in this back-and-forth, so a reply reads like a thread. */
function ThreadStrip({ thread, dark }: { thread: ThreadItem[]; dark: boolean }) {
  return (
    <div className={`rounded-[1.25rem] border px-3 py-3 text-left ${dark ? "border-cream/25 bg-cream/5 text-cream" : "border-line bg-paper/80 text-ink"}`}>
      <p className="label flex items-center gap-1.5 !text-current opacity-70">
        <History className="size-3.5" aria-hidden /> Earlier in this thread
      </p>
      <ol className="no-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
        {thread.map((t) => (
          <li key={t.slug} className="shrink-0">
            <a href={`/b/${t.slug}`} className="flex w-28 flex-col items-center rounded-xl p-1.5 text-center transition hover:bg-ink/5">
              <BouquetSvg design={t.design} className="h-20 w-auto" label={`Bouquet from ${t.from || "someone"}`} />
              <span className="mt-1 w-full truncate text-xs font-medium" data-clarity-mask="true">
                {t.from || "Someone"} → {t.to || "you"}
              </span>
              <span className="text-[11px] opacity-60">{new Date(t.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Footer({ slug, dark, hideReport }: { slug: string; dark: boolean; hideReport: boolean }) {
  const [reported, setReported] = useState(false);
  const [reporting, setReporting] = useState(false);
  return (
    <div className={dark ? "text-cream" : "text-ink"}>
      <p className={`text-xs ${dark ? "text-cream/60" : "text-ink-soft"}`}>
        Made with{" "}
        <Link href="/" className="underline underline-offset-2">
          Flower Bouquet Digital
        </Link>
        {!hideReport && !reported && !reporting && (
          <button className="ml-2 inline-flex min-h-9 items-center gap-1 underline underline-offset-2" data-track="report_opened" onClick={() => setReporting(true)}>
            <Flag className="size-3" aria-hidden /> Report
          </button>
        )}
        {reported && <span className="ml-2">Thanks, we&rsquo;ll take a look.</span>}
      </p>
      {reporting && !reported && (
        <form
          className="mx-auto mt-3 max-w-sm rounded-2xl border border-line bg-paper p-4 text-left text-sm text-ink"
          onSubmit={async (e) => {
            e.preventDefault();
            const reason = new FormData(e.currentTarget).get("reason") as string;
            track("bouquet_reported", { reason });
            await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, reason }) }).catch(() => {});
            setReported(true);
          }}
        >
          <fieldset>
            <legend className="font-medium">What&rsquo;s wrong?</legend>
            {["Harassment or bullying", "Spam or scam", "Hate or threats", "Something else"].map((r, i) => (
              <label key={r} className="mt-2 flex min-h-9 items-center gap-2">
                <input type="radio" name="reason" value={r} defaultChecked={i === 0} className="size-4 accent-ink" /> {r}
              </label>
            ))}
          </fieldset>
          <div className="mt-3 flex gap-2">
            <button className="btn-primary !py-2 text-sm">Send report</button>
            <button type="button" className="btn-ghost text-sm" onClick={() => setReporting(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function PetalRain({ dark }: { dark?: boolean }) {
  const petals = Array.from({ length: 14 }, (_, i) => i);
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {petals.map((i) => (
        <span
          key={i}
          className="pp-petal absolute -top-8 block h-4 w-3 rounded-[60%_0_60%_0]"
          style={{
            left: `${(i * 73) % 100}%`,
            background: ["#F4A6C0", "#F7DE8A", "#C9B8F2", dark ? "#FFFFFF" : "#F28A6B"][i % 4],
            animationDelay: `${0.6 + (i % 7) * 0.45}s`,
            animationDuration: `${5 + (i % 5)}s`,
          }}
        />
      ))}
    </div>
  );
}
