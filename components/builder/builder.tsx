"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, Flower2, RotateCcw } from "lucide-react";
import { BouquetSvg } from "@/components/bouquet/bouquet-svg";
import { NoteCard } from "@/components/bouquet/note-card";
import { SharePanel } from "@/components/share/share-panel";
import { BuilderCanvas } from "./canvas";
import { CardStep } from "./card-step";
import { ItemToolbar, TopBar } from "./toolbars";
import { Tray } from "./tray";
import { arrange } from "@/lib/bouquet/composition";
import { readDraft, saveDraft, useBuilder, type Step } from "@/lib/bouquet/store";
import { FAMILY_BY_SLUG } from "@/lib/content/flowers";
import { OCCASIONS, OCCASION_BY_SLUG } from "@/lib/content/occasions";
import { track } from "@/lib/analytics/track";
import { DEFAULTS } from "@/lib/bouquet/catalog";
import { getMine } from "@/lib/local";

export type BuilderParams = { occasion?: string; flowers?: string; replyTo?: string; to?: string; edit?: string };

/** ISO timestamp to a datetime-local input value in the user's timezone. */
function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function presetFor(occasionSlug: string) {
  const o = OCCASION_BY_SLUG.get(occasionSlug);
  if (!o) return null;
  return {
    design: { items: arrange(o.preset.stems), wrapper: o.preset.wrapper, ribbon: o.preset.ribbon, background: o.preset.background },
    occasion: o.slug,
  };
}

