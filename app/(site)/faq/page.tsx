import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { FaqList } from "@/components/marketing/faq-list";
import { GUIDES, SITE_FAQ } from "@/lib/content/guides";
import { JsonLd, faqLd } from "@/lib/seo/jsonld";

export const metadata: Metadata = {
  title: "FAQ – Digital Flower Bouquets",
  description: "Answers about Flower Bouquet Digital: is it free, how recipients open bouquets, scheduling, privacy, sharing on Instagram and WhatsApp, and more.",
  alternates: { canonical: "/faq" },
};

const ALL = [...SITE_FAQ, ...GUIDES.flatMap((g) => g.faq)].filter((f, i, a) => a.findIndex((x) => x.q === f.q) === i);

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <JsonLd data={faqLd(ALL)} />
      <Breadcrumbs items={[{ name: "FAQ", path: "/faq" }]} />
      <h1 className="mt-6 font-display text-5xl sm:text-6xl">Frequently asked questions</h1>
      <FaqList items={ALL} className="mt-8" level={2} />
    </div>
  );
}
