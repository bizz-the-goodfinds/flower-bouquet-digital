import { createBouquetSchema } from "@/lib/bouquet/card";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { currentUserId } from "@/lib/supabase/server";
import { SOURCE_COLUMNS, bouquetColumns, toSource, type Row } from "@/lib/server/bouquets";
import { isAbusive, json, tokenMatches } from "@/lib/server/security";

type Owned = Row & { id: string; edit_token_hash: string; owner_id: string | null };

/** Loads a live bouquet the caller may edit: via the device edit token or as the signed-in owner. */
async function loadEditable(req: Request, slug: string) {
  if (!/^[A-Za-z0-9_-]{6,16}$/.test(slug)) return null;
  const { data } = await supabaseAdmin().from("bouquets").select(SOURCE_COLUMNS).eq("slug", slug).is("deleted_at", null).maybeSingle<Owned>();
  if (!data) return null;
  if (tokenMatches(req.headers.get("x-edit-token"), data.edit_token_hash)) return data;
  const uid = data.owner_id ? await currentUserId() : null;
  return uid && uid === data.owner_id ? data : null;
}

export async function GET(req: Request, ctx: RouteContext<"/api/bouquets/[slug]">) {
  const row = await loadEditable(req, (await ctx.params).slug);
  if (!row) return json({ error: "Not found" }, 404);
  return json(toSource(row));
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/bouquets/[slug]">) {
  const row = await loadEditable(req, (await ctx.params).slug);
  if (!row) return json({ error: "Not found" }, 404);
  const parsed = createBouquetSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Something in your bouquet looks off. Try again." }, 422);
  const { card } = parsed.data;
  if (isAbusive(card.to, card.from, card.message)) return json({ error: "Your note contains words we don't allow. Keep it kind 🌸" }, 422);
  const { error } = await supabaseAdmin().from("bouquets").update(bouquetColumns(parsed.data)).eq("id", row.id);
  if (error) return json({ error: "Couldn't save changes. Try again." }, 500);
  return json({ slug: row.slug });
}

export async function DELETE(req: Request, ctx: RouteContext<"/api/bouquets/[slug]">) {
  const row = await loadEditable(req, (await ctx.params).slug);
  if (!row) return json({ error: "Not found" }, 404);
  const { error } = await supabaseAdmin().from("bouquets").update({ deleted_at: new Date().toISOString() }).eq("id", row.id);
  if (error) return json({ error: "Couldn't delete. Try again." }, 500);
  return json({ ok: true });
}
