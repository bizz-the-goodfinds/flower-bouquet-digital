"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const LINKS = [
  { href: "/create", label: "Make a bouquet" },
  { href: "/occasions", label: "Occasions" },
  { href: "/flowers", label: "Flower meanings" },
  { href: "/guides", label: "Guides" },
  { href: "/garden", label: "My bouquets" },
  { href: "/faq", label: "FAQ" },
];

/** Phone-only menu. Built on <details> so it works before hydration; closes on navigation. */
export function MobileMenu() {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();
  useEffect(() => {
    ref.current?.removeAttribute("open");
  }, [pathname]);

  return (
    <details ref={ref} data-track="mobile_menu_opened" className="group relative md:hidden">
      <summary
        aria-label="Menu"
        className="grid size-11 cursor-pointer list-none place-items-center rounded-full hover:bg-ink/5 [&::-webkit-details-marker]:hidden"
      >
        <Menu className="size-6 group-open:hidden" aria-hidden />
        <X className="hidden size-6 group-open:block" aria-hidden />
      </summary>
      <nav
        aria-label="Mobile"
        className="absolute right-0 top-13 z-50 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border-[1.5px] border-ink bg-paper p-2 shadow-[3px_3px_0_0_var(--color-ink)]"
      >
        <ul>
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={pathname === l.href ? "page" : undefined}
                className="flex min-h-12 items-center rounded-xl px-4 text-base hover:bg-cream aria-[current=page]:font-semibold"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </details>
  );
}
