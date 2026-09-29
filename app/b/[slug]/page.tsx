import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Countdown } from "@/components/reveal/countdown";
import { Envelope } from "@/components/reveal/envelope";
import { RecipientView } from "@/components/reveal/recipient-view";
import { Logo } from "@/components/ui/logo";
import { cardFontVars } from "@/lib/fonts";
import { getBouquet } from "@/lib/server/bouquets";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/b/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const state = await getBouquet(slug);
  const robots = { index: false, follow: false, googleBot: { index: false, follow: false } };
  if (state.status === "missing") return { title: "Bouquet not found", robots };
  const to = state.status === "ok" ? state.bouquet.to : state.to;
  const from = state.status === "ok" ? state.bouquet.from : state.from;
  const title = to ? `A bouquet for ${to} 💐` : "Someone sent you a bouquet 💐";
  const description = from ? `${from} made you a bouquet. Tap to unwrap it.` : "Tap to unwrap your digital bouquet.";
  return {
    title: { absolute: title },
    description,
    robots,
    alternates: { canonical: null },
    openGraph: { title, description, type: "website", url: `/b/${slug}` },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function BouquetPage({ params }: PageProps<"/b/[slug]">) {
  const { slug } = await params;
  const state = await getBouquet(slug);
  if (state.status === "missing") notFound();

  return (
    <div className={cardFontVars} data-card-fonts>
      <main id="main">
        {state.status === "locked" ? (
          <>
            <header className="absolute top-0 left-0 z-20 p-3 sm:p-5">
              <Link href="/" aria-label="Flower Bouquet Digital home" className="flex items-center rounded-full bg-paper/80 py-1 pr-3 pl-2 backdrop-blur-sm">
                <Logo compact />
              </Link>
            </header>
            <div className="grid min-h-dvh place-items-center px-4 py-20">
              <Envelope to={state.to} from={state.from} look={state.envelope} locked={<Countdown revealAt={state.revealAt} />} />
            </div>
          </>
        ) : (
          <RecipientView bouquet={state.bouquet} />
        )}
      </main>
    </div>
  );
}
