import type { Metadata } from "next";
import { OpenRouterCallback } from "./callback";

export const metadata: Metadata = { title: "Connecting your AI", robots: { index: false, follow: false } };

/** OpenRouter sends people back here after they approve a key for the note writer. */
export default function Page() {
  return (
    <main id="main" className="grid min-h-dvh place-items-center px-4">
      <OpenRouterCallback />
    </main>
  );
}
