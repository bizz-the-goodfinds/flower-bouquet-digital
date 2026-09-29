"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CalendarClock, Eye, Hourglass, Pencil, RotateCcw, Save, Send } from "lucide-react";
import { MiniBloom } from "@/components/ui/bloom-loader";
import { EnvelopeArt } from "@/components/reveal/envelope";
import { RecipientView } from "@/components/reveal/recipient-view";
import { Tooltip } from "@/components/ui/tooltip";
import { ENVELOPE_COLORS, LINERS, SEALS, linerSwatchSvg, sealSvg, type EnvelopeColor, type Liner, type Seal } from "@/lib/bouquet/envelope";
import { BouquetSvg } from "@/components/bouquet/bouquet-svg";
import { NoteCard } from "@/components/bouquet/note-card";
import { BACKGROUNDS } from "@/lib/bouquet/catalog";
import { CARD_FONTS, CARD_TEMPLATES, EXPIRY_OPTIONS, MAX_STICKERS, STICKERS, type CardFont, type CardTemplate, type Expiry } from "@/lib/bouquet/card";
import { clearDraft, useBuilder } from "@/lib/bouquet/store";
import { OCCASION_BY_SLUG } from "@/lib/content/occasions";
import { addMine } from "@/lib/local";
import { track } from "@/lib/analytics/track";
import { TURNSTILE_SITE_KEY, Turnstile } from "./turnstile";

const MAX_MSG = 500;

