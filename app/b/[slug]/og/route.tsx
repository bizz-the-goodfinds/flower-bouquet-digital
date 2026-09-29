import { bouquetOgImage, envelopeOgImage } from "@/lib/og";
import { getBouquet, getLink, teaser } from "@/lib/server/bouquets";

/** Link preview image: the sender's sealed envelope with a teaser (the bouquet stays a surprise). `?r=` personalises it for a personal link. */
export async function GET(req: Request, ctx: RouteContext<"/b/[slug]/og">) {
  const { slug } = await ctx.params;
  const state = await getBouquet(slug);
  if (state.status === "missing") return bouquetOgImage({ design: null, kicker: "flower bouquet digital", title: "Digital bouquets that never wilt" });
  const link = await getLink(state.meta.id, new URL(req.url).searchParams.get("r") ?? undefined);
  const locked = state.status === "locked";
  const from = locked ? state.from : state.bouquet.from;
  const to = link?.name ?? (locked ? state.to : state.bouquet.to);
  const look = locked ? state.envelope : state.bouquet.style.envelope;
  return envelopeOgImage({ look, from, ...teaser({ to, from, locked }).og });
}
