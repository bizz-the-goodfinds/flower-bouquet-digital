"use client";

import { BACKGROUNDS, DEFAULTS } from "./catalog";
import { CARD_FONTS, CARD_TEMPLATES, normalizeCardFont, type CardStyle } from "./card";
import { CANVAS, bouquetLayers, type Design } from "./composition";
import { ENVELOPE_COLORS, envelopeSvg, normalizeEnvelope } from "./envelope";
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
  const [envelope, backImg, frontImg, ...headImgs] = await Promise.all([
    loadSvg(svgDoc("0 0 380 260", envelopePx, (envelopePx * 260) / 380, envelopeSvg(env, src.from))),
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

// Timeline (ms)
const T = { envIn: 0, envHold: 1500, envOut: 2000, bloom: 1900, card: 3700, end: 6800 };

type Stage = { W: number; H: number; story: boolean; src: AnimSource; fonts: Fonts };

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
  const ink = A.dark ? "#F6EFFF" : "#1B1A17";

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
    const inn = easeOut(ms / 500);
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
    if (ms > 700 && ms < T.envHold) {
      const p = ((ms - 700) % 700) / 700;
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

  // 3) Note card slides up, like the card on the recipient page.
  const hasCard = Boolean(src.to || src.from || src.message);
  const c = easeOut((ms - T.card) / 800);
  if (hasCard && c > 0) {
    const t = CARD_TEMPLATES[src.style.template] ?? CARD_TEMPLATES.paper;
    const cw = W * (st.story ? 0.84 : 0.86);
    const pad = cw * 0.07;
    const fs = Math.round(W * (st.story ? 0.046 : 0.042) * fonts.cardScale);
    ctx.save();
    ctx.font = `${fs}px ${fonts.card}`;
    const lines = src.message ? wrapLines(ctx, src.message, cw - pad * 2, st.story ? 7 : 4) : [];
    ctx.restore();
    const lh = fs * 1.35;
    const chH = pad * 1.6 + W * 0.03 + lines.length * lh + (src.from ? lh * 1.3 : 0) + pad * 0.6;
    const cardTop = (st.story ? H * 0.6 : H * 0.55) + (1 - c) * H * 0.12;
    ctx.save();
    ctx.globalAlpha = c;
    ctx.translate(W / 2, cardTop + chH / 2);
    ctx.rotate(((-1.5 + (1 - c) * 4) * Math.PI) / 180);
    ctx.translate(-cw / 2, -chH / 2);
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
    if (src.to) {
      ctx.globalAlpha = c * 0.7;
      ctx.font = `${Math.round(W * 0.022)}px ${fonts.mono}`;
      ctx.fillText(fit(ctx, `FOR ${src.to.toUpperCase()}`, cw - pad * 2), pad, y + W * 0.02);
      ctx.globalAlpha = c;
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

  // Watermark
  ctx.save();
  ctx.fillStyle = A.dark && ms > T.envOut ? "#F6EFFF" : ink;
  ctx.globalAlpha = 0.5;
  ctx.textAlign = "center";
  ctx.font = `${Math.round(W * (st.story ? 0.022 : 0.026))}px ${fonts.mono}`;
  ctx.fillText(site.url.replace(/^https?:\/\//, ""), W / 2, H - H * (st.story ? 0.03 : 0.02));
  ctx.restore();
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
  const st: Stage = { W, H, story: true, src, fonts };
  drawFrame(ctx, A, st, 0);

  const stream = canvas.captureStream(30);
  const rec = new MediaRecorder(stream, { mimeType: support.mime, videoBitsPerSecond: 5_000_000 });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise<Blob>((resolve) => (rec.onstop = () => resolve(new Blob(chunks, { type: support.mime.split(";")[0] }))));

  rec.start(250);
  const start = performance.now();
  await new Promise<void>((resolve) => {
    const tick = () => {
      const ms = performance.now() - start;
      drawFrame(ctx, A, st, Math.min(ms, T.end));
      opts.onProgress?.(Math.min(1, ms / T.end));
      if (ms < T.end) requestAnimationFrame(tick);
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
  const st: Stage = { W, H, story: false, src, fonts };

  // Palette from an envelope frame + the final frame keeps colours stable (no flicker).
  const sample = (ms: number) => {
    drawFrame(ctx, A, st, ms);
    return ctx.getImageData(0, 0, W, H).data;
  };
  const a = sample(900);
  const b = sample(T.end);
  const both = new Uint8ClampedArray(a.length + b.length);
  both.set(a);
  both.set(b, a.length);
  const palette = quantize(both, 256);

  const gif = GIFEncoder();
  const fps = 12;
  const total = Math.round((T.end / 1000) * fps);
  for (let i = 0; i <= total; i++) {
    drawFrame(ctx, A, st, (i / total) * T.end);
    const index = applyPalette(ctx.getImageData(0, 0, W, H).data, palette);
    gif.writeFrame(index, W, H, { palette, delay: i === total ? 2500 : Math.round(1000 / fps), repeat: 0 });
    opts.onProgress?.(i / total);
    if (i % 5 === 0) await new Promise((r) => setTimeout(r, 0)); // keep the UI responsive
  }
  gif.finish();
  return new Blob([gif.bytes() as BlobPart], { type: "image/gif" });
}
