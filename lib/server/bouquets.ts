import "server-only";
import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Design, Item } from "@/lib/bouquet/composition";
import { EXPIRY_OPTIONS, type CardStyle, type CreateBouquetInput } from "@/lib/bouquet/card";

export type PublicBouquet = {
  slug: string;
  design: Design;
  to: string;
  from: string;
  message: string;
  style: CardStyle;
  occasion: string | null;
  revealAt: string | null;
  createdAt: string;
};

export type BouquetState =
  | { status: "ok"; bouquet: PublicBouquet }
  | { status: "locked"; to: string; from: string; revealAt: string; design: Design }
  | { status: "missing" };

const SLUG_RE = /^[A-Za-z0-9_-]{6,16}$/;

export type Row = {
  slug: string;
  composition: { items: Item[] };
  wrapper: string;
  background: string;
  card_style: { template?: string; font?: string; ribbon?: string; stickers?: string[] };
  recipient_name: string | null;
  sender_name: string | null;
  message: string | null;
  occasion: string | null;
  reveal_at: string | null;
  expires_at: string | null;
  deleted_at: string | null;
  is_flagged: boolean;
  created_at: string;
};

export const getBouquet = cache(async (slug: string): Promise<BouquetState> => {
  if (!SLUG_RE.test(slug)) return { status: "missing" };
  const { data, error } = await supabaseAdmin()
    .from("bouquets")
    .select("slug, composition, wrapper, background, card_style, recipient_name, sender_name, message, occasion, reveal_at, expires_at, deleted_at, is_flagged, created_at")
    .eq("slug", slug)
    .maybeSingle<Row>();
  if (error) throw error;
  if (!data || data.deleted_at || data.is_flagged) return { status: "missing" };
  if (data.expires_at && new Date(data.expires_at) < new Date()) return { status: "missing" };

  const design: Design = {
    items: data.composition.items,
    wrapper: data.wrapper,
    background: data.background,
    ribbon: data.card_style.ribbon ?? "cherry",
  };
  const to = data.recipient_name ?? "";
  const from = data.sender_name ?? "";

  if (data.reveal_at && new Date(data.reveal_at) > new Date()) {
    return { status: "locked", to, from, revealAt: data.reveal_at, design };
  }
  return {
    status: "ok",
    bouquet: {
      slug: data.slug,
      design,
      to,
      from,
      message: data.message ?? "",
      style: {
        template: (data.card_style.template ?? "paper") as CardStyle["template"],
        font: (data.card_style.font ?? "caveat") as CardStyle["font"],
        stickers: (data.card_style.stickers ?? []) as CardStyle["stickers"],
      },
      occasion: data.occasion,
      revealAt: data.reveal_at,
      createdAt: data.created_at,
    },
  };
});

/** Maps validated input to the columns shared by insert and update. */
export function bouquetColumns(input: CreateBouquetInput) {
  const { design, card, occasion, revealAt, expiry } = input;
  const days = EXPIRY_OPTIONS[expiry].days;
  return {
    composition: { items: design.items },
    wrapper: design.wrapper,
    background: design.background,
    card_style: { ...card.style, ribbon: design.ribbon },
    recipient_name: card.to || null,
    sender_name: card.from || null,
    message: card.message || null,
    occasion: occasion || null,
    reveal_at: revealAt || null,
    expires_at: days ? new Date(Date.now() + days * 24 * 3600 * 1000).toISOString() : null,
  };
}

/** Editable source of a bouquet, for its creator. */
export function toSource(row: Row & { id?: string }) {
  return {
    slug: row.slug,
    design: { items: row.composition.items, wrapper: row.wrapper, background: row.background, ribbon: row.card_style.ribbon ?? "cherry" },
    card: {
      to: row.recipient_name ?? "",
      from: row.sender_name ?? "",
      message: row.message ?? "",
      style: {
        template: row.card_style.template ?? "paper",
        font: row.card_style.font ?? "caveat",
        stickers: row.card_style.stickers ?? [],
      },
    },
    occasion: row.occasion,
    revealAt: row.reveal_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

export const SOURCE_COLUMNS =
  "id, slug, edit_token_hash, owner_id, composition, wrapper, background, card_style, recipient_name, sender_name, message, occasion, reveal_at, expires_at, deleted_at, is_flagged, created_at, view_count";
