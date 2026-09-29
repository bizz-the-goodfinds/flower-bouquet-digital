import { customAlphabet } from "nanoid";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { LINK_KEY_RE, loadEditable } from "@/lib/server/bouquets";
import { isAbusive, json } from "@/lib/server/security";

const linkKey = customAlphabet("23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ", 7);
const MAX_LINKS = 50;

const bodySchema = z.object({ name: z.string().trim().min(1).max(60) });

/** Sender creates a personal link for one recipient: own opens, own chat. */
export async function POST(req: Request, ctx: RouteContext<"/api/bouquets/[slug]/links">) {
  const row = await loadEditable(req, (await ctx.params).slug);
  if (!row) return json({ error: "Not found" }, 404);
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Add their name first." }, 422);
  if (isAbusive(parsed.data.name)) return json({ error: "Keep it kind 🌸" }, 422);
  const db = supabaseAdmin();
  const { count } = await db.from("bouquet_links").select("id", { count: "exact", head: true }).eq("bouquet_id", row.id);
  if ((count ?? 0) >= MAX_LINKS) return json({ error: `Up to ${MAX_LINKS} personal links per bouquet.` }, 422);
  for (let attempt = 0; attempt < 3; attempt++) {
    const key = linkKey();
    const { error } = await db.from("bouquet_links").insert({ bouquet_id: row.id, key, name: parsed.data.name });
    if (!error) return json({ key, name: parsed.data.name, views: 0, openedAt: null }, 201);
    if (error.code !== "23505") break;
  }
  return json({ error: "Couldn't make that link. Try again." }, 500);
}

export async function DELETE(req: Request, ctx: RouteContext<"/api/bouquets/[slug]/links">) {
  const row = await loadEditable(req, (await ctx.params).slug);
  if (!row) return json({ error: "Not found" }, 404);
  const key = new URL(req.url).searchParams.get("key") ?? "";
  if (!LINK_KEY_RE.test(key)) return json({ error: "Bad request" }, 400);
  await supabaseAdmin().from("bouquet_links").delete().eq("bouquet_id", row.id).eq("key", key);
  return json({ ok: true });
}
