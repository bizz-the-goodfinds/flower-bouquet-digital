import "server-only";
import { clientIp } from "./security";

/** Verifies a Cloudflare Turnstile token. Passes automatically when Turnstile isn't configured. */
export async function verifyTurnstile(token: string | null | undefined, req: Request) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token, remoteip: clientIp(req) });
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
    const data = (await res.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch {
    // Fail open on Cloudflare outages; rate limits still apply.
    return true;
  }
}
