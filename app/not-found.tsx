import Link from "next/link";
import { LogoMark } from "@/components/ui/logo";

export default function NotFound() {
  return (
    <main id="main" className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <LogoMark className="mx-auto size-16 rotate-12" />
        <h1 className="mt-6 font-display text-6xl">404: no blooms here</h1>
        <p className="mx-auto mt-3 max-w-sm text-ink/75">This page doesn&rsquo;t exist. Maybe make someone a bouquet instead?</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/create" className="btn-primary">
            Make a bouquet
          </Link>
          <Link href="/" className="btn-secondary">
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
