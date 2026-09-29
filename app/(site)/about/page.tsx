import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Flower Bouquet Digital",
  description: `${site.definition} Here's why we built it.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Breadcrumbs items={[{ name: "About", path: "/about" }]} />
      <h1 className="mt-6 font-display text-5xl sm:text-6xl">About {site.name}</h1>
      <div className="prose-flower mt-6">
        <p>
          <strong>{site.definition}</strong>
        </p>
        <p>
          Real flowers are lovely, but they are expensive, slow, and they wilt in a week. Most of the time we just want to tell someone
          &ldquo;I&rsquo;m thinking of you&rdquo; in a way that feels more special than a text. That&rsquo;s what {site.name} is for.
        </p>
        <h2>What makes it different</h2>
        <ul>
          <li>You arrange every stem yourself, so each bouquet is one of a kind.</li>
          <li>Every flower is hand-drawn and comes with its traditional meaning.</li>
          <li>The recipient doesn&rsquo;t need an app or an account. The link just works.</li>
          <li>It&rsquo;s free, private by default, and made to be shared.</li>
        </ul>
        <h2>Contact</h2>
        <p>
          Found a bug or have an idea for a flower we should add? We&rsquo;d love to hear it. You can also report a bouquet directly from its page.
        </p>
      </div>
      <Link href="/create" className="btn-primary mt-8">
        Make a bouquet
      </Link>
    </div>
  );
}
