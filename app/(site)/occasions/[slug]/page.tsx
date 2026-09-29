import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { StaticBouquet, StemThumb, presetDesign } from "@/components/bouquet/static-bouquet";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { FaqList } from "@/components/marketing/faq-list";
import { FAMILY_BY_SLUG } from "@/lib/content/flowers";
import { OCCASIONS, OCCASION_BY_SLUG } from "@/lib/content/occasions";
import { JsonLd, articleLd, faqLd } from "@/lib/seo/jsonld";

export const dynamicParams = false;
export function generateStaticParams() {
  return OCCASIONS.map((o) => ({ slug: o.slug }));
}

export async function generateMetadata({ params }: PageProps<"/occasions/[slug]">): Promise<Metadata> {
  const o = OCCASION_BY_SLUG.get((await params).slug);
  if (!o) return {};
  return { title: { absolute: o.title }, description: o.metaDescription, alternates: { canonical: `/occasions/${o.slug}` } };
}

export default async function OccasionPage({ params }: PageProps<"/occasions/[slug]">) {
  const o = OCCASION_BY_SLUG.get((await params).slug);
  if (!o) notFound();
  const path = `/occasions/${o.slug}`;
  const others = OCCASIONS.filter((x) => x.slug !== o.slug).slice(0, 6);

  return (
    <article className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd data={[articleLd({ title: o.title, description: o.metaDescription, path, published: "2026-09-29", updated: "2026-09-29" }), faqLd(o.faq)]} />
      <Breadcrumbs items={[{ name: "Occasions", path: "/occasions" }, { name: o.name, path }]} />

      <header className="mt-6 grid items-center gap-8 md:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="label">
            {o.emoji} {o.name}
          </p>
          <h1 className="mt-3 font-display text-5xl leading-[1.02] sm:text-6xl">{o.title.split(" – ")[0]}</h1>
          <p className="mt-5 text-xl leading-relaxed text-ink/85">{o.answer}</p>
          <Link href={`/create?occasion=${o.slug}`} className="btn-primary mt-7 text-base">
            Customize this bouquet <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <StaticBouquet design={presetDesign(o.preset, 7)} label={`${o.name} bouquet preset`} className="mx-auto w-full max-w-sm" />
      </header>

      <div className="mx-auto max-w-3xl">
        <section className="mt-14">
          <h2 className="font-display text-3xl">Best flowers for {o.name.toLowerCase()}</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {o.flowers.map((slug) => {
              const fam = FAMILY_BY_SLUG.get(slug);
              if (!fam) return null;
              return (
                <li key={slug}>
                  <Link href={`/flowers/${slug}`} className="flex items-center gap-4 rounded-2xl border border-line bg-paper p-3 hover:border-ink">
                    <StemThumb slug={fam.stems[0]} className="size-14 shrink-0" />
                    <span>
                      <span className="block font-display text-xl">{fam.name}</span>
                      <span className="line-clamp-2 text-sm text-ink-soft">{fam.answer.split(".")[0]}.</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mt-14">
          <h2 className="font-display text-3xl">{o.name} message ideas</h2>
          <p className="mt-2 text-ink/75">Copy one, or use it as a starting point. They&rsquo;re also one tap away inside the maker.</p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {o.messages.map((m) => (
              <li key={m} className="rounded-2xl border border-line bg-paper px-5 py-4 font-display text-xl leading-snug italic">
                &ldquo;{m}&rdquo;
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14">
          <h2 className="font-display text-3xl">FAQ</h2>
          <FaqList items={o.faq} className="mt-5" />
        </section>

        <section className="mt-14">
          <h2 className="font-display text-3xl">More occasions</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {others.map((x) => (
              <li key={x.slug}>
                <Link href={`/occasions/${x.slug}`} className="chip hover:border-ink">
                  {x.emoji} {x.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </article>
  );
}
