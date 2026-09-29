import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { currentUserId } from "@/lib/supabase/server";
import { normalizeDesign } from "@/lib/bouquet/composition";
import { normalizeEnvelope } from "@/lib/bouquet/envelope";
import { normalizeCardFont, normalizeNoteMode, normalizeStickers } from "@/lib/bouquet/card";
import { CONVERSATION_RE, type Row } from "@/lib/server/bouquets";
import { MESSAGE_COLS, toMessage, type Msg } from "@/lib/server/chat";
import { json } from "@/lib/server/security";

const bodySchema = z.object({
  items: z
    .array(z.object({ slug: z.string().regex(/^[A-Za-z0-9_-]{6,16}$/), conversation: z.string().regex(CONVERSATION_RE), link: z.string().regex(/^[A-Za-z0-9]{6,12}$/).nullable().optional() }))
    .max(200),
});

type Full = Row & { id: string; owner_id: string | null };
const COLS = "id, slug, owner_id, thread_id, reply_to, composition, wrapper, background, card_style, recipient_name, sender_name, message, reveal_at, expires_at, deleted_at, is_flagged, created_at";

/** Bouquets the caller received: opened on this device, plus (signed in) every device. Locked ones hide their flowers. */
export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Bad request" }, 400);
  const uid = await currentUserId();
  const db = supabaseAdmin();

  const wanted = new Map(parsed.data.items.map((i) => [i.slug, { conversation: i.conversation, link: i.link ?? null }]));
  if (uid) {
    const { data } = await db
      .from("bouquet_receipts")
      .select("conversation, link_key, created_at, bouquets(slug)")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(200)
      .returns<{ conversation: string; link_key: string | null; bouquets: { slug: string } | null }[]>();
    for (const r of data ?? []) if (r.bouquets) wanted.set(r.bouquets.slug, { conversation: r.conversation, link: r.link_key });
  }
  if (!wanted.size) return json({ bouquets: [], signedIn: Boolean(uid) });

  const { data: rows, error } = await db.from("bouquets").select(COLS).in("slug", [...wanted.keys()]).returns<Full[]>();
  if (error) return json({ error: "Couldn't load" }, 500);
  const now = new Date();
  const live = (rows ?? []).filter((r) => !r.deleted_at && !r.is_flagged && !(r.expires_at && new Date(r.expires_at) < now) && !(uid && r.owner_id === uid));

  const [msgs, links] = await Promise.all([
    live.length ? db.from("reactions").select(`${MESSAGE_COLS}, bouquet_id`).in("bouquet_id", live.map((r) => r.id)).not("conversation", "is", null).returns<(Msg & { bouquet_id: string })[]>() : null,
    live.length ? db.from("bouquet_links").select("bouquet_id, key, name").in("bouquet_id", live.map((r) => r.id)).returns<{ bouquet_id: string; key: string; name: string }[]>() : null,
  ]);

  const bouquets = live
    .map((r) => {
      const w = wanted.get(r.slug)!;
      const locked = Boolean(r.reveal_at && new Date(r.reveal_at) > now);
      const chat = (msgs?.data ?? []).filter((m) => m.bouquet_id === r.id && m.conversation === w.conversation).sort((a, b) => a.created_at.localeCompare(b.created_at));
      const last = chat.at(-1);
      const linkName = w.link ? (links?.data ?? []).find((l) => l.bouquet_id === r.id && l.key === w.link)?.name : undefined;
      return {
        slug: r.slug,
        link: linkName ? w.link : null,
        conversation: w.conversation,
        thread: r.thread_id ?? r.id,
        replyTo: r.reply_to,
        from: r.sender_name ?? "",
        to: linkName ?? r.recipient_name ?? "",
        createdAt: r.created_at,
        locked,
        revealAt: r.reveal_at,
        envelope: normalizeEnvelope(r.card_style.envelope),
        design: locked ? null : normalizeDesign({ items: r.composition.items, wrapper: r.wrapper, paper: r.card_style.paper, background: r.background, ribbon: r.card_style.ribbon ?? "cherry" }),
        chat: { count: chat.length, last: last ? toMessage(last) : null },
        // Note + card look for downloads (image/video/GIF). Hidden while the bouquet is still locked.
        message: locked ? "" : (r.message ?? ""),
        style: {
          template: r.card_style.template ?? "paper",
          font: normalizeCardFont(r.card_style.font),
          stickers: normalizeStickers(r.card_style.stickers),
          envelope: normalizeEnvelope(r.card_style.envelope),
          note: normalizeNoteMode(r.card_style.note),
        },
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return json({ bouquets, signedIn: Boolean(uid) });
}

/** Signed in: stop listing a received bouquet on every device. */
export async function DELETE(req: Request) {
  const uid = await currentUserId();
  if (!uid) return json({ ok: true });
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  if (!/^[A-Za-z0-9_-]{6,16}$/.test(slug)) return json({ error: "Bad request" }, 400);
  const db = supabaseAdmin();
  const { data: b } = await db.from("bouquets").select("id").eq("slug", slug).maybeSingle<{ id: string }>();
  if (b) await db.from("bouquet_receipts").delete().eq("user_id", uid).eq("bouquet_id", b.id);
  return json({ ok: true });
}
