import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { BACKGROUNDS } from "@/lib/bouquet/catalog";
import { bouquetSvg, type Design } from "@/lib/bouquet/composition";
import { ENVELOPE_COLORS, envelopeSvg, type EnvelopeLook } from "@/lib/bouquet/envelope";
import { logoSvg } from "@/lib/brand";
import { site } from "@/lib/site";

export const OG_SIZE = { width: 1200, height: 630 };

let fonts: Promise<{ name: string; data: Buffer; style: "normal" | "italic" }[]> | null = null;
function loadFonts() {
  fonts ??= Promise.all([
    readFile(join(process.cwd(), "assets/PlayfairDisplay-400-normal.ttf")).then((data) => ({ name: "Playfair Display", data, style: "normal" as const })),
    readFile(join(process.cwd(), "assets/PlayfairDisplay-400-italic.ttf")).then((data) => ({ name: "Playfair Display", data, style: "italic" as const })),
  ]);
  return fonts;
}

const svgDataUri = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

export async function bouquetOgImage(opts: { design: Design | null; kicker: string; title: string; subtitle?: string }) {
  const bg = opts.design ? (BACKGROUNDS[opts.design.background] ?? BACKGROUNDS.cream) : BACKGROUNDS.cream;
  const ink = bg.dark ? "#F6EFFF" : "#1B1A17";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: bg.fill, fontFamily: "Playfair Display", color: ink }}>
        <div style={{ width: 520, height: 630, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          {opts.design ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={svgDataUri(bouquetSvg(opts.design, { background: false, width: 504 }))} width={504} height={630} alt="" />
          ) : (
            <div style={{ fontSize: 260, display: "flex", marginBottom: 150 }}>💌</div>
          )}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 64px 0 24px" }}>
          <div style={{ fontSize: 24, letterSpacing: 4, textTransform: "uppercase", opacity: 0.65, fontStyle: "normal" }}>{opts.kicker}</div>
          <div style={{ fontSize: opts.title.length > 34 ? 62 : 76, lineHeight: 1.05, marginTop: 16, fontStyle: "italic" }}>{opts.title}</div>
          {opts.subtitle && <div style={{ fontSize: 30, marginTop: 24, opacity: 0.8 }}>{opts.subtitle}</div>}
          <div style={{ display: "flex", alignItems: "center", marginTop: 48, fontSize: 32, fontStyle: "italic" }}>
            <div style={{ width: 18, height: 18, borderRadius: 9, background: "#F4A6C0", border: `2px solid ${ink}`, marginRight: 10 }} />
            {site.wordmark}
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await loadFonts(), emoji: "twemoji" },
  );
}

const PETALS: [number, number, number, string][] = [
  [70, 60, -20, "#F4A6C0"],
  [470, 90, 35, "#F7DE8A"],
  [40, 470, 60, "#C9B8F2"],
  [500, 520, -45, "#F28A6B"],
  [250, 30, 15, "#F4A6C0"],
];

/**
 * Link preview for a bouquet: the sender's own sealed envelope, never the bouquet itself,
 * so the flowers stay a surprise until the recipient taps the link.
 */
export async function envelopeOgImage(opts: { look: EnvelopeLook; from: string; kicker: string; title: string; subtitle: string }) {
  const c = ENVELOPE_COLORS[opts.look.color] ?? ENVELOPE_COLORS.classic;
  const dark = opts.look.color === "night";
  const bg = dark ? "#1E1B2E" : c.accent;
  const ink = dark ? "#F6EFFF" : "#1B1A17";
  const envelope = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 260" width="480" height="328">${envelopeSvg(opts.look, opts.from, true)}</svg>`;
  const initial = opts.look.seal === "initial" ? (opts.from || "♥").slice(0, 1).toUpperCase() : null;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: bg, fontFamily: "Playfair Display", color: ink }}>
        <div style={{ width: 560, height: 630, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          {PETALS.map(([x, y, r, color], i) => (
            <div
              key={i}
              style={{ position: "absolute", left: x, top: y, width: 34, height: 46, background: color, border: "3px solid #1B1A17", borderRadius: "60% 0 60% 0", transform: `rotate(${r}deg)` }}
            />
          ))}
          <div style={{ display: "flex", position: "relative", transform: "rotate(-5deg)" }}>
            <div style={{ position: "absolute", left: 10, top: 10, width: 470, height: 318, borderRadius: 22, background: "#1B1A17" }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={svgDataUri(envelope)} width={480} height={328} alt="" />
            {initial && (
              <div style={{ position: "absolute", left: 240 - 20, top: 186 - 30, width: 40, height: 56, display: "flex", justifyContent: "center", fontSize: 38, fontStyle: "italic", color: c.accent }}>
                {initial}
              </div>
            )}
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 64px 0 8px" }}>
          <div style={{ fontSize: 24, letterSpacing: 4, textTransform: "uppercase", opacity: 0.7 }}>{opts.kicker}</div>
          <div style={{ fontSize: opts.title.length > 30 ? 60 : 72, lineHeight: 1.05, marginTop: 16, fontStyle: "italic" }}>{opts.title}</div>
          <div style={{ fontSize: 30, marginTop: 22, opacity: 0.85 }}>{opts.subtitle}</div>
          <div
            style={{ display: "flex", alignItems: "center", alignSelf: "flex-start", marginTop: 40, padding: "8px 22px 8px 10px", borderRadius: 40, background: "#FFFDF8", border: "3px solid #1B1A17", boxShadow: "5px 5px 0 0 #1B1A17", color: "#1B1A17", fontSize: 28, fontStyle: "italic" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={svgDataUri(logoSvg())} width={44} height={44} alt="" style={{ marginRight: 10 }} />
            {site.name}
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await loadFonts(), emoji: "twemoji", headers: { "Cache-Control": "public, max-age=600, s-maxage=600" } },
  );
}
