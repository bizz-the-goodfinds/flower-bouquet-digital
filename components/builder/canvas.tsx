"use client";

import { useCallback, useRef, type KeyboardEvent, type PointerEvent as RPointerEvent } from "react";
import { BouquetSvg } from "@/components/bouquet/bouquet-svg";
import { STEM_BY_SLUG } from "@/lib/bouquet/catalog";
import type { Item } from "@/lib/bouquet/composition";
import { useBuilder } from "@/lib/bouquet/store";

type Pt = { x: number; y: number };
type Gesture = {
  id: string;
  start: Pt;
  item: Item;
  moved: boolean;
  pinch?: { dist: number; angle: number; s: number; r: number };
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function BuilderCanvas() {
  const design = useBuilder((s) => s.design);
  const selectedId = useBuilder((s) => s.selectedId);
  const svgRef = useRef<SVGSVGElement>(null);
  const pointers = useRef(new Map<number, Pt>());
  const gesture = useRef<Gesture | null>(null);

  const toSvg = useCallback((e: { clientX: number; clientY: number }): Pt => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const m = svg.getScreenCTM();
    const p = m ? pt.matrixTransform(m.inverse()) : pt;
    return { x: p.x, y: p.y };
  }, []);

  const capture = (id: number) => {
    try {
      svgRef.current?.setPointerCapture(id);
    } catch {
      // Some browsers reject capture for pointers that already ended; dragging still works without it.
    }
  };

  const startPinch = () => {
    const g = gesture.current;
    if (!g || pointers.current.size < 2) return;
    const [a, b] = [...pointers.current.values()];
    const it = useBuilder.getState().design.items.find((i) => i.id === g.id);
    if (!it) return;
    g.pinch = { dist: Math.hypot(b.x - a.x, b.y - a.y), angle: Math.atan2(b.y - a.y, b.x - a.x), s: it.s, r: it.r };
  };

  const onItemPointerDown = (id: string, e: RPointerEvent<SVGGElement>) => {
    e.stopPropagation();
    capture(e.pointerId);
    pointers.current.set(e.pointerId, toSvg(e));
    const { design: d, select } = useBuilder.getState();
    if (pointers.current.size === 1 || !gesture.current) {
      const item = d.items.find((i) => i.id === id);
      if (!item) return;
      select(id);
      gesture.current = { id, start: toSvg(e), item, moved: false };
    } else startPinch();
  };

  const onBackgroundPointerDown = (e: RPointerEvent<SVGGElement>) => {
    if (gesture.current) {
      capture(e.pointerId);
      pointers.current.set(e.pointerId, toSvg(e));
      startPinch();
    } else useBuilder.getState().select(null);
  };

  const onPointerMove = (e: RPointerEvent<SVGSVGElement>) => {
    const g = gesture.current;
    if (!g || !pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, toSvg(e));
    const st = useBuilder.getState();
    if (g.pinch && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      if (!g.moved) st.snapshot();
      g.moved = true;
      const s = clamp(Math.round(g.pinch.s * (dist / g.pinch.dist) * 100) / 100, 0.5, 1.8);
      let r = g.pinch.r + ((angle - g.pinch.angle) * 180) / Math.PI;
      r = ((((r + 180) % 360) + 360) % 360) - 180;
      st.live((d) => ({ ...d, items: d.items.map((i) => (i.id === g.id ? { ...i, s, r: Math.round(r) } : i)) }));
      return;
    }
    const p = pointers.current.get(e.pointerId)!;
    const dx = p.x - g.start.x;
    const dy = p.y - g.start.y;
    if (!g.moved && Math.hypot(dx, dy) < 6) return;
    if (!g.moved) st.snapshot();
    g.moved = true;
    st.live((d) => ({
      ...d,
      items: d.items.map((i) =>
        i.id === g.id ? { ...i, x: Math.round(clamp(g.item.x + dx, 60, 940)), y: Math.round(clamp(g.item.y + dy, 60, 900)) } : i,
      ),
    }));
  };

  const onPointerEnd = (e: RPointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId);
    const g = gesture.current;
    if (!g) return;
    if (pointers.current.size === 0) gesture.current = null;
    else if (pointers.current.size === 1) {
      // Continue as a drag with the remaining finger.
      const item = useBuilder.getState().design.items.find((i) => i.id === g.id);
      if (item) gesture.current = { id: g.id, start: [...pointers.current.values()][0], item, moved: g.moved };
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const st = useBuilder.getState();
    const items = st.design.items;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
      e.preventDefault();
      if (e.shiftKey) st.redo();
      else st.undo();
      return;
    }
    if (e.key === "n" || e.key === "N") {
      if (!items.length) return;
      const idx = items.findIndex((i) => i.id === st.selectedId);
      st.select(items[(idx + (e.shiftKey ? items.length - 1 : 1)) % items.length].id);
      e.preventDefault();
      return;
    }
    const it = items.find((i) => i.id === st.selectedId);
    if (!it) return;
    const step = e.shiftKey ? 40 : 10;
    const patch: Partial<Item> | null =
      e.key === "ArrowLeft" ? { x: clamp(it.x - step, 60, 940) }
      : e.key === "ArrowRight" ? { x: clamp(it.x + step, 60, 940) }
      : e.key === "ArrowUp" ? { y: clamp(it.y - step, 60, 900) }
      : e.key === "ArrowDown" ? { y: clamp(it.y + step, 60, 900) }
      : e.key === "[" ? { r: clamp(it.r - 15, -180, 180) }
      : e.key === "]" ? { r: clamp(it.r + 15, -180, 180) }
      : e.key === "-" ? { s: clamp(Math.round((it.s - 0.1) * 100) / 100, 0.5, 1.8) }
      : e.key === "=" || e.key === "+" ? { s: clamp(Math.round((it.s + 0.1) * 100) / 100, 0.5, 1.8) }
      : null;
    if (patch) {
      e.preventDefault();
      st.updateItem(it.id, patch);
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      st.removeItem(it.id);
    } else if (e.key === "Escape") st.select(null);
  };

  const selected = design.items.find((i) => i.id === selectedId);

  return (
    <div
      tabIndex={0}
      onKeyDown={onKeyDown}
      role="application"
      aria-roledescription="bouquet editor"
      aria-label="Bouquet canvas. Press N to select the next flower, arrow keys to move, [ and ] to rotate, + and - to resize, Delete to remove."
      className="relative rounded-[1.5rem] outline-offset-4"
    >
      <BouquetSvg
        ref={svgRef}
        design={design}
        selectedId={selectedId}
        label={`Your bouquet with ${design.items.length} stems`}
        onItemPointerDown={onItemPointerDown}
        onBackgroundPointerDown={onBackgroundPointerDown}
        onPointerMove={onPointerMove}
        onPointerEnd={onPointerEnd}
        className="block h-auto w-full touch-none select-none rounded-[1.5rem] ring-1 ring-line"
      />
      <p aria-live="polite" className="sr-only">
        {selected ? `${STEM_BY_SLUG.get(selected.f)?.name} selected` : ""}
      </p>
    </div>
  );
}
