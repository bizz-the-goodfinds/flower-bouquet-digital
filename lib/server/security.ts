import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function clientIp(req: Request) {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown").trim();
}

export function ipHash(req: Request) {
  const salt = process.env.IP_HASH_SALT ?? "petalpost";
  return createHash("sha256").update(`${salt}:${clientIp(req)}`).digest("hex").slice(0, 32);
}

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export const newEditToken = () => randomBytes(24).toString("base64url");

export function tokenMatches(token: string | null, hash: string) {
  if (!token) return false;
  const a = Buffer.from(sha256(token));
  const b = Buffer.from(hash);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Deliberately short list: blocks threats and the worst slurs, not normal swearing.
const BLOCKED = [
  /\bk+y+s+\b/i,
  /\bkill\s*(your|ur)\s*self\b/i,
  /\bgo\s+die\b/i,
  /\bi('?ll| will)\s+kill\s+you\b/i,
  /\bn[i1]gg(er|a)s?\b/i,
  /\bf[a4]gg?[o0]ts?\b/i,
  /\bretards?\b/i,
  /\btr[a4]nn(y|ies)\b/i,
];

export function isAbusive(...texts: (string | null | undefined)[]) {
  const joined = texts.filter(Boolean).join(" ");
  return BLOCKED.some((re) => re.test(joined));
}

export function json(data: unknown, status = 200, headers?: HeadersInit) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store", ...headers } });
}
