import { notifyDueReveals } from "@/lib/server/push";
import { json } from "@/lib/server/security";

/** Vercel Cron: tells senders their scheduled bouquets have unlocked (page visits also do this right away). */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return json({ error: "Unauthorized" }, 401);
  return json({ notified: await notifyDueReveals() });
}
