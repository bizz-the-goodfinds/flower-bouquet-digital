"use client";

import { useState } from "react";
import { ArrowLeft, CalendarClock, Loader2, Send } from "lucide-react";
import { NoteCard } from "@/components/bouquet/note-card";
import { CARD_FONTS, CARD_TEMPLATES, type CardFont, type CardTemplate } from "@/lib/bouquet/card";
import { clearDraft, useBuilder } from "@/lib/bouquet/store";
import { OCCASION_BY_SLUG } from "@/lib/content/occasions";
import { addMine } from "@/lib/local";
import { track } from "@/lib/analytics/track";

const MAX_MSG = 500;

export function CardStep() {
  const card = useBuilder((s) => s.card);
  const occasion = useBuilder((s) => s.occasion);
  const revealAt = useBuilder((s) => s.revealAt);
  const { setCard, setMeta, setStep } = useBuilder.getState();
  const [scheduled, setScheduled] = useState(Boolean(revealAt));
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const ideas = occasion ? OCCASION_BY_SLUG.get(occasion)?.messages ?? [] : [];

  const send = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const st = useBuilder.getState();
    const honeypot = (new FormData(e.currentTarget).get("website") as string) ?? "";
    let reveal: string | null = null;
    if (scheduled && st.revealAt) {
      const d = new Date(st.revealAt);
      if (Number.isNaN(d.getTime()) || d.getTime() < Date.now() - 60_000) {
        setError("Pick an open time in the future.");
        return;
      }
      reveal = d.toISOString();
    }
    setSending(true);
    try {
      const res = await fetch("/api/bouquets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          design: st.design,
          card: st.card,
          occasion: st.occasion,
          revealAt: reveal,
          replyTo: st.replyTo,
          website: honeypot,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't send. Please try again.");
      addMine({ slug: data.slug, token: data.token, to: st.card.to, from: st.card.from, createdAt: new Date().toISOString(), design: st.design });
      clearDraft();
      track("bouquet_created", {
        flower_count: st.design.items.length,
        occasion: st.occasion ?? "none",
        has_reveal_at: Boolean(reveal),
        is_reply: Boolean(st.replyTo),
        font: st.card.style.font,
        length_bucket: st.card.message.length < 50 ? "short" : st.card.message.length < 200 ? "medium" : "long",
      });
      st.markSent({ slug: data.slug, token: data.token });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={send} className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div className="order-2 min-w-0 space-y-5 lg:order-1">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="label">To</span>
            <input className="field mt-1.5" value={card.to} maxLength={60} placeholder="Their name" onChange={(e) => setCard({ to: e.target.value })} data-clarity-mask="true" />
          </label>
          <label className="block">
            <span className="label">From</span>
            <input className="field mt-1.5" value={card.from} maxLength={60} placeholder="You (optional)" onChange={(e) => setCard({ from: e.target.value })} data-clarity-mask="true" />
          </label>
        </div>

        <label className="block">
          <span className="flex items-baseline justify-between">
            <span className="label">Your note</span>
            <span className="font-mono text-xs text-ink-soft">
              {card.message.length}/{MAX_MSG}
            </span>
          </span>
          <textarea
            className="field mt-1.5 min-h-36 resize-y leading-relaxed"
            value={card.message}
            maxLength={MAX_MSG}
            placeholder="Say the thing ✨"
            onChange={(e) => setCard({ message: e.target.value })}
            data-clarity-mask="true"
          />
        </label>

        {ideas.length > 0 && (
          <div>
            <p className="label mb-2">Need words? Tap one</p>
            <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {ideas.map((m) => (
                <button type="button" key={m} onClick={() => setCard({ message: m })} className="chip shrink-0 text-left whitespace-nowrap hover:border-ink">
                  {m.length > 42 ? `${m.slice(0, 40)}…` : m}
                </button>
              ))}
            </div>
          </div>
        )}

        <fieldset>
          <legend className="label mb-2">Card</legend>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(CARD_TEMPLATES) as CardTemplate[]).map((k) => (
              <button
                type="button"
                key={k}
                aria-pressed={card.style.template === k}
                onClick={() => setCard({ style: { ...card.style, template: k } })}
                className={`flex items-center gap-2 rounded-full border-[1.5px] px-3 py-1.5 text-sm transition ${card.style.template === k ? "border-ink shadow-[2px_2px_0_0_var(--color-ink)]" : "border-line"}`}
              >
                <span className="size-4 rounded-full ring-1 ring-ink/20" style={{ background: CARD_TEMPLATES[k].bg }} />
                {CARD_TEMPLATES[k].name}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="label mb-2">Handwriting</legend>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(CARD_FONTS) as CardFont[]).map((k) => (
              <button
                type="button"
                key={k}
                aria-pressed={card.style.font === k}
                onClick={() => setCard({ style: { ...card.style, font: k } })}
                className={`rounded-full border-[1.5px] px-4 py-1.5 transition ${card.style.font === k ? "border-ink bg-ink text-cream" : "border-line bg-paper"}`}
                style={{ fontFamily: CARD_FONTS[k].css, fontSize: `${CARD_FONTS[k].scale}rem` }}
              >
                {CARD_FONTS[k].name}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="rounded-2xl border border-line bg-paper p-4">
          <label className="flex cursor-pointer items-center justify-between gap-3">
            <span className="flex items-center gap-2 font-medium">
              <CalendarClock className="size-5" aria-hidden /> Schedule the reveal
            </span>
            <input
              type="checkbox"
              role="switch"
              checked={scheduled}
              onChange={(e) => {
                setScheduled(e.target.checked);
                if (!e.target.checked) setMeta({ revealAt: "" });
              }}
              className="peer sr-only"
            />
            <span aria-hidden className="relative h-7 w-12 rounded-full bg-line transition peer-checked:bg-ink after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-paper after:transition peer-checked:after:translate-x-5 peer-focus-visible:outline-2 peer-focus-visible:outline-petal-deep" />
          </label>
          {scheduled && (
            <div className="mt-3">
              <input
                type="datetime-local"
                className="field"
                value={revealAt}
                onChange={(e) => setMeta({ revealAt: e.target.value })}
                aria-label="Open date and time"
                required
              />
              <p className="mt-2 text-sm text-ink-soft">They&rsquo;ll see a countdown until then. Time is in your timezone.</p>
            </div>
          )}
        </div>

        {/* Honeypot */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

        {error && (
          <p role="alert" className="rounded-xl bg-petal/25 px-4 py-3 text-sm text-petal-deep">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 pt-2">
          <button type="button" className="btn-ghost" onClick={() => setStep("arrange")}>
            <ArrowLeft className="size-4" aria-hidden /> Flowers
          </button>
          <button type="submit" className="btn-primary text-base" disabled={sending}>
            {sending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
            {sending ? "Wrapping…" : "Send bouquet"}
          </button>
        </div>
        <p className="text-xs text-ink-soft">
          By sending you agree to our <a className="underline" href="/terms">terms</a>. Be kind. Links are private and unlisted.
        </p>
      </div>

      <div className="order-1 lg:order-2">
        <div className="lg:sticky lg:top-24">
          <p className="label mb-3 text-center">preview</p>
          <NoteCard to={card.to} from={card.from} message={card.message} style={card.style} placeholder className="mx-auto max-w-sm -rotate-1" />
        </div>
      </div>
    </form>
  );
}
