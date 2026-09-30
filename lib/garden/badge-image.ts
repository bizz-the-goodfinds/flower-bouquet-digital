"use client";

import { logoSvg } from "../brand";
import type { Badge } from "./badges";

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

const cssFont = (name: string, fallback: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

/** A 4:5 shareable image of an earned badge. Drawn on-device. */
export async function renderBadgePng(badge: Badge) {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const display = cssFont("--font-playfair", "Georgia, serif");
  const mono = cssFont("--font-geist-mono", "ui-monospace, monospace");
  await Promise.all([document.fonts.load(`italic 96px ${display}`), document.fonts.load(`28px ${mono}`)]).catch(() => {});

  ctx.fillStyle = "#FBF6EE";
  ctx.fillRect(0, 0, W, H);
  // Confetti
  const colors = ["#F4A6C0", "#F7DE8A", "#C9B8F2", "#9DB59A", "#E8553E"];
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    const r = 330 + ((i * 53) % 120);
    ctx.save();
    ctx.translate(W / 2 + Math.cos(a) * r, 560 + Math.sin(a) * r);
    ctx.rotate(a * 3);
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(-10, -6, 20, 12);
    ctx.restore();
  }
  // Medal
  ctx.fillStyle = "#1B1A17";
  ctx.beginPath();
  ctx.arc(W / 2 + 12, 572, 250, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#F7DE8A";
  ctx.beginPath();
  ctx.arc(W / 2, 560, 250, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#1B1A17";
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `240px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  ctx.fillText(badge.emoji, W / 2, 575);

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#1B1A17";
  ctx.font = `28px ${mono}`;
  ctx.globalAlpha = 0.7;
  ctx.fillText("I EARNED A BADGE", W / 2, 180);
  ctx.globalAlpha = 1;
  ctx.font = `italic 120px ${display}`;
  ctx.fillText(badge.name, W / 2, 970);
  ctx.font = `32px ${mono}`;
  ctx.globalAlpha = 0.7;
  ctx.fillText(badge.done, W / 2, 1040);
  ctx.globalAlpha = 1;

  const logo = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(logoSvg().replace("<svg ", '<svg width="128" height="128" '))}`);
  const { drawBrandPill } = await import("../bouquet/animate");
  drawBrandPill(ctx, logo, W, H, { display, mono }, false);
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Export failed"))), "image/png"));
}
