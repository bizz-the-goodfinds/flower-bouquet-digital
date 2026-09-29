import { z } from "zod";
import { INK, ribbonMarkup, wrapperBack, wrapperFront } from "./art";
import { BACKGROUNDS, DEFAULTS, RIBBONS, STEM_BY_SLUG, WRAPPERS } from "./catalog";

export const CANVAS = { w: 1000, h: 1250 } as const;
export const TIE = { x: 500, y: 930 } as const;
export const MAX_STEMS = 18;
/** Art is drawn small; heads are scaled up by this on the canvas. */
export const HEAD_SCALE = 1.5;

export const itemSchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]{1,12}$/),
  f: z.string().refine((s) => STEM_BY_SLUG.has(s), "Unknown flower"),
  x: z.number().min(60).max(940),
  y: z.number().min(60).max(900),
  r: z.number().min(-180).max(180),
  s: z.number().min(0.5).max(1.8),
  fx: z.boolean().optional(),
});

export const designSchema = z.object({
  items: z.array(itemSchema).min(1).max(MAX_STEMS),
  wrapper: z.string().refine((s) => s in WRAPPERS),
  ribbon: z.string().refine((s) => s in RIBBONS),
  background: z.string().refine((s) => s in BACKGROUNDS),
});

export type Item = z.infer<typeof itemSchema>;
export type Design = z.infer<typeof designSchema>;

const r1 = (n: number) => Math.round(n * 10) / 10;

export function isGreenery(item: Pick<Item, "f">) {
  return STEM_BY_SLUG.get(item.f)?.kind === "greenery";
}

/** Curved stem from the head down through the tie point, ending hidden inside the wrapper. */
export function stemPath(item: Item) {
  const dx = TIE.x - item.x;
  const dy = TIE.y - item.y;
  const len = Math.hypot(dx, dy) || 1;
  const cx = (item.x + TIE.x) / 2 - (dy / len) * (item.x - TIE.x) * 0.08;
  const cy = (item.y + TIE.y) / 2 + (dx / len) * (item.x - TIE.x) * 0.08;
  const ex = TIE.x + (dx / len) * 170;
  const ey = TIE.y + (dy / len) * 170;
  return `M${r1(item.x)} ${r1(item.y)} Q${r1(cx)} ${r1(cy)} ${r1(TIE.x)} ${r1(TIE.y)} L${r1(ex)} ${r1(ey)}`;
}

export function headTransform(item: Item) {
  return `translate(${r1(item.x)} ${r1(item.y)}) rotate(${r1(item.r)}) scale(${r1((item.fx ? -item.s : item.s) * HEAD_SCALE * 100) / 100} ${r1(item.s * HEAD_SCALE * 100) / 100})`;
}

/** Greenery grows from the tie point to the item position. */
export function sprigGeometry(item: Item) {
  const dx = item.x - TIE.x;
  const dy = item.y - TIE.y;
  const len = Math.max(160, Math.hypot(dx, dy));
  const angle = (Math.atan2(dx, -dy) * 180) / Math.PI;
  return { len, transform: `translate(${TIE.x} ${TIE.y}) rotate(${r1(angle)}) scale(${r1(item.s)} 1)` };
}

const artCache = new Map<string, string>();
export function stemArt(slug: string, len?: number) {
  const key = len ? `${slug}:${Math.round(len / 10)}` : slug;
  let out = artCache.get(key);
  if (!out) {
    out = STEM_BY_SLUG.get(slug)?.art(len ? Math.round(len / 10) * 10 : undefined) ?? "";
    artCache.set(key, out);
  }
  return out;
}

export const stemStroke = (d: string) =>
  `<path d="${d}" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>` +
  `<path d="${d}" fill="none" stroke="#6E9C63" stroke-width="5.5" stroke-linecap="round"/>`;

export function backgroundMarkup(key: string) {
  const bg = BACKGROUNDS[key] ?? BACKGROUNDS[DEFAULTS.background];
  let out = `<rect width="${CANVAS.w}" height="${CANVAS.h}" fill="${bg.fill}"/>`;
  if (bg.dark) {
    const stars: [number, number, number][] = [[120, 140, 3], [860, 110, 2.5], [760, 260, 2], [90, 420, 2], [920, 520, 3], [220, 70, 2], [620, 60, 2.5]];
    out += stars.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#FFF3C4" opacity=".8"/>`).join("");
  }
  return out;
}

