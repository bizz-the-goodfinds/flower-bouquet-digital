import { z } from "zod";

/** Envelope looks for the "tap to unwrap" moment. */
export const ENVELOPE_COLORS = {
  classic: { name: "Classic", body: "#FFFDF8", flap: "#FBE3EA", line: "#1B1A17", seal: "#D6336C", sealInk: "#8C1D45", accent: "#F4A6C0" },
  kraft: { name: "Kraft", body: "#E6CFAE", flap: "#D2AE85", line: "#3B2A1A", seal: "#B83A28", sealInk: "#7A2216", accent: "#F7B7A3" },
  sage: { name: "Sage", body: "#F1F6EE", flap: "#C3D5B8", line: "#1F2B1A", seal: "#4F7A47", sealInk: "#2E4A28", accent: "#DDEBD5" },
  lilac: { name: "Lilac", body: "#F6F2FE", flap: "#D9CCF5", line: "#241B45", seal: "#7B61C9", sealInk: "#4B3894", accent: "#EFE8FD" },
  butter: { name: "Butter", body: "#FFF9E3", flap: "#F9E7A6", line: "#3A2E08", seal: "#E8553E", sealInk: "#9C2F1F", accent: "#FDF1C8" },
  sky: { name: "Sky", body: "#F3F8FE", flap: "#C9DDF4", line: "#14273F", seal: "#3E6FB5", sealInk: "#23457A", accent: "#E2EEFB" },
  blush: { name: "Blush", body: "#FDECF1", flap: "#F4A6C0", line: "#4A1A2B", seal: "#1B1A17", sealInk: "#000000", accent: "#FFF6F9" },
  night: { name: "Midnight", body: "#2B2840", flap: "#1E1B2E", line: "#0E0C18", seal: "#E8C15A", sealInk: "#8C6A12", accent: "#3A3656" },
} as const;

export const SEALS = {
  flower: "Flower",
  heart: "Heart",
  star: "Star",
  initial: "Initial",
  bow: "Bow",
} as const;

export const LINERS = {
  plain: "Plain",
  dots: "Dots",
  stripes: "Stripes",
  hearts: "Hearts",
} as const;

export type EnvelopeColor = keyof typeof ENVELOPE_COLORS;
export type Seal = keyof typeof SEALS;
export type Liner = keyof typeof LINERS;
export type EnvelopeLook = { color: EnvelopeColor; seal: Seal; liner: Liner };

export const DEFAULT_ENVELOPE: EnvelopeLook = { color: "classic", seal: "flower", liner: "plain" };

export const envelopeSchema = z
  .object({
    color: z.enum(Object.keys(ENVELOPE_COLORS) as [EnvelopeColor, ...EnvelopeColor[]]),
    seal: z.enum(Object.keys(SEALS) as [Seal, ...Seal[]]),
    liner: z.enum(Object.keys(LINERS) as [Liner, ...Liner[]]),
  })
  .default(DEFAULT_ENVELOPE);

export function normalizeEnvelope(v: unknown): EnvelopeLook {
  const r = envelopeSchema.safeParse(v ?? undefined);
  return r.success ? r.data : DEFAULT_ENVELOPE;
}

function linerPattern(look: EnvelopeLook, w: number, h: number) {
  const c = ENVELOPE_COLORS[look.color] ?? ENVELOPE_COLORS.classic;
  let out = "";
  if (look.liner === "dots")
    for (let y = 10; y < h; y += 16) for (let x = 12 + ((y / 16) % 2) * 8; x < w; x += 16) out += `<circle cx="${x}" cy="${y}" r="2.6" fill="${c.accent}"/>`;
  else if (look.liner === "stripes") for (let x = -h; x < w; x += 18) out += `<path d="M${x} ${h} L${x + h} 0" stroke="${c.accent}" stroke-width="7"/>`;
  else if (look.liner === "hearts")
    for (let y = 14; y < h; y += 26)
      for (let x = 14 + ((y / 26) % 2) * 13; x < w; x += 26)
        out += `<path d="M${x} ${y + 4} c-5 -4 -7 -8 -4 -11 c2 -2 4 -1 4 1 c0 -2 2 -3 4 -1 c3 3 1 7 -4 11z" fill="${c.accent}"/>`;
  return out;
}

