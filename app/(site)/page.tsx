import Link from "next/link";
import { ArrowRight, CalendarClock, Download, HeartHandshake, Link2, Shuffle, Sparkles } from "lucide-react";
import { StaticBouquet, StemThumb, presetDesign } from "@/components/bouquet/static-bouquet";
import { FaqList } from "@/components/marketing/faq-list";
import { OCCASIONS } from "@/lib/content/occasions";
import { SITE_FAQ } from "@/lib/content/guides";
import { JsonLd, faqLd, organizationLd, webAppLd, websiteLd } from "@/lib/seo/jsonld";
import { site } from "@/lib/site";

const HERO = { stems: ["peony", "red-rose", "pink-rose", "pink-tulip", "ranunculus", "daisy", "babys-breath", "lavender", "eucalyptus", "fern", "white-rose"], wrapper: "kraft", ribbon: "cherry", background: "cream" };

const MEANINGS = [
  ["red-rose", "Red rose", "Deep love", "/flowers/rose"],
  ["sunflower", "Sunflower", "Loyalty & warmth", "/flowers/sunflower"],
  ["pink-tulip", "Pink tulip", "Care & happiness", "/flowers/tulip"],
  ["peony", "Peony", "Romance & luck", "/flowers/peony"],
  ["daisy", "Daisy", "Fresh starts", "/flowers/daisy"],
  ["white-lily", "White lily", "Remembrance", "/flowers/lily"],
] as const;

