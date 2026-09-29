import { presetDesign } from "@/components/bouquet/static-bouquet";
import { OCCASIONS, OCCASION_BY_SLUG } from "@/lib/content/occasions";
import { OG_SIZE, bouquetOgImage } from "@/lib/og";

export const alt = "Digital bouquet for the occasion";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return OCCASIONS.map((o) => ({ slug: o.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const o = OCCASION_BY_SLUG.get((await params).slug)!;
  return bouquetOgImage({
    design: presetDesign(o.preset, 7),
    kicker: `${o.emoji} ${o.name}`,
    title: o.title.split(" – ")[0],
    subtitle: "Make one free, send it as a link",
  });
}
