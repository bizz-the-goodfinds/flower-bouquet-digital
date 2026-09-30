"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BloomLoader } from "@/components/ui/bloom-loader";
import { AiError, PROVIDERS, finishOpenRouterSignIn } from "@/lib/ai/providers";
import { saveConnection } from "@/lib/ai/key";
import { track } from "@/lib/analytics/track";

export function OpenRouterCallback() {
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const params = new URLSearchParams(location.search);
    const code = params.get("code");
    // The code is single-use: drop it from the address bar and history right away.
    history.replaceState(null, "", "/ai/callback");
    if (!code) {
      setTimeout(() => setError("OpenRouter didn't finish signing you in. You can try again from the note writer."), 0);
      return;
    }
    finishOpenRouterSignIn(code)
      .then((key) => {
        saveConnection({ provider: "openrouter", key, model: PROVIDERS.openrouter.defaultModel }, { remember: false, method: "oauth" });
        track("ai_key_connected", { provider: "openrouter", method: "oauth", remember: false });
        location.replace("/create?resume=write");
      })
      .catch((err) => setError(err instanceof AiError ? err.message : "Couldn't connect OpenRouter. Try again."));
  }, []);

  if (error)
    return (
      <div className="max-w-sm text-center">
        <p className="font-display text-3xl">Almost there</p>
        <p role="alert" className="mt-2 text-ink/75">
          {error}
        </p>
        <Link href="/create?resume=write" className="btn-primary mt-6">
          Back to your bouquet
        </Link>
      </div>
    );
  return <BloomLoader label="Connecting OpenRouter…" />;
}
