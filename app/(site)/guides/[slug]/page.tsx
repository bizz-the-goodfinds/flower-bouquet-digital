import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { FaqList } from "@/components/marketing/faq-list";
import { GUIDES, GUIDE_BY_SLUG } from "@/lib/content/guides";
import { JsonLd, articleLd, faqLd, howToLd } from "@/lib/seo/jsonld";

export const dynamicParams = false;
export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: PageProps<"/guides/[slug]">): Promise<Metadata> {
  const g = GUIDE_BY_SLUG.get((await params).slug);
  if (!g) return {};
  return {
    title: { absolute: g.title },
    description: g.metaDescription,
    alternates: { canonical: `/guides/${g.slug}` },
    openGraph: { type: "article", publishedTime: g.published, modifiedTime: g.updated },
  };
}

export default async function GuidePage({ params }: PageProps<"/guides/[slug]">) {
  const g = GUIDE_BY_SLUG.get((await params).slug);
  if (!g) notFound();
  const path = `/guides/${g.slug}`;
  const ld: Record<string, unknown>[] = [articleLd({ title: g.title, description: g.metaDescription, path, published: g.published, updated: g.updated }), faqLd(g.faq)];
  if (g.howTo) ld.push(howToLd(g.title, g.metaDescription, g.howTo));

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <JsonLd data={ld} />
      <Breadcrumbs items={[{ name: "Guides", path: "/guides" }, { name: g.title.split(/[:(–]/)[0].trim(), path }]} />
      <h1 className="mt-6 font-display text-5xl leading-[1.02] sm:text-6xl">{g.title}</h1>
      <p className="mt-3 font-mono text-xs text-ink-soft">
        Updated <time dateTime={g.updated}>{new Date(g.updated).toLocaleDateString("en-US", { dateStyle: "long" })}</time>
      </p>
      <p className="mt-6 rounded-2xl border-l-4 border-petal-deep bg-paper px-5 py-4 text-xl leading-relaxed text-ink/90">{g.answer}</p>

      <div className="prose-flower">
        {g.howTo && (
          <>
            <h2>Step by step</h2>
            <ol className="my-4 space-y-3">
              {g.howTo.map((s, i) => (
                <li key={s.name} className="flex gap-4 rounded-2xl border border-line bg-paper p-4">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink font-mono text-sm text-cream">{i + 1}</span>
                  <span>
                    <strong className="block">{s.name}</strong>
                    <span className="text-ink/80">{s.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </>
        )}
        {g.sections.map((s) => (
          <section key={s.heading}>
            <h2>{s.heading}</h2>
            {s.body.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
            {s.list && (
              <ul>
                {s.list.map((li) => (
                  <li key={li}>{li}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
        <h2>FAQ</h2>
      </div>
      <FaqList items={g.faq} className="mt-2" />

      <div className="mt-12 rounded-[var(--radius-card)] bg-ink p-8 text-center text-cream">
        <p className="font-display text-3xl">Ready to try it?</p>
        <Link href="/create" className="btn mt-5 bg-petal text-ink">
          Make a bouquet <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </article>
  );
}
