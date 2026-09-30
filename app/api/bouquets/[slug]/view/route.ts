import { after } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { currentUserId } from "@/lib/supabase/server";
import { LINK_KEY_RE } from "@/lib/server/bouquets";
import { notifyOpened } from "@/lib/server/push";
import { json } from "@/lib/server/security";

/** Counts an open. The signed-in sender opening their own bouquet never counts. The first open pings the sender. */
export async function POST(req: Request, ctx: RouteContext<"/api/bouquets/[slug]/view">) {
  const { slug } = await ctx.params;
  if (!/^[A-Za-z0-9_-]{6,16}$/.test(slug)) return json({ ok: false }, 400);
  const body = (await req.json().catch(() => null)) as { link?: unknown } | null;
  const link = typeof body?.link === "string" && LINK_KEY_RE.test(body.link) ? body.link : null;
  const db = supabaseAdmin();
  const [{ data: b }, uid] = await Promise.all([
    db.from("bouquets").select("id, owner_id, view_count").eq("slug", slug).is("deleted_at", null).maybeSingle<{ id: string; owner_id: string | null; view_count: number }>(),
    currentUserId(),
  ]);
  if (!b) return json({ ok: false }, 404);
  if (b.owner_id && b.owner_id === uid) return json({ ok: true, counted: false });
  const personal = link
    ? await db.from("bouquet_links").select("name, opened_at").eq("bouquet_id", b.id).eq("key", link).maybeSingle<{ name: string; opened_at: string | null }>()
    : null;
  await Promise.all([
    db.rpc("increment_bouquet_view", { p_slug: slug }),
    personal?.data ? db.rpc("increment_link_view", { p_bouquet: b.id, p_key: link }) : null,
  ]);
  // First open of this personal link, or of the bouquet itself.
  if (personal?.data ? !personal.data.opened_at : b.view_count === 0) after(() => notifyOpened(b.id, personal?.data?.name));
  return json({ ok: true, counted: true });
}
