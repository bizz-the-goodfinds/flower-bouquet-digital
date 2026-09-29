import { presetDesign } from "@/components/bouquet/static-bouquet";
import { GUIDES, GUIDE_BY_SLUG } from "@/lib/content/guides";
import { OG_SIZE, bouquetOgImage } from "@/lib/og";

export const alt = "Flower Bouquet Digital guide";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const g = GUIDE_BY_SLUG.get((await params).slug)!;
  return bouquetOgImage({
    design: presetDesign(
      { stems: ["sunflower", "pink-rose", "daisy", "pink-tulip", "lavender", "babys-breath", "eucalyptus", "ruscus"], wrap: "wide", paper: "blush", ribbon: "ivory", background: "butter" },
      3,
    ),
    kicker: "guide",
    title: g.title.split(/[:(]/)[0].trim(),
  });
}