export function Builder({ params }: { params: BuilderParams }) {
  const step = useBuilder((s) => s.step);
  const count = useBuilder((s) => s.design.items.length);
  const init = useRef(false);
  const [editState, setEditState] = useState<"idle" | "loading" | "failed">(params.edit ? "loading" : "idle");

  useEffect(() => {
    if (init.current) return;
    init.current = true;
    const st = useBuilder.getState();
    st.reset();
    let source = "direct";
    if (params.edit) {
      const slug = params.edit;
      const token = getMine().find((m) => m.slug === slug)?.token ?? null;
      fetch(`/api/bouquets/${encodeURIComponent(slug)}`, { headers: token ? { "x-edit-token": token } : {} })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error("not found"))))
        .then((src) => {
          useBuilder.getState().load({
            design: src.design,
            card: src.card,
            occasion: src.occasion,
            revealAt: toLocalInput(src.revealAt),
            expiry: "never",
            editing: { slug, token },
          });
          setEditState("idle");
        })
        .catch(() => setEditState("failed"));
      track("builder_opened", { source: "edit" });
      return;
    }
    if (params.occasion && presetFor(params.occasion)) {
      st.load(presetFor(params.occasion)!);
      source = "preset";
    } else if (params.flowers && FAMILY_BY_SLUG.has(params.flowers)) {
      const fam = FAMILY_BY_SLUG.get(params.flowers)!;
      const stems = [...fam.stems, ...fam.stems, "babys-breath", "eucalyptus", "fern"].slice(0, 9);
      st.load({ design: { items: arrange(stems), ...DEFAULTS } });
      source = "flower_page";
    } else {
      const draft = readDraft();
      if (draft && draft.design.items.length) st.load(draft);
    }
    if (params.replyTo) {
      st.setMeta({ replyTo: params.replyTo });
      if (params.to) st.setCard({ to: params.to.slice(0, 60) });
      source = "send_back";
    }
    track("builder_opened", { source });
    if (params.occasion) track("preset_selected", { occasion: params.occasion });
  }, [params]);

  // Autosave the draft so a refresh never loses a bouquet.
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const unsub = useBuilder.subscribe(() => {
      clearTimeout(t);
      t = setTimeout(saveDraft, 400);
    });
    return () => {
      unsub();
      clearTimeout(t);
    };
  }, []);

  const surprise = () => {
    const o = OCCASIONS[Math.floor(Math.random() * OCCASIONS.length)];
    const p = presetFor(o.slug)!;
    const st = useBuilder.getState();
    st.commit(() => p.design);
    st.setMeta({ occasion: p.occasion });
    track("preset_selected", { occasion: o.slug, source: "surprise" });
  };

  if (editState !== "idle")
    return (
      <div className="mx-auto grid min-h-[60dvh] max-w-md place-items-center px-4 text-center">
        {editState === "loading" ? (
          <p className="animate-pulse font-display text-3xl">Unwrapping your bouquet…</p>
        ) : (
          <div>
            <p className="font-display text-3xl">Can&rsquo;t edit this bouquet</p>
            <p className="mt-2 text-ink/70">Only its sender can edit it, from the same device or while signed in.</p>
            <Link href="/garden" className="btn-primary mt-6">
              My bouquets
            </Link>
          </div>
        )}
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 pb-28 short:pt-3 short:pb-10 lg:pb-12">
      <Stepper step={step} />

      {step === "arrange" && (
        <div className="mt-6 grid grid-cols-1 gap-6 short:mt-3 short:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] short:gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
          <div className="sticky top-16 z-20 -mx-4 min-w-0 self-start bg-cream/95 px-4 pb-1 backdrop-blur-md short:mx-0 short:bg-transparent short:px-0 short:backdrop-blur-none lg:top-20 lg:mx-0 lg:bg-transparent lg:px-0 lg:backdrop-blur-none">
            <TopBar onSurprise={surprise} />
            <div className="relative mx-auto mt-1 w-[min(100%,max(30dvh,190px))] short:w-[min(100%,calc((100dvh-10rem)*0.8))] lg:w-[min(100%,calc((100dvh-16rem)*0.8))] lg:max-w-[520px]">
              <BuilderCanvas />
              {count === 0 && (
                <div className="pointer-events-none absolute inset-0 grid place-items-center p-8 text-center">
                  <div className="pointer-events-auto rounded-2xl bg-paper/90 p-5 backdrop-blur-sm">
                    <Flower2 className="mx-auto size-8 text-petal-deep" aria-hidden />
                    <p className="mt-2 font-display text-2xl">Start with a flower</p>
                    <p className="mt-1 text-sm text-ink-soft">Tap any flower to add it, or let us style one.</p>
                    <button type="button" onClick={surprise} className="btn-secondary mt-4 !py-2 text-sm">
                      Surprise me ✨
                    </button>
                  </div>
                </div>
              )}
              <div className="mt-2 flex min-h-12 min-w-0 justify-center">
                <ItemToolbar />
              </div>
            </div>
          </div>
          <div className="min-w-0 space-y-4">
            <Tray />
            <div
              data-bottom-bar
              className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-cream/95 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md short:static short:border-0 short:bg-transparent short:p-0 lg:static lg:border-0 lg:bg-transparent lg:p-0"
            >
              <button
                type="button"
                className="btn-primary w-full text-base"
                disabled={count === 0}
                onClick={() => {
                  useBuilder.getState().setStep("card");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Write the card <ArrowRight className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "card" && (
        <div className="mt-8">
          <CardStep />
        </div>
      )}

      {step === "sent" && <Sent />}
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const steps: [Step, string][] = [
    ["arrange", "Arrange"],
    ["card", "Write"],
    ["sent", "Send"],
  ];
  const idx = steps.findIndex(([s]) => s === step);
  return (
    <ol className="flex items-center justify-center gap-1.5 text-sm sm:gap-2" aria-label="Progress">
      {steps.map(([s, label], i) => (
        <li key={s} className="flex items-center gap-2" aria-current={i === idx ? "step" : undefined}>
          <span
            className={`grid size-7 place-items-center rounded-full border-[1.5px] font-mono text-xs ${i <= idx ? "border-ink bg-ink text-cream" : "border-line text-ink-soft"}`}
          >
            {i + 1}
          </span>
          <span className={i === idx ? "font-medium" : "text-ink-soft"}>{label}</span>
          {i < steps.length - 1 && <span aria-hidden className="mx-0.5 h-px w-4 bg-line min-[360px]:w-6 sm:mx-1 sm:w-10" />}
        </li>
      ))}
    </ol>
  );
}

function Sent() {
  const sent = useBuilder((s) => s.sent)!;
  const design = useBuilder((s) => s.design);
  const card = useBuilder((s) => s.card);
  const edited = useBuilder((s) => Boolean(s.editing));
  const url = `${window.location.origin}/b/${sent.slug}`;
  return (
    <div className="mt-8 grid items-start gap-8 lg:grid-cols-2">
      <div className="relative mx-auto w-full max-w-md">
        <BouquetSvg design={design} label="Your bouquet" className="h-auto w-full rounded-[1.5rem] ring-1 ring-line" />
        <NoteCard to={card.to} from={card.from} message={card.message} style={card.style} className="mx-6 -mt-16 rotate-2" />
      </div>
      <div>
        <p className="label">{edited ? "all fresh" : "sent with love"}</p>
        <h1 className="mt-2 font-display text-4xl leading-none sm:text-5xl">{edited ? "Changes saved 💐" : "Your bouquet is ready 💐"}</h1>
        <p className="mt-3 text-ink/75">
          Send this link to {card.to || "them"}. It&rsquo;s private: only people with the link can open it. You can see opens and reactions in{" "}
          <Link href="/garden" className="underline underline-offset-2">
            My bouquets
          </Link>
          .
        </p>
        <div className="mt-6">
          <SharePanel url={url} to={card.to} from={card.from} design={design} />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={`/b/${sent.slug}`} target="_blank" rel="noopener" className="btn-ghost border border-line">
            <Eye className="size-4" aria-hidden /> Preview it
          </a>
          <button type="button" className="btn-ghost border border-line" onClick={() => useBuilder.getState().reset()}>
            <RotateCcw className="size-4" aria-hidden /> Make another
          </button>
        </div>
      </div>
    </div>
  );
}
