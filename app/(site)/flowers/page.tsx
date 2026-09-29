import type { Metadata } from "next";
import Link from "next/link";
import { StemThumb } from "@/components/bouquet/static-bouquet";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { FLOWER_FAMILIES } from "@/lib/content/flowers";

export const metadata: Metadata = {
  title: "Flower Meanings by Flower & Color",
  description:
    "A friendly guide to flower meanings: roses, tulips, sunflowers, peonies, lilies and more, with color meanings and the best occasion for each.",
  alternates: { canonical: "/flowers" },
};

export default function FlowersIndex() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Breadcrumbs items={[{ name: "Flower meanings", path: "/flowers" }]} />
      <h1 className="mt-6 font-display text-5xl leading-none sm:text-6xl">Flower meanings</h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink/80">
        Every flower carries a message. Red roses say &ldquo;I love you,&rdquo; yellow roses say &ldquo;you&rsquo;re my best friend,&rdquo; and white
        lilies say &ldquo;I&rsquo;m thinking of you.&rdquo; Pick a flower to see what it means, which colors change the message, and when to send it.
      </p>
      <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {FLOWER_FAMILIES.map((f) => (
          <li key={f.slug}>
            <Link
              href={`/flowers/${f.slug}`}
              className="flex h-full flex-col items-center rounded-2xl border border-line bg-paper p-5 text-center transition hover:-translate-y-0.5 hover:border-ink hover:shadow-[3px_3px_0_0_var(--color-ink)]"
            >
              <StemThumb slug={f.stems[0]} className="size-20" />
              <h2 className="mt-3 font-display text-2xl">{f.name}</h2>
              <p className="mt-1 text-sm text-ink-soft">{f.answer.split(/[.:]/)[0].replace(/^[^,]+ (symbolize|symbolizes|carry|are|is) /, "")}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
