import { supabaseAdmin } from "@/lib/supabase/admin";
import { json } from "@/lib/server/security";

export async function POST(_req: Request, ctx: RouteContext<"/api/bouquets/[slug]/view">) {
  const { slug } = await ctx.params;
  if (!/^[A-Za-z0-9_-]{6,16}$/.test(slug)) return json({ ok: false }, 400);
  await supabaseAdmin().rpc("increment_bouquet_view", { p_slug: slug });
  return json({ ok: true });
}
