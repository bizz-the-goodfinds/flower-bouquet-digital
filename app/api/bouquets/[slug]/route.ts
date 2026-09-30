import { createBouquetSchema } from "@/lib/bouquet/card";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { bouquetColumns, loadEditable, mediaColumns, toSource } from "@/lib/server/bouquets";
import { removeVoice, voicePlayUrl } from "@/lib/server/voice";
import { isAbusive, json } from "@/lib/server/security";

export async function GET(req: Request, ctx: RouteContext<"/api/bouquets/[slug]">) {
  const row = await loadEditable(req, (await ctx.params).slug);
  if (!row) return json({ error: "Not found" }, 404);
  return json(toSource(row, await voicePlayUrl(row.voice_path ?? null)));
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/bouquets/[slug]">) {
  const row = await loadEditable(req, (await ctx.params).slug);
  if (!row) return json({ error: "Not found" }, 404);
  const parsed = createBouquetSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Something in your bouquet looks off. Try again." }, 422);
  const { card } = parsed.data;
  if (isAbusive(card.to, card.from, card.message)) return json({ error: "Your note contains words we don't allow. Keep it kind 🌸" }, 422);
  const media = await mediaColumns(parsed.data, row.id, row);
  if ("error" in media) return json({ error: media.error }, 422);
  const { error } = await supabaseAdmin().from("bouquets").update({ ...bouquetColumns(parsed.data), ...media.columns }).eq("id", row.id);
  if (error) return json({ error: "Couldn't save changes. Try again." }, 500);
  return json({ slug: row.slug });
}

export async function DELETE(req: Request, ctx: RouteContext<"/api/bouquets/[slug]">) {
  const row = await loadEditable(req, (await ctx.params).slug);
  if (!row) return json({ error: "Not found" }, 404);
  const { error } = await supabaseAdmin().from("bouquets").update({ deleted_at: new Date().toISOString(), voice_path: null, voice_seconds: null }).eq("id", row.id);
  if (error) return json({ error: "Couldn't delete. Try again." }, 500);
  // The voice note goes with the bouquet.
  await removeVoice(row.voice_path);
  return json({ ok: true });
}
