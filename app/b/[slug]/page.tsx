import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { TrackOnMount } from "@/components/analytics/listeners";
import { Countdown } from "@/components/reveal/countdown";
import { Envelope } from "@/components/reveal/envelope";
import { RecipientView } from "@/components/reveal/recipient-view";
import { Logo } from "@/components/ui/logo";
import { cardFontVars } from "@/lib/fonts";
import { OG_SIZE } from "@/lib/og";
import { getAncestors, getBouquet, getLink, teaser } from "@/lib/server/bouquets";
import { notifyDueReveals } from "@/lib/server/push";

export const dynamic = "force-dynamic";

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export async function generateMetadata({ params, searchParams }: PageProps<"/b/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const r = one((await searchParams).r);
  const state = await getBouquet(slug);
  const robots = { index: false, follow: false, googleBot: { index: false, follow: false } };
  if (state.status === "missing") return { title: "Bouquet not found", robots };
  const link = await getLink(state.meta.id, r);
  const locked = state.status === "locked";
  const to = link?.name ?? (locked ? state.to : state.bouquet.to);
  const from = locked ? state.from : state.bouquet.from;
  const { title, description, og } = teaser({ to, from, locked });
  const url = `/b/${slug}${link ? `?r=${link.key}` : ""}`;
  const images = [{ url: `/b/${slug}/og${link ? `?r=${link.key}` : ""}`, ...OG_SIZE, alt: `${og.title}: a sealed envelope, tap to open` }];
  return {
    title: { absolute: title },
    description,
    robots,
    alternates: { canonical: null },
    openGraph: { title, description, type: "website", url, images },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

export default async function BouquetPage({ params, searchParams }: PageProps<"/b/[slug]">) {
  const { slug } = await params;
  const state = await getBouquet(slug);
  if (state.status === "missing") notFound();
  // A scheduled bouquet that just unlocked: tell the sender now rather than waiting for the cron.
  if (state.status === "ok" && state.meta.revealPending) after(() => notifyDueReveals([state.meta.id]));
  // Both only need the bouquet row, so fetch them together.
  const [link, thread] = await Promise.all([getLink(state.meta.id, one((await searchParams).r)), state.status === "locked" ? [] : getAncestors(state.meta)]);

  return (
    <div className={cardFontVars} data-card-fonts>
      <main id="main">
        {state.status === "locked" ? (
          <>
            <TrackOnMount name="bouquet_locked_viewed" params={{ personal_link: Boolean(link) }} />
            <header className="absolute top-0 left-0 z-20 p-3 sm:p-5">
              <Link href="/" aria-label="Flower Bouquet Digital home" className="flex items-center rounded-full bg-paper/80 py-1 pr-3 pl-2 backdrop-blur-sm">
                <Logo compact />
              </Link>
            </header>
            <div className="grid min-h-dvh place-items-center px-4 py-20">
              <Envelope to={link?.name ?? state.to} from={state.from} look={state.envelope} locked={<Countdown revealAt={state.revealAt} />} />
            </div>
          </>
        ) : (
          <RecipientView
            bouquet={link ? { ...state.bouquet, to: link.name } : state.bouquet}
            link={link?.key ?? null}
            thread={thread}
          />
        )}
      </main>
    </div>
  );
}
