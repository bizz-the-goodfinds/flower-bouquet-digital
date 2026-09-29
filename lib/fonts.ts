import { Bitcount_Single, Cutive_Mono, Geist, Geist_Mono, Handlee, Playfair_Display, Playwrite_CA_Guides, Sacramento } from "next/font/google";

/** Brand / headings */
export const playfair = Playfair_Display({
  subsets: ["latin"],
  // Headings only use regular weight; static 400 files are much smaller than the variable font.
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});
/** UI and body copy */
export const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
export const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

// Letter (note card) fonts; only loaded on routes that show cards. Playfair is shared with the site.
const handlee = Handlee({ subsets: ["latin"], weight: "400", variable: "--font-handlee", display: "swap", preload: false });
// next/font has no metrics for Playwrite or Bitcount, so skip the auto-sized fallback (avoids a build warning) and fall back to cursive.
const playwrite = Playwrite_CA_Guides({ weight: "400", variable: "--font-playwrite", display: "swap", adjustFontFallback: false, fallback: ["cursive"] });
const cutive = Cutive_Mono({ subsets: ["latin"], weight: "400", variable: "--font-cutive", display: "swap", preload: false });
const sacramento = Sacramento({ subsets: ["latin"], weight: "400", variable: "--font-sacramento", display: "swap", preload: false });
const bitcount = Bitcount_Single({ subsets: ["latin"], variable: "--font-bitcount", display: "swap", preload: false, adjustFontFallback: false, fallback: ["monospace"] });

export const cardFontVars = [handlee, playwrite, cutive, sacramento, bitcount].map((f) => f.variable).join(" ");
