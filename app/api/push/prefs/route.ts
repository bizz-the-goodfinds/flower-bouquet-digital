import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { DEFAULT_PREFS } from "@/lib/server/push";
import { json } from "@/lib/server/security";

const bodySchema = z.object({
  endpoint: z.string().max(1000),
  prefs: z.object({ opened: z.boolean(), chat: z.boolean(), reveal: z.boolean() }),
});

/** Which notifications this device gets. The subscription endpoint is the device's secret. */
export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Bad request" }, 400);
  const { data } = await supabaseAdmin()
    .from("push_subscriptions")
    .update({ prefs: parsed.data.prefs })
    .eq("endpoint", parsed.data.endpoint)
    .select("prefs")
    .maybeSingle<{ prefs: typeof DEFAULT_PREFS }>();
  if (!data) return json({ error: "Not found" }, 404);
  return json({ prefs: { ...DEFAULT_PREFS, ...data.prefs } });
}
