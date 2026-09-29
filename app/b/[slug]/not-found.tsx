import Link from "next/link";
import { LogoMark } from "@/components/ui/logo";

export default function BouquetNotFound() {
  return (
    <main id="main" className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <LogoMark className="mx-auto size-16 -rotate-12 opacity-60 grayscale" />
        <h1 className="mt-6 font-display text-5xl">This bouquet has wilted</h1>
        <p className="mx-auto mt-3 max-w-sm text-ink/75">The link may be mistyped, or the sender deleted it. Good news: making a fresh one takes a minute.</p>
        <Link href="/create" className="btn-primary mt-8">
          Make a bouquet
        </Link>
      </div>
    </main>
  );
}
