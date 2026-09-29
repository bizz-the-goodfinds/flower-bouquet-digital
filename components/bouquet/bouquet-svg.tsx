"use client";

import { forwardRef, useMemo, type PointerEvent as RPointerEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ribbonMarkup, wrapperBack, wrapperFront } from "@/lib/bouquet/art";
import { DEFAULTS, RIBBONS, STEM_BY_SLUG, WRAPPERS } from "@/lib/bouquet/catalog";
import {
  CANVAS,
  HEAD_SCALE,
  backgroundMarkup,
  headTransform,
  isGreenery,
  sprigGeometry,
  stemArt,
  stemPath,
  stemStroke,
  type Design,
} from "@/lib/bouquet/composition";

type Props = {
  design: Design;
  className?: string;
  label?: string;
  showBackground?: boolean;
  selectedId?: string | null;
  /** Staggered bloom-in animation (recipient view). */
  bloom?: boolean;
  onItemPointerDown?: (id: string, e: RPointerEvent<SVGGElement>) => void;
  onBackgroundPointerDown?: (e: RPointerEvent<SVGGElement>) => void;
  onPointerMove?: (e: RPointerEvent<SVGSVGElement>) => void;
  onPointerEnd?: (e: RPointerEvent<SVGSVGElement>) => void;
};

function Grow({ bloom, delay, origin, children }: { bloom?: boolean; delay: number; origin: string; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  if (!bloom) return <g className="pp-pop">{children}</g>;
  return (
    <motion.g
      initial={reduce ? { opacity: 0 } : { scale: 0, opacity: 0 }}
      animate={reduce ? { opacity: 1 } : { scale: 1, opacity: 1 }}
      transition={reduce ? { duration: 0.3, delay: delay * 0.3 } : { delay, type: "spring", stiffness: 240, damping: 16 }}
      style={{ transformBox: "fill-box", transformOrigin: origin }}
    >
      {children}
    </motion.g>
  );
}

export const BouquetSvg = forwardRef<SVGSVGElement, Props>(function BouquetSvg(
  { design, className, label = "Flower bouquet", showBackground = true, selectedId, bloom, onItemPointerDown, onBackgroundPointerDown, onPointerMove, onPointerEnd },
  ref,
) {
  const paper = WRAPPERS[design.wrapper] ?? WRAPPERS[DEFAULTS.wrapper];
  const ribbon = RIBBONS[design.ribbon] ?? RIBBONS[DEFAULTS.ribbon];
  const back = useMemo(() => wrapperBack(paper), [paper]);
  const front = useMemo(() => wrapperFront(paper) + ribbonMarkup(ribbon.color, ribbon.dark), [paper, ribbon]);
  const bg = useMemo(() => backgroundMarkup(design.background), [design.background]);

  const greens = design.items.filter(isGreenery);
  const blooms = design.items.filter((i) => !isGreenery(i));
  const interactive = Boolean(onItemPointerDown);
  const selected = design.items.find((i) => i.id === selectedId);
  const base = bloom ? 0.35 : 0;

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${CANVAS.w} ${CANVAS.h}`}
      className={className}
      role="img"
      aria-label={label}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      {showBackground && <g onPointerDown={onBackgroundPointerDown} dangerouslySetInnerHTML={{ __html: bg }} />}
      <g onPointerDown={onBackgroundPointerDown} dangerouslySetInnerHTML={{ __html: back }} />

      {greens.map((g, i) => {
        const { len, transform } = sprigGeometry(g);
        return (
          <g
            key={g.id}
            transform={transform}
            onPointerDown={interactive ? (e) => onItemPointerDown!(g.id, e) : undefined}
            style={interactive ? { cursor: "grab" } : undefined}
          >
            <Grow bloom={bloom} delay={base + i * 0.08} origin="center bottom">
              <g dangerouslySetInnerHTML={{ __html: stemArt(g.f, len) }} />
            </Grow>
          </g>
        );
      })}

      <g pointerEvents="none" dangerouslySetInnerHTML={{ __html: blooms.map((b) => stemStroke(stemPath(b))).join("") }} />

      {blooms.map((b, i) => (
        <g
          key={b.id}
          transform={headTransform(b)}
          onPointerDown={interactive ? (e) => onItemPointerDown!(b.id, e) : undefined}
          style={interactive ? { cursor: "grab" } : undefined}
        >
          <Grow bloom={bloom} delay={base + greens.length * 0.08 + i * 0.09} origin="center">
            <g dangerouslySetInnerHTML={{ __html: stemArt(b.f) }} />
          </Grow>
        </g>
      ))}

      <g pointerEvents="none" dangerouslySetInnerHTML={{ __html: front }} />

      {selected && (
        <circle
          cx={selected.x}
          cy={selected.y}
          r={isGreenery(selected) ? 46 : (STEM_BY_SLUG.get(selected.f)?.size ?? 60) * selected.s * HEAD_SCALE * 0.85 + 12}
          fill="none"
          stroke="#D6336C"
          strokeWidth={4}
          strokeDasharray="12 10"
          pointerEvents="none"
          className="pp-marching"
        />
      )}
    </svg>
  );
});
