import { supabaseAdmin } from "@/lib/supabase/admin";
import { json, tokenMatches } from "@/lib/server/security";

export async function DELETE(req: Request, ctx: RouteContext<"/api/bouquets/[slug]">) {
  const { slug } = await ctx.params;
  const token = req.headers.get("x-edit-token");
  const db = supabaseAdmin();
  const { data } = await db.from("bouquets").select("id, edit_token_hash").eq("slug", slug).is("deleted_at", null).maybeSingle();
  if (!data || !tokenMatches(token, data.edit_token_hash)) return json({ error: "Not found" }, 404);
  const { error } = await db.from("bouquets").update({ deleted_at: new Date().toISOString() }).eq("id", data.id);
  if (error) return json({ error: "Couldn't delete. Try again." }, 500);
  return json({ ok: true });
}
