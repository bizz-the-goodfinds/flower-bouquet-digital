import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { currentUserId } from "@/lib/supabase/server";
import { SOURCE_COLUMNS, toSource, type Row } from "@/lib/server/bouquets";
import { json, tokenMatches } from "@/lib/server/security";

const bodySchema = z.object({
  items: z.array(z.object({ slug: z.string().regex(/^[A-Za-z0-9_-]{6,16}$/), token: z.string().min(10).max(64) })).max(100),
});

type Full = Row & { id: string; edit_token_hash: string; owner_id: string | null; view_count: number; reactions: { emoji: string; reply: string | null; created_at: string }[] };

/** Bouquets the caller created: proved by device edit tokens, plus all owned by the signed-in account. */
export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Bad request" }, 400);
  const tokens = new Map(parsed.data.items.map((i) => [i.slug, i.token]));
  const uid = await currentUserId();
  const db = supabaseAdmin();
  const cols = `${SOURCE_COLUMNS}, reactions(emoji, reply, created_at)`;

  const [byToken, byOwner] = await Promise.all([
    tokens.size ? db.from("bouquets").select(cols).in("slug", [...tokens.keys()]).returns<Full[]>() : Promise.resolve({ data: [] as Full[], error: null }),
    uid ? db.from("bouquets").select(cols).eq("owner_id", uid).is("deleted_at", null).order("created_at", { ascending: false }).limit(100).returns<Full[]>() : Promise.resolve({ data: [] as Full[], error: null }),
  ]);
  if (byToken.error || byOwner.error) return json({ error: "Couldn't load" }, 500);

  const seen = new Map<string, Full>();
  for (const b of byToken.data ?? []) if (tokenMatches(tokens.get(b.slug) ?? null, b.edit_token_hash)) seen.set(b.slug, b);
  for (const b of byOwner.data ?? []) seen.set(b.slug, b);

  const bouquets = [...seen.values()]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((b) => ({
      ...toSource(b),
      views: b.view_count,
      deleted: Boolean(b.deleted_at),
      owned: Boolean(uid && b.owner_id === uid),
      reactions: (b.reactions ?? []).sort((x, y) => y.created_at.localeCompare(x.created_at)),
    }));
  return json({ bouquets, signedIn: Boolean(uid) });
}
