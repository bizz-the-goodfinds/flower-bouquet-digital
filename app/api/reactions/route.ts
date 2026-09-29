import { z } from "zod";
import { REACTIONS } from "@/lib/bouquet/card";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ipHash, isAbusive, json } from "@/lib/server/security";

const bodySchema = z.object({
  slug: z.string().regex(/^[A-Za-z0-9_-]{6,16}$/),
  emoji: z.enum(REACTIONS),
  reply: z.string().trim().max(280).optional(),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Bad request" }, 400);
  const { slug, emoji, reply } = parsed.data;
  if (isAbusive(reply)) return json({ error: "Keep it kind 🌸" }, 422);

  const db = supabaseAdmin();
  const hash = ipHash(req);
  const { count } = await db
    .from("reactions")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", hash)
    .gte("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString());
  if ((count ?? 0) >= 15) return json({ error: "Slow down a little 🙂" }, 429);

  const { data: b } = await db.from("bouquets").select("id").eq("slug", slug).is("deleted_at", null).maybeSingle();
  if (!b) return json({ error: "Not found" }, 404);
  const { error } = await db.from("reactions").insert({ bouquet_id: b.id, emoji, reply: reply || null, ip_hash: hash });
  if (error) return json({ error: "Couldn't send. Try again." }, 500);
  return json({ ok: true }, 201);
}
