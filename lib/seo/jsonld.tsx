import { absoluteUrl, site } from "@/lib/site";

export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export const organizationLd = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": absoluteUrl("/#organization"),
  name: site.name,
  url: site.url,
  logo: { "@type": "ImageObject", url: absoluteUrl("/icons/logo-600.png"), width: 600, height: 600 },
  description: site.definition,
});

export const websiteLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": absoluteUrl("/#website"),
  name: site.name,
  url: site.url,
  description: site.description,
  inLanguage: "en",
  publisher: { "@id": absoluteUrl("/#organization") },
});

export const webAppLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "@id": absoluteUrl("/#app"),
  name: site.name,
  alternateName: "Digital Flower Bouquet Maker",
  url: absoluteUrl("/create"),
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Any (web browser)",
  browserRequirements: "Requires JavaScript",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  description: site.description,
  featureList: [
    "Drag-and-drop bouquet builder with 35 hand-drawn flowers and greenery",
    "Handwritten-style note cards",
    "Shareable link with animated unwrap",
    "Scheduled reveal at a set date and time",
    "Download as image or Instagram story",
    "Emoji reactions and send-one-back replies",
  ],
  publisher: { "@id": absoluteUrl("/#organization") },
});

export const faqLd = (faq: { q: string; a: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
});

export const breadcrumbLd = (items: { name: string; path: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: it.name,
    item: absoluteUrl(it.path),
  })),
});

export const articleLd = (a: { title: string; description: string; path: string; published: string; updated: string }) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  headline: a.title,
  description: a.description,
  mainEntityOfPage: absoluteUrl(a.path),
  datePublished: a.published,
  dateModified: a.updated,
  image: absoluteUrl("/opengraph-image"),
  author: { "@id": absoluteUrl("/#organization") },
  publisher: { "@id": absoluteUrl("/#organization") },
});

export const howToLd = (name: string, description: string, steps: { name: string; text: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "HowTo",
  name,
  description,
  totalTime: "PT1M",
  estimatedCost: { "@type": "MonetaryAmount", currency: "USD", value: "0" },
  step: steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.name, text: s.text })),
});
