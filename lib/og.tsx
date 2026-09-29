import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { BACKGROUNDS } from "@/lib/bouquet/catalog";
import { bouquetSvg, type Design } from "@/lib/bouquet/composition";
import { site } from "@/lib/site";

export const OG_SIZE = { width: 1200, height: 630 };

let fonts: Promise<{ name: string; data: Buffer; style: "normal" | "italic" }[]> | null = null;
function loadFonts() {
  fonts ??= Promise.all([
    readFile(join(process.cwd(), "assets/InstrumentSerif-Regular.ttf")).then((data) => ({ name: "Instrument Serif", data, style: "normal" as const })),
    readFile(join(process.cwd(), "assets/InstrumentSerif-Italic.ttf")).then((data) => ({ name: "Instrument Serif", data, style: "italic" as const })),
  ]);
  return fonts;
}

const svgDataUri = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

export async function bouquetOgImage(opts: { design: Design | null; kicker: string; title: string; subtitle?: string }) {
  const bg = opts.design ? (BACKGROUNDS[opts.design.background] ?? BACKGROUNDS.cream) : BACKGROUNDS.cream;
  const ink = bg.dark ? "#F6EFFF" : "#1B1A17";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: bg.fill, fontFamily: "Instrument Serif", color: ink }}>
        <div style={{ width: 520, height: 630, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          {opts.design ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={svgDataUri(bouquetSvg(opts.design, { background: false, width: 504 }))} width={504} height={630} alt="" />
          ) : (
            <div style={{ fontSize: 260, display: "flex", marginBottom: 150 }}>💌</div>
          )}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 64px 0 24px" }}>
          <div style={{ fontSize: 26, letterSpacing: 4, textTransform: "uppercase", opacity: 0.65, fontStyle: "normal" }}>{opts.kicker}</div>
          <div style={{ fontSize: 92, lineHeight: 1, marginTop: 16, fontStyle: "italic" }}>{opts.title}</div>
          {opts.subtitle && <div style={{ fontSize: 36, marginTop: 24, opacity: 0.8 }}>{opts.subtitle}</div>}
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
