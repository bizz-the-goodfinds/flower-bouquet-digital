import "server-only";
import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Design, Item } from "@/lib/bouquet/composition";
import type { CardStyle } from "@/lib/bouquet/card";

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

type Row = {
  slug: string;
  composition: { items: Item[] };
  wrapper: string;
  background: string;
  card_style: { template?: string; font?: string; ribbon?: string };
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
      },
      occasion: data.occasion,
      revealAt: data.reveal_at,
      createdAt: data.created_at,
    },
  };
});
