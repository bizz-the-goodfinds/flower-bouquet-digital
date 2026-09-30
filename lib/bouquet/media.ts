import { z } from "zod";

/** Song and voice note attachments. Shared by the builder, the API and the recipient page. */

export const SONG_PROVIDERS = {
  spotify: { name: "Spotify", color: "#1DB954" },
  youtube: { name: "YouTube", color: "#FF0033" },
  apple: { name: "Apple Music", color: "#FA2D48" },
} as const;
export type SongProvider = keyof typeof SONG_PROVIDERS;

/** A parsed song link: enough to build the embed without trusting anything else from the client. */
export type SongRef = { provider: SongProvider; url: string; embed: string };

export type Song = SongRef & { title: string; artist: string; thumb: string | null };

export const MAX_VOICE_SECONDS = 60;
export const MAX_VOICE_BYTES = 2 * 1024 * 1024;

/** A voice note in a draft: its storage path, a server signature proving we stored it, and a playable URL. */
export type VoiceDraft = { path: string; sig: string; seconds: number; url: string | null };
/** A voice note on a sent bouquet: a short-lived signed URL. */
export type Voice = { url: string; seconds: number };

const YT_ID = /^[A-Za-z0-9_-]{11}$/;

/** Recognises Spotify, YouTube and Apple Music links. Returns null for anything else. */
export function parseSongUrl(raw: string): SongRef | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.replace(/^www\./, "").replace(/^m\./, "");
  const parts = u.pathname.split("/").filter(Boolean);

  if (host === "open.spotify.com") {
    // Optional locale prefix: /intl-de/track/<id>
    const p = parts[0]?.startsWith("intl-") ? parts.slice(1) : parts;
    const [type, id] = p;
    if (!["track", "album", "playlist", "episode"].includes(type) || !/^[A-Za-z0-9]{10,32}$/.test(id ?? "")) return null;
    return { provider: "spotify", url: `https://open.spotify.com/${type}/${id}`, embed: `https://open.spotify.com/embed/${type}/${id}` };
  }

  if (host === "youtube.com" || host === "music.youtube.com" || host === "youtu.be") {
    let id: string | null = null;
    if (host === "youtu.be") id = parts[0] ?? null;
    else if (parts[0] === "watch") id = u.searchParams.get("v");
    else if (parts[0] === "shorts" || parts[0] === "embed" || parts[0] === "live") id = parts[1] ?? null;
    if (!id || !YT_ID.test(id)) return null;
    return { provider: "youtube", url: `https://www.youtube.com/watch?v=${id}`, embed: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0` };
  }

  if (host === "music.apple.com") {
    // /us/album/<name>/<id>?i=<track id>, /us/song/<name>/<id>, /us/playlist/<name>/pl.<id>
    const [country, type] = parts;
    if (!/^[a-z]{2}$/.test(country ?? "") || !["album", "song", "playlist"].includes(type ?? "")) return null;
    if (!parts.slice(2).every((s) => /^[\w.%-]{1,200}$/.test(s)) || parts.length < 3) return null;
    const i = u.searchParams.get("i");
    const query = i && /^\d{1,20}$/.test(i) ? `?i=${i}` : "";
    const path = `/${parts.join("/")}${query}`;
    return { provider: "apple", url: `https://music.apple.com${path}`, embed: `https://embed.music.apple.com${path}` };
  }
  return null;
}

/** Player height per provider (px). */
export const EMBED_HEIGHT: Record<SongProvider, number> = { spotify: 152, youtube: 0, apple: 175 };

const clip = (s: unknown, n: number) => (typeof s === "string" ? s.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, n) : "");

/** Validates stored song JSON (old rows, or anything unexpected, become null). */
export function normalizeSong(v: unknown): Song | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const ref = typeof o.url === "string" ? parseSongUrl(o.url) : null;
  if (!ref) return null;
  const thumb = typeof o.thumb === "string" && /^https:\/\//.test(o.thumb) ? o.thumb.slice(0, 500) : null;
  return { ...ref, title: clip(o.title, 120) || "A song for you", artist: clip(o.artist, 120), thumb };
}

export const songInputSchema = z.object({ url: z.string().url().max(500) }).nullable().optional();

export const voiceInputSchema = z
  .object({
    path: z.string().regex(/^(pending|b)\/[0-9a-f-]{36}\.(webm|m4a|ogg|mp3)$/),
    sig: z.string().regex(/^[A-Za-z0-9_-]{20,64}$/),
    seconds: z.number().int().min(1).max(MAX_VOICE_SECONDS),
  })
  .nullable()
  .optional();

/** Maps a recorder MIME type to the stored file extension and content type. */
export function voiceFormat(mime: string): { ext: "webm" | "m4a" | "ogg" | "mp3"; type: string } | null {
  const m = mime.split(";")[0].trim().toLowerCase();
  if (m === "audio/webm" || m === "video/webm") return { ext: "webm", type: "audio/webm" };
  if (m === "audio/mp4" || m === "video/mp4" || m === "audio/x-m4a" || m === "audio/aac") return { ext: "m4a", type: "audio/mp4" };
  if (m === "audio/ogg") return { ext: "ogg", type: "audio/ogg" };
  if (m === "audio/mpeg") return { ext: "mp3", type: "audio/mpeg" };
  return null;
}

export const fmtSeconds = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s) % 60).padStart(2, "0")}`;
