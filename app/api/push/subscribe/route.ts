import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { currentUserId } from "@/lib/supabase/server";
import { ownedBouquetIds } from "@/lib/server/bouquets";
import { DEFAULT_PREFS, type PushPrefs } from "@/lib/server/push";
import { json } from "@/lib/server/security";

/** Only real browser push services: we POST to this URL, so anything else would let callers aim our server elsewhere. */
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /(^|\.)push\.services\.mozilla\.com$/, /(^|\.)notify\.windows\.com$/, /(^|\.)push\.apple\.com$/];
const endpointSchema = z
  .string()
  .url()
  .max(1000)
  .refine((u) => {
    const url = new URL(u);
    return url.protocol === "https:" && PUSH_HOSTS.some((re) => re.test(url.hostname));
  });

const itemsSchema = z.array(z.object({ slug: z.string().regex(/^[A-Za-z0-9_-]{6,16}$/), token: z.string().min(10).max(64) })).max(100);

const bodySchema = z.object({
  subscription: z.object({ endpoint: endpointSchema, keys: z.object({ p256dh: z.string().min(20).max(200), auth: z.string().min(8).max(100) }) }),
  /** Bouquets this device sent (edit tokens prove it). */
  items: itemsSchema.default([]),
});

/** Saves this device's push subscription and links it to the bouquets it sent (and the account, when signed in). */
export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Bad request" }, 400);
  const { subscription, items } = parsed.data;
  const db = supabaseAdmin();
  const uid = await currentUserId();

  const { data: sub, error } = await db
    .from("push_subscriptions")
    .upsert(
      { endpoint: subscription.endpoint, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth, ...(uid ? { user_id: uid } : {}) },
      { onConflict: "endpoint" },
    )
    .select("id, prefs")
    .single<{ id: string; prefs: Partial<PushPrefs> }>();
  if (error || !sub) {
    console.error("push subscribe failed", error);
    return json({ error: "Couldn't turn on notifications. Try again." }, 500);
  }
  // Token-proven bouquets only: the account's own bouquets are covered through user_id.
  const ids = await ownedBouquetIds(items, null);
  if (ids.length) await db.from("push_bouquets").upsert(ids.map((bouquet_id) => ({ subscription_id: sub.id, bouquet_id })), { ignoreDuplicates: true });
  return json({ prefs: { ...DEFAULT_PREFS, ...sub.prefs } });
}

/** Turns notifications off on this device. */
export async function DELETE(req: Request) {
  const parsed = z.object({ endpoint: z.string().max(1000) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Bad request" }, 400);
  await supabaseAdmin().from("push_subscriptions").delete().eq("endpoint", parsed.data.endpoint);
  return json({ ok: true });
}
