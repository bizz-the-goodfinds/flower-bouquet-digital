import { customAlphabet } from "nanoid";
import { createBouquetSchema } from "@/lib/bouquet/card";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { bouquetColumns } from "@/lib/server/bouquets";
import { ipHash, isAbusive, json, newEditToken, sha256 } from "@/lib/server/security";
import { verifyTurnstile } from "@/lib/server/turnstile";
import { currentUserId } from "@/lib/supabase/server";

const slugId = customAlphabet("23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ", 8);

const LIMIT_10_MIN = 12;
const LIMIT_DAY = 60;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const parsed = createBouquetSchema.safeParse(body);
  if (!parsed.success) return json({ error: "Something in your bouquet looks off. Try again." }, 422);
  const { card, revealAt, replyTo, turnstileToken } = parsed.data;

  if (isAbusive(card.to, card.from, card.message)) {
    return json({ error: "Your note contains words we don't allow. Keep it kind 🌸" }, 422);
  }
  if (revealAt) {
    const t = new Date(revealAt).getTime();
    if (t > Date.now() + 366 * 24 * 3600 * 1000) return json({ error: "Open date must be within a year." }, 422);
  }

  if (!(await verifyTurnstile(turnstileToken, req))) {
    return json({ error: "Couldn't verify you're human. Refresh and try again." }, 403);
  }

  const db = supabaseAdmin();
  const hash = ipHash(req);
  const since = (ms: number) => new Date(Date.now() - ms).toISOString();
  const [recent, daily] = await Promise.all([
    db.from("bouquets").select("id", { count: "exact", head: true }).eq("ip_hash", hash).gte("created_at", since(10 * 60 * 1000)),
    db.from("bouquets").select("id", { count: "exact", head: true }).eq("ip_hash", hash).gte("created_at", since(24 * 3600 * 1000)),
  ]);
  if ((recent.count ?? 0) >= LIMIT_10_MIN || (daily.count ?? 0) >= LIMIT_DAY) {
    return json({ error: "Whoa, that's a lot of flowers. Take a breather and try again in a few minutes." }, 429);
  }

  const token = newEditToken();
  const ownerId = await currentUserId();
  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = slugId();
    const { error } = await db.from("bouquets").insert({
      slug,
      edit_token_hash: sha256(token),
      owner_id: ownerId,
      ...bouquetColumns(parsed.data),
      reply_to: replyTo || null,
      ip_hash: hash,
    });
    if (!error) return json({ slug, token }, 201);
    if (error.code !== "23505") {
      console.error("create bouquet failed", error);
      return json({ error: "Couldn't save your bouquet. Please try again." }, 500);
    }
  }
  return json({ error: "Couldn't save your bouquet. Please try again." }, 500);
}
