"use client";

import { useEffect, useRef, useState } from "react";
import { Clapperboard, Download, Film, Image as ImageIcon, Smartphone } from "lucide-react";
import { MiniBloom } from "@/components/ui/bloom-loader";
import type { AnimSource } from "@/lib/bouquet/animate";
import { useExport, type ExportKind } from "./use-export";

const OPTIONS: [ExportKind, string, string, typeof ImageIcon][] = [
  ["post", "Image", "Square post", ImageIcon],
  ["story", "Story", "9:16 for Instagram & TikTok", Smartphone],
  ["video", "Video", "The whole opening, petals and all", Clapperboard],
  ["gif", "GIF", "Loops in any chat", Film],
];

/**
 * "Save" button with a small menu: image, story, video or GIF of a bouquet. Everything renders on-device.
 * The menu anchors to the nearest positioned ancestor (e.g. a card footer with `relative`) so it never runs off-screen.
 */
export function DownloadMenu({ src, where, className = "" }: { src: AnimSource; where: "sender" | "recipient"; className?: string }) {
  const [open, setOpen] = useState(false);
  const exp = useExport(src, where);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const busyLabel = exp.busy && (exp.busy === "video" || exp.busy === "gif" ? `${Math.round(exp.progress * 100)}%` : "Saving…");

  return (
    <div ref={ref}>
      <button type="button" className={className} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} disabled={exp.busy !== null}>
        {exp.busy ? <MiniBloom /> : <Download className="size-4" aria-hidden />}
        {busyLabel || "Save"}
      </button>
      {open && (
        <div role="menu" className="absolute inset-x-2 bottom-full z-20 mb-2 rounded-2xl border-[1.5px] border-ink bg-paper p-1.5 text-left shadow-[4px_4px_0_0_var(--color-ink)] open:animate-[pp-dialog_.15s_ease-out]">
          {OPTIONS.map(([kind, label, hint, Icon]) => (
            <button
              key={kind}
              role="menuitem"
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-cream"
              onClick={() => {
                setOpen(false);
                exp.run(kind);
              }}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{label}</span>
                <span className="block text-xs text-ink-soft">{hint}</span>
              </span>
            </button>
          ))}
        </div>
      )}
      {exp.error && (
        <p role="alert" className="absolute inset-x-2 bottom-full z-20 mb-2 rounded-xl bg-paper px-3 py-2 text-xs text-petal-deep shadow-[var(--shadow-soft)]">
          {exp.error}
        </p>
      )}
    </div>
  );
}
