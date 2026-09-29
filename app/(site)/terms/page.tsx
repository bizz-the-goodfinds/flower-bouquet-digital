import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: `The simple rules for using ${site.name}.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Breadcrumbs items={[{ name: "Terms", path: "/terms" }]} />
      <h1 className="mt-6 font-display text-5xl">Terms of use</h1>
      <p className="mt-2 font-mono text-xs text-ink-soft">Last updated September 29, 2026</p>
      <div className="prose-flower mt-4">
        <p>By using {site.name} you agree to these terms. They are short on purpose.</p>
        <h2>Be kind</h2>
        <p>Don&rsquo;t use {site.name} to harass, threaten, impersonate or spam anyone, or to share illegal content. We may remove bouquets that break these rules, and bouquets reported by several people are hidden automatically.</p>
        <h2>Your content</h2>
        <p>You own what you write. You give us permission to store and display it to people who have the link, so the service can work.</p>
        <h2>The service</h2>
        <p>{site.name} is free and provided as is. We try hard to keep links working, but we can&rsquo;t guarantee they will be available forever.</p>
        <h2>Artwork</h2>
        <p>The flower illustrations belong to {site.name}. You may share images of bouquets you made for personal, non-commercial use.</p>
        <h2>Changes</h2>
        <p>We may update these terms. If we make big changes, we&rsquo;ll update the date above.</p>
      </div>
    </div>
  );
}
