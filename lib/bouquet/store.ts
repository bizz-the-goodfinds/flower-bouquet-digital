"use client";

import { create } from "zustand";
import { track } from "@/lib/analytics/track";
import { DEFAULTS } from "./catalog";
import { normalizeCardFont, normalizeNoteMode, normalizeStickers, type CardStyle, type Expiry } from "./card";
import { DEFAULT_ENVELOPE, normalizeEnvelope } from "./envelope";
import type { Song, VoiceDraft } from "./media";
import { MAX_STEMS, arrange, normalizeDesign, spawnPosition, type Design, type Item } from "./composition";

export type Step = "arrange" | "card" | "sent";

export type CardDraft = { to: string; from: string; message: string; style: CardStyle };

type State = {
  step: Step;
  design: Design;
  card: CardDraft;
  occasion: string | null;
  replyTo: string | null;
  revealAt: string; // datetime-local value, "" = open immediately
  expiry: Expiry;
  /** Optional song link card and voice note, added on the Write step. */
  song: Song | null;
  voice: VoiceDraft | null;
  /** Set when editing an already-sent bouquet. */
  editing: { slug: string; token: string | null } | null;
  selectedId: string | null;
  past: Design[];
  future: Design[];
  sent: { slug: string; token: string } | null;

  setStep: (s: Step) => void;
  select: (id: string | null) => void;
  /** Change the design and record an undo step. */
  commit: (fn: (d: Design) => Design) => void;
  /** Change the design without recording (live drag); call snapshot() once at gesture start. */
  live: (fn: (d: Design) => Design) => void;
  snapshot: () => void;
  undo: () => void;
  redo: () => void;
  addStem: (slug: string) => void;
  updateItem: (id: string, patch: Partial<Item>) => void;
  removeItem: (id: string) => void;
  shuffle: () => void;
  setCard: (patch: Partial<CardDraft>) => void;
  setMeta: (patch: Partial<Pick<State, "occasion" | "replyTo" | "revealAt" | "expiry" | "song" | "voice">>) => void;
  load: (patch: Partial<Pick<State, "design" | "card" | "occasion" | "replyTo" | "revealAt" | "expiry" | "editing" | "song" | "voice">>) => void;
  markSent: (sent: { slug: string; token: string }) => void;
  reset: () => void;
};

export const emptyDesign = (): Design => ({ items: [], ...DEFAULTS });
const emptyCard = (): CardDraft => ({ to: "", from: "", message: "", style: { template: "paper", font: "playfair", stickers: [], envelope: { ...DEFAULT_ENVELOPE }, note: "tucked" } });

const HISTORY = 60;

export const useBuilder = create<State>((set, get) => ({
  step: "arrange",
  design: emptyDesign(),
  card: emptyCard(),
  occasion: null,
  replyTo: null,
  revealAt: "",
  expiry: "never",
  song: null,
  voice: null,
  editing: null,
  selectedId: null,
  past: [],
  future: [],
  sent: null,

  setStep: (step) => {
    if (get().step !== step) track("builder_step", { step, flower_count: get().design.items.length });
    set({ step, selectedId: null });
  },
  select: (selectedId) => set({ selectedId }),
  commit: (fn) =>
    set((s) => ({ past: [...s.past.slice(-HISTORY), s.design], future: [], design: fn(s.design) })),
  live: (fn) => set((s) => ({ design: fn(s.design) })),
  snapshot: () => set((s) => ({ past: [...s.past.slice(-HISTORY), s.design], future: [] })),
  undo: () =>
    set((s) => {
      const prev = s.past.at(-1);
      if (!prev) return s;
      track("undo_used");
      return { design: prev, past: s.past.slice(0, -1), future: [s.design, ...s.future], selectedId: null };
    }),
  redo: () =>
    set((s) => {
      const next = s.future[0];
      if (!next) return s;
      track("redo_used");
      return { design: next, future: s.future.slice(1), past: [...s.past, s.design], selectedId: null };
    }),
  addStem: (slug) => {
    const { design } = get();
    if (design.items.length >= MAX_STEMS) return;
    const item = spawnPosition(design.items, slug, Math.random, design.wrapper);
    get().commit((d) => ({ ...d, items: [...d.items, item] }));
    set({ selectedId: item.id });
  },
  updateItem: (id, patch) => get().commit((d) => ({ ...d, items: d.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) })),
  removeItem: (id) => {
    track("flower_removed", { flower_slug: get().design.items.find((it) => it.id === id)?.f });
    get().commit((d) => ({ ...d, items: d.items.filter((it) => it.id !== id) }));
    set({ selectedId: null });
  },
  shuffle: () => {
    const { design } = get();
    if (!design.items.length) return;
    get().commit((d) => ({ ...d, items: arrange(d.items.map((i) => i.f), Date.now(), d.wrapper) }));
    set({ selectedId: null });
  },
  setCard: (patch) => set((s) => ({ card: { ...s.card, ...patch } })),
  setMeta: (patch) => set(patch),
  load: (patch) => set({ ...patch, past: [], future: [], selectedId: null }),
  markSent: (sent) => set({ sent, step: "sent" }),
  reset: () =>
    set({
      step: "arrange",
      design: emptyDesign(),
      card: emptyCard(),
      occasion: null,
      replyTo: null,
      revealAt: "",
      expiry: "never",
      song: null,
      voice: null,
      editing: null,
      selectedId: null,
      past: [],
      future: [],
      sent: null,
    }),
}));

// ---------- Draft persistence ----------
const DRAFT_KEY = "pp-draft-v1";

export function saveDraft() {
  const { design, card, occasion, replyTo, song, voice, step, editing } = useBuilder.getState();
  if (step === "sent" || editing) return;
  try {
    // The voice note's playback link expires; the recording itself is kept by path.
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ design, card, occasion, replyTo, song, voice: voice && { ...voice, url: null }, at: Date.now() }));
  } catch {}
}

export function readDraft(): Pick<State, "design" | "card" | "occasion" | "replyTo" | "song" | "voice"> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (!d?.design?.items || Date.now() - d.at > 7 * 24 * 3600 * 1000) return null;
    d.card.style.stickers = normalizeStickers(d.card.style.stickers);
    d.card.style.font = normalizeCardFont(d.card.style.font);
    d.card.style.envelope = normalizeEnvelope(d.card.style.envelope);
    d.card.style.note = normalizeNoteMode(d.card.style.note);
    d.design = normalizeDesign(d.design);
    d.song ??= null;
    d.voice ??= null;
    return d;
  } catch {
    return null;
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {}
}
