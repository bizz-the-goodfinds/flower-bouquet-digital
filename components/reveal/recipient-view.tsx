"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Download, Flag, Flower2 } from "lucide-react";
import { BouquetSvg } from "@/components/bouquet/bouquet-svg";
import { NoteCard } from "@/components/bouquet/note-card";
import { BACKGROUNDS } from "@/lib/bouquet/catalog";
import { REACTIONS } from "@/lib/bouquet/card";
import { renderBouquetPng, saveImage } from "@/lib/bouquet/export";
import { isMine } from "@/lib/local";
import { track } from "@/lib/analytics/track";
import type { PublicBouquet } from "@/lib/server/bouquets";
import { Envelope } from "./envelope";

export function RecipientView({ bouquet }: { bouquet: PublicBouquet }) {
  const [open, setOpen] = useState(false);
  const shownAt = useRef(0);
  const reduce = useReducedMotion();
  const bg = BACKGROUNDS[bouquet.design.background] ?? BACKGROUNDS.cream;

  useEffect(() => {
    shownAt.current = performance.now();
    track("bouquet_viewed", { is_creator: isMine(bouquet.slug) });
  }, [bouquet.slug]);

  const unwrap = () => {
    setOpen(true);
    track("bouquet_unwrapped", { time_to_unwrap_ms: Math.round(performance.now() - shownAt.current) });
    if (!isMine(bouquet.slug)) fetch(`/api/bouquets/${bouquet.slug}/view`, { method: "POST", keepalive: true }).catch(() => {});
  };

  return (
    <div className="relative min-h-dvh overflow-hidden transition-colors duration-700" style={{ background: open ? bg.fill : undefined }}>
      <AnimatePresence mode="wait">
        {!open ? (
          <motion.div
            key="wrapped"
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.08, y: -30 }}
            transition={{ duration: 0.45 }}
            className="grid min-h-dvh place-items-center px-4 py-16"
          >
            <Envelope to={bouquet.to} from={bouquet.from} onOpen={unwrap} />
          </motion.div>
        ) : (
          <motion.div key="open" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-5xl px-4 pt-8 pb-20">
            {!reduce && <PetalRain dark={bg.dark} />}
            <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[1.1fr_1fr]">
              <div className="mx-auto w-full max-w-[480px] min-w-0">
                <BouquetSvg design={bouquet.design} bloom showBackground={false} label={`A bouquet for ${bouquet.to || "you"}`} className="h-auto w-full" />
              </div>
              <motion.div
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 60, rotate: 4 }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, rotate: -1.5 }}
                transition={{ delay: reduce ? 0.2 : 1.6, type: "spring", stiffness: 120, damping: 16 }}
                className="mx-auto w-full max-w-md min-w-0 px-1"
              >
                <NoteCard to={bouquet.to} from={bouquet.from} message={bouquet.message} style={bouquet.style} />
              </motion.div>
            </div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduce ? 0.3 : 2.4 }}>
              <Respond bouquet={bouquet} dark={Boolean(bg.dark)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Respond({ bouquet, dark }: { bouquet: PublicBouquet; dark: boolean }) {
  const [picked, setPicked] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [reported, setReported] = useState(false);
  const [reporting, setReporting] = useState(false);
  const mine = typeof window !== "undefined" && isMine(bouquet.slug);
  const text = dark ? "text-cream" : "text-ink";
  const sendBack = `/create?replyTo=${bouquet.slug}${bouquet.from ? `&to=${encodeURIComponent(bouquet.from)}` : ""}`;

  const send = async () => {
    if (!picked) return;
    setStatus("sending");
    const res = await fetch("/api/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: bouquet.slug, emoji: picked, reply: reply || undefined }),
    }).catch(() => null);
    setStatus(res?.ok ? "sent" : "error");
    if (res?.ok) track("reaction_sent", { emoji: picked, has_reply: Boolean(reply) });
  };

  return (
    <div className={`mx-auto mt-10 max-w-xl text-center ${text}`}>
      {!mine && (
        <div className="rounded-[1.5rem] border-[1.5px] border-ink bg-paper p-5 text-ink shadow-[3px_3px_0_0_var(--color-ink)]">
          {status === "sent" ? (
            <p className="font-display text-2xl">Sent {picked} {bouquet.from ? `to ${bouquet.from}` : ""}</p>
          ) : (
            <>
              <p className="font-display text-2xl">How does it make you feel?</p>
              <div className="mt-3 flex flex-wrap justify-center gap-1.5" role="radiogroup" aria-label="Reaction">
                {REACTIONS.map((r) => (
                  <button
                    key={r}
                    role="radio"
                    aria-checked={picked === r}
                    onClick={() => setPicked(r)}
                    className={`grid size-12 place-items-center rounded-full text-2xl transition hover:scale-110 ${picked === r ? "scale-110 bg-petal/40 ring-2 ring-ink" : "bg-cream"}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              {picked && (
                <div className="mt-3 flex gap-2">
                  <input
                    className="field !py-2.5"
                    maxLength={280}
                    placeholder={`Say something back${bouquet.from ? ` to ${bouquet.from}` : ""} (optional)`}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    data-clarity-mask="true"
                  />
                  <button className="btn-primary !py-2.5" onClick={send} disabled={status === "sending"}>
                    Send
                  </button>
                </div>
              )}
              {status === "error" && <p className="mt-2 text-sm text-petal-deep">Couldn&rsquo;t send. Try again?</p>}
            </>
          )}
        </div>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href={sendBack} onClick={() => track("send_back_clicked")} className="btn-primary text-base">
          <Flower2 className="size-4" aria-hidden /> Send one back
        </Link>
        <button
          className={`btn-ghost border ${dark ? "border-cream/30 text-cream hover:bg-cream/10" : "border-line"}`}
          onClick={async () => {
            const blob = await renderBouquetPng(bouquet.design, { format: "story", to: bouquet.to, from: bouquet.from });
            await saveImage(blob, "my-bouquet.png");
            track("image_downloaded", { format: "story", where: "recipient" });
          }}
        >
          <Download className="size-4" aria-hidden /> Keep it
        </button>
      </div>

      <p className={`mt-10 text-xs ${dark ? "text-cream/60" : "text-ink-soft"}`}>
        Made with <Link href="/" className="underline underline-offset-2">Petalpost</Link>, free digital bouquets.{" "}
        {!mine && !reported && !reporting && (
          <button className="ml-2 inline-flex min-h-11 items-center gap-1 underline underline-offset-2" onClick={() => setReporting(true)}>
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
            await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: bouquet.slug, reason }) }).catch(() => {});
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
