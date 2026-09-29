"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, Flower2, RotateCcw } from "lucide-react";
import { BouquetSvg } from "@/components/bouquet/bouquet-svg";
import { NoteCard } from "@/components/bouquet/note-card";
import { SharePanel } from "@/components/share/share-panel";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { BloomLoader } from "@/components/ui/bloom-loader";
import { Tooltip } from "@/components/ui/tooltip";
import { BuilderCanvas } from "./canvas";
import { CardStep } from "./card-step";
import { ItemToolbar, TopBar } from "./toolbars";
import { Tray } from "./tray";
import { arrange, normalizeDesign } from "@/lib/bouquet/composition";
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
    design: { items: arrange(o.preset.stems, Date.now(), o.preset.wrap), wrapper: o.preset.wrap, paper: o.preset.paper, ribbon: o.preset.ribbon, background: o.preset.background },
    occasion: o.slug,
  };
}

export function Builder({ params }: { params: BuilderParams }) {
  const step = useBuilder((s) => s.step);
  const count = useBuilder((s) => s.design.items.length);
  const init = useRef(false);
  const [confirmDialog, confirm] = useConfirm();
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
            design: normalizeDesign(src.design),
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

  const surprise = async () => {
    const st0 = useBuilder.getState();
    if (st0.design.items.length) {
      const ok = await confirm({
        title: "Swap for a surprise bouquet?",
        description: "We'll replace your current flowers with a styled bouquet. You can undo this.",
        preview: <BouquetSvg design={st0.design} className="h-auto w-full rounded-2xl" label="Current bouquet" />,
        confirmLabel: "Surprise me ✨",
        cancelLabel: "Keep mine",
      });
      if (!ok) return;
    }
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
          <BloomLoader label="Unwrapping your bouquet…" />
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
    <div
      className={`mx-auto max-w-6xl px-4 pt-6 pb-16 lg:pb-12 ${step === "arrange" ? "flex h-[calc(100dvh-4rem)] min-h-[26rem] flex-col !pt-3 !pb-0 short:min-h-0 compact:!pt-1 lg:!pt-5 lg:!pb-5" : ""}`}
    >
      {confirmDialog}
      <Stepper step={step} />

      {step === "arrange" && (
        <div className="mt-3 flex min-h-0 flex-1 flex-col gap-2 compact:mt-0 short:flex-row short:gap-4 lg:mt-5 lg:flex-row lg:gap-8">
          <div className="flex min-h-0 min-w-0 flex-[1.2] flex-col short:flex-1 lg:flex-1">
            <TopBar onSurprise={surprise} />
            <div className="mx-auto flex min-h-0 w-full flex-1 items-start justify-center lg:mt-1">
              <div className="relative aspect-[4/5] h-full max-w-full">
                <BuilderCanvas />
                <div className="pointer-events-none absolute inset-x-0 -bottom-1 z-10 flex justify-center px-1 lg:hidden [&>*]:pointer-events-auto">
                  <ItemToolbar />
                </div>
                {count === 0 && (
                  <div className="pointer-events-none absolute inset-0 grid place-items-center p-3 text-center sm:p-8">
                    <div className="pointer-events-auto rounded-2xl bg-paper/90 p-3 backdrop-blur-sm sm:p-5">
                      <Flower2 className="mx-auto size-7 text-petal-deep" aria-hidden />
                      <p className="mt-1 font-display text-xl sm:text-2xl">Start with a flower</p>
                      <p className="mt-1 hidden text-sm text-ink-soft min-[400px]:block">Tap any flower to add it, or let us style one.</p>
                      <button type="button" onClick={surprise} className="btn-secondary mt-3 !py-2 text-sm">
                        Surprise me ✨
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="hidden h-14 shrink-0 justify-center pt-2 lg:flex">
              <ItemToolbar />
            </div>
          </div>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 short:flex-[1.3] lg:w-[440px] lg:flex-none lg:gap-3">
            <Tray className="flex-1" />
            <div data-bottom-bar className="shrink-0 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:pb-0">
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

/** Clickable progress: go back to Arrange any time, jump to Write once there are flowers. Locked after sending. */
function Stepper({ step }: { step: Step }) {
  const count = useBuilder((s) => s.design.items.length);
  const steps: { id: Step; label: string; hint: string }[] = [
    { id: "arrange", label: "Arrange", hint: "Pick and arrange flowers" },
    { id: "card", label: "Write", hint: count ? "Write your card" : "Add a flower first" },
    { id: "sent", label: "Send", hint: "Preview & send from the Write step" },
  ];
  const idx = steps.findIndex((s) => s.id === step);
  const reachable = (id: Step) => step !== "sent" && id !== step && (id === "arrange" || (id === "card" && count > 0));
  return (
    <nav aria-label="Progress">
      <ol className={`flex items-center justify-center gap-1 text-sm sm:gap-2 ${step === "arrange" ? "compact:hidden" : ""}`}>
        {steps.map((s, i) => {
          const can = reachable(s.id);
          const content = (
            <>
              <span
                className={`grid size-7 place-items-center rounded-full border-[1.5px] font-mono text-xs transition ${i <= idx ? "border-ink bg-ink text-cream" : "border-line text-ink-soft"} ${can ? "group-hover:scale-110" : ""}`}
              >
                {i + 1}
              </span>
              <span className={`${i === idx ? "font-medium" : "text-ink-soft"} ${can ? "underline-offset-4 group-hover:underline" : ""}`}>{s.label}</span>
            </>
          );
          return (
            <li key={s.id} className="flex items-center gap-1 sm:gap-2" aria-current={i === idx ? "step" : undefined}>
              <Tooltip label={s.hint} side="bottom">
                {can ? (
                  <button
                    type="button"
                    className="group flex min-h-11 items-center gap-2 rounded-full px-1"
                    onClick={() => {
                      useBuilder.getState().setStep(s.id);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    {content}
                  </button>
                ) : (
                  <span className="flex min-h-11 items-center gap-2 px-1" aria-disabled={i !== idx}>
                    {content}
                  </span>
                )}
              </Tooltip>
              {i < steps.length - 1 && <span aria-hidden className="h-px w-3 bg-line min-[360px]:w-5 sm:w-10" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function Sent() {
  const sent = useBuilder((s) => s.sent)!;
  const design = useBuilder((s) => s.design);
  const card = useBuilder((s) => s.card);
  const edited = useBuilder((s) => Boolean(s.editing));
  const url = `${window.location.origin}/b/${sent.slug}`;
  const hasNote = Boolean(card.to || card.from || card.message);
  return (
    // grid-cols-1 + min-w-0: the column is the screen width, so a long link can't widen the page (iOS Safari sizes auto columns to their content).
    <div className="mt-8 grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
      <div className="relative mx-auto w-full max-w-md min-w-0">
        <BouquetSvg design={design} label="Your bouquet" className="h-auto w-full rounded-[1.5rem] ring-1 ring-line" />
        {hasNote && <NoteCard to={card.to} from={card.from} message={card.message} style={card.style} className="mx-6 -mt-16 rotate-2" />}
      </div>
      <div className="min-w-0">
        <p className="label">{edited ? "all fresh" : "sent with love"}</p>
        <h1 className="mt-2 font-display text-4xl leading-none sm:text-5xl">{edited ? "Changes saved 💐" : "Your bouquet is ready 💐"}</h1>
        <p className="mt-3 text-ink/75">
          Send this link to {card.to || "them"}. Their preview shows only your sealed envelope, so the flowers stay a surprise. It&rsquo;s private: only people with the link can open it. See opens and chat with them in{" "}
          <Link href="/garden" className="underline underline-offset-2">
            My bouquets
          </Link>
          .
        </p>
        <div className="mt-6">
          <SharePanel url={url} to={card.to} from={card.from} design={design} message={card.message} style={card.style} personal={{ slug: sent.slug, token: sent.token || null }} />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/garden" className="btn-ghost border border-line">
            <Eye className="size-4" aria-hidden /> Preview in My bouquets
          </Link>
          <button type="button" className="btn-ghost border border-line" data-track="make_another_clicked" onClick={() => useBuilder.getState().reset()}>
            <RotateCcw className="size-4" aria-hidden /> Make another
          </button>
        </div>
      </div>
    </div>
  );
}