/** Full bouquet as a standalone SVG string (for OG images and PNG export). */
export function bouquetSvg(d: Design, opts: { background?: boolean; width?: number } = {}) {
  const paper = WRAPPERS[d.wrapper] ?? WRAPPERS[DEFAULTS.wrapper];
  const ribbon = RIBBONS[d.ribbon] ?? RIBBONS[DEFAULTS.ribbon];
  const greens = d.items.filter(isGreenery);
  const blooms = d.items.filter((i) => !isGreenery(i));
  const body =
    (opts.background === false ? "" : backgroundMarkup(d.background)) +
    wrapperBack(paper) +
    greens.map((g) => {
      const { len, transform } = sprigGeometry(g);
      return `<g transform="${transform}">${stemArt(g.f, len)}</g>`;
    }).join("") +
    blooms.map((b) => stemStroke(stemPath(b))).join("") +
    blooms.map((b) => `<g transform="${headTransform(b)}">${stemArt(b.f)}</g>`).join("") +
    wrapperFront(paper) +
    ribbonMarkup(ribbon.color, ribbon.dark);
  const w = opts.width ?? CANVAS.w;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS.w} ${CANVAS.h}" width="${w}" height="${Math.round((w * CANVAS.h) / CANVAS.w)}">${body}</svg>`;
}

// ---------- Layout ----------

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let idCounter = 0;
export const newId = () => `${Date.now().toString(36).slice(-5)}${(idCounter++ % 1296).toString(36)}`;

/** Arrange stems into a natural dome: big blooms in the middle, fillers at the edges, greenery fanned behind. */
export function arrange(slugs: string[], seed = Date.now()): Item[] {
  const rand = mulberry32(seed);
  const jitter = (n: number) => (rand() - 0.5) * 2 * n;
  const greens = slugs.filter((s) => STEM_BY_SLUG.get(s)?.kind === "greenery");
  const blooms = slugs
    .filter((s) => STEM_BY_SLUG.get(s)?.kind !== "greenery")
    .sort((a, b) => {
      const A = STEM_BY_SLUG.get(a)!;
      const B = STEM_BY_SLUG.get(b)!;
      const ka = A.kind === "filler" ? 1 : 0;
      const kb = B.kind === "filler" ? 1 : 0;
      return ka - kb || B.size - A.size || rand() - 0.5;
    });

  const items: Item[] = [];
  greens.forEach((f, i) => {
    const n = greens.length;
    const t = n === 1 ? 0.5 : i / (n - 1);
    const angle = (-116 + t * 52 + jitter(4)) * (Math.PI / 180);
    const dist = 580 + jitter(30);
    items.push({ id: newId(), f, x: clampX(TIE.x + Math.cos(angle) * dist), y: clampY(TIE.y + Math.sin(angle) * dist), r: 0, s: 1 });
  });

  const n = blooms.length;
  const spread = Math.min(1, 0.5 + n * 0.05);
  const rx = 290 * spread;
  const ry = 175 * spread;
  const cx = 500;
  const cy = 540;
  const placed = blooms.map((f, i) => {
    const rr = n === 1 ? 0 : Math.sqrt((i + 0.5) / n);
    const a = i * 2.39996 + seed * 0.001;
    const def = STEM_BY_SLUG.get(f)!;
    return {
      id: newId(),
      f,
      x: clampX(cx + rx * rr * Math.cos(a) + jitter(10)),
      y: clampY(cy + ry * rr * Math.sin(a) * 0.9 + jitter(10) - (def.kind === "filler" ? 70 : 0)),
      r: Math.round(jitter(def.slug.includes("tulip") || def.kind === "filler" ? 25 : 18)),
      s: Math.round((0.95 + jitter(0.08)) * 100) / 100,
      fx: rand() > 0.5,
    };
  });
  // Lower heads sit in front, like a real bouquet seen from the front.
  placed.sort((a, b) => a.y - b.y);
  return [...items, ...placed];
}

const clampX = (x: number) => Math.round(Math.min(900, Math.max(100, x)));
const clampY = (y: number) => Math.round(Math.min(860, Math.max(90, y)));

/** Drop position for a newly added stem: near the dome, not on top of the last one. */
export function spawnPosition(existing: Item[], slug: string, rand = Math.random): Item {
  const def = STEM_BY_SLUG.get(slug)!;
  if (def.kind === "greenery") {
    const angle = (-116 + rand() * 52) * (Math.PI / 180);
    return { id: newId(), f: slug, x: clampX(TIE.x + Math.cos(angle) * 600), y: clampY(TIE.y + Math.sin(angle) * 600), r: 0, s: 1 };
  }
  let best = { x: 500, y: 540, score: -1 };
  for (let k = 0; k < 24; k++) {
    const a = rand() * Math.PI * 2;
    const rr = Math.sqrt(rand());
    const x = 500 + Math.cos(a) * 270 * rr;
    const y = 530 + Math.sin(a) * 160 * rr;
    const nearest = existing.reduce((m, it) => Math.min(m, Math.hypot(it.x - x, it.y - y)), 999);
    const score = nearest - rr * 40;
    if (score > best.score) best = { x, y, score };
  }
  return { id: newId(), f: slug, x: clampX(best.x), y: clampY(best.y), r: Math.round((rand() - 0.5) * 30), s: 1, fx: rand() > 0.5 };
}
