import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { StemThumb } from "@/components/bouquet/static-bouquet";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { FaqList } from "@/components/marketing/faq-list";
import { STEM_BY_SLUG } from "@/lib/bouquet/catalog";
import { FAMILY_BY_SLUG, FLOWER_FAMILIES } from "@/lib/content/flowers";
import { OCCASION_BY_SLUG } from "@/lib/content/occasions";
import { JsonLd, articleLd, faqLd } from "@/lib/seo/jsonld";

export const dynamicParams = false;
export function generateStaticParams() {
  return FLOWER_FAMILIES.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: PageProps<"/flowers/[slug]">): Promise<Metadata> {
  const f = FAMILY_BY_SLUG.get((await params).slug);
  if (!f) return {};
  return { title: { absolute: f.title }, description: f.metaDescription, alternates: { canonical: `/flowers/${f.slug}` } };
}

export default async function FlowerPage({ params }: PageProps<"/flowers/[slug]">) {
  const f = FAMILY_BY_SLUG.get((await params).slug);
  if (!f) notFound();
  const path = `/flowers/${f.slug}`;
  const related = FLOWER_FAMILIES.filter((x) => x.slug !== f.slug && x.occasions.some((o) => f.occasions.includes(o))).slice(0, 4);

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <JsonLd data={[articleLd({ title: f.title, description: f.metaDescription, path, published: "2026-09-29", updated: "2026-09-29" }), faqLd(f.faq)]} />
      <Breadcrumbs items={[{ name: "Flower meanings", path: "/flowers" }, { name: f.name, path }]} />

      <header className="mt-6">
        <div className="flex flex-wrap gap-2">
          {f.stems.map((s) => (
            <span key={s} className="grid size-20 place-items-center rounded-2xl border border-line bg-paper">
              <StemThumb slug={s} className="size-16" />
            </span>
          ))}
        </div>
        <h1 className="mt-6 font-display text-5xl leading-[1.02] sm:text-6xl">{f.title.split(" – ")[0]}</h1>
        <p className="mt-5 text-xl leading-relaxed text-ink/85">{f.answer}</p>
        <Link href={`/create?flowers=${f.slug}`} className="btn-primary mt-6">
          Make a bouquet with {f.plural.toLowerCase()} <ArrowRight className="size-4" aria-hidden />
        </Link>
      </header>

      <div className="prose-flower mt-4">
        {f.colors && (
          <>
            <h2>
              {f.name} meaning by {f.slug === "eucalyptus" ? "type" : "color"}
            </h2>
            <div className="overflow-hidden rounded-2xl border border-line bg-paper">
              <table className="w-full text-left text-[16px]">
                <thead className="bg-cream/60 text-sm">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">
                      {f.slug === "eucalyptus" ? "Greenery" : "Color"}
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Meaning
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {f.colors.map((c) => (
                    <tr key={c.color} className="border-t border-line">
                      <th scope="row" className="px-4 py-3 font-medium">
                        {c.color}
                      </th>
                      <td className="px-4 py-3 text-ink/80">{c.meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <h2>In our bouquet maker</h2>
        <ul>
          {f.stems.map((s) => {
            const d = STEM_BY_SLUG.get(s);
            return d ? (
              <li key={s}>
                <strong>{d.name}</strong>: {d.meaning.toLowerCase()}
              </li>
            ) : null;
          })}
        </ul>

        <h2>When to send {f.plural.toLowerCase()}</h2>
        <ul>
          {f.occasions.map((o) => {
            const occ = OCCASION_BY_SLUG.get(o);
            return occ ? (
              <li key={o}>
                <Link href={`/occasions/${o}`} className="underline underline-offset-2">
                  {occ.name}
                </Link>
              </li>
            ) : null;
          })}
        </ul>

        <h2>Fun facts</h2>
        <ul>
          {f.facts.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>

        <h2>FAQ</h2>
      </div>
      <FaqList items={f.faq} className="mt-2" />

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-3xl">Pairs well with</h2>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {related.map((r) => (
              <li key={r.slug}>
                <Link href={`/flowers/${r.slug}`} className="flex flex-col items-center rounded-2xl border border-line bg-paper p-4 text-center hover:border-ink">
                  <StemThumb slug={r.stems[0]} className="size-14" />
                  <span className="mt-2 font-display text-xl">{r.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
