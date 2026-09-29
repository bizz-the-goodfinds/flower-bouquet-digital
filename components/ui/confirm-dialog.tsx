"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

export type ConfirmOptions = {
  title: string;
  description?: ReactNode;
  /** Optional visual (e.g. the bouquet being deleted). */
  preview?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
};

type Pending = ConfirmOptions & { resolve: (ok: boolean) => void };

/**
 * Branded replacement for window.confirm().
 * Usage: const [confirmDialog, confirm] = useConfirm(); ... if (await confirm({...})) ...; render {confirmDialog}.
 */
export function useConfirm() {
  const [pending, setPending] = useState<Pending | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => new Promise<boolean>((resolve) => setPending({ ...opts, resolve })), []);

  const close = (ok: boolean) => {
    pending?.resolve(ok);
    setPending(null);
  };

  const dialog = pending ? <ConfirmDialog {...pending} onClose={close} /> : null;
  return [dialog, confirm] as const;
}

function ConfirmDialog({ title, description, preview, confirmLabel = "Confirm", cancelLabel = "Cancel", tone = "default", onClose }: ConfirmOptions & { onClose: (ok: boolean) => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    return () => d?.close();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose(false);
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose(false); // click on backdrop
      }}
      className="m-auto w-[min(100%-1.5rem,26rem)] rounded-[1.75rem] border-[1.5px] border-ink bg-paper p-0 text-ink shadow-[5px_5px_0_0_var(--color-ink)] backdrop:bg-ink/50 backdrop:backdrop-blur-sm open:animate-[pp-dialog_.18s_ease-out]"
    >
      <div className="p-6 text-center">
        {preview ? (
          <div className="mx-auto mb-4 w-32">{preview}</div>
        ) : (
          tone === "danger" && (
            <span className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-petal/30 text-petal-deep">
              <AlertTriangle className="size-6" aria-hidden />
            </span>
          )
        )}
        <h2 id="confirm-dialog-title" className="font-display text-2xl leading-tight">
          {title}
        </h2>
        {description && <div className="mt-2 text-[15px] leading-relaxed text-ink/75">{description}</div>}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
          <button type="button" className="btn-ghost min-h-11 border border-line" onClick={() => onClose(false)} autoFocus>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={tone === "danger" ? "btn min-h-11 bg-petal-deep text-cream shadow-[3px_3px_0_0_var(--color-ink)] hover:-translate-y-0.5" : "btn-primary min-h-11"}
            onClick={() => onClose(true)}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
