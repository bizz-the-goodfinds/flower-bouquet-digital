import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { currentUserId } from "@/lib/supabase/server";
import { SOURCE_COLUMNS, toSource, type Row } from "@/lib/server/bouquets";
import { groupConversations, type Msg } from "@/lib/server/chat";
import { json, tokenMatches } from "@/lib/server/security";

const bodySchema = z.object({
  items: z.array(z.object({ slug: z.string().regex(/^[A-Za-z0-9_-]{6,16}$/), token: z.string().min(10).max(64) })).max(100),
});

type Link = { key: string; name: string; view_count: number; opened_at: string | null };
type Full = Row & { id: string; edit_token_hash: string; owner_id: string | null; view_count: number; reactions: Msg[]; bouquet_links: Link[] };

/** Bouquets the caller created: proved by device edit tokens, plus all owned by the signed-in account. */
export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Bad request" }, 400);
  const tokens = new Map(parsed.data.items.map((i) => [i.slug, i.token]));
  const uid = await currentUserId();
  const db = supabaseAdmin();
  const cols = `${SOURCE_COLUMNS}, reactions(id, author, emoji, reply, conversation, created_at), bouquet_links(key, name, view_count, opened_at)`;

  const [byToken, byOwner] = await Promise.all([
    tokens.size ? db.from("bouquets").select(cols).in("slug", [...tokens.keys()]).returns<Full[]>() : Promise.resolve({ data: [] as Full[], error: null }),
    uid ? db.from("bouquets").select(cols).eq("owner_id", uid).is("deleted_at", null).order("created_at", { ascending: false }).limit(100).returns<Full[]>() : Promise.resolve({ data: [] as Full[], error: null }),
  ]);
  if (byToken.error || byOwner.error) return json({ error: "Couldn't load" }, 500);

  const seen = new Map<string, Full>();
  for (const b of byToken.data ?? []) if (tokenMatches(tokens.get(b.slug) ?? null, b.edit_token_hash)) seen.set(b.slug, b);
  for (const b of byOwner.data ?? []) seen.set(b.slug, b);

  // Bouquets people sent back in reply to these (they belong in the same thread).
  const { data: replyRows } = seen.size
    ? await db
        .from("bouquets")
        .select("slug, reply_to, sender_name, created_at, reveal_at")
        .in("reply_to", [...seen.keys()])
        .is("deleted_at", null)
        .eq("is_flagged", false)
        .returns<{ slug: string; reply_to: string; sender_name: string | null; created_at: string; reveal_at: string | null }[]>()
    : { data: [] };

  const bouquets = [...seen.values()]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((b) => ({
      ...toSource(b),
      views: b.view_count,
      deleted: Boolean(b.deleted_at),
      owned: Boolean(uid && b.owner_id === uid),
      thread: b.thread_id ?? b.id,
      replyTo: b.reply_to ?? null,
      conversations: groupConversations(b.reactions ?? [], [...(b.bouquet_links ?? [])]),
      replies: (replyRows ?? []).filter((r) => r.reply_to === b.slug).map((r) => ({ slug: r.slug, from: r.sender_name ?? "", createdAt: r.created_at })),
    }));
  return json({ bouquets, signedIn: Boolean(uid) });
}
