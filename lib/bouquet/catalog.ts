import { heads, sprigs, type Paper } from "./art";

export type StemKind = "flower" | "filler" | "greenery";

export type StemDef = {
  slug: string;
  name: string;
  /** Flower family, links to /flowers/[family] */
  family: string;
  kind: StemKind;
  /** Visual radius of the head at scale 1, used for layout */
  size: number;
  /** One-line meaning shown in the builder tray */
  meaning: string;
  /** SVG markup of the head centered on the origin (greenery: sprig of a given length) */
  art: (len?: number) => string;
  thumbViewBox: string;
};

const T = {
  red: { base: "#D6334A", dark: "#A11F35", light: "#F0697C" },
  pink: { base: "#F4A6C0", dark: "#DC7A9C", light: "#FBD0DE" },
  white: { base: "#FFFBF3", dark: "#E9DFCF", light: "#FFFFFF" },
  yellow: { base: "#F7D466", dark: "#E3AE35", light: "#FBE7A4" },
  peach: { base: "#F8B89A", dark: "#E98E6C", light: "#FCD8C6" },
  purple: { base: "#B08BE0", dark: "#8A62C4", light: "#D4BEF5" },
  coral: { base: "#F28A6B", dark: "#D9664A", light: "#F9B7A1" },
  orange: { base: "#FF8A4C", dark: "#E4652A", light: "#FFB485" },
  blue: { base: "#9DB8EE", dark: "#7393D8", light: "#C9D8F7" },
  blush: { base: "#F7C3CF", dark: "#E79AAE", light: "#FCE3E9" },
};

const HEAD_BOX = "-92 -96 184 184";

const flower = (
  slug: string,
  name: string,
  family: string,
  size: number,
  meaning: string,
  art: () => string,
  kind: StemKind = "flower",
  thumbViewBox = HEAD_BOX,
): StemDef => ({ slug, name, family, kind, size, meaning, art, thumbViewBox });

const green = (slug: string, name: string, meaning: string, art: (len: number) => string): StemDef => ({
  slug,
  name,
  family: "eucalyptus",
  kind: "greenery",
  size: 40,
  meaning,
  art: (len = 420) => art(len),
  thumbViewBox: "-70 -430 140 250",
});

export const STEMS: StemDef[] = [
  flower("red-rose", "Red rose", "rose", 66, "Deep love & romance", () => heads.rose(T.red)),
  flower("pink-rose", "Pink rose", "rose", 66, "Gratitude & admiration", () => heads.rose(T.pink)),
  flower("white-rose", "White rose", "rose", 66, "New beginnings", () => heads.rose(T.white)),
  flower("yellow-rose", "Yellow rose", "rose", 66, "Friendship & joy", () => heads.rose(T.yellow)),
  flower("peach-rose", "Peach rose", "rose", 66, "Sincerity & thanks", () => heads.rose(T.peach)),
  flower("pink-tulip", "Pink tulip", "tulip", 58, "Care & happiness", () => heads.tulip(T.pink), "flower", "-70 -100 140 140"),
  flower("red-tulip", "Red tulip", "tulip", 58, "Declared love", () => heads.tulip(T.red), "flower", "-70 -100 140 140"),
  flower("yellow-tulip", "Yellow tulip", "tulip", 58, "Sunshine & cheer", () => heads.tulip(T.yellow), "flower", "-70 -100 140 140"),
  flower("purple-tulip", "Purple tulip", "tulip", 58, "Royalty & admiration", () => heads.tulip(T.purple), "flower", "-70 -100 140 140"),
  flower("sunflower", "Sunflower", "sunflower", 80, "Loyalty & warmth", () => heads.sunflower()),
  flower("daisy", "Daisy", "daisy", 58, "Innocence & fresh starts", () => heads.daisy("#FFFDF7", "#F4C542", "#B7832B")),
  flower("gerbera", "Gerbera", "gerbera", 66, "Cheerfulness", () => heads.gerbera(T.orange)),
  flower("pink-gerbera", "Pink gerbera", "gerbera", 66, "Admiration & fun", () => heads.gerbera(T.pink)),
  flower("peony", "Peony", "peony", 76, "Romance & good fortune", () => heads.peony(T.blush)),
  flower("coral-peony", "Coral peony", "peony", 76, "Prosperity & bold love", () => heads.peony(T.coral)),
  flower("white-lily", "White lily", "lily", 84, "Purity & remembrance", () => heads.lily("#FFFDF7", "#EFE6D6", "#C9A27A")),
  flower("stargazer-lily", "Stargazer lily", "lily", 84, "Ambition & abundance", () => heads.lily("#F4A6C0", "#DC7A9C", "#A11F35")),
  flower("cosmos", "Cosmos", "cosmos", 62, "Order & peace", () => heads.cosmos("#F29BBF")),
  flower("white-cosmos", "White cosmos", "cosmos", 62, "Harmony", () => heads.cosmos("#FFFDF7")),
  flower("pink-carnation", "Pink carnation", "carnation", 62, "A mother's love", () => heads.carnation(T.pink)),
  flower("red-carnation", "Red carnation", "carnation", 62, "Deep admiration", () => heads.carnation(T.red)),
  flower("anemone", "Anemone", "anemone", 60, "Anticipation", () => heads.anemone()),
  flower("ranunculus", "Ranunculus", "ranunculus", 56, "You're charming", () => heads.ranunculus(T.coral)),
  flower("peach-ranunculus", "Peach ranunculus", "ranunculus", 56, "Radiant charm", () => heads.ranunculus(T.peach)),
  flower("poppy", "Poppy", "poppy", 66, "Remembrance & dreams", () => heads.poppy()),
  flower("hydrangea", "Hydrangea", "hydrangea", 72, "Heartfelt gratitude", () => heads.hydrangea(T.blue)),
  flower("pink-hydrangea", "Pink hydrangea", "hydrangea", 72, "Sincere emotion", () => heads.hydrangea(T.pink)),
  flower("lavender", "Lavender", "lavender", 40, "Calm & devotion", () => heads.lavender(), "filler", "-40 -168 80 176"),
  flower("babys-breath", "Baby's breath", "babys-breath", 50, "Everlasting love", () => heads.babysBreath(), "filler", "-75 -95 150 100"),
  flower("forget-me-not", "Forget-me-not", "forget-me-not", 46, "Remember me", () => heads.forgetMeNot(), "filler", "-60 -70 120 80"),
  flower("cherry-blossom", "Cherry blossom", "cherry-blossom", 50, "Life's beauty", () => heads.cherryBlossom(), "filler", "-60 -90 110 100"),
  green("eucalyptus", "Eucalyptus", "Protection & healing", sprigs.eucalyptus),
  green("fern", "Fern", "Sincerity & magic", sprigs.fern),
  green("ruscus", "Ruscus", "Lasting bonds", sprigs.ruscus),
  green("pampas", "Pampas grass", "Positive vibes", sprigs.pampas),
];

