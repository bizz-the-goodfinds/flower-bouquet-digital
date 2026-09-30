import type { Metadata } from "next";
import { Builder } from "@/components/builder/builder";
import { cardFontVars } from "@/lib/fonts";
import { JsonLd, breadcrumbLd, webAppLd } from "@/lib/seo/jsonld";

export const metadata: Metadata = {
  title: "Bouquet Maker – Make & Send a Bouquet",
  description:
    "Make a digital flower bouquet in seconds: pick from 35 hand-drawn flowers and greens, arrange them by hand, write a note and send a link. Free, no signup.",
  alternates: { canonical: "/create" },
};

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function CreatePage({ searchParams }: PageProps<"/create">) {
  const sp = await searchParams;
  const params = { occasion: one(sp.occasion), flowers: one(sp.flowers), replyTo: one(sp.replyTo), to: one(sp.to), edit: one(sp.edit), ref: one(sp.ref), resume: one(sp.resume) };
  return (
    <div className={cardFontVars} data-card-fonts>
      <JsonLd data={[webAppLd(), breadcrumbLd([{ name: "Home", path: "/" }, { name: "Bouquet maker", path: "/create" }])]} />
      <h1 className="sr-only">Digital bouquet maker</h1>
      <Builder key={JSON.stringify(params)} params={params} />
    </div>
  );
}
