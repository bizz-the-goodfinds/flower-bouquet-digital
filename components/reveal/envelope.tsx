"use client";

import { motion, useReducedMotion } from "motion/react";

export function Envelope({ to, from, onOpen, locked }: { to: string; from: string; onOpen?: () => void; locked?: React.ReactNode }) {
  const reduce = useReducedMotion();
  const Tag = onOpen ? motion.button : motion.div;
  return (
    <div className="flex flex-col items-center text-center">
      <p className="label">{from ? `${from} sent you` : "someone sent you"}</p>
      <h1 className="mt-2 font-display text-5xl leading-none sm:text-6xl">
        a bouquet{to ? <>, <em className="text-petal-deep">{to}</em></> : null}
      </h1>
      <Tag
        {...(onOpen ? { onClick: onOpen, type: "button" as const, "aria-label": "Unwrap your bouquet" } : {})}
        initial={reduce ? false : { y: 20, opacity: 0 }}
        animate={reduce ? undefined : { y: 0, opacity: 1 }}
        whileHover={onOpen && !reduce ? { rotate: -2, scale: 1.02 } : undefined}
        whileTap={onOpen && !reduce ? { scale: 0.97 } : undefined}
        className="group relative mt-10 w-[min(84vw,380px)] cursor-pointer"
      >
        <svg viewBox="0 0 380 260" className="h-auto w-full drop-shadow-[4px_4px_0_var(--color-ink)]" aria-hidden>
          <rect x="4" y="4" width="372" height="252" rx="14" fill="#FFFDF8" stroke="#1B1A17" strokeWidth="3" />
          <path d="M6 18 L190 150 L374 18" fill="none" stroke="#1B1A17" strokeWidth="3" strokeLinejoin="round" />
          <path d="M6 250 L150 124 M374 250 L230 124" fill="none" stroke="#1B1A17" strokeWidth="2" opacity=".35" />
          <path d="M8 16 L190 146 L372 16 L372 10 Q372 6 366 6 L14 6 Q8 6 8 10Z" fill="#FBE3EA" />
          <g transform="translate(190 148)">
            <circle r="30" fill="#D6336C" stroke="#1B1A17" strokeWidth="3" />
            {[0, 72, 144, 216, 288].map((a) => (
              <path key={a} d="M0 0 C6 -2 7 -11 0 -12 C-7 -11 -6 -2 0 0Z" transform={`rotate(${a})`} fill="#F4A6C0" stroke="#8C1D45" strokeWidth="1.5" />
            ))}
            <circle r="4" fill="#F7DE8A" />
          </g>
        </svg>
        {onOpen && (
          <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-cream shadow-[3px_3px_0_0_var(--color-petal)] transition group-hover:-translate-y-0.5">
            Tap to unwrap 💐
          </span>
        )}
      </Tag>
      {locked}
    </div>
  );
}
