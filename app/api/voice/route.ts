import { MAX_VOICE_BYTES, voiceFormat } from "@/lib/bouquet/media";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ipHash, json } from "@/lib/server/security";
import { newPendingPath, signVoicePath, uploadVoice, voicePlayUrl } from "@/lib/server/voice";

const LIMIT_HOUR = 20;

/**
 * Stores a voice note recorded on the Write step (raw audio body, up to 2 MB) before the bouquet exists.
 * Returns its pending path and a signature the create/edit call hands back to attach it.
 */
export async function POST(req: Request) {
  const format = voiceFormat(req.headers.get("content-type") ?? "");
  if (!format) return json({ error: "That recording format isn't supported." }, 415);
  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > MAX_VOICE_BYTES) return json({ error: "That recording is too long. Keep it under a minute." }, 413);

  const db = supabaseAdmin();
  const hash = ipHash(req);
  const { count } = await db
    .from("rate_events")
    .select("id", { count: "exact", head: true })
    .eq("kind", "voice_upload")
    .eq("ip_hash", hash)
    .gte("created_at", new Date(Date.now() - 3600 * 1000).toISOString());
  if ((count ?? 0) >= LIMIT_HOUR) return json({ error: "That's a lot of recordings. Try again in a bit." }, 429);

  const body = await req.arrayBuffer();
  if (!body.byteLength) return json({ error: "The recording was empty. Try again." }, 422);
  if (body.byteLength > MAX_VOICE_BYTES) return json({ error: "That recording is too long. Keep it under a minute." }, 413);

  const path = newPendingPath(format.ext);
  try {
    await Promise.all([uploadVoice(path, body, format.type), db.from("rate_events").insert({ kind: "voice_upload", ip_hash: hash })]);
  } catch (err) {
    console.error("voice upload failed", err);
    return json({ error: "Couldn't save the recording. Try again." }, 500);
  }
  return json({ path, sig: signVoicePath(path), url: await voicePlayUrl(path) }, 201);
}
