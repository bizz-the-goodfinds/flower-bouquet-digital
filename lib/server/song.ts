import "server-only";
import { parseSongUrl, type Song, type SongRef } from "@/lib/bouquet/media";

const UA = "Mozilla/5.0 (compatible; FlowerBouquetDigital/1.0; +https://flower-bouquet-digital.vercel.app)";
const TIMEOUT = 4000;

async function getJson(url: string) {
  const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(TIMEOUT), next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`oEmbed ${res.status}`);
  return (await res.json()) as Record<string, unknown>;
}

/** Open Graph tags from a public page (for details oEmbed leaves out). Best effort. */
async function getOg(url: string) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(TIMEOUT), next: { revalidate: 86400 } });
    if (!res.ok) return {};
    const html = (await res.text()).slice(0, 300_000);
    const og: Record<string, string> = {};
    for (const m of html.matchAll(/<meta\s+property="og:(title|description|image)"\s+content="([^"]*)"/g)) og[m[1]] ??= decode(m[2]);
    return og;
  } catch {
    return {};
  }
}

const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

const str = (v: unknown) => (typeof v === "string" ? v : "");
const https = (v: unknown) => (typeof v === "string" && v.startsWith("https://") ? v : null);

/**
 * Looks up title, artist and thumbnail for a song link through each service's public oEmbed endpoint
 * (no API keys). Returns null when the link doesn't point at something real.
 */
export async function resolveSong(raw: string): Promise<Song | null> {
  const ref = parseSongUrl(raw);
  if (!ref) return null;
  try {
    return await lookup(ref);
  } catch {
    return null;
  }
}

async function lookup(ref: SongRef): Promise<Song | null> {
  const enc = encodeURIComponent(ref.url);
  if (ref.provider === "youtube") {
    const o = await getJson(`https://www.youtube.com/oembed?format=json&url=${enc}`);
    return { ...ref, title: str(o.title), artist: str(o.author_name).replace(/ - Topic$/, ""), thumb: https(o.thumbnail_url) };
  }
  if (ref.provider === "spotify") {
    const [o, og] = await Promise.all([getJson(`https://open.spotify.com/oembed?url=${enc}`), getOg(ref.url)]);
    // "Artist · Album · Song · 1987" for tracks.
    const artist = ref.url.includes("/track/") ? (og.description?.split(" · ")[0] ?? "") : "";
    return { ...ref, title: str(o.title), artist, thumb: https(o.thumbnail_url) ?? https(og.image) };
  }
  // Apple Music's oEmbed titles songs by their album, so read the page's Open Graph tags instead.
  const og = await getOg(ref.url);
  if (!og.title) return null;
  const m = og.title.replace(/ on Apple\s?Music$/i, "").match(/^(.*) by (.*)$/);
  return { ...ref, title: m ? m[1] : og.title.replace(/ on Apple\s?Music$/i, ""), artist: m ? m[2] : "", thumb: https(og.image) };
}
