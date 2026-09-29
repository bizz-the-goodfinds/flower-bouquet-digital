import { presetDesign } from "@/components/bouquet/static-bouquet";
import { FAMILY_BY_SLUG, FLOWER_FAMILIES } from "@/lib/content/flowers";
import { OG_SIZE, bouquetOgImage } from "@/lib/og";

export const alt = "Flower meaning";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return FLOWER_FAMILIES.map((f) => ({ slug: f.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const f = FAMILY_BY_SLUG.get((await params).slug)!;
  const stems = [...f.stems, ...f.stems, ...f.stems].slice(0, 7).concat(["babys-breath", "eucalyptus", "fern"]);
  return bouquetOgImage({
    design: presetDesign({ stems, wrap: "cone", paper: "kraft", ribbon: "cherry", background: "cream" }, 11),
    kicker: "flower meanings",
    title: f.title.split(/[–:]/)[0].trim(),
    subtitle: f.answer.split(". ")[0].slice(0, 90),
  });
}
