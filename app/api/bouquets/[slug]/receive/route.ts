import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { currentUserId } from "@/lib/supabase/server";
import { CONVERSATION_RE, conversationAllowed } from "@/lib/server/bouquets";
import { json } from "@/lib/server/security";

const bodySchema = z.object({ conversation: z.string().regex(CONVERSATION_RE), link: z.string().regex(/^[A-Za-z0-9]{6,12}$/).nullable().optional() });

/**
 * A recipient opened a bouquet. Signed in: remember it under their account (so it shows as received on every device)
 * and hand back the conversation they already have, so the chat follows them. Signed out: echo the conversation.
 */
export async function POST(req: Request, ctx: RouteContext<"/api/bouquets/[slug]/receive">) {
  const { slug } = await ctx.params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Bad request" }, 400);
  const { conversation, link } = parsed.data;
  const uid = await currentUserId();
  if (!uid) return json({ conversation, signedIn: false });

  const db = supabaseAdmin();
  const { data: b } = await db.from("bouquets").select("id, owner_id").eq("slug", slug).is("deleted_at", null).maybeSingle<{ id: string; owner_id: string | null }>();
  if (!b || !(await conversationAllowed(b.id, conversation))) return json({ error: "Not found" }, 404);
  if (b.owner_id === uid) return json({ conversation, signedIn: true, own: true });
  await db.from("bouquet_receipts").upsert({ user_id: uid, bouquet_id: b.id, conversation, link_key: link ?? null }, {
    onConflict: "user_id,bouquet_id",
    // A personal link is the more specific conversation, so it replaces a device one; otherwise keep the first.
    ignoreDuplicates: !conversation.startsWith("l:"),
  });
  if (conversation.startsWith("l:")) return json({ conversation, signedIn: true });
  // A device conversation may have been ignored in favour of the one already stored: hand that one back.
  const { data } = await db.from("bouquet_receipts").select("conversation").eq("user_id", uid).eq("bouquet_id", b.id).maybeSingle<{ conversation: string }>();
  return json({ conversation: data?.conversation ?? conversation, signedIn: true });
}
