import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ipHash, json } from "@/lib/server/security";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8, "Use at least 8 characters").max(72),
});

/**
 * Creates an email + password account that is confirmed immediately (no verification email).
 * The client then signs in with signInWithPassword.
 */
export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: parsed.error.issues[0]?.message ?? "Check your email and password." }, 422);

  const db = supabaseAdmin();
  const hash = ipHash(req);
  const { count } = await db
    .from("signup_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", hash)
    .gte("created_at", new Date(Date.now() - 3600 * 1000).toISOString());
  if ((count ?? 0) >= 5) return json({ error: "Too many sign-ups from here. Try again later." }, 429);
  await db.from("signup_attempts").insert({ ip_hash: hash });

  const { error } = await db.auth.admin.createUser({ email: parsed.data.email, password: parsed.data.password, email_confirm: true });
  if (error) {
    const exists = /already|registered|exists/i.test(error.message);
    return json({ error: exists ? "That email already has an account. Sign in instead." : "Couldn't create your account. Try again." }, exists ? 409 : 500);
  }
  return json({ ok: true }, 201);
}
