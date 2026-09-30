"use client";

import { useEffect, useState } from "react";
import { Download, PlusSquare, Share, X } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { canPromptInstall, isIos, isStandalone, onInstallChange, promptInstall } from "@/lib/pwa/client";
import { nudgeDismissed, nudgeDone, nudgeDue } from "@/lib/pwa/nudge";
import { track } from "@/lib/analytics/track";

/**
 * "Add to home screen" card for the sent screen and My bouquets: the browser's own install prompt on Android and
 * desktop Chrome/Edge, a short illustrated guide on iOS. Shares its "Not now" backoff with the page-level nudge.
 */
export function InstallPrompt({ where }: { where: "sent" | "garden" }) {
  const [mode, setMode] = useState<"prompt" | "ios" | null>(null);
  const [guide, setGuide] = useState(false);

  useEffect(() => {
    const decide = () => {
      if (isStandalone()) {
        nudgeDone("install");
        return setMode(null);
      }
      if (!nudgeDue("install")) return setMode(null);
      setMode(canPromptInstall() ? "prompt" : isIos() ? "ios" : null);
    };
    const t = setTimeout(decide, 0);
    const off = onInstallChange(decide);
    return () => {
      clearTimeout(t);
      off();
    };
  }, []);

  if (!mode) return null;

  const dismiss = () => {
    nudgeDismissed("install");
    setMode(null);
    track("install_dismissed", { where });
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-paper p-3 pl-4">
      <Download className="size-5 shrink-0" aria-hidden />
      <p className="min-w-0 flex-1 text-sm">
        <span className="font-medium">Keep your bouquets one tap away.</span> <span className="text-ink/70">Add the app to your home screen.</span>
      </p>
      <button
        type="button"
        className="btn-primary shrink-0 !px-3.5 !py-2 text-sm"
        onClick={async () => {
          track("install_clicked", { where, platform: mode });
          if (mode === "ios") return setGuide(true);
          const outcome = await promptInstall();
          track("install_prompt_result", { outcome, where });
          if (outcome === "accepted") nudgeDone("install");
          else nudgeDismissed("install");
          setMode(null);
        }}
      >
        Add
      </button>
      <button type="button" onClick={dismiss} className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-cream" aria-label="Not now">
        <X className="size-4" aria-hidden />
      </button>
      {guide && (
        <IosInstallSheet
          onClose={() => {
            setGuide(false);
            nudgeDone("install");
            setMode(null);
          }}
        />
      )}
    </div>
  );
}

/** iOS has no install prompt: three illustrated steps in Safari. */
export function IosInstallSheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet title="Add to Home Screen" onClose={onClose}>
      <ol className="space-y-4">
        <li className="flex items-center gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl border-[1.5px] border-ink bg-cream">
            <Share className="size-6 text-[#0A84FF]" aria-hidden />
          </span>
          <span>
            <span className="block font-medium">1. Tap Share</span>
            <span className="text-sm text-ink/70">The square with an arrow, in Safari&rsquo;s toolbar.</span>
          </span>
        </li>
        <li className="flex items-center gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl border-[1.5px] border-ink bg-cream">
            <PlusSquare className="size-6" aria-hidden />
          </span>
          <span>
            <span className="block font-medium">2. Tap &ldquo;Add to Home Screen&rdquo;</span>
            <span className="text-sm text-ink/70">Scroll down the list if you don&rsquo;t see it.</span>
          </span>
        </li>
        <li className="flex items-center gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl border-[1.5px] border-ink bg-petal/40 text-xl">💐</span>
          <span>
            <span className="block font-medium">3. Tap Add</span>
            <span className="text-sm text-ink/70">Open it from your Home Screen. From there you can also turn on notifications (iOS 16.4+).</span>
          </span>
        </li>
      </ol>
      <button type="button" className="btn-primary mt-6 w-full" onClick={onClose}>
        Got it
      </button>
    </Sheet>
  );
}
