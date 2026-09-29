import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${site.name} handles your data: what we store, the analytics and cookies we use, accounts, and how to delete your bouquets.`,
  alternates: { canonical: "/privacy" },
};

const UPDATED = "September 29, 2026";

export default function PrivacyPage() {
  const host = site.url.replace(/^https?:\/\//, "");
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Breadcrumbs items={[{ name: "Privacy", path: "/privacy" }]} />
      <h1 className="mt-6 font-display text-5xl">Privacy policy</h1>
      <p className="mt-2 font-mono text-xs text-ink-soft">Last updated {UPDATED}</p>
      <div className="prose-flower mt-4">
        <p>
          This policy explains what {site.name} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) collects when you use {host}. The short version: we store the
          bouquets you send so their links work, we use analytics to improve the product, and we never sell your data.
        </p>

        <h2>What we store</h2>
        <ul>
          <li>
            <strong>Bouquets you send:</strong> the flower arrangement, wrap, the names and note you write, card style and stickers, occasion,
            optional open date and optional expiry date.
          </li>
          <li>
            <strong>Reactions and reports</strong> that recipients send.
          </li>
          <li>
            <strong>A one-way hash of your IP address</strong>, used only for spam and abuse prevention (rate limits). We never store your raw IP
            address.
          </li>
          <li>
            <strong>Accounts (optional):</strong> if you create one, your email address and a securely hashed password (or your Google account
            email if you sign in with Google). Accounts only exist to show your bouquets on any device.
          </li>
        </ul>
        <p>You can make and send bouquets without an account. We never ask for your phone number or payment details.</p>

        <h2>Stored on your device</h2>
        <p>
          Your browser keeps a list of bouquets you sent, a private edit key for each (so only you can edit or delete them), your unsent draft and
          your cookie choice. Images, videos and GIFs you download are created on your device and are not uploaded to us. Clearing your browser
          data removes all of this.
        </p>

        <h2>Analytics and cookies</h2>
        <ul>
          <li>
            <strong>Google Analytics for Firebase</strong>: which features people use (for example, which flowers are popular).
          </li>
          <li>
            <strong>Microsoft Clarity</strong>: heatmaps and anonymized session recordings. Names, notes and replies you type are masked and never
            recorded.
          </li>
          <li>
            <strong>Vercel Analytics and Speed Insights</strong>: page views and performance, without cookies.
          </li>
          <li>
            <strong>Sign-in cookies</strong> (only if you create an account) keep you signed in. They are strictly necessary.
          </li>
          <li>
            <strong>Cloudflare Turnstile</strong> may run a privacy-preserving check when you send a bouquet, to stop bots.
          </li>
        </ul>
        <p>
          In the EU, EEA and UK, analytics only load after you accept. Elsewhere they load after your first interaction and you can opt out from
          the notice. To change your choice, clear this site&rsquo;s data in your browser and choose again.
        </p>

        <h2>Who can see a bouquet</h2>
        <p>
          Anyone who has its link. Links are random and unlisted, and bouquet pages tell search engines not to index them. Please don&rsquo;t put
          sensitive information in a note.
        </p>

        <h2>How long we keep data</h2>
        <ul>
          <li>Bouquets stay until you delete them or until the expiry you chose. Expired and deleted bouquets stop working immediately.</li>
          <li>Rate-limit records are kept only as long as needed to prevent abuse.</li>
          <li>Account data stays until you ask us to delete your account.</li>
        </ul>

        <h2>Your choices and rights</h2>
        <p>
          Edit or delete any bouquet from <Link href="/garden">My bouquets</Link>. You can ask us to access, correct or delete your data, or to
          delete your account, by reporting through any bouquet page or contacting us via the <Link href="/about">about page</Link>. Depending on
          where you live (for example under GDPR or India&rsquo;s DPDP Act) you may have additional rights, and we will honour them.
        </p>

        <h2>Service providers</h2>
        <p>
          Data is stored with Supabase (database and accounts) and served by Vercel (hosting). Analytics are provided by Google (Firebase) and
          Microsoft (Clarity). Bot protection is provided by Cloudflare. These providers process data on our behalf.
        </p>

        <h2>Children</h2>
        <p>{site.name} is not directed at children under 13, and we do not knowingly collect their data.</p>

        <h2>Changes</h2>
        <p>If we change this policy in a meaningful way, we will update the date at the top of this page.</p>
      </div>
    </div>
  );
}