export function CardStep() {
  const card = useBuilder((s) => s.card);
  const occasion = useBuilder((s) => s.occasion);
  const revealAt = useBuilder((s) => s.revealAt);
  const expiry = useBuilder((s) => s.expiry);
  const editing = useBuilder((s) => s.editing);
  const design = useBuilder((s) => s.design);
  const bg = BACKGROUNDS[design.background] ?? BACKGROUNDS.cream;
  const { setCard, setMeta, setStep } = useBuilder.getState();
  const [captcha, setCaptcha] = useState<string | null>(null);
  const needsCaptcha = Boolean(TURNSTILE_SITE_KEY) && !editing && !captcha;
  const [scheduled, setScheduled] = useState(Boolean(revealAt));
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const ideas = occasion ? OCCASION_BY_SLUG.get(occasion)?.messages ?? [] : [];

  const [confirm, setConfirm] = useState<{ reveal: string | null; honeypot: string } | null>(null);

  /** Step 1: validate, then show the full preview for confirmation. */
  const review = (e: React.FormEvent<HTMLFormElement>) => {
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
    setConfirm({ reveal, honeypot });
    track("preview_opened", { editing: Boolean(st.editing) });
  };

  /** Step 2: the person confirmed the preview. */
  const send = async () => {
    if (!confirm) return;
    const { reveal, honeypot } = confirm;
    const st = useBuilder.getState();
    setError(null);
    setSending(true);
    try {
      const payload = JSON.stringify({
        design: st.design,
        card: st.card,
        occasion: st.occasion,
        revealAt: reveal,
        replyTo: st.replyTo,
        expiry: st.expiry,
        turnstileToken: captcha,
        website: honeypot,
      });
      const res = st.editing
        ? await fetch(`/api/bouquets/${st.editing.slug}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", ...(st.editing.token ? { "x-edit-token": st.editing.token } : {}) },
            body: payload,
          })
        : await fetch("/api/bouquets", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't send. Please try again.");
      if (st.editing) {
        const token = st.editing.token;
        if (token) addMine({ slug: st.editing.slug, token, to: st.card.to, from: st.card.from, createdAt: new Date().toISOString(), design: st.design });
        track("bouquet_edited", { flower_count: st.design.items.length });
        st.markSent({ slug: st.editing.slug, token: token ?? "" });
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
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
      setConfirm(null);
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={review} className="grid grid-cols-1 gap-8 lg:grid-cols-2">
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

        <fieldset>
          <legend className="label mb-2">
            Stickers <span className="normal-case tracking-normal">(up to {MAX_STICKERS})</span>
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {STICKERS.map((st) => {
              const on = card.style.stickers.includes(st);
              const full = !on && card.style.stickers.length >= MAX_STICKERS;
              return (
                <button
                  type="button"
                  key={st}
                  aria-pressed={on}
                  aria-label={`Sticker ${st}`}
                  disabled={full}
                  onClick={() =>
                    setCard({ style: { ...card.style, stickers: on ? card.style.stickers.filter((x) => x !== st) : [...card.style.stickers, st] } })
                  }
                  className={`grid size-11 place-items-center rounded-full text-xl transition active:scale-90 disabled:opacity-30 ${on ? "bg-petal/40 ring-2 ring-ink" : "bg-paper ring-1 ring-line hover:ring-ink"}`}
                >
                  {st}
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="label mb-2">Envelope</legend>
          <div className="flex gap-4 rounded-2xl border border-line bg-paper p-3">
            <div className="w-24 shrink-0 self-center sm:w-28">
              <EnvelopeArt look={card.style.envelope} initial={card.from} />
            </div>
            <div className="min-w-0 flex-1 space-y-2.5">
              <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Envelope colour">
                {(Object.keys(ENVELOPE_COLORS) as EnvelopeColor[]).map((k) => (
                  <Tooltip key={k} label={ENVELOPE_COLORS[k].name}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={card.style.envelope.color === k}
                      aria-label={`${ENVELOPE_COLORS[k].name} envelope`}
                      onClick={() => setCard({ style: { ...card.style, envelope: { ...card.style.envelope, color: k } } })}
                      className={`size-8 rounded-full border-2 transition ${card.style.envelope.color === k ? "scale-110 border-ink shadow-[2px_2px_0_0_var(--color-ink)]" : "border-line"}`}
                      style={{ background: `linear-gradient(135deg, ${ENVELOPE_COLORS[k].flap} 50%, ${ENVELOPE_COLORS[k].body} 50%)` }}
                    />
                  </Tooltip>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Seal">
                {(Object.keys(SEALS) as Seal[]).map((k) => {
                  const on = card.style.envelope.seal === k;
                  return (
                    <Tooltip key={k} label={`${SEALS[k]} seal`}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={on}
                        aria-label={`${SEALS[k]} seal`}
                        onClick={() => setCard({ style: { ...card.style, envelope: { ...card.style.envelope, seal: k } } })}
                        className={`grid size-10 place-items-center rounded-full transition ${on ? "scale-110 ring-2 ring-ink ring-offset-2 ring-offset-paper" : "opacity-80 hover:opacity-100"}`}
                      >
                        <svg viewBox="-34 -34 68 68" className="size-10" aria-hidden dangerouslySetInnerHTML={{ __html: sealSvg({ ...card.style.envelope, seal: k }, card.from) }} />
                      </button>
                    </Tooltip>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Liner">
                {(Object.keys(LINERS) as Liner[]).map((k) => {
                  const on = card.style.envelope.liner === k;
                  return (
                    <Tooltip key={k} label={`${LINERS[k]} liner`}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={on}
                        aria-label={`${LINERS[k]} liner`}
                        onClick={() => setCard({ style: { ...card.style, envelope: { ...card.style.envelope, liner: k } } })}
                        className={`size-10 overflow-hidden rounded-xl border-[1.5px] transition ${on ? "scale-110 border-ink shadow-[2px_2px_0_0_var(--color-ink)]" : "border-line"}`}
                      >
                        <svg viewBox="0 0 60 60" className="size-full" aria-hidden dangerouslySetInnerHTML={{ __html: linerSwatchSvg({ ...card.style.envelope, liner: k }) }} />
                      </button>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend className="label mb-2 flex items-center gap-1.5">
            <Hourglass className="size-3.5" aria-hidden /> Link lasts
          </legend>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(EXPIRY_OPTIONS) as Expiry[]).map((k) => (
              <button
                type="button"
                key={k}
                aria-pressed={expiry === k}
                onClick={() => setMeta({ expiry: k })}
                className={`min-h-11 rounded-full border-[1.5px] px-4 text-sm transition ${expiry === k ? "border-ink bg-ink text-cream" : "border-line bg-paper"}`}
              >
                {EXPIRY_OPTIONS[k].name}
              </button>
            ))}
          </div>
          {editing && expiry !== "never" && <p className="mt-2 text-xs text-ink-soft">Counted from when you save.</p>}
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

        {!editing && <Turnstile onToken={setCaptcha} />}

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
          <button type="submit" className="btn-primary text-base" disabled={sending || needsCaptcha}>
            <Eye className="size-4" aria-hidden />
            {needsCaptcha ? "Checking…" : "Preview & send"}
          </button>
        </div>
        <p className="text-xs text-ink-soft">
          By sending you agree to our <a className="underline" href="/terms">terms</a>. Be kind. Links are private and unlisted.
        </p>
      </div>

      <div className="order-1 min-w-0 lg:order-2">
        <div className="lg:sticky lg:top-24">
          <p className="label mb-2 text-center">live preview</p>
          <div className="mx-auto max-w-sm rounded-[1.75rem] p-3 pb-5 ring-1 ring-line" style={{ background: bg.fill }}>
            <BouquetSvg design={design} showBackground={false} label="Your bouquet" className="mx-auto h-auto w-[62%] min-[420px]:w-[70%] lg:w-[78%]" />
            <NoteCard to={card.to} from={card.from} message={card.message} style={card.style} placeholder className="relative mx-2 -mt-6 -rotate-1 sm:-mt-10" />
          </div>
          <button type="submit" className="btn-primary mx-auto mt-5 hidden w-full max-w-sm text-base lg:flex" disabled={needsCaptcha}>
            <Eye className="size-4" aria-hidden /> {needsCaptcha ? "Checking…" : "Preview & send"}
          </button>
        </div>
      </div>

      {confirm && (
        <ConfirmSend
          sending={sending}
          editing={Boolean(editing)}
          reveal={confirm.reveal}
          onCancel={() => setConfirm(null)}
          onConfirm={send}
        />
      )}
    </form>
  );
}

function ConfirmSend({
  sending,
  editing,
  reveal,
  onCancel,
  onConfirm,
}: {
  sending: boolean;
  editing: boolean;
  reveal: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [run, setRun] = useState(0);
  const design = useBuilder((s) => s.design);
  const card = useBuilder((s) => s.card);
  const expiry = useBuilder((s) => s.expiry);
  const occasion = useBuilder((s) => s.occasion);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    return () => d?.close();
  }, []);

  const bouquet = {
    slug: "preview",
    design,
    to: card.to,
    from: card.from,
    message: card.message,
    style: card.style,
    occasion,
    revealAt: reveal,
    createdAt: new Date().toISOString(),
  };

  const actions = (
    <div className="flex items-center gap-1.5">
      <Tooltip label="Back to editing" side="bottom">
        <button type="button" className="btn-ghost min-h-11 border border-line bg-paper !px-3" onClick={onCancel} disabled={sending} aria-label="Keep editing">
          <Pencil className="size-4" aria-hidden /> <span className="hidden sm:inline">Keep editing</span>
        </button>
      </Tooltip>
      <Tooltip label="Play the opening again" side="bottom">
        <button type="button" className="grid size-11 place-items-center rounded-full border border-line bg-paper" onClick={() => setRun((r) => r + 1)} aria-label="Replay">
          <RotateCcw className="size-4" aria-hidden />
        </button>
      </Tooltip>
      <button type="button" className="btn-primary min-h-11 !px-4 text-sm whitespace-nowrap" onClick={onConfirm} disabled={sending} autoFocus>
        {sending ? <MiniBloom /> : editing ? <Save className="size-4" aria-hidden /> : <Send className="size-4" aria-hidden />}
        {sending ? "Wrapping…" : editing ? "Save" : "Send 💐"}
      </button>
    </div>
  );

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        if (!sending) onCancel();
      }}
      aria-label="Preview before sending"
      className="m-0 h-dvh max-h-none w-screen max-w-none overflow-y-auto bg-cream p-0 text-ink backdrop:bg-ink/60"
    >
      <p className="sticky top-0 z-40 h-7 truncate bg-ink px-4 text-center text-xs leading-7 text-cream">
        <span className="font-medium">Preview</span> · exactly what {card.to || "they"}&rsquo;ll see
        <span className="hidden sm:inline">
          {" "}· Opens {reveal ? new Date(reveal).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "right away"} · Link lasts{" "}
          {EXPIRY_OPTIONS[expiry].name.toLowerCase()}
        </span>
      </p>
      <RecipientView key={run} bouquet={bouquet} preview previewActions={actions} />
    </dialog>
  );
}