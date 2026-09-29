"use client";

import { BACKGROUNDS, DEFAULTS } from "./catalog";
import { CARD_FONTS, CARD_TEMPLATES, normalizeCardFont, normalizeNoteMode, type CardStyle } from "./card";
import { CANVAS, bouquetLayers, normalizeDesign, tieOf, type Design } from "./composition";
import { ENVELOPE_COLORS, envelopeSvg, normalizeEnvelope } from "./envelope";
import { logoSvg } from "../brand";
import { site } from "../site";

/**
 * Renders the same opening the recipient sees (envelope → unwrap → bloom → note card)
 * to a video (MP4 where supported, else WebM) or an animated GIF. Everything runs on-device.
 */

export type AnimSource = { design: Design; to: string; from: string; message: string; style: CardStyle };

type Assets = {
  bg: string;
  dark: boolean;
  envelope: HTMLImageElement;
  logo: HTMLImageElement;
  back: HTMLImageElement;
  front: HTMLImageElement;
  heads: { img: HTMLImageElement; x: number; y: number; reach: number }[];
};

type Fonts = { display: string; mono: string; card: string; cardScale: number };

const svgDoc = (viewBox: string, w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${Math.round(w)}" height="${Math.round(h)}">${body}</svg>`;

function loadSvg(svg: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

async function prepare(src: AnimSource, pxPerUnit: number, envelopePx: number): Promise<Assets> {
  const { design: d, back, heads, front } = bouquetLayers(src.design);
  const bg = BACKGROUNDS[d.background] ?? BACKGROUNDS[DEFAULTS.background];
  const full = (body: string) => loadSvg(svgDoc(`0 0 ${CANVAS.w} ${CANVAS.h}`, CANVAS.w * pxPerUnit, CANVAS.h * pxPerUnit, body));
  const env = normalizeEnvelope(src.style.envelope);
  const [envelope, logo, backImg, frontImg, ...headImgs] = await Promise.all([
    loadSvg(svgDoc("0 0 380 260", envelopePx, (envelopePx * 260) / 380, envelopeSvg(env, src.from))),
    loadSvg(logoSvg().replace("<svg ", '<svg width="128" height="128" ')),
    full(back),
    full(front),
    ...heads.map((h) => {
      const { x, y } = h.item;
      const size = h.reach * 2;
      return loadSvg(svgDoc(`${x - h.reach} ${y - h.reach} ${size} ${size}`, size * pxPerUnit, size * pxPerUnit, h.markup));
    }),
  ]);
  return {
    bg: bg.fill,
    dark: Boolean(bg.dark),
    envelope,
    logo,
    back: backImg,
    front: frontImg,
    heads: heads.map((h, i) => ({ img: headImgs[i], x: h.item.x, y: h.item.y, reach: h.reach })),
  };
}

async function loadFonts(style: CardStyle): Promise<Fonts> {
  // Card font variables live on the wrapper that loaded them (data-card-fonts); site fonts on <html>.
  const host = document.querySelector("[data-card-fonts]") ?? document.documentElement;
  const root = getComputedStyle(document.documentElement);
  const cs = getComputedStyle(host);
  const f = CARD_FONTS[normalizeCardFont(style.font)];
  const varName = f.css.match(/var\((--[^)]+)\)/)?.[1] ?? "--font-playfair";
  const display = root.getPropertyValue("--font-playfair").trim() || "Georgia, serif";
  const mono = root.getPropertyValue("--font-geist-mono").trim() || "ui-monospace, monospace";
  const card = cs.getPropertyValue(varName).trim() || root.getPropertyValue(varName).trim() || display;
  await Promise.all([
    document.fonts.load(`italic 64px ${display}`),
    document.fonts.load(`64px ${display}`),
    document.fonts.load(`20px ${mono}`),
    document.fonts.load(`32px ${card}`),
  ]).catch(() => {});
  return { display, mono, card, cardScale: f.scale };
}

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
const easeIn = (t: number) => Math.pow(clamp01(t), 2);
const easeOutBack = (t: number) => {
  const c = 1.9;
  const x = clamp01(t) - 1;
  return 1 + (c + 1) * x * x * x + c * x * x;
};

/** How long the first (cover) frame is held before the opening plays. */
const COVER_MS = 600;

// Timeline (ms)
const T = { envIn: 0, envHold: 1500, envOut: 2000, bloom: 1900, card: 3700, end: 6800 };
/** Tucked notes need time to appear on their pick, fly out and be read. */
const TUCKED = { ...T, fly: 4700, end: 8200 };
const timeline = (src: AnimSource) => (normalizeNoteMode(src.style.note) === "tucked" && hasNote(src) ? TUCKED : { ...T, fly: Infinity });
const hasNote = (src: AnimSource) => Boolean(src.to || src.from || src.message);

type Stage = { W: number; H: number; story: boolean; src: AnimSource; fonts: Fonts; tl: ReturnType<typeof timeline> };

function wrapLines(ctx: CanvasRenderingContext2D, text: string, max: number, maxLines: number) {
  const lines: string[] = [];
  for (const para of text.split(/\n/)) {
    let line = "";
    for (const word of para.split(/\s+/)) {
      const probe = line ? `${line} ${word}` : word;
      if (ctx.measureText(probe).width <= max) line = probe;
      else if (!line) {
        // A single word longer than the line: hard-break it.
        let chunk = "";
        for (const ch of word) {
          if (ctx.measureText(chunk + ch).width > max) {
            lines.push(chunk);
            chunk = ch;
          } else chunk += ch;
        }
        line = chunk;
      } else {
        lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  if (lines.length > maxLines) {
    const cut = lines.slice(0, maxLines);
    cut[maxLines - 1] = `${cut[maxLines - 1].replace(/\s*\S*$/, "")}…`;
    return cut;
  }
  return lines;
}

function fit(ctx: CanvasRenderingContext2D, text: string, max: number) {
  if (ctx.measureText(text).width <= max) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > max) t = t.slice(0, -1);
  return `${t}…`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawFrame(ctx: CanvasRenderingContext2D, A: Assets, st: Stage, ms: number) {
  const { W, H, src, fonts } = st;
  const env = normalizeEnvelope(src.style.envelope);
  const envColors = ENVELOPE_COLORS[env.color];

  // Background: cream page for the envelope, cross-fading into the bouquet background.
  ctx.fillStyle = "#FBF6EE";
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.globalAlpha = easeOut((ms - T.envHold) / 700);
  ctx.fillStyle = A.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // 1) Envelope with the recipient's name, then it lifts away.
  if (ms < T.envOut + 100) {
    const out = easeIn((ms - T.envHold) / (T.envOut - T.envHold));
    // Fully visible from frame 0: the first frame is the video/GIF cover, so it shows the sender's envelope.
    const inn = 1;
    const ew = W * (st.story ? 0.78 : 0.72);
    const eh = (ew * 260) / 380;
    const cx = W / 2;
    const cy = H * (st.story ? 0.56 : 0.6) - out * H * 0.08;
    const wiggle = ms > 600 && ms < T.envHold ? Math.sin(ms / 90) * 0.02 * Math.max(0, 1 - Math.abs(ms - 1000) / 400) : 0;
    ctx.save();
    ctx.globalAlpha = inn * (1 - out);
    ctx.fillStyle = "#1B1A17";
    ctx.textAlign = "center";
    ctx.font = `${Math.round(W * 0.03)}px ${fonts.mono}`;
    ctx.globalAlpha *= 0.7;
    ctx.fillText(src.from ? `${src.from.toUpperCase()} SENT YOU` : "SOMEONE SENT YOU", cx, H * (st.story ? 0.25 : 0.14));
    ctx.globalAlpha = inn * (1 - out);
    ctx.font = `${Math.round(W * 0.085)}px ${fonts.display}`;
    const title = `a bouquet${src.to ? `, ${src.to}` : ""}`;
    ctx.fillText(fit(ctx, title, W * 0.9), cx, H * (st.story ? 0.31 : 0.25));
    ctx.translate(cx, cy);
    ctx.rotate(wiggle);
    ctx.scale(0.92 + inn * 0.08 + out * 0.25, 0.92 + inn * 0.08 + out * 0.25);
    ctx.shadowColor = "rgba(27,26,23,1)";
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;
    ctx.drawImage(A.envelope, -ew / 2, -eh / 2, ew, eh);
    ctx.restore();
    // "tap" pulse on the seal
    if (ms > 300 && ms < T.envHold) {
      const p = ((ms - 300) % 700) / 700;
      ctx.save();
      ctx.globalAlpha = (1 - p) * 0.6 * inn;
      ctx.strokeStyle = envColors.seal;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy - eh / 2 + eh * (148 / 260), (ew / 380) * (32 + p * 26), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // 2) Bouquet rises and blooms.
  const bw = st.story ? W * 0.8 : W * 0.66;
  const scale = bw / CANVAS.w;
  const bh = CANVAS.h * scale;
  const top = st.story ? H * 0.07 : H * 0.03;
  const left = (W - bw) / 2;
  const rise = easeOut((ms - T.bloom) / 700);
  if (rise > 0) {
    const sway = ms > T.card ? Math.sin((ms - T.card) / 520) * 0.012 : 0;
    ctx.save();
    ctx.globalAlpha = rise;
    ctx.translate(left + bw / 2, top + bh);
    ctx.rotate(sway);
    ctx.translate(-(left + bw / 2), -(top + bh) + (1 - rise) * H * 0.05);
    ctx.drawImage(A.back, left, top, bw, bh);
    A.heads.forEach((h, i) => {
      const k = easeOutBack((ms - T.bloom - 350 - i * 105) / 480);
      if (k <= 0.001) return;
      const size = h.reach * 2 * scale;
      ctx.save();
      ctx.translate(left + h.x * scale, top + h.y * scale);
      ctx.scale(k, k);
      ctx.drawImage(h.img, -size / 2, -size / 2, size, size);
      ctx.restore();
    });
    ctx.drawImage(A.front, left, top, bw, bh);
    ctx.restore();
  }

  // Petals drift down once it's unwrapped, like the petal rain on the recipient page.
  drawPetals(ctx, W, H, ms - T.envOut, A.dark);

  // 3) The note, as the recipient page shows it: pinned (slides up under the bouquet) or tucked (pick → flies out → unfolds).
  if (hasNote(src)) {
    const { tl } = st;
    if (tl.fly === Infinity) {
      const c = easeOut((ms - tl.card) / 800);
      if (c > 0) {
        const cw = W * (st.story ? 0.84 : 0.86);
        const h = noteHeight(ctx, st, cw);
        const cardTop = (st.story ? H * 0.58 : H * 0.5) + (1 - c) * H * 0.12;
        drawNoteCard(ctx, st, { cx: W / 2, cy: cardTop + h / 2, cw, rot: -1.5 + (1 - c) * 4, alpha: c });
      }
    } else {
      const tie = tieOf(normalizeDesign(src.design).wrapper);
      const tagW = bw * 0.26;
      const tagH = tagW * 0.62;
      const tag = { cx: left + (tie.x + 40) * scale + tagW / 2, cy: top + (tie.y - 360) * scale + tagH / 2 };
      const f = easeInOut((ms - tl.fly) / 750);
      if (f <= 0) {
        const k = easeOutBack((ms - tl.card) / 550);
        if (k > 0.001) drawTag(ctx, st, tag.cx, tag.cy, tagW, tagH, k, ms > tl.card + 600 ? (ms - tl.card - 600) % 1400 / 1400 : -1);
      } else {
        // Dim the bouquet, then the card grows from its pick to the centre and unfolds from the top.
        ctx.save();
        ctx.fillStyle = `rgba(27,26,23,${0.35 * f})`;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
        const cw = W * (st.story ? 0.84 : 0.86);
        const s0 = tagW / cw;
        const k = s0 + (1 - s0) * f;
        const cy = H * (st.story ? 0.47 : 0.45);
        drawNoteCard(ctx, st, {
          cx: tag.cx + (W / 2 - tag.cx) * f,
          cy: tag.cy + (cy - tag.cy) * f,
          cw,
          rot: 8 + (-1.5 - 8) * f,
          alpha: 1,
          scale: k,
          unfold: 0.35 + 0.65 * easeOut((ms - tl.fly - 250) / 600),
        });
      }
    }
  }

  drawBrand(ctx, A, st);
}

const easeInOut = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

function noteLayout(ctx: CanvasRenderingContext2D, st: Stage, cw: number) {
  const { W, src, fonts } = st;
  const pad = cw * 0.07;
  const fs = Math.round(W * (st.story ? 0.046 : 0.042) * fonts.cardScale);
  ctx.save();
  ctx.font = `${fs}px ${fonts.card}`;
  const lines = src.message ? wrapLines(ctx, src.message, cw - pad * 2, st.story ? 7 : 5) : [];
  ctx.restore();
  const lh = fs * 1.35;
  const h = pad * 1.6 + W * 0.03 + lines.length * lh + (src.from ? lh * 1.3 : 0) + pad * 0.6;
  return { pad, fs, lines, lh, h };
}
const noteHeight = (ctx: CanvasRenderingContext2D, st: Stage, cw: number) => noteLayout(ctx, st, cw).h;

/** The full note card, centred on (cx, cy). `unfold` squashes it from the top (0..1), `scale` shrinks it (for the fly-out). */
function drawNoteCard(
  ctx: CanvasRenderingContext2D,
  st: Stage,
  o: { cx: number; cy: number; cw: number; rot: number; alpha: number; scale?: number; unfold?: number },
) {
  const { W, src, fonts } = st;
  const { pad, fs, lines, lh, h: chH } = noteLayout(ctx, st, o.cw);
  const cw = o.cw;
  const t = CARD_TEMPLATES[src.style.template] ?? CARD_TEMPLATES.paper;
  ctx.save();
  ctx.globalAlpha = o.alpha;
  ctx.translate(o.cx, o.cy);
  ctx.rotate((o.rot * Math.PI) / 180);
  ctx.scale(o.scale ?? 1, o.scale ?? 1);
  ctx.translate(-cw / 2, -chH / 2);
  if (o.unfold !== undefined && o.unfold < 1) ctx.scale(1, Math.max(0.05, o.unfold));
  ctx.fillStyle = "#1B1A17";
  roundRect(ctx, 5, 5, cw, chH, 22);
  ctx.fill();
  ctx.fillStyle = t.bg;
  roundRect(ctx, 0, 0, cw, chH, 22);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#1B1A17";
  ctx.stroke();
  // washi tape
  ctx.fillStyle = "rgba(247,222,138,.85)";
  ctx.save();
  ctx.translate(cw / 2, 0);
  ctx.rotate(-0.03);
  ctx.fillRect(-cw * 0.11, -W * 0.018, cw * 0.22, W * 0.036);
  ctx.restore();
  let y = pad * 1.2;
  ctx.fillStyle = t.ink;
  ctx.textAlign = "left";
  if (src.to) {
    ctx.globalAlpha = o.alpha * 0.7;
    ctx.font = `${Math.round(W * 0.022)}px ${fonts.mono}`;
    ctx.fillText(fit(ctx, `FOR ${src.to.toUpperCase()}`, cw - pad * 2), pad, y + W * 0.02);
    ctx.globalAlpha = o.alpha;
  }
  y += W * 0.03 + pad * 0.5;
  ctx.font = `${fs}px ${fonts.card}`;
  lines.forEach((ln) => {
    y += lh;
    ctx.fillText(ln, pad, y);
  });
  if (src.from) {
    ctx.fillStyle = t.accent;
    ctx.textAlign = "right";
    ctx.fillText(fit(ctx, `— ${src.from}`, cw - pad * 2), cw - pad, y + lh * 1.3);
    ctx.textAlign = "left";
  }
  // stickers
  const spots = [
    [cw - cw * 0.02, -W * 0.01, 0.2],
    [cw * 0.02, chH + W * 0.01, -0.2],
    [cw + W * 0.005, chH / 2, 0.1],
  ];
  ctx.font = `${Math.round(W * 0.07)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
  ctx.textAlign = "center";
  (src.style.stickers ?? []).slice(0, 3).forEach((s, i) => {
    const [sx, sy, r] = spots[i];
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(r);
    ctx.fillText(s, 0, W * 0.025);
    ctx.restore();
  });
  ctx.restore();
}

/** The small florist card on its pick, tucked into the bouquet. `pulse` (0..1, or -1 for none) draws the "tap me" ring. */
function drawTag(ctx: CanvasRenderingContext2D, st: Stage, cx: number, cy: number, w: number, h: number, k: number, pulse: number) {
  const { src, fonts } = st;
  const t = CARD_TEMPLATES[src.style.template] ?? CARD_TEMPLATES.paper;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(k, k);
  // pick
  ctx.save();
  ctx.translate(-w * 0.2, h * 0.3);
  ctx.rotate((18 * Math.PI) / 180);
  ctx.fillStyle = "#1B1A17";
  ctx.fillRect(-3.5, 0, 7, h * 1.1);
  ctx.fillStyle = "#6E9C63";
  ctx.fillRect(-2, 0, 4, h * 1.1 - 1.5);
  ctx.restore();
  ctx.rotate((8 * Math.PI) / 180);
  if (pulse >= 0) {
    ctx.save();
    ctx.globalAlpha = (1 - pulse) * 0.8;
    ctx.strokeStyle = "#D6336C";
    ctx.lineWidth = 3;
    const g = 1 + pulse * 0.12;
    roundRect(ctx, (-w / 2) * g - 4, (-h / 2) * g - 4, w * g + 8, h * g + 8, 12);
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = "#1B1A17";
  roundRect(ctx, -w / 2 + 3, -h / 2 + 3, w, h, 8);
  ctx.fill();
  ctx.fillStyle = t.bg;
  roundRect(ctx, -w / 2, -h / 2, w, h, 8);
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "#1B1A17";
  ctx.stroke();
  ctx.fillStyle = "rgba(247,222,138,.85)";
  ctx.fillRect(-w * 0.14, -h / 2 - h * 0.08, w * 0.28, h * 0.16);
  const px = -w / 2 + w * 0.09;
  ctx.fillStyle = t.ink;
  ctx.globalAlpha = 0.7;
  ctx.font = `${Math.round(h * 0.15)}px ${fonts.mono}`;
  ctx.fillText(fit(ctx, src.to ? `FOR ${src.to.toUpperCase()}` : "FOR YOU", w * 0.82), px, -h / 2 + h * 0.3);
  ctx.globalAlpha = 0.22;
  ctx.fillRect(px, -h / 2 + h * 0.45, w * 0.82, h * 0.06);
  ctx.fillRect(px, -h / 2 + h * 0.59, w * 0.64, h * 0.06);
  ctx.globalAlpha = 1;
  ctx.fillStyle = t.accent;
  ctx.font = `600 ${Math.round(h * 0.17)}px ${fonts.mono}`;
  ctx.fillText("Tap to read 💌", px, -h / 2 + h * 0.86);
  ctx.restore();
}

/** Branded pill at the bottom of every frame: logo mark, wordmark and site address. */
export function drawBrandPill(ctx: CanvasRenderingContext2D, logo: HTMLImageElement, W: number, H: number, fonts: { display: string; mono: string }, story: boolean) {
  const h = Math.round(W * (story ? 0.085 : 0.09));
  const logoSize = h * 0.78;
  const name = site.name;
  const domain = site.url.replace(/^https?:\/\//, "");
  ctx.save();
  const nameFont = `italic ${Math.round(h * 0.36)}px ${fonts.display}`;
  const urlFont = `${Math.round(h * 0.2)}px ${fonts.mono}`;
  ctx.font = nameFont;
  const nameW = ctx.measureText(name).width;
  ctx.font = urlFont;
  const urlW = ctx.measureText(domain).width;
  const pad = h * 0.22;
  const w = pad + logoSize + pad * 0.7 + Math.max(nameW, urlW) + pad * 1.4;
  const x = (W - w) / 2;
  const y = H - h - H * (story ? 0.035 : 0.025);
  ctx.fillStyle = "#1B1A17";
  roundRect(ctx, x + 4, y + 4, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = "#FFFDF8";
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#1B1A17";
  ctx.stroke();
  ctx.drawImage(logo, x + pad, y + (h - logoSize) / 2, logoSize, logoSize);
  const tx = x + pad + logoSize + pad * 0.7;
  ctx.fillStyle = "#1B1A17";
  ctx.textAlign = "left";
  ctx.font = nameFont;
  ctx.fillText(name, tx, y + h * 0.52);
  ctx.globalAlpha = 0.6;
  ctx.font = urlFont;
  ctx.fillText(domain, tx, y + h * 0.8);
  ctx.restore();
}

function drawBrand(ctx: CanvasRenderingContext2D, A: Assets, st: Stage) {
  drawBrandPill(ctx, A.logo, st.W, st.H, st.fonts, st.story);
}

const PETAL_COUNT = 14;
const PETAL_COLORS = ["#F4A6C0", "#F7DE8A", "#C9B8F2", "#F28A6B"];

/** Same timing and path as the CSS `pp-petal` rain (components/reveal/recipient-view.tsx), in canvas pixels. */
function drawPetals(ctx: CanvasRenderingContext2D, W: number, H: number, since: number, dark: boolean) {
  if (since <= 0) return;
  const pw = W * 0.024;
  const ph = W * 0.032;
  for (let i = 0; i < PETAL_COUNT; i++) {
    const start = 600 + (i % 7) * 450;
    const dur = 5000 + (i % 5) * 1000;
    const p = (since - start) / dur;
    if (p <= 0 || p >= 1) continue;
    const alpha = p < 0.1 ? (p / 0.1) * 0.9 : 0.9 * (1 - (p - 0.1) / 0.9);
    const x = ((i * 73) % 100) / 100 * W + p * W * 0.08;
    const y = -H * 0.05 + p * H * 1.1;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate((p * 540 * Math.PI) / 180);
    ctx.fillStyle = i % 4 === 3 && dark ? "#FFFFFF" : PETAL_COLORS[i % 4];
    ctx.beginPath();
    ctx.moveTo(-pw / 2, -ph / 2);
    ctx.quadraticCurveTo(pw / 2, -ph / 2, pw / 2, ph / 2);
    ctx.quadraticCurveTo(-pw / 2, ph / 2, -pw / 2, -ph / 2);
    ctx.fill();
    ctx.restore();
  }
}

export function videoSupport() {
  if (typeof MediaRecorder === "undefined" || typeof HTMLCanvasElement === "undefined" || !("captureStream" in HTMLCanvasElement.prototype)) return null;
  for (const mime of ["video/mp4;codecs=avc1.42E01E", "video/mp4", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"]) {
    if (MediaRecorder.isTypeSupported(mime)) return { mime, ext: mime.startsWith("video/mp4") ? "mp4" : "webm" };
  }
  return null;
}

/** 9:16 story video of the full opening, recorded in real time (~6.8s). */
export async function renderBloomVideo(src: AnimSource, opts: { onProgress?: (p: number) => void } = {}) {
  const support = videoSupport();
  if (!support) throw new Error("Video export isn't supported in this browser. Try Chrome or Safari.");
  const W = 720;
  const H = 1280;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const [A, fonts] = await Promise.all([prepare(src, (W * 0.8) / CANVAS.w, W * 0.8), loadFonts(src.style)]);
  const st: Stage = { W, H, story: true, src, fonts, tl: timeline(src) };
  drawFrame(ctx, A, st, 0);

  const stream = canvas.captureStream(30);
  const rec = new MediaRecorder(stream, { mimeType: support.mime, videoBitsPerSecond: 5_000_000 });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise<Blob>((resolve) => (rec.onstop = () => resolve(new Blob(chunks, { type: support.mime.split(";")[0] }))));

  rec.start(250);
  // Push the cover frame right away so the file never starts on a blank (black) frame.
  (stream.getVideoTracks()[0] as MediaStreamTrack & { requestFrame?: () => void }).requestFrame?.();
  const start = performance.now() + COVER_MS;
  await new Promise<void>((resolve) => {
    const tick = () => {
      const ms = Math.max(0, performance.now() - start);
      drawFrame(ctx, A, st, Math.min(ms, st.tl.end));
      opts.onProgress?.(Math.min(1, ms / st.tl.end));
      if (ms < st.tl.end) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
  rec.stop();
  stream.getTracks().forEach((t) => t.stop());
  return { blob: await done, ext: support.ext };
}

/** Looping 4:5 GIF of the full opening. */
export async function renderBloomGif(src: AnimSource, opts: { onProgress?: (p: number) => void } = {}) {
  const { GIFEncoder, quantize, applyPalette } = await import("gifenc");
  const W = 480;
  const H = 600;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const [A, fonts] = await Promise.all([prepare(src, (W * 0.66) / CANVAS.w, W * 0.72), loadFonts(src.style)]);
  const st: Stage = { W, H, story: false, src, fonts, tl: timeline(src) };

    const sample = (ms: number) => {
    drawFrame(ctx, A, st, ms);
    return ctx.getImageData(0, 0, W, H).data;
  };
  // Envelope cover, the card mid-slide and the final frame, so every stage keeps its true colours.
  const frames = [sample(0), sample(T.card + 400), sample(st.tl.end)];
  const all = new Uint8ClampedArray(frames.reduce((n, f) => n + f.length, 0));
  frames.reduce((off, f) => (all.set(f, off), off + f.length), 0);
  const palette = quantize(all, 256);

  const gif = GIFEncoder();
  const fps = 12;
  const total = Math.round((st.tl.end / 1000) * fps);
  for (let i = 0; i <= total; i++) {
    drawFrame(ctx, A, st, (i / total) * st.tl.end);
    const index = applyPalette(ctx.getImageData(0, 0, W, H).data, palette);
    gif.writeFrame(index, W, H, { palette, delay: i === total ? 2500 : i === 0 ? COVER_MS : Math.round(1000 / fps), repeat: 0 });
    opts.onProgress?.(i / total);
    if (i % 5 === 0) await new Promise((r) => setTimeout(r, 0)); // keep the UI responsive
  }
  gif.finish();
  return new Blob([gif.bytes() as BlobPart], { type: "image/gif" });
}
