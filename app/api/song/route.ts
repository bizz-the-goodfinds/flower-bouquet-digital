import { normalizeSong, parseSongUrl } from "@/lib/bouquet/media";
import { json } from "@/lib/server/security";
import { resolveSong } from "@/lib/server/song";

/** GET ?url=<song link>: title, artist and thumbnail for the Write step's song card. */
export async function GET(req: Request) {
  const url = new URL(req.url).searchParams.get("url") ?? "";
  if (url.length > 500 || !parseSongUrl(url)) return json({ error: "Paste a Spotify, YouTube or Apple Music link." }, 422);
  const song = normalizeSong(await resolveSong(url));
  if (!song) return json({ error: "Couldn't find that song. Check the link and try again." }, 404);
  return json({ song });
}
