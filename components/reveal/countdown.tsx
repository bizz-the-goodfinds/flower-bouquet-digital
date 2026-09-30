"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fmtZoned } from "@/lib/time/zone";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

export function Countdown({ revealAt }: { revealAt: string }) {
  const router = useRouter();
  const target = new Date(revealAt).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const n = Date.now();
      setNow(n);
      if (n >= target) {
        clearInterval(id);
        router.refresh();
      }
    };
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [target, router]);

  const p = parts(now === null ? 0 : target - now);
  const opens = new Date(revealAt);
  return (
    <div className="mt-10">
      <p className="label">it blooms in</p>
      <div className="mt-3 flex justify-center gap-2 font-mono" aria-live="off" role="timer">
        {(
          [
            ["d", "days"],
            ["h", "hrs"],
            ["m", "min"],
            ["s", "sec"],
          ] as const
        ).map(([k, label]) => (
          <div key={k} className="w-16 rounded-xl border-[1.5px] border-ink bg-paper py-2 shadow-[2px_2px_0_0_var(--color-ink)]">
            <div className="text-2xl tabular-nums">{now === null ? "--" : String(p[k]).padStart(2, "0")}</div>
            <div className="text-xs tracking-wider text-ink-soft uppercase">{label}</div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-ink-soft" suppressHydrationWarning>
        Opens {now === null ? "soon" : `${fmtZoned(opens)} your time`}. Come back then, or keep this tab open.
      </p>
    </div>
  );
}
