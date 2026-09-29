import type { Metadata } from "next";
import { Garden } from "@/components/garden/garden";
import { cardFontVars } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "My bouquets",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

export default function GardenPage() {
  return (
    // Card fonts: downloads (video/GIF) draw the note in the sender's handwriting.
    <div className={`mx-auto max-w-6xl px-4 py-10 ${cardFontVars}`} data-card-fonts>
      <h1 className="font-display text-5xl sm:text-6xl">My bouquets</h1>
      <p className="mt-3 max-w-xl text-ink/75">Bouquets you&rsquo;ve sent and received, grouped into threads when someone sends one back. Preview yours without counting an open, and chat with each person who reacts.</p>
      <Garden />
    </div>
  );
}
