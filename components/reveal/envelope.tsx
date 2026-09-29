"use client";

import { motion, useReducedMotion } from "motion/react";
import { DEFAULT_ENVELOPE, envelopeSvg, type EnvelopeLook } from "@/lib/bouquet/envelope";

export function EnvelopeArt({ look = DEFAULT_ENVELOPE, initial = "", className = "" }: { look?: EnvelopeLook; initial?: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 380 260"
      className={`h-auto w-full drop-shadow-[4px_4px_0_var(--color-ink)] ${className}`}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: envelopeSvg(look, initial) }}
    />
  );
}

export function Envelope({
  to,
  from,
  look,
  onOpen,
  locked,
  as = "h1",
}: {
  to: string;
  from: string;
  look?: EnvelopeLook;
  onOpen?: () => void;
  locked?: React.ReactNode;
  as?: "h1" | "h2";
}) {
  const reduce = useReducedMotion();
  const Tag = onOpen ? motion.button : motion.div;
  const Heading = as;
  return (
    <div className="flex flex-col items-center text-center">
      <p className="label">{from ? `${from} sent you` : "someone sent you"}</p>
      <Heading className="mt-2 font-display text-4xl leading-tight sm:text-6xl">
        a bouquet{to ? <>, <em className="text-petal-deep [overflow-wrap:anywhere]">{to}</em></> : null}
      </Heading>
      <Tag
        {...(onOpen ? { onClick: onOpen, type: "button" as const, "aria-label": "Unwrap your bouquet" } : {})}
        initial={reduce ? false : { y: 20, opacity: 0 }}
        animate={reduce ? undefined : { y: 0, opacity: 1 }}
        whileHover={onOpen && !reduce ? { rotate: -2, scale: 1.02 } : undefined}
        whileTap={onOpen && !reduce ? { scale: 0.97 } : undefined}
        className="group relative mt-8 w-[min(84vw,380px)] cursor-pointer sm:mt-10"
      >
        <EnvelopeArt look={look} initial={from} />
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
