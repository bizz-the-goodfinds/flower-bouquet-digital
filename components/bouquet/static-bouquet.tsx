import { arrange, bouquetSvg, type Design } from "@/lib/bouquet/composition";
import { STEM_BY_SLUG } from "@/lib/bouquet/catalog";

/** Server-rendered bouquet (inline SVG, zero JS). */
export function StaticBouquet({ design, className, label }: { design: Design; className?: string; label: string }) {
  const svg = bouquetSvg(design, { background: false })
    .replace(/ width="\d+" height="\d+"/, ' style="display:block;width:100%;height:auto"')
    .replace("<svg ", `<svg role="img" aria-label="${label.replace(/"/g, "")}" `);
  return <div className={className} dangerouslySetInnerHTML={{ __html: svg }} />;
}

export type Preset = { stems: string[]; wrap?: string; paper: string; ribbon: string; background: string };

export function presetDesign(p: Preset, seed = 42): Design {
  const wrapper = p.wrap ?? "cone";
  return { items: arrange(p.stems, seed, wrapper), wrapper, paper: p.paper, ribbon: p.ribbon, background: p.background };
}

export function StemThumb({ slug, className = "size-12" }: { slug: string; className?: string }) {
  const def = STEM_BY_SLUG.get(slug);
  if (!def) return null;
  return (
    <svg viewBox={def.thumbViewBox} className={className} aria-hidden="true" dangerouslySetInnerHTML={{ __html: def.kind === "greenery" ? def.art(420) : def.art() }} />
  );
}
