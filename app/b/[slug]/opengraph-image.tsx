import { OG_SIZE, bouquetOgImage } from "@/lib/og";
import { getBouquet } from "@/lib/server/bouquets";

export const alt = "A digital flower bouquet";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const state = await getBouquet(slug);
  if (state.status === "ok") {
    const { to, from, design } = state.bouquet;
    return bouquetOgImage({
      design,
      kicker: from ? `from ${from}` : "you've got flowers",
      title: to ? `A bouquet for ${to}` : "A bouquet for you",
      subtitle: "Tap to unwrap 💐",
    });
  }
  if (state.status === "locked") {
    return bouquetOgImage({
      design: null,
      kicker: state.from ? `from ${state.from}` : "something is blooming",
      title: state.to ? `Something is blooming for ${state.to}` : "Something is blooming",
      subtitle: "Opens soon ✨",
    });
  }
  return bouquetOgImage({ design: null, kicker: "flower bouquet digital", title: "Digital bouquets that never wilt" });
}