/** Wax seal centred on the origin (radius 30). */
export function sealSvg(look: EnvelopeLook, initial = "", textless = false) {
  const c = ENVELOPE_COLORS[look.color] ?? ENVELOPE_COLORS.classic;
  const S = `stroke="${c.sealInk}" stroke-width="1.5"`;
  const inner =
    look.seal === "heart"
      ? `<path d="M0 10 C-14 0 -16 -10 -9 -14 C-4 -17 0 -13 0 -9 C0 -13 4 -17 9 -14 C16 -10 14 0 0 10Z" fill="${c.accent}" ${S}/>`
      : look.seal === "star"
        ? `<path d="M0 -14 L4 -4 L14 -4 L6 3 L9 13 L0 7 L-9 13 L-6 3 L-14 -4 L-4 -4Z" fill="${c.accent}" ${S}/>`
        : look.seal === "initial" && textless
          ? ""
          : look.seal === "initial"
          ? `<text x="0" y="8" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="24" fill="${c.accent}">${escapeXml((initial || "♥").slice(0, 1).toUpperCase())}</text>`
          : look.seal === "bow"
            ? `<path d="M0 0 L-14 -8 L-14 8Z M0 0 L14 -8 L14 8Z" fill="${c.accent}" ${S}/><circle r="4" fill="${c.accent}" ${S}/>`
            : [0, 72, 144, 216, 288]
                .map((a) => `<path d="M0 0 C6 -2 7 -11 0 -12 C-7 -11 -6 -2 0 0Z" transform="rotate(${a})" fill="${c.accent}" ${S}/>`)
                .join("") + `<circle r="4" fill="#F7DE8A"/>`;
  return `<circle r="30" fill="${c.seal}" stroke="${c.line}" stroke-width="3"/><circle r="24" fill="none" stroke="${c.sealInk}" stroke-width="1.5" opacity=".6"/>${inner}`;
}

/** Small square swatch of a liner pattern on the flap colour (viewBox 0 0 60 60). */
export function linerSwatchSvg(look: EnvelopeLook) {
  const c = ENVELOPE_COLORS[look.color] ?? ENVELOPE_COLORS.classic;
  return `<rect width="60" height="60" fill="${c.flap}"/>${linerPattern(look, 60, 60)}`;
}

/** Envelope artwork (viewBox 0 0 380 260). `textless` leaves the initial seal blank (for renderers without fonts). */
export function envelopeSvg(look: EnvelopeLook, initial = "", textless = false) {
  const c = ENVELOPE_COLORS[look.color] ?? ENVELOPE_COLORS.classic;
  const flap = "M8 16 L190 146 L372 16 L372 10 Q372 6 366 6 L14 6 Q8 6 8 10Z";
  return (
    `<rect x="4" y="4" width="372" height="252" rx="14" fill="${c.body}" stroke="${c.line}" stroke-width="3"/>` +
    `<path d="M6 250 L150 124 M374 250 L230 124" fill="none" stroke="${c.line}" stroke-width="2" opacity=".3"/>` +
    `<clipPath id="pp-flap"><path d="${flap}"/></clipPath>` +
    `<path d="${flap}" fill="${c.flap}"/><g clip-path="url(#pp-flap)">${linerPattern(look, 380, 150)}</g>` +
    `<path d="M6 18 L190 150 L374 18" fill="none" stroke="${c.line}" stroke-width="3" stroke-linejoin="round"/>` +
    `<g transform="translate(190 148)">${sealSvg(look, initial, textless)}</g>`
  );
}

const escapeXml = (s: string) => s.replace(/[<>&"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
