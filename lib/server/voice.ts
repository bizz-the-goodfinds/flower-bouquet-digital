import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const VOICE_BUCKET = "voice-notes";
/** How long a playback link works. The bouquet page is rendered per request, so each visit gets a fresh one. */
const PLAY_SECONDS = 60 * 60;

const secret = () => process.env.VOICE_SIGNING_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "dev-voice-secret";

/** Proves a storage path came from our upload route (clients can't attach someone else's recording). */
export const signVoicePath = (path: string) => createHmac("sha256", secret()).update(`voice:${path}`).digest("base64url").slice(0, 32);
export function voicePathValid(path: string, sig: string) {
  const a = Buffer.from(signVoicePath(path));
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const newPendingPath = (ext: string) => `pending/${randomUUID()}.${ext}`;

export async function uploadVoice(path: string, body: ArrayBuffer, contentType: string) {
  const { error } = await supabaseAdmin().storage.from(VOICE_BUCKET).upload(path, body, { contentType, upsert: false });
  if (error) throw error;
}

export async function voicePlayUrl(path: string | null) {
  if (!path) return null;
  const { data } = await supabaseAdmin().storage.from(VOICE_BUCKET).createSignedUrl(path, PLAY_SECONDS);
  return data?.signedUrl ?? null;
}

/** Playback links for many recordings in one request, keyed by path. */
export async function voicePlayUrls(paths: string[]) {
  if (!paths.length) return new Map<string, string>();
  const { data } = await supabaseAdmin().storage.from(VOICE_BUCKET).createSignedUrls(paths, PLAY_SECONDS);
  return new Map((data ?? []).filter((d) => d.signedUrl && d.path).map((d) => [d.path!, d.signedUrl]));
}

export async function removeVoice(path: string | null | undefined) {
  if (!path) return;
  await supabaseAdmin().storage.from(VOICE_BUCKET).remove([path]).catch(() => {});
}

/**
 * Attaches a recording to a bouquet: a fresh upload moves from pending/ to b/<bouquet id>.<ext>;
 * the bouquet's current recording is kept as is. Returns the final path, or null if the draft's recording can't be used.
 */
export async function claimVoice(bouquetId: string, draft: { path: string; sig: string }, current: string | null): Promise<string | null> {
  if (!voicePathValid(draft.path, draft.sig)) return null;
  if (draft.path === current) return current;
  if (!draft.path.startsWith("pending/")) return null;
  const ext = draft.path.split(".").pop();
  const final = `b/${bouquetId}.${ext}`;
  const store = supabaseAdmin().storage.from(VOICE_BUCKET);
  if (current) await store.remove([current]).catch(() => {});
  const { error } = await store.move(draft.path, final);
  if (error) {
    console.error("voice move failed", error);
    return null;
  }
  return final;
}
