"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Clapperboard, Download, Film, Flag, Flower2, History } from "lucide-react";
import { BouquetSvg } from "@/components/bouquet/bouquet-svg";
import { NoteCard } from "@/components/bouquet/note-card";
import { useExport } from "@/components/share/use-export";
import { Logo } from "@/components/ui/logo";
import { Tooltip } from "@/components/ui/tooltip";
import { BACKGROUNDS } from "@/lib/bouquet/catalog";
import type { Conversation } from "@/lib/bouquet/chat";
import { normalizeEnvelope } from "@/lib/bouquet/envelope";
import { addReceived, getReceived, isMine, viewerId } from "@/lib/local";
import { MiniBloom } from "@/components/ui/bloom-loader";
import { track } from "@/lib/analytics/track";
import type { PublicBouquet, ThreadItem } from "@/lib/server/bouquets";
import { PreviewChat, RecipientChat, SenderChat } from "./chat";
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
  const shownAt = useRef(0);
  const reduce = useReducedMotion();
  const bg = BACKGROUNDS[bouquet.design.background] ?? BACKGROUNDS.cream;
  const dark = Boolean(bg.dark) && open;
  const exp = useExport({ design: bouquet.design, to: bouquet.to, from: bouquet.from, message: bouquet.message, style: bouquet.style }, "recipient");
  const sendBack = `/create?replyTo=${bouquet.slug}${bouquet.from ? `&to=${encodeURIComponent(bouquet.from)}` : ""}`;

  useEffect(() => {
    shownAt.current = performance.now();
    if (preview) return;
    const own = isMine(bouquet.slug);
    track("bouquet_viewed", { is_creator: own });
    let cancelled = false;
    const t = setTimeout(async () => {
      setMine(own);
      if (own) return;
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
  }, [bouquet.slug, bouquet.to, bouquet.from, preview, link]);

  const unwrap = () => {
    setOpen(true);
    if (preview) return;
    track("bouquet_unwrapped", { time_to_unwrap_ms: Math.round(performance.now() - shownAt.current) });
    if (!isMine(bouquet.slug))
      fetch(`/api/bouquets/${bouquet.slug}/view`, { method: "POST", keepalive: true, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ link }) }).catch(() => {});
  };

  const iconBtn = `flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-full border px-3 text-sm transition disabled:opacity-40 ${dark ? "border-cream/30 text-cream hover:bg-cream/10" : "border-line bg-paper/80 text-ink hover:bg-paper"}`;

  return (
    <div
      className={`relative flex min-h-dvh flex-col transition-colors duration-700 ${preview ? "min-h-full" : ""}`}
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
            className={`mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-center gap-4 px-4 pb-8 lg:grid-cols-[1.05fr_1fr] lg:gap-10 ${preview ? "" : "lg:h-[calc(100dvh-4.25rem)] lg:pb-4"}`}
          >
            {!reduce && <PetalRain dark={Boolean(bg.dark)} />}
            <div className="flex min-h-0 min-w-0 justify-center lg:h-full">
              <BouquetSvg
                design={bouquet.design}
                bloom
                showBackground={false}
                label={`A bouquet for ${bouquet.to || "you"}`}
                className="h-auto w-full max-w-[460px] lg:h-full lg:max-h-[calc(100dvh-6rem)] lg:w-auto lg:max-w-full"
              />
            </div>
            <div className="relative z-10 flex min-h-0 min-w-0 flex-col justify-center gap-4 lg:max-h-full lg:overflow-y-auto lg:py-4">
              {(bouquet.to || bouquet.from || bouquet.message) && (
                <motion.div
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 60, rotate: 4 }}
                  animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, rotate: -1.5 }}
                  transition={{ delay: reduce ? 0.2 : 1.6, type: "spring", stiffness: 120, damping: 16 }}
                  className="mx-auto w-full max-w-md px-2"
                >
                  <NoteCard to={bouquet.to} from={bouquet.from} message={bouquet.message} style={bouquet.style} />
                </motion.div>
              )}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduce ? 0.3 : 2.4 }} className="mx-auto w-full max-w-md">
                <div className="space-y-3 text-center">
                  {sender ? (
                    <>
                      <SenderChat slug={bouquet.slug} token={sender.token} to={bouquet.to} conversations={sender.conversations} refreshKey={sender.refreshKey} />
                      {sender.extra}
                    </>
                  ) : preview ? (
                    <PreviewChat />
                  ) : mine ? (
                    <p className={`rounded-2xl px-4 py-3 text-sm ${bg.dark ? "bg-cream/10 text-cream" : "bg-paper/80 text-ink"}`}>
                      This is your bouquet 💐 See opens and chat with {bouquet.to || "them"} in{" "}
                      <Link href="/garden" className="underline underline-offset-2">
                        My bouquets
                      </Link>
                      .
                    </p>
                  ) : (
                    <RecipientChat slug={bouquet.slug} conversation={conversation} from={bouquet.from} />
                  )}
                  {thread.length > 0 && <ThreadStrip thread={thread} dark={Boolean(bg.dark)} />}
                  <Footer slug={bouquet.slug} dark={Boolean(bg.dark)} hideReport={mine || Boolean(preview)} />
                </div>
              </motion.div>
            </div>
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
          <button className="ml-2 inline-flex min-h-9 items-center gap-1 underline underline-offset-2" onClick={() => setReporting(true)}>
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
