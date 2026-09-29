import type { Metadata } from "next";
import Link from "next/link";
import { StaticBouquet, presetDesign } from "@/components/bouquet/static-bouquet";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { OCCASIONS } from "@/lib/content/occasions";
import { JsonLd, collectionLd } from "@/lib/seo/jsonld";

export const metadata: Metadata = {
  title: "Digital Bouquets for Every Occasion",
  description:
    "Ready-made digital bouquets for birthdays, anniversaries, apologies, crushes, best friends, Mother's Day, Valentine's and more. Customize and send free.",
  alternates: { canonical: "/occasions" },
};

export default function OccasionsIndex() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd
        data={collectionLd({
          name: "Occasions",
          description: metadata.description as string,
          path: "/occasions",
          items: OCCASIONS.map((x) => ({ name: x.name, path: `/occasions/${x.slug}` })),
        })}
      />
      <Breadcrumbs items={[{ name: "Occasions", path: "/occasions" }]} />
      <h1 className="mt-6 font-display text-5xl leading-none sm:text-6xl">Bouquets for every moment</h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink/80">
        Start from a bouquet styled for the moment, then make it yours. Each one uses flowers whose meaning fits the occasion, and comes with note
        ideas if you&rsquo;re stuck.
      </p>
      <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {OCCASIONS.map((o, i) => (
          <li key={o.slug}>
            <Link
              href={`/occasions/${o.slug}`}
              className="group flex h-full items-center gap-4 rounded-[var(--radius-card)] border border-line bg-paper p-4 transition hover:-translate-y-0.5 hover:border-ink hover:shadow-[3px_3px_0_0_var(--color-ink)]"
            >
              <StaticBouquet design={presetDesign(o.preset, 100 + i)} label={`${o.name} bouquet`} className="w-20 shrink-0 transition group-hover:-rotate-3 sm:w-24" />
              <div className="min-w-0">
                <h2 className="font-display text-2xl [overflow-wrap:anywhere]">
                  {o.name} <span aria-hidden>{o.emoji}</span>
                </h2>
                <p className="mt-1 text-sm text-ink-soft">{o.flowers.slice(0, 3).join(", ")}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
