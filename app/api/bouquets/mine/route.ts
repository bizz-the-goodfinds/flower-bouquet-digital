import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { json, tokenMatches } from "@/lib/server/security";

const bodySchema = z.object({
  items: z.array(z.object({ slug: z.string().regex(/^[A-Za-z0-9_-]{6,16}$/), token: z.string().min(10).max(64) })).max(100),
});

/** Stats and reactions for bouquets this device created (proved by edit tokens). */
export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Bad request" }, 400);
  const { items } = parsed.data;
  if (!items.length) return json({ bouquets: [] });

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("bouquets")
    .select("id, slug, edit_token_hash, view_count, deleted_at, reactions(emoji, reply, created_at)")
    .in("slug", items.map((i) => i.slug));
  if (error) return json({ error: "Couldn't load" }, 500);

  const tokens = new Map(items.map((i) => [i.slug, i.token]));
  const bouquets = (data ?? [])
    .filter((b) => tokenMatches(tokens.get(b.slug) ?? null, b.edit_token_hash))
    .map((b) => ({
      slug: b.slug,
      views: b.view_count,
      deleted: Boolean(b.deleted_at),
      reactions: (b.reactions ?? []).sort((x, y) => y.created_at.localeCompare(x.created_at)),
    }));
  return json({ bouquets });
}
