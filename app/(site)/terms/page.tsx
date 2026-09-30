import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: `The simple rules for using ${site.name}: be kind, you own your words, and how accounts and links work.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Breadcrumbs items={[{ name: "Terms", path: "/terms" }]} />
      <h1 className="mt-6 font-display text-5xl">Terms of use</h1>
      <p className="mt-2 font-mono text-xs text-ink-soft">Last updated September 30, 2026</p>
      <div className="prose-flower mt-4">
        <p>
          By using {site.name} you agree to these terms and to our <Link href="/privacy">privacy policy</Link>. They are short on purpose.
        </p>

        <h2>Be kind</h2>
        <p>
          Don&rsquo;t use {site.name} to harass, threaten, bully, impersonate or spam anyone, or to share hateful, sexual or illegal content. We
          may remove bouquets or accounts that break these rules. Bouquets reported by several people are hidden automatically.
        </p>

        <h2>Your content</h2>
        <p>
          You own what you write. You give us permission to store your bouquet and show it to people who have its link, so the service works. You
          are responsible for what you send.
        </p>

        <h2>Songs, voice notes and AI</h2>
        <p>
          Only attach songs you&rsquo;re happy for the recipient to play, and only record your own voice. Voice notes follow the same rules as
          notes and can be reported. The AI note writer runs on your own AI account: you are responsible for your key, for what the provider
          charges you, and for following the provider&rsquo;s terms. Drafts are suggestions; what you send is still yours and still has to be kind.
        </p>

        <h2>Accounts</h2>
        <p>
          Accounts are optional. Keep your password safe; you&rsquo;re responsible for activity on your account. Only create an account with an
          email address you own.
        </p>

        <h2>Links, scheduling and expiry</h2>
        <p>
          Anyone with a bouquet&rsquo;s link can open it. Scheduled bouquets stay wrapped until their open time, and bouquets with an expiry stop
          working after it. You can delete a bouquet at any time.
        </p>

        <h2>Artwork and downloads</h2>
        <p>
          The flower illustrations, wraps and branding belong to {site.name}. You may share images, videos and GIFs of bouquets you made or
          received for personal, non-commercial use.
        </p>

        <h2>The service</h2>
        <p>
          {site.name} is free and provided &ldquo;as is&rdquo;. We work hard to keep it running and your links working, but we can&rsquo;t
          guarantee it will always be available or error-free, and we&rsquo;re not liable for indirect losses from using it.
        </p>

        <h2>Age</h2>
        <p>You must be at least 13 years old to use {site.name}.</p>

        <h2>Changes</h2>
        <p>We may update these terms. If we make meaningful changes, we&rsquo;ll update the date above.</p>
      </div>
    </div>
  );
}
