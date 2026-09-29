import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { OCCASIONS } from "@/lib/content/occasions";
import { FLOWER_FAMILIES } from "@/lib/content/flowers";
import { GUIDES } from "@/lib/content/guides";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-paper/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-soft">{site.definition}</p>
          <Link href="/create" className="btn-secondary mt-6 !py-2">
            Make a bouquet
          </Link>
        </div>
        <FooterCol title="Occasions" links={OCCASIONS.slice(0, 7).map((o) => ({ href: `/occasions/${o.slug}`, label: o.name }))} />
        <FooterCol title="Flower meanings" links={FLOWER_FAMILIES.slice(0, 7).map((f) => ({ href: `/flowers/${f.slug}`, label: f.name }))} />
        <FooterCol
          title="Petalpost"
          links={[
            ...GUIDES.map((g) => ({ href: `/guides/${g.slug}`, label: g.title.split(/[:(–]/)[0].trim() })),
            { href: "/faq", label: "FAQ" },
            { href: "/about", label: "About" },
            { href: "/privacy", label: "Privacy" },
            { href: "/terms", label: "Terms" },
          ]}
        />
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-ink-soft">
          © {new Date().getFullYear()} {site.name}. Flowers that never wilt. Made with 💐
        </p>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="label mb-3">{title}</p>
      <ul className="space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-ink/80 hover:text-ink hover:underline underline-offset-2">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
