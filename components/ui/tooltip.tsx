"use client";

import { useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Small tooltip for icon buttons. Shows on hover, keyboard focus and long-press (touch).
 * Rendered in a portal with fixed positioning so scrolling toolbars can't clip it.
 */
export function Tooltip({ label, side = "top", children }: { label: string; side?: "top" | "bottom"; children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const press = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    const r = ref.current?.getBoundingClientRect();
    if (r) setPos({ x: r.left + r.width / 2, y: side === "top" ? r.top : r.bottom });
  };
  const hide = () => setPos(null);

  return (
    <span
      ref={ref}
      className="inline-flex shrink-0"
      onPointerEnter={(e) => e.pointerType === "mouse" && show()}
      onPointerLeave={hide}
      onFocus={(e) => e.target.matches(":focus-visible") && show()}
      onBlur={hide}
      onTouchStart={() => {
        press.current = setTimeout(() => {
          show();
          setTimeout(hide, 1400);
        }, 450);
      }}
      onTouchEnd={() => press.current && clearTimeout(press.current)}
      onTouchMove={() => press.current && clearTimeout(press.current)}
    >
      {children}
      {pos &&
        createPortal(
          <span
            role="tooltip"
            style={{ left: pos.x, top: pos.y }}
            className={`pointer-events-none fixed z-[60] -translate-x-1/2 rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-cream shadow-lg ${side === "top" ? "-translate-y-[calc(100%+8px)]" : "translate-y-2"}`}
          >
            {label}
          </span>,
          document.body,
        )}
    </span>
  );
}
