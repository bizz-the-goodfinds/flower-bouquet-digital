import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { currentUserId } from "@/lib/supabase/server";
import { json, tokenMatches } from "@/lib/server/security";

const bodySchema = z.object({
  items: z.array(z.object({ slug: z.string().regex(/^[A-Za-z0-9_-]{6,16}$/), token: z.string().min(10).max(64) })).max(100),
});

/** After sign-in, attach bouquets made on this device (proved by edit tokens) to the account. */
export async function POST(req: Request) {
  const uid = await currentUserId();
  if (!uid) return json({ error: "Sign in first" }, 401);
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Bad request" }, 400);
  const tokens = new Map(parsed.data.items.map((i) => [i.slug, i.token]));
  if (!tokens.size) return json({ claimed: 0 });

  const db = supabaseAdmin();
  const { data } = await db.from("bouquets").select("id, slug, edit_token_hash").in("slug", [...tokens.keys()]).is("owner_id", null);
  const ids = (data ?? []).filter((b) => tokenMatches(tokens.get(b.slug) ?? null, b.edit_token_hash)).map((b) => b.id);
  if (ids.length) await db.from("bouquets").update({ owner_id: uid }).in("id", ids);
  return json({ claimed: ids.length });
}
