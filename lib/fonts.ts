import { Caveat, Dancing_Script, Geist, Geist_Mono, Instrument_Serif, Reenie_Beanie } from "next/font/google";

export const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});
export const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
export const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

// Handwriting fonts for the note card; only loaded on routes that show cards.
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat", display: "swap", preload: false });
const reenie = Reenie_Beanie({ subsets: ["latin"], weight: "400", variable: "--font-reenie", display: "swap", preload: false });
const dancing = Dancing_Script({ subsets: ["latin"], variable: "--font-dancing", display: "swap", preload: false });

export const cardFontVars = `${caveat.variable} ${reenie.variable} ${dancing.variable}`;
