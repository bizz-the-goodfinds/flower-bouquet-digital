"use client";

import { BACKGROUNDS, DEFAULTS } from "./catalog";
import { CANVAS, bouquetSvg, type Design } from "./composition";
import { site } from "../site";

export type ExportFormat = "post" | "story";

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function cssFont(varName: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return v || fallback;
}

/** Renders the bouquet (plus a small caption) to a PNG blob. Everything happens on-device. */
export async function renderBouquetPng(design: Design, opts: { format: ExportFormat; to?: string; from?: string }) {
  const W = 1080;
  const H = opts.format === "story" ? 1920 : 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const bg = BACKGROUNDS[design.background] ?? BACKGROUNDS[DEFAULTS.background];
  const inkColor = bg.dark ? "#F6EFFF" : "#1B1A17";

  ctx.fillStyle = bg.fill;
  ctx.fillRect(0, 0, W, H);

  const svg = bouquetSvg(design, { background: false, width: CANVAS.w });
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const img = await loadImage(url);
    const display = cssFont("--font-playfair", "Georgia, serif");
    const mono = cssFont("--font-geist-mono", "ui-monospace, monospace");
    await Promise.all([document.fonts.load(`italic 80px ${display}`), document.fonts.load(`24px ${mono}`)]).catch(() => {});

    const bw = opts.format === "story" ? 1000 : 940;
    const bh = (bw * CANVAS.h) / CANVAS.w;
    const top = opts.format === "story" ? 420 : 40;
    ctx.drawImage(img, (W - bw) / 2, top, bw, bh);

    ctx.fillStyle = inkColor;
    ctx.textAlign = "center";
    if (opts.format === "story") {
      ctx.font = `28px ${mono}`;
      ctx.globalAlpha = 0.7;
      ctx.fillText("A BOUQUET FOR", W / 2, 230);
      ctx.globalAlpha = 1;
      ctx.font = `italic 120px ${display}`;
      ctx.fillText(truncate(ctx, opts.to || "you", W - 120), W / 2, 350);
    } else if (opts.to) {
      ctx.font = `italic 64px ${display}`;
      ctx.fillText(truncate(ctx, `for ${opts.to}`, W - 120), W / 2, H - 70);
    }
    ctx.font = `22px ${mono}`;
    ctx.globalAlpha = 0.55;
    ctx.fillText(`made on ${site.wordmark} · ${site.url.replace(/^https?:\/\//, "")}`, W / 2, H - (opts.format === "story" ? 90 : 24));
    ctx.globalAlpha = 1;
  } finally {
    URL.revokeObjectURL(url);
  }
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Export failed"))), "image/png"));
}

function truncate(ctx: CanvasRenderingContext2D, text: string, max: number) {
  if (ctx.measureText(text).width <= max) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > max) t = t.slice(0, -1);
  return `${t}…`;
}

/** Share the file where possible (saves to Photos on iOS), otherwise download it. */
export async function saveImage(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: blob.type || "image/png" });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  const touch = matchMedia("(pointer: coarse)").matches;
  if (touch && nav.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
    }
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
