import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${site.name} handles your data: what we store, analytics we use, and how to delete your bouquets.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Breadcrumbs items={[{ name: "Privacy", path: "/privacy" }]} />
      <h1 className="mt-6 font-display text-5xl">Privacy policy</h1>
      <p className="mt-2 font-mono text-xs text-ink-soft">Last updated September 29, 2026</p>
      <div className="prose-flower mt-4">
        <p>
          This policy explains what {site.name} (&ldquo;we&rdquo;) collects when you use {site.url.replace(/^https?:\/\//, "")}. Short version: we store
          the bouquets you send so the link works, we use analytics to improve the product, and we never sell your data.
        </p>
        <h2>What we store</h2>
        <ul>
          <li>
            <strong>Bouquets you send</strong>: the flower arrangement, the names and note you write, card style, occasion and optional open date.
          </li>
          <li>
            <strong>Reactions and reports</strong> that recipients send.
          </li>
          <li>
            <strong>A one-way hash of your IP address</strong>, used only to prevent spam and abuse (rate limits). We do not store your raw IP
            address.
          </li>
        </ul>
        <p>
          Accounts are optional. If you choose to sign in, we store your email address (or your Google account&rsquo;s email) so your bouquets can
          sync across devices. We never email you anything except the sign-in link you ask for.
        </p>

        <h2>On your device</h2>
        <p>
          Your browser stores a list of bouquets you sent, a private edit key for each (so only you can delete them), your unsent draft, and your
          cookie choice. Clearing your browser data removes these.
        </p>

        <h2>Analytics</h2>
        <p>
          We use Google Analytics for Firebase, Microsoft Clarity and Vercel Analytics to understand how people use the site (for example, which
          flowers are popular and where people get stuck). Clarity may record anonymized sessions; the names and notes you type are masked and never
          recorded. In the EU and UK these tools load only after you accept. You can opt out any time by clearing site data and choosing
          &ldquo;Decline&rdquo; or &ldquo;Opt out&rdquo;.
        </p>

        <h2>Who can see a bouquet</h2>
        <p>
          Anyone with the link. Links are random and unlisted, and bouquet pages tell search engines not to index them. Don&rsquo;t put sensitive
          information in a note.
        </p>

        <h2>Deleting your data</h2>
        <p>
          Delete any bouquet you sent from <a href="/garden">My bouquets</a> on the device you sent it from. Deleted bouquets stop working
          immediately. For other requests, contact us through the report link or the about page.
        </p>

        <h2>Service providers</h2>
        <p>Data is stored with Supabase (database) and served by Vercel (hosting). Analytics are provided by Google (Firebase) and Microsoft (Clarity).</p>

        <h2>Children</h2>
        <p>{site.name} is not directed at children under 13.</p>
      </div>
    </div>
  );
}
