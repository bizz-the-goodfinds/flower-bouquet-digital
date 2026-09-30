"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * A modal panel: bottom sheet on phones, centred card on wider screens. Closes on Escape and backdrop tap.
 * Rendered into <body> so a form inside it is never nested in the page's own form.
 */
export function Sheet({ title, onClose, children, wide = false }: { title: ReactNode; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    return () => d?.close();
  }, []);

  return createPortal(
    <dialog
      ref={ref}
      aria-labelledby="sheet-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className={`mx-auto mt-auto mb-0 max-h-[92dvh] w-full max-w-none overflow-y-auto overscroll-contain rounded-t-[1.75rem] border-[1.5px] border-b-0 border-ink bg-paper p-0 text-ink backdrop:bg-ink/50 backdrop:backdrop-blur-sm open:animate-[pp-dialog_.18s_ease-out] sm:m-auto sm:w-[min(100%-1.5rem,var(--sheet-w))] sm:rounded-[1.75rem] sm:border-b-[1.5px] sm:shadow-[5px_5px_0_0_var(--color-ink)]`}
      style={{ "--sheet-w": wide ? "36rem" : "28rem" } as React.CSSProperties}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-paper/95 px-5 py-3 backdrop-blur">
        <h2 id="sheet-title" className="min-w-0 font-display text-2xl leading-tight">
          {title}
        </h2>
        <button type="button" onClick={onClose} className="grid size-11 shrink-0 place-items-center rounded-full border border-line hover:bg-cream" aria-label="Close">
          <X className="size-5" aria-hidden />
        </button>
      </div>
      <div className="px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{children}</div>
    </dialog>,
    document.body,
  );
}
