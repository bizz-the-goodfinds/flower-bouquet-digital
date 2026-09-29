"use client";

import { useEffect } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/ui/logo";
import { track } from "@/lib/analytics/track";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
    track("app_error", { digest: error.digest ?? "none" });
  }, [error]);

  return (
    <main id="main" className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <LogoMark className="mx-auto size-16 -rotate-6" />
        <h1 className="mt-6 font-display text-5xl">A petal fell off</h1>
        <p className="mx-auto mt-3 max-w-sm text-ink/75">Something went wrong on our side. Your draft is saved, so nothing is lost.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button className="btn-primary" onClick={() => retry()}>
            Try again
          </button>
          <Link href="/" className="btn-secondary">
            Home
          </Link>
        </div>
        {error.digest && <p className="mt-6 font-mono text-xs text-ink-soft">Error ref: {error.digest}</p>}
      </div>
    </main>
  );
}
