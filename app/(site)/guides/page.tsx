import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { GUIDES } from "@/lib/content/guides";
import { JsonLd, collectionLd } from "@/lib/seo/jsonld";

export const metadata: Metadata = {
  title: "Guides – Sending Digital Flowers",
  description: "Short guides on sending digital flower bouquets, flower color meanings, and when digital flowers beat real ones.",
  alternates: { canonical: "/guides" },
};

export default function GuidesIndex() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <JsonLd
        data={collectionLd({
          name: "Guides",
          description: metadata.description as string,
          path: "/guides",
          items: GUIDES.map((x) => ({ name: x.title, path: `/guides/${x.slug}` })),
        })}
      />
      <Breadcrumbs items={[{ name: "Guides", path: "/guides" }]} />
      <h1 className="mt-6 font-display text-5xl sm:text-6xl">Guides</h1>
      <ul className="mt-8 space-y-4">
        {GUIDES.map((g) => (
          <li key={g.slug}>
            <Link href={`/guides/${g.slug}`} className="block rounded-[var(--radius-card)] border border-line bg-paper p-6 transition hover:border-ink hover:shadow-[3px_3px_0_0_var(--color-ink)]">
              <h2 className="font-display text-3xl leading-tight">{g.title}</h2>
              <p className="mt-2 text-ink/75">{g.metaDescription}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