export default function Home() {
  return (
    <>
      <JsonLd data={[organizationLd(), websiteLd(), webAppLd(), faqLd(SITE_FAQ)]} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 pt-10 pb-8 md:grid-cols-[1.1fr_1fr] md:pt-16">
          <div>
            <p className="label">free · no signup · no app</p>
            <h1 className="mt-4 font-display text-[3.4rem] leading-[0.95] tracking-tight sm:text-7xl lg:text-[5.5rem]">
              Send flowers that <em className="text-petal-deep">never wilt.</em>
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-ink/80">
              Arrange a hand-drawn bouquet, write a little note, and send it as a link that blooms open on their phone.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/create" className="btn-primary text-base">
                Make a bouquet <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link href="/occasions" className="btn-secondary text-base">
                Pick an occasion
              </Link>
            </div>
            <ul className="mt-7 flex flex-wrap gap-2 text-sm text-ink/80">
              <li className="chip">💐 35 flowers & greens</li>
              <li className="chip">⏰ Schedule the reveal</li>
              <li className="chip">📲 WhatsApp & IG ready</li>
            </ul>
          </div>
          <div className="relative mx-auto w-full max-w-[440px]">
            <div className="absolute inset-x-6 top-10 bottom-4 -z-10 rounded-[40%] bg-petal/30 blur-3xl" aria-hidden />
            <StaticBouquet design={presetDesign(HERO, 20260929)} label="Illustrated bouquet of peonies, roses and tulips wrapped in kraft paper" className="animate-float" />
            <div className="absolute right-0 bottom-16 w-40 rotate-6 rounded-lg border-[1.5px] border-ink bg-paper p-3 shadow-[3px_3px_0_0_var(--color-ink)] sm:-right-4">
              <p className="label !text-[9px]">for you</p>
              <p className="mt-1 font-display text-lg leading-tight italic">&ldquo;saw these and thought of you&rdquo;</p>
            </div>
          </div>
        </div>
      </section>

      {/* Definition (answer-first, for search & AI engines) */}
      <section className="mx-auto max-w-3xl px-4 py-10 text-center">
        <h2 className="font-display text-3xl sm:text-4xl">What is {site.name}?</h2>
        <p className="mt-4 text-lg leading-relaxed text-ink/80">
          {site.definition} You pick flowers, arrange them by hand, choose a wrapper, write a card, and get a short link. Your person taps it,
          the bouquet unwraps and blooms, and your note appears. It works on any phone or computer, costs nothing, and never wilts.
        </p>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-12" aria-labelledby="how">
        <p className="label text-center">how it works</p>
        <h2 id="how" className="mt-2 text-center font-display text-4xl sm:text-5xl">
          Three taps to someone&rsquo;s smile
        </h2>
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            ["01", "Arrange", "Tap flowers to add them. Drag, spin and resize, or hit shuffle and let us style it.", Shuffle],
            ["02", "Write", "Pick a card and a handwriting style. Say the thing. Set a time for it to open if you want.", Sparkles],
            ["03", "Send", "Share the link anywhere or save it as a story. They unwrap it and can send one back.", Link2],
          ].map(([n, t, d, Icon]) => {
            const I = Icon as typeof Shuffle;
            return (
              <li key={n as string} className="rounded-[var(--radius-card)] border-[1.5px] border-ink bg-paper p-6 shadow-[3px_3px_0_0_var(--color-ink)]">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-ink-soft">{n as string}</span>
                  <I className="size-5" aria-hidden />
                </div>
                <h3 className="mt-6 font-display text-3xl">{t as string}</h3>
                <p className="mt-2 leading-relaxed text-ink/75">{d as string}</p>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Occasions */}
      <section className="mx-auto max-w-6xl px-4 py-12" aria-labelledby="occasions">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="label">start from a vibe</p>
            <h2 id="occasions" className="mt-2 font-display text-4xl sm:text-5xl">
              Bouquets for every moment
            </h2>
          </div>
          <Link href="/occasions" className="btn-ghost hidden sm:inline-flex">
            All occasions <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {OCCASIONS.map((o) => (
            <li key={o.slug}>
              <Link
                href={`/occasions/${o.slug}`}
                className="group flex h-full items-center gap-3 rounded-2xl border border-line bg-paper px-4 py-4 transition hover:-translate-y-0.5 hover:border-ink hover:shadow-[3px_3px_0_0_var(--color-ink)]"
              >
                <span className="text-2xl" aria-hidden>
                  {o.emoji}
                </span>
                <span className="font-medium">{o.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Meanings */}
      <section className="mx-auto max-w-6xl px-4 py-12" aria-labelledby="meanings">
        <p className="label">the language of flowers</p>
        <h2 id="meanings" className="mt-2 font-display text-4xl sm:text-5xl">
          Every stem says something
        </h2>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {MEANINGS.map(([slug, name, meaning, href]) => (
            <li key={slug}>
              <Link href={href} className="flex h-full flex-col items-center rounded-2xl border border-line bg-paper p-4 text-center transition hover:border-ink">
                <StemThumb slug={slug} className="size-20" />
                <span className="mt-3 font-display text-xl">{name}</span>
                <span className="text-sm text-ink-soft">{meaning}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/flowers" className="btn-ghost mt-4">
          All flower meanings <ArrowRight className="size-4" aria-hidden />
        </Link>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-12" aria-labelledby="features">
        <h2 id="features" className="font-display text-4xl sm:text-5xl">
          Small gift. Big feelings.
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [CalendarClock, "Schedule the reveal", "Lock it until midnight on their birthday. They see a countdown until it blooms."],
            [Download, "Story-ready", "Download a square post or a 9:16 story image in one tap."],
            [HeartHandshake, "Send one back", "They can react, reply, and make you a bouquet in return."],
            [Sparkles, "Private by default", "Links are unlisted and hidden from search. Delete any time."],
          ].map(([Icon, t, d]) => {
            const I = Icon as typeof Sparkles;
            return (
              <div key={t as string} className="rounded-[var(--radius-card)] bg-paper p-6 ring-1 ring-line">
                <I className="size-6 text-petal-deep" aria-hidden />
                <h3 className="mt-4 text-lg font-semibold">{t as string}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-ink/75">{d as string}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-12" aria-labelledby="faq">
        <h2 id="faq" className="text-center font-display text-4xl sm:text-5xl">
          Questions, answered
        </h2>
        <FaqList items={SITE_FAQ} className="mt-8" />
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="relative overflow-hidden rounded-[2rem] bg-ink px-6 py-14 text-center text-cream sm:px-12">
          <h2 className="font-display text-4xl sm:text-6xl">
            Someone deserves flowers <em className="text-petal">today.</em>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-cream/75">It takes about a minute. It&rsquo;ll make their whole day.</p>
          <Link href="/create" className="btn mt-8 bg-petal text-ink shadow-[3px_3px_0_0_var(--color-cream)] hover:-translate-y-0.5">
            Make a bouquet <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>
    </>
  );
}
