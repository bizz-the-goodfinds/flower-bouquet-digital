"use client";

import { useEffect, useState } from "react";

const INK = "#1B1A17";

function Petals({ color, r = 7 }: { color: string; r?: number }) {
  return (
    <>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cy={-r} rx={r * 0.62} ry={r} transform={`rotate(${a})`} fill={color} stroke={INK} strokeWidth="1.6" />
      ))}
      <circle r={r * 0.45} fill="#F7DE8A" stroke={INK} strokeWidth="1.4" />
    </>
  );
}

const HEADS = [
  { x: 36, y: 46, color: "#F4A6C0", delay: "0s" },
  { x: 60, y: 32, color: "#E8553E", delay: ".25s" },
  { x: 84, y: 46, color: "#C9B8F2", delay: ".5s" },
] as const;

/** The looping mini bouquet: stems grow, flowers bloom one by one, the bow is tied. */
export function BouquetMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 140" className={className} aria-hidden>
      <path d="M22 74 L98 74 L68 134 L52 134Z" fill="#D2AE85" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      {HEADS.map((h) => (
        <path key={h.x} d={`M60 104 Q${(60 + h.x) / 2} ${(104 + h.y) / 2 + 6} ${h.x} ${h.y}`} className="pp-load-stem" style={{ animationDelay: h.delay }} fill="none" stroke="#6E9C63" strokeWidth="3.5" strokeLinecap="round" pathLength={1} />
      ))}
      {HEADS.map((h) => (
        <g key={h.x} transform={`translate(${h.x} ${h.y})`}>
          <g className="pp-load-head" style={{ animationDelay: h.delay }}>
            <Petals color={h.color} r={h.x === 60 ? 9 : 7.5} />
          </g>
        </g>
      ))}
      <path d="M28 88 C44 94 76 94 92 88 L70 134 L50 134Z" fill="#E6CFAE" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <g className="pp-load-bow">
        <path d="M60 94 C52 86 44 88 46 94 C48 100 56 98 60 94Z M60 94 C68 86 76 88 74 94 C72 100 64 98 60 94Z" fill="#E8553E" stroke={INK} strokeWidth="1.8" />
        <circle cx="60" cy="94" r="3" fill="#B83A28" stroke={INK} strokeWidth="1.5" />
      </g>
    </svg>
  );
}

const STEPS = ["Picking the freshest stems…", "Arranging your flowers…", "Tying the ribbon…", "Sealing the envelope…"];

/**
 * A tiny bouquet that builds itself on a loop: stems grow, flowers bloom one by one, the bow is tied.
 * Stays invisible for a moment so fast loads never flash, then walks through the steps of making a bouquet.
 */
export function BloomLoader({ label, steps = STEPS, delay = 180, className = "" }: { label?: string; steps?: string[]; delay?: number; className?: string }) {
  const [shown, setShown] = useState(delay === 0);
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setShown(true), delay);
    const id = setInterval(() => setStep((n) => n + 1), 2400);
    return () => {
      clearTimeout(t);
      clearInterval(id);
    };
  }, [delay]);
  // The first caption is the page's own (e.g. "Fetching your envelope…"); then it walks through the steps.
  const text = step === 0 && label ? label : steps[(step - (label ? 1 : 0)) % steps.length];
  return (
    <div role="status" aria-live="polite" className={`flex flex-col items-center gap-3 text-center transition-opacity duration-300 ${shown ? "opacity-100" : "opacity-0"} ${className}`}>
      <BouquetMark className="h-28 w-24" />
      <p key={text} className="pp-load-label font-display text-xl text-ink/80 italic">
        {text}
      </p>
    </div>
  );
}

/** A single spinning flower, sized like an icon. Drop-in for button spinners. */
export function MiniBloom({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="-12 -12 24 24" className={`animate-[spin_1.6s_linear_infinite] ${className}`} aria-hidden>
      <Petals color="currentColor" r={5.5} />
    </svg>
  );
}

/** Placeholder block with a soft petal-coloured shimmer. */
export function Shimmer({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`pp-shimmer rounded-[var(--radius-card)] ${className}`} />;
}

/** Skeleton of a bouquet card (garden lists): a bouquet building itself where the thumbnail will be. */
export function BouquetCardSkeleton() {
  return (
    <div aria-hidden className="flex gap-4 rounded-[var(--radius-card)] border border-line bg-paper p-4">
      <div className="relative grid h-28 w-24 shrink-0 place-items-center overflow-hidden rounded-xl">
        <Shimmer className="absolute inset-0 !rounded-xl opacity-70" />
        <BouquetMark className="relative h-24 w-20" />
      </div>
      <div className="flex-1 space-y-2 pt-1">
        <Shimmer className="h-4 w-16 !rounded-full" />
        <Shimmer className="h-6 w-3/4 !rounded-lg" />
        <Shimmer className="h-4 w-1/3 !rounded-lg" />
        <Shimmer className="h-4 w-1/2 !rounded-lg" />
      </div>
    </div>
  );
}
