import { supabaseAdmin } from "@/lib/supabase/admin";
import { currentUserId } from "@/lib/supabase/server";
import { LINK_KEY_RE } from "@/lib/server/bouquets";
import { json } from "@/lib/server/security";

/** Counts an open. The signed-in sender opening their own bouquet never counts. */
export async function POST(req: Request, ctx: RouteContext<"/api/bouquets/[slug]/view">) {
  const { slug } = await ctx.params;
  if (!/^[A-Za-z0-9_-]{6,16}$/.test(slug)) return json({ ok: false }, 400);
  const body = (await req.json().catch(() => null)) as { link?: unknown } | null;
  const link = typeof body?.link === "string" && LINK_KEY_RE.test(body.link) ? body.link : null;
  const db = supabaseAdmin();
  const { data: b } = await db.from("bouquets").select("id, owner_id").eq("slug", slug).is("deleted_at", null).maybeSingle<{ id: string; owner_id: string | null }>();
  if (!b) return json({ ok: false }, 404);
  if (b.owner_id && b.owner_id === (await currentUserId())) return json({ ok: true, counted: false });
  await Promise.all([
    db.rpc("increment_bouquet_view", { p_slug: slug }),
    link ? db.rpc("increment_link_view", { p_bouquet: b.id, p_key: link }) : null,
  ]);
  return json({ ok: true, counted: true });
}
