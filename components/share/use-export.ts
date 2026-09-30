"use client";

import { useState } from "react";
import type { AnimSource } from "@/lib/bouquet/animate";
import { renderBouquetPng, saveImage } from "@/lib/bouquet/export";
import { track } from "@/lib/analytics/track";

export type ExportKind = "post" | "story" | "video" | "gif";

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Image / video / GIF export with progress and friendly errors. */
export function useExport(src: AnimSource, where: "sender" | "recipient") {
  const { design, to, from, song } = src;
  const [busy, setBusy] = useState<ExportKind | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const base = `bouquet${to ? `-for-${slugify(to)}` : ""}`;

  const run = async (kind: ExportKind) => {
    setBusy(kind);
    setProgress(0);
    setError(null);
    try {
      if (kind === "post" || kind === "story") {
        await saveImage(await renderBouquetPng(design, { format: kind, to, from, song }), `${base}-${kind}.png`);
      } else {
        const anim = await import("@/lib/bouquet/animate");
        if (kind === "video") {
          const { blob, ext } = await anim.renderBloomVideo(src, { onProgress: setProgress });
          await saveImage(blob, `${base}.${ext}`);
        } else {
          await saveImage(await anim.renderBloomGif(src, { onProgress: setProgress }), `${base}.gif`);
        }
      }
      track("image_downloaded", { format: kind, where });
    } catch (err) {
      setError((err as Error).message || "Couldn't save that. Try again.");
      track("export_failed", { format: kind, where, error: String((err as Error).message).slice(0, 100) });
    } finally {
      setBusy(null);
    }
  };

  return { busy, progress, error, run };
}
