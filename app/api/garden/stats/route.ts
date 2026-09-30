import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { currentUserId } from "@/lib/supabase/server";
import { ownedBouquetIds } from "@/lib/server/bouquets";
import { json } from "@/lib/server/security";
import { BADGES, streaks, type GardenStats } from "@/lib/garden/badges";
import { OCCASIONS } from "@/lib/content/occasions";

const bodySchema = z.object({
  items: z.array(z.object({ slug: z.string().regex(/^[A-Za-z0-9_-]{6,16}$/), token: z.string().min(10).max(64) })).max(100),
});

type Mine = { id: string; slug: string; thread_id: string | null; occasion: string | null; view_count: number; song: unknown; voice_path: string | null; created_at: string };

/** Runs an `.in()` query in chunks so long id lists don't overflow the URL. */
async function chunked<T>(values: string[], run: (part: string[]) => PromiseLike<{ data: T[] | null }>) {
  const parts: string[][] = [];
  for (let i = 0; i < values.length; i += 100) parts.push(values.slice(i, i + 100));
  return (await Promise.all(parts.map(run))).flatMap((r) => r.data ?? []);
}

/** Streak, badges and referral stats for My bouquets. Works from device edit tokens, plus the account when signed in. */
export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Bad request" }, 400);
  const uid = await currentUserId();
  const ids = (await ownedBouquetIds(parsed.data.items, uid)).slice(0, 1000);
  const db = supabaseAdmin();

  const mine = await chunked<Mine>(ids, (part) =>
    db.from("bouquets").select("id, slug, thread_id, occasion, view_count, song, voice_path, created_at").in("id", part).returns<Mine[]>(),
  );
  const slugs = mine.map((b) => b.slug);
  const threads = [...new Set(mine.map((b) => b.thread_id ?? b.id))];

  const [replyBouquets, chatReplies, threadRows, referrals] = await Promise.all([
    chunked<{ id: string }>(slugs, (part) => db.from("bouquets").select("id").in("reply_to", part).is("deleted_at", null).returns<{ id: string }[]>()),
    chunked<{ id: string }>(ids, (part) =>
      db.from("reactions").select("id").in("bouquet_id", part).eq("author", "recipient").not("reply", "is", null).limit(1000).returns<{ id: string }[]>(),
    ),
    chunked<{ id: string; thread_id: string | null }>(threads, (part) =>
      db.from("bouquets").select("id, thread_id").or(`id.in.(${part.join(",")}),thread_id.in.(${part.join(",")})`).is("deleted_at", null).returns<{ id: string; thread_id: string | null }[]>(),
    ),
    chunked<{ people: number }>(ids, (part) => db.from("bouquet_referrals").select("people").in("bouquet_id", part).returns<{ people: number }[]>()),
  ]);

  const perThread = new Map<string, number>();
  for (const r of threadRows) {
    const t = r.thread_id ?? r.id;
    perThread.set(t, (perThread.get(t) ?? 0) + 1);
  }
  const s = streaks(mine.map((b) => new Date(b.created_at)));
  const occasions = new Set(mine.map((b) => b.occasion).filter(Boolean));
  const stats: GardenStats = {
    sent: mine.length,
    opens: mine.reduce((n, b) => n + b.view_count, 0),
    streak: s.current,
    bestStreak: s.best,
    sentThisWeek: s.sentThisWeek,
    replies: replyBouquets.length + chatReplies.length,
    deepestThread: Math.max(0, ...perThread.values()),
    occasionsUsed: OCCASIONS.filter((o) => occasions.has(o.slug)).length,
    occasionsTotal: OCCASIONS.length,
    voiceNotes: mine.filter((b) => b.voice_path).length,
    songs: mine.filter((b) => b.song).length,
    referrals: referrals.reduce((n, r) => n + r.people, 0),
  };

  const earned = BADGES.filter((b) => b.earned(stats)).map((b) => b.id);
  let earnedAt: Record<string, string> = {};
  if (uid) {
    // Accounts keep the date each badge was first earned, across devices.
    if (earned.length) await db.from("badges").upsert(earned.map((badge) => ({ user_id: uid, badge })), { onConflict: "user_id,badge", ignoreDuplicates: true });
    const { data } = await db.from("badges").select("badge, earned_at").eq("user_id", uid).returns<{ badge: string; earned_at: string }[]>();
    earnedAt = Object.fromEntries((data ?? []).map((r) => [r.badge, r.earned_at]));
  }
  return json({ stats, earned, earnedAt, signedIn: Boolean(uid) });
}
