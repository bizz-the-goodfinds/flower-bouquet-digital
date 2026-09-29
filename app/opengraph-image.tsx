import { presetDesign } from "@/components/bouquet/static-bouquet";
import { OG_SIZE, bouquetOgImage } from "@/lib/og";

export const alt = "Petalpost – free digital flower bouquets that never wilt";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return bouquetOgImage({
    design: presetDesign(
      { stems: ["peony", "red-rose", "pink-rose", "pink-tulip", "ranunculus", "daisy", "babys-breath", "lavender", "eucalyptus", "fern", "white-rose"], wrapper: "kraft", ribbon: "cherry", background: "cream" },
      20260929,
    ),
    kicker: "free · no signup · no app",
    title: "Send flowers that never wilt",
    subtitle: "Make a digital bouquet in a minute",
  });
}