export const STEM_BY_SLUG = new Map(STEMS.map((s) => [s.slug, s]));

export const PAPERS: Record<string, Paper & { name: string }> = {
  kraft: { name: "Kraft", paper: "#D2AE85", shade: "#A9825C", edge: "#8A6644" },
  blush: { name: "Blush tissue", paper: "#F7C6D3", shade: "#E59BB0", edge: "#C9738C" },
  cream: { name: "Cream", paper: "#F5EDDF", shade: "#DCCFB8", edge: "#B8A88C" },
  news: { name: "Newsprint", paper: "#EDE8DF", shade: "#CFC7B9", edge: "#8C857A", print: "news" },
  noir: { name: "Noir", paper: "#2E2B33", shade: "#18161B", edge: "#6E6878" },
  sage: { name: "Sage", paper: "#C3D5B8", shade: "#98B38A", edge: "#6F8C63" },
  lilac: { name: "Lilac dots", paper: "#DDD0F7", shade: "#B9A5E8", edge: "#FFFFFF", print: "dots" },
  butter: { name: "Butter", paper: "#F9E7A6", shade: "#E7C96A", edge: "#B89A3C" },
  sky: { name: "Sky", paper: "#C9DDF4", shade: "#9DBDE6", edge: "#6F93C4" },
  coral: { name: "Coral", paper: "#F7B7A3", shade: "#E88C73", edge: "#C4644C" },
  ivory: { name: "Ivory", paper: "#FFFBF0", shade: "#EDE3CF", edge: "#C9B99A" },
  cherry: { name: "Cherry dots", paper: "#E8553E", shade: "#B83A28", edge: "#FFE3DC", print: "dots" },
};

export const RIBBONS: Record<string, { name: string; color: string; dark: string }> = {
  cherry: { name: "Cherry", color: "#E8553E", dark: "#B83A28" },
  pink: { name: "Pink", color: "#F28DB2", dark: "#C9628A" },
  ivory: { name: "Ivory", color: "#FFF8EA", dark: "#D9CBB0" },
  sage: { name: "Sage", color: "#9DB59A", dark: "#6F8C63" },
  lilac: { name: "Lilac", color: "#B9A5E8", dark: "#8A73C4" },
  ink: { name: "Ink", color: "#2E2B33", dark: "#111014" },
  gold: { name: "Gold", color: "#E8C15A", dark: "#B8912E" },
};

export const BACKGROUNDS: Record<string, { name: string; fill: string; dark?: boolean }> = {
  cream: { name: "Cream", fill: "#FBF6EE" },
  blush: { name: "Blush", fill: "#FBE3EA" },
  sage: { name: "Sage", fill: "#E3ECDD" },
  butter: { name: "Butter", fill: "#FBF0C9" },
  lilac: { name: "Lilac", fill: "#ECE6FB" },
  sky: { name: "Sky", fill: "#E0ECF7" },
  night: { name: "Night", fill: "#1E1B2E", dark: true },
};

export const DEFAULTS = { wrapper: "cone", paper: "kraft", ribbon: "cherry", background: "cream" };
