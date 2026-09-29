"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Pin, PinOff, X } from "lucide-react";
import { NoteCard } from "@/components/bouquet/note-card";
import { CARD_TEMPLATES, type CardStyle } from "@/lib/bouquet/card";
import { CANVAS, tieOf } from "@/lib/bouquet/composition";

export type Note = { to: string; from: string; message: string; style: CardStyle };

/** One element moves between the three note states (tucked tag, pinned card, open card) via this shared layout id. */
const LAYOUT_ID = "note-card";

/**
 * The note as a real florist card: a small card on a pick, tucked into the bouquet just above the wrap.
 * Render inside the box that holds the bouquet (same 4:5 frame) so it sits on each wrap's tie point.
 */
export function NoteTag({ note, wrapper, onOpen, hint, delay = 1.5 }: { note: Note; wrapper: string; onOpen: () => void; hint: boolean; delay?: number }) {
  const reduce = useReducedMotion();
  const tie = tieOf(wrapper);
  const t = CARD_TEMPLATES[note.style.template] ?? CARD_TEMPLATES.paper;
  const left = ((tie.x + 40) / CANVAS.w) * 100;
  const top = ((tie.y - 360) / CANVAS.h) * 100;
  return (
    <motion.div
      className="absolute z-10 w-[26%] max-w-40 min-w-24"
      style={{ left: `${left}%`, top: `${top}%` }}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.6 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: reduce ? 0.2 : delay, type: "spring", stiffness: 160, damping: 14 }}
    >
      {/* the pick it's stuck on, disappearing into the wrap */}
      <span aria-hidden className="absolute top-[80%] left-[30%] h-[75%] w-[5px] origin-top rotate-[18deg] rounded-full border-[1.5px] border-ink bg-[#6E9C63]" />
      <motion.button
        type="button"
        layoutId={LAYOUT_ID}
        onClick={onOpen}
        aria-label={`Read the note${note.from ? ` from ${note.from}` : ""}`}
        className="group relative block w-full rotate-[8deg] cursor-pointer rounded-lg border-[1.5px] border-ink p-2 text-left shadow-[3px_3px_0_0_var(--color-ink)] sm:p-2.5"
        style={{ background: t.bg, color: t.ink }}
        whileHover={reduce ? undefined : { scale: 1.06, y: -4, rotate: 4 }}
        whileTap={reduce ? undefined : { scale: 0.96 }}
      >
        <span aria-hidden className="absolute -top-1.5 left-1/2 h-3 w-10 -translate-x-1/2 -rotate-3 rounded-sm bg-butter/80" />
        <span className="block truncate font-mono text-[9px] tracking-[0.12em] uppercase opacity-70 sm:text-[10px]" data-clarity-mask="true">
          {note.to ? `for ${note.to}` : "for you"}
        </span>
        <span aria-hidden className="mt-1 block space-y-1">
          <span className="block h-1 w-full rounded-full opacity-25" style={{ background: t.ink }} />
          <span className="block h-1 w-4/5 rounded-full opacity-25" style={{ background: t.ink }} />
        </span>
        <span className="mt-1.5 flex items-center justify-between gap-1 text-[10px] font-medium sm:text-xs" style={{ color: t.accent }}>
          Tap to read <span aria-hidden>💌</span>
        </span>
        {hint && !reduce && <span aria-hidden className="pp-note-hint pointer-events-none absolute -inset-1 rounded-xl border-2 border-petal-deep" />}
      </motion.button>
    </motion.div>
  );
}

/** The note pinned beside the bouquet: always visible. Long notes clamp on small screens; tap to read in full. */
export function PinnedNote({ note, onOpen, onUnpin, delay = 1.5, className = "" }: { note: Note; onOpen: () => void; onUnpin: () => void; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={`relative ${className}`}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 60, rotate: 4 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, rotate: -1.5 }}
      transition={{ delay: reduce ? 0.2 : delay, type: "spring", stiffness: 120, damping: 16 }}
    >
      <motion.div layoutId={LAYOUT_ID} className="rounded-2xl">
        <button type="button" onClick={onOpen} className="block w-full cursor-zoom-in text-left" aria-label="Read the whole note">
          <NoteCard to={note.to} from={note.from} message={note.message} style={note.style} className="!p-5 sm:!p-6 [&_.pp-note-msg]:line-clamp-4 lg:[&_.pp-note-msg]:line-clamp-[12]" />
        </button>
      </motion.div>
      <button
        type="button"
        onClick={onUnpin}
        className="absolute -top-3 -left-3 z-10 grid size-9 place-items-center rounded-full border-[1.5px] border-ink bg-paper text-ink shadow-[2px_2px_0_0_var(--color-ink)] transition hover:-translate-y-0.5"
        aria-label="Tuck the note into the bouquet"
        title="Tuck it into the bouquet"
      >
        <PinOff className="size-4" aria-hidden />
      </button>
    </motion.div>
  );
}

/** The note opened full size: flies out of the bouquet and unfolds. Pin keeps it beside the bouquet. */
export function OpenNote({ note, pinned, onClose, onTogglePin }: { note: Note; pinned: boolean; onClose: () => void; onTogglePin: () => void }) {
  const reduce = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`Note${note.from ? ` from ${note.from}` : ""}`}
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/35 p-4 backdrop-blur-[3px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-[min(30rem,100%)] [perspective:1200px]">
        <motion.div layoutId={LAYOUT_ID} className="rounded-2xl" transition={{ type: "spring", stiffness: 180, damping: 22 }}>
          {/* Unfolds like a folded card being opened. */}
          <motion.div
            initial={reduce ? { opacity: 0 } : { rotateX: -80, opacity: 0.4 }}
            animate={{ rotateX: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { rotateX: -80, opacity: 0 }}
            transition={{ delay: reduce ? 0 : 0.18, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: "top center" }}
          >
            <NoteCard to={note.to} from={note.from} message={note.message} style={note.style} />
          </motion.div>
        </motion.div>
        <motion.div className="mt-5 flex flex-wrap justify-center gap-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.5 } }} exit={{ opacity: 0 }}>
          <button type="button" onClick={onTogglePin} className="btn-secondary !py-2.5 text-sm">
            {pinned ? <PinOff className="size-4" aria-hidden /> : <Pin className="size-4" aria-hidden />}
            {pinned ? "Tuck into bouquet" : "Pin beside bouquet"}
          </button>
          <button ref={closeRef} type="button" onClick={onClose} className="btn-primary !py-2.5 text-sm">
            <X className="size-4" aria-hidden /> {pinned ? "Close" : "Tuck it back"}
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
