import { z } from "zod";
import { REACTIONS } from "@/lib/bouquet/card";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { CONVERSATION_RE, SLUG_PATTERN, conversationAllowed, loadEditable } from "@/lib/server/bouquets";
import { MESSAGE_COLS, groupConversations, toMessage, type Msg } from "@/lib/server/chat";
import { isAbusive, json } from "@/lib/server/security";

/**
 * GET ?c=<conversation>: one recipient's chat (whoever holds the conversation id: their link or their device).
 * GET without c: every conversation, for the sender only (edit token or signed-in owner).
 */
export async function GET(req: Request, ctx: RouteContext<"/api/bouquets/[slug]/chat">) {
  const { slug } = await ctx.params;
  const url = new URL(req.url);
  const c = url.searchParams.get("c");
  const db = supabaseAdmin();

  if (c) {
    if (!SLUG_PATTERN.test(slug) || !CONVERSATION_RE.test(c)) return json({ error: "Bad request" }, 400);
    // Newest page first (?before=<iso> for older pages), returned oldest→newest for display.
    const before = url.searchParams.get("before");
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || PAGE));
    // This is polled, so everything is keyed by slug through joins and runs in one round trip.
    let q = db.from("reactions").select(`${MESSAGE_COLS}, bouquets!inner(slug)`).eq("bouquets.slug", slug).eq("conversation", c);
    if (before && !Number.isNaN(Date.parse(before))) q = q.lt("created_at", before);
    const [b, link, msgs] = await Promise.all([
      db.from("bouquets").select("id").eq("slug", slug).is("deleted_at", null).maybeSingle<{ id: string }>(),
      // Personal-link conversations must still have their link; device ones are free-form.
      c.startsWith("l:") ? db.from("bouquet_links").select("key, bouquets!inner(slug)").eq("bouquets.slug", slug).eq("key", c.slice(2)).maybeSingle() : null,
      q.order("created_at", { ascending: false }).limit(limit + 1).returns<Msg[]>(),
    ]);
    if (!b.data || (link && !link.data)) return json({ error: "Not found" }, 404);
    const rows = msgs.data ?? [];
    return json({ messages: rows.slice(0, limit).reverse().map(toMessage), hasMore: rows.length > limit });
  }

  const row = await loadEditable(req, slug);
  if (!row) return json({ error: "Not found" }, 404);
  const [msgs, links] = await Promise.all([
    db.from("reactions").select(MESSAGE_COLS).eq("bouquet_id", row.id).order("created_at").limit(1000).returns<Msg[]>(),
    db.from("bouquet_links").select("key, name, view_count, opened_at").eq("bouquet_id", row.id).order("created_at").returns<{ key: string; name: string; view_count: number; opened_at: string | null }[]>(),
  ]);
  return json({ conversations: groupConversations(msgs.data ?? [], links.data ?? []) });
}

const PAGE = 30;

const bodySchema = z
  .object({
    conversation: z.string().regex(CONVERSATION_RE),
    emoji: z.enum(REACTIONS).optional(),
    text: z.string().trim().max(280).optional(),
  })
  .refine((b) => b.emoji || b.text, "Empty message");

/** The sender answers one recipient. */
export async function POST(req: Request, ctx: RouteContext<"/api/bouquets/[slug]/chat">) {
  const row = await loadEditable(req, (await ctx.params).slug);
  if (!row) return json({ error: "Not found" }, 404);
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Bad request" }, 400);
  const { conversation, emoji, text } = parsed.data;
  if (isAbusive(text)) return json({ error: "Keep it kind 🌸" }, 422);
  if (!(await conversationAllowed(row.id, conversation))) return json({ error: "Not found" }, 404);
  const db = supabaseAdmin();
  if (conversation.startsWith("d:")) {
    // Device conversations exist only once that recipient has written first.
    const { count } = await db.from("reactions").select("id", { count: "exact", head: true }).eq("bouquet_id", row.id).eq("conversation", conversation);
    if (!count) return json({ error: "Not found" }, 404);
  }
  const { data, error } = await db
    .from("reactions")
    .insert({ bouquet_id: row.id, author: "sender", conversation, emoji: emoji ?? null, reply: text || null })
    .select(MESSAGE_COLS)
    .single<Msg>();
  if (error) return json({ error: "Couldn't send. Try again." }, 500);
  return json({ message: toMessage(data) }, 201);
}
