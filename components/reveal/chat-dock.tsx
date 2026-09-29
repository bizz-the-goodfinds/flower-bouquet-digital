"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ChevronDown, MessageCircle } from "lucide-react";

/**
 * A small floating dock for the chat and extras, so the bouquet keeps the whole screen.
 * Collapsed it's one pill (with an unread badge); expanded it's a compact panel above the pill.
 * Children stay mounted while hidden so the chat keeps listening for replies.
 */
export function ChatDock({
  label,
  expanded,
  onToggle,
  unread = 0,
  children,
}: {
  label: React.ReactNode;
  expanded: boolean;
  onToggle: (next: boolean) => void;
  unread?: number;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const panel = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !document.querySelector("[aria-modal='true']") && onToggle(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [expanded, onToggle]);

  return (
    <div className="pointer-events-none fixed right-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 flex flex-col items-end gap-2 sm:right-5 sm:bottom-5">
      <motion.section
        ref={panel}
        id="chat-dock"
        aria-label="Reactions and chat"
        aria-hidden={!expanded}
        inert={!expanded}
        initial={false}
        animate={
          expanded
            ? { opacity: 1, y: 0, scale: 1, visibility: "visible" as const }
            : { opacity: 0, y: reduce ? 0 : 16, scale: reduce ? 1 : 0.96, transitionEnd: { visibility: "hidden" as const } }
        }
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        style={{ transformOrigin: "bottom right" }}
        className="pointer-events-auto flex max-h-[calc(100dvh-9rem)] w-[min(22rem,calc(100vw-1.5rem))] flex-col gap-2.5 overflow-y-auto overscroll-contain rounded-[1.5rem] border-[1.5px] border-ink bg-paper p-2.5 text-ink shadow-[4px_4px_0_0_var(--color-ink)]"
      >
        {children}
      </motion.section>
      <button
        type="button"
        onClick={() => onToggle(!expanded)}
        aria-expanded={expanded}
        aria-controls="chat-dock"
        className="pointer-events-auto relative inline-flex min-h-12 items-center gap-2 rounded-full border-[1.5px] border-ink bg-ink px-4 py-2.5 text-sm font-medium text-cream shadow-[3px_3px_0_0_var(--color-petal)] transition hover:-translate-y-0.5"
      >
        {expanded ? <ChevronDown className="size-4" aria-hidden /> : <MessageCircle className="size-4" aria-hidden />}
        {expanded ? "Hide" : label}
        {!expanded && unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 grid min-w-5 place-items-center rounded-full bg-petal-deep px-1 font-mono text-[11px] text-cream ring-2 ring-paper">{unread}</span>
        )}
      </button>
    </div>
  );
}
