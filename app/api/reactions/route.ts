import { z } from "zod";
import { REACTIONS } from "@/lib/bouquet/card";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { CONVERSATION_RE, conversationAllowed } from "@/lib/server/bouquets";
import { MESSAGE_COLS, toMessage, type Msg } from "@/lib/server/chat";
import { ipHash, isAbusive, json } from "@/lib/server/security";

const bodySchema = z
  .object({
    slug: z.string().regex(/^[A-Za-z0-9_-]{6,16}$/),
    /** The recipient's conversation with the sender. Older clients don't send one. */
    conversation: z.string().regex(CONVERSATION_RE).optional(),
    emoji: z.enum(REACTIONS).optional(),
    reply: z.string().trim().max(280).optional(),
  })
  .refine((b) => b.emoji || b.reply, "Empty message");

/** A recipient reacts or writes to the sender. */
export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Bad request" }, 400);
  const { slug, emoji, reply, conversation } = parsed.data;
  if (isAbusive(reply)) return json({ error: "Keep it kind 🌸" }, 422);

  const db = supabaseAdmin();
  const hash = ipHash(req);
  const { count } = await db
    .from("reactions")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", hash)
    .gte("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString());
  if ((count ?? 0) >= 30) return json({ error: "Slow down a little 🙂" }, 429);

  const { data: b } = await db.from("bouquets").select("id").eq("slug", slug).is("deleted_at", null).maybeSingle<{ id: string }>();
  if (!b) return json({ error: "Not found" }, 404);
  if (conversation && !(await conversationAllowed(b.id, conversation))) return json({ error: "Not found" }, 404);
  const { data, error } = await db
    .from("reactions")
    .insert({ bouquet_id: b.id, emoji: emoji ?? null, reply: reply || null, ip_hash: hash, author: "recipient", conversation: conversation ?? null })
    .select(MESSAGE_COLS)
    .single<Msg>();
  if (error) return json({ error: "Couldn't send. Try again." }, 500);
  return json({ ok: true, message: toMessage(data) }, 201);
}
