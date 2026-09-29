import "server-only";
import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { currentUserId } from "@/lib/supabase/server";
import { tokenMatches } from "@/lib/server/security";
import { normalizeDesign, type Design, type Item } from "@/lib/bouquet/composition";
import { normalizeEnvelope, type EnvelopeLook } from "@/lib/bouquet/envelope";
import { EXPIRY_OPTIONS, normalizeCardFont, normalizeStickers, type CardStyle, type CreateBouquetInput } from "@/lib/bouquet/card";

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

/** Server-only facts about a bouquet (never sent to the browser as-is). */
export type BouquetMeta = { id: string; threadId: string; replyTo: string | null; ownerId: string | null };

export type BouquetState =
  | { status: "ok"; bouquet: PublicBouquet; meta: BouquetMeta }
  | { status: "locked"; to: string; from: string; revealAt: string; design: Design; envelope: EnvelopeLook; meta: BouquetMeta }
  | { status: "missing" };

/** An earlier bouquet in the same "send one back" chain. */
export type ThreadItem = { slug: string; from: string; to: string; createdAt: string; design: Design };

const SLUG_RE = /^[A-Za-z0-9_-]{6,16}$/;

export type Row = {
  id?: string;
  slug: string;
  reply_to?: string | null;
  thread_id?: string | null;
  owner_id?: string | null;
  composition: { items: Item[] };
  wrapper: string;
  background: string;
  card_style: { template?: string; font?: string; ribbon?: string; paper?: string; stickers?: string[]; envelope?: unknown };
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
    .select("id, slug, reply_to, thread_id, owner_id, composition, wrapper, background, card_style, recipient_name, sender_name, message, occasion, reveal_at, expires_at, deleted_at, is_flagged, created_at")
    .eq("slug", slug)
    .maybeSingle<Row>();
  if (error) throw error;
  if (!data || data.deleted_at || data.is_flagged) return { status: "missing" };
  if (data.expires_at && new Date(data.expires_at) < new Date()) return { status: "missing" };

  const design: Design = normalizeDesign({
    items: data.composition.items,
    wrapper: data.wrapper,
    paper: data.card_style.paper,
    background: data.background,
    ribbon: data.card_style.ribbon ?? "cherry",
  });
  const to = data.recipient_name ?? "";
  const from = data.sender_name ?? "";
  const meta: BouquetMeta = { id: data.id!, threadId: data.thread_id ?? data.id!, replyTo: data.reply_to ?? null, ownerId: data.owner_id ?? null };

  if (data.reveal_at && new Date(data.reveal_at) > new Date()) {
    return { status: "locked", to, from, revealAt: data.reveal_at, design, envelope: normalizeEnvelope(data.card_style.envelope), meta };
  }
  return {
    status: "ok",
    meta,
    bouquet: {
      slug: data.slug,
      design,
      to,
      from,
      message: data.message ?? "",
      style: {
        template: (data.card_style.template ?? "paper") as CardStyle["template"],
        font: normalizeCardFont(data.card_style.font),
        stickers: normalizeStickers(data.card_style.stickers) as CardStyle["stickers"],
        envelope: normalizeEnvelope(data.card_style.envelope),
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
    card_style: { ...card.style, ribbon: design.ribbon, paper: design.paper },
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
    design: normalizeDesign({
      items: row.composition.items,
      wrapper: row.wrapper,
      paper: row.card_style.paper,
      background: row.background,
      ribbon: row.card_style.ribbon ?? "cherry",
    }),
    card: {
      to: row.recipient_name ?? "",
      from: row.sender_name ?? "",
      message: row.message ?? "",
      style: {
        template: row.card_style.template ?? "paper",
        font: normalizeCardFont(row.card_style.font),
        stickers: normalizeStickers(row.card_style.stickers),
        envelope: normalizeEnvelope(row.card_style.envelope),
      },
    },
    occasion: row.occasion,
    revealAt: row.reveal_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

export const SOURCE_COLUMNS =
  "id, slug, reply_to, thread_id, edit_token_hash, owner_id, composition, wrapper, background, card_style, recipient_name, sender_name, message, occasion, reveal_at, expires_at, deleted_at, is_flagged, created_at, view_count";

export const SLUG_PATTERN = SLUG_RE;
export const LINK_KEY_RE = /^[A-Za-z0-9]{6,12}$/;
/** A chat conversation: `l:<personal link key>` or `d:<recipient device id>`. */
export const CONVERSATION_RE = /^[ld]:[A-Za-z0-9_-]{6,32}$/;

export type Owned = Row & { id: string; edit_token_hash: string; owner_id: string | null };

/** Loads a live bouquet the caller may edit: via the device edit token or as the signed-in owner. */
export async function loadEditable(req: Request, slug: string) {
  if (!SLUG_RE.test(slug)) return null;
  const { data } = await supabaseAdmin().from("bouquets").select(SOURCE_COLUMNS).eq("slug", slug).is("deleted_at", null).maybeSingle<Owned>();
  if (!data) return null;
  if (tokenMatches(req.headers.get("x-edit-token"), data.edit_token_hash)) return data;
  const uid = data.owner_id ? await currentUserId() : null;
  return uid && uid === data.owner_id ? data : null;
}

/** The personal link `key` of a bouquet, if it exists. */
export const getLink = cache(async (bouquetId: string, key: string | undefined) => {
  if (!key || !LINK_KEY_RE.test(key)) return null;
  const { data } = await supabaseAdmin().from("bouquet_links").select("key, name").eq("bouquet_id", bouquetId).eq("key", key).maybeSingle<{ key: string; name: string }>();
  return data;
});

/** Checks that a conversation id belongs to this bouquet (personal links must exist; device ids are free-form). */
export async function conversationAllowed(bouquetId: string, conversation: string) {
  if (!CONVERSATION_RE.test(conversation)) return false;
  if (conversation.startsWith("d:")) return true;
  return Boolean(await getLink(bouquetId, conversation.slice(2)));
}

/**
 * Earlier bouquets this one answers, oldest first: walks `reply_to` up the chain.
 * Only direct ancestors are shown, never side branches (other people's replies stay private).
 */
export async function getAncestors(meta: BouquetMeta): Promise<ThreadItem[]> {
  if (!meta.replyTo) return [];
  const { data } = await supabaseAdmin()
    .from("bouquets")
    .select("id, slug, reply_to, composition, wrapper, background, card_style, recipient_name, sender_name, reveal_at, expires_at, deleted_at, is_flagged, created_at")
    .or(`id.eq.${meta.threadId},thread_id.eq.${meta.threadId}`)
    .order("created_at", { ascending: true })
    .limit(60)
    .returns<Row[]>();
  const bySlug = new Map((data ?? []).map((r) => [r.slug, r]));
  const now = new Date();
  const out: ThreadItem[] = [];
  let next: string | null = meta.replyTo;
  for (let i = 0; next && i < 20; i++) {
    const r = bySlug.get(next);
    if (!r) break;
    next = r.reply_to ?? null;
    const hidden = r.deleted_at || r.is_flagged || (r.expires_at && new Date(r.expires_at) < now) || (r.reveal_at && new Date(r.reveal_at) > now);
    if (hidden) continue;
    out.unshift({
      slug: r.slug,
      from: r.sender_name ?? "",
      to: r.recipient_name ?? "",
      createdAt: r.created_at,
      design: normalizeDesign({ items: r.composition.items, wrapper: r.wrapper, paper: r.card_style.paper, background: r.background, ribbon: r.card_style.ribbon ?? "cherry" }),
    });
  }
  return out;
}

/** Teaser copy for link previews: says who it's from, never what's inside. */
export function teaser(opts: { to: string; from: string; locked?: boolean }) {
  const { to, from, locked } = opts;
  const title = to ? `💌 ${to}, something special is waiting for you` : "💌 Something special is waiting for you";
  const description = locked
    ? `${from || "Someone"} sealed a surprise for you. It unlocks soon, so keep this link close ✨`
    : `${from || "Someone"} wrapped a little surprise just for you. Break the seal to see what's inside 🌸`;
  return {
    title,
    description,
    og: {
      kicker: from ? `a little something from ${from}` : "you've got mail",
      title: to ? `${to}, this one's for you` : "This one's for you",
      subtitle: locked ? "Sealed for now. Opens soon ⏳" : "Break the seal to see what's inside ✨",
    },
  };
}
