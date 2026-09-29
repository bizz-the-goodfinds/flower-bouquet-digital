import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" aria-label="Petalpost home" className="shrink-0">
          <Logo />
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 text-[15px]">
          <Link href="/flowers" className="btn-ghost hidden sm:inline-flex">
            Meanings
          </Link>
          <Link href="/occasions" className="btn-ghost hidden sm:inline-flex">
            Occasions
          </Link>
          <Link href="/garden" className="btn-ghost hidden md:inline-flex">
            My bouquets
          </Link>
          <Link href="/create" className="btn-primary ml-1 !px-4 !py-2">
            Make one
          </Link>
        </nav>
      </div>
    </header>
  );
}
