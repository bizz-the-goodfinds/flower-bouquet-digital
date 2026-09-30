import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${site.name} handles your data: what we store, the analytics and cookies we use, accounts, and how to delete your bouquets.`,
  alternates: { canonical: "/privacy" },
};

const UPDATED = "September 30, 2026 (v2: AI note writer, songs, voice notes, notifications)";

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
            <strong>Reactions, chat messages and reports:</strong> emoji reactions and short messages between a sender and each recipient,
            and reports about a bouquet.
          </li>
          <li>
            <strong>Personal links (optional):</strong> the first name a sender types for each person they send a personal link to, and
            whether and how often that link was opened.
          </li>
          <li>
            <strong>Received bouquets (signed in only):</strong> which bouquets you opened, so they appear under My bouquets on every device.
          </li>
          <li>
            <strong>Songs and voice notes (optional):</strong> the song link you add, with the title, artist and cover image we look up from
            Spotify, YouTube or Apple Music; and voice notes you record, stored privately and played only through short-lived links. A voice note
            is deleted when you delete its bouquet or remove it while editing.
          </li>
          <li>
            <strong>Notifications (optional):</strong> if you turn them on, your browser&rsquo;s push subscription (an address at Google, Apple,
            Mozilla or Microsoft&rsquo;s push service), which bouquets it&rsquo;s for, and which kinds of notification you want. Turning them off
            deletes it. Notifications say who opened or answered a bouquet, never what they wrote.
          </li>
          <li>
            <strong>Badges (signed in only):</strong> which badges your account earned and when. Streaks and stats are worked out from your
            bouquets when you open My bouquets.
          </li>
          <li>
            <strong>Referrals:</strong> when you make a bouquet after opening someone else&rsquo;s, we note which bouquet brought you, so its
            sender sees a count (&ldquo;3 people sent flowers after opening yours&rdquo;). They never see who you are.
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
          Your browser keeps your AI key if you connected one (see below), a list of bouquets you sent, a private edit key for each (so only you can edit or delete them), a list of bouquets
          you received, a random device ID that keeps your chat with each sender private to you, which chat messages you have already seen, your
          unsent draft and your cookie choice. With v2 it can also keep: the last bouquet you opened (for 30 days, so a bouquet you make next
          counts toward its sender&rsquo;s referral stats), your badges and whether you&rsquo;ve seen their celebration, your notification settings,
          whether the &ldquo;Your garden&rdquo; panel is open, a count of your visits, and when you last said &ldquo;Not now&rdquo; to notifications
          or installing the app (so we don&rsquo;t ask too often). Images, videos, GIFs and badge images you download are created on your device
          and are not uploaded to us. Clearing your browser data removes all of this.
        </p>

        <h2>AI note writer</h2>
        <p>
          &ldquo;Help me write&rdquo; runs on <strong>your own</strong> AI account with Google (Gemini), OpenAI, Anthropic or OpenRouter. Your API key
          is kept only in your browser (for the current tab, or on this device if you tick &ldquo;Remember&rdquo;) and your browser sends it,
          with the tone, names, occasion and details you give, straight to the provider you chose. None of it passes through or is stored on
          our servers, and it is never sent to our analytics. The provider&rsquo;s own privacy policy covers what they do with the request.
          Signing in with OpenRouter creates a key on your OpenRouter account that you can revoke there.
        </p>

        <h2>Embedded players</h2>
        <p>
          A song card shows its cover image from the music service. The Spotify, YouTube or Apple Music player loads only when the recipient taps
          the card; from then on that service&rsquo;s own cookies and privacy policy apply. YouTube uses its privacy-enhanced mode.
        </p>

        <h2>Notifications and the app</h2>
        <p>
          We only ask for notification permission after you tap a button, and never on a bouquet someone sent you. You can turn notifications off in My bouquets
          or in your browser at any time; that deletes your subscription from our database. Tapping a notification opens My bouquets with a
          tag that tells our analytics the visit came from a notification. Installing the app adds nothing new to what we collect. The app keeps
          copies of the home page, the bouquet maker and My bouquets on your device so they open on a weak connection; bouquet pages and your
          data are never stored in that cache.
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
          In the EU, EEA and UK, analytics only load after you accept. Elsewhere, Google Analytics loads a moment after the page does and
          Clarity loads after your first interaction, and you can opt out from the notice. Links shared from the app carry a tag naming the app
          they were shared through (for example WhatsApp), so we can see which ones people use; it contains nothing about you. To change your choice, clear this site&rsquo;s data in your browser and choose again.
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
          <li>Voice notes are deleted with their bouquet. A recording you make but never send may be kept for a short while, then deleted.</li>
          <li>Notification subscriptions are deleted when you turn notifications off, or when your browser tells us they no longer work.</li>
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
          Microsoft (Clarity). Bot protection is provided by Cloudflare. Notifications are delivered through your browser&rsquo;s push service
          (Google, Apple, Mozilla or Microsoft). These providers process data on our behalf. Song details come from the public pages of
          Spotify, YouTube and Apple Music, which we contact without sending anything about you. The AI provider you connect for the note writer
          (Google, OpenAI, Anthropic or OpenRouter) is chosen and paid for by you and receives requests directly from your browser, not from us.
        </p>

        <h2>Children</h2>
        <p>{site.name} is not directed at children under 13, and we do not knowingly collect their data.</p>

        <h2>Changes</h2>
        <p>If we change this policy in a meaningful way, we will update the date at the top of this page.</p>
      </div>
    </div>
  );
}
