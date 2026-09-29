import type { Metadata } from "next";
import { Builder } from "@/components/builder/builder";
import { cardFontVars } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Bouquet Maker – Arrange & Send a Digital Bouquet",
  description:
    "Make a digital flower bouquet in seconds: pick from 35 hand-drawn flowers and greens, arrange them by hand, write a note and send a link. Free, no signup.",
  alternates: { canonical: "/create" },
};

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function CreatePage({ searchParams }: PageProps<"/create">) {
  const sp = await searchParams;
  const params = { occasion: one(sp.occasion), flowers: one(sp.flowers), replyTo: one(sp.replyTo), to: one(sp.to) };
  return (
    <div className={cardFontVars}>
      <h1 className="sr-only">Digital bouquet maker</h1>
      <Builder key={JSON.stringify(params)} params={params} />
    </div>
  );
}
