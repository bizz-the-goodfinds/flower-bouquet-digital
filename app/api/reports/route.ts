import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ipHash, json } from "@/lib/server/security";

const bodySchema = z.object({
  slug: z.string().regex(/^[A-Za-z0-9_-]{6,16}$/),
  reason: z.string().trim().min(1).max(500),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Bad request" }, 400);
  const db = supabaseAdmin();
  const hash = ipHash(req);
  const { data: b } = await db.from("bouquets").select("id").eq("slug", parsed.data.slug).maybeSingle();
  if (!b) return json({ error: "Not found" }, 404);
  // One report per IP per bouquet, so a single person can't take a bouquet down.
  const { count } = await db.from("reports").select("id", { count: "exact", head: true }).eq("bouquet_id", b.id).eq("ip_hash", hash);
  if ((count ?? 0) > 0) return json({ ok: true });
  const { error } = await db.from("reports").insert({ bouquet_id: b.id, reason: parsed.data.reason, ip_hash: hash });
  if (error) return json({ error: "Couldn't send report." }, 500);
  return json({ ok: true }, 201);
}
