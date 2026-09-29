import { CANVAS, arrange, bouquetLayers, bouquetSvg, type Design } from "@/lib/bouquet/composition";
import { STEM_BY_SLUG } from "@/lib/bouquet/catalog";

/**
 * Server-rendered bouquet (inline SVG, zero JS).
 * `animated`: CSS-only life for the hero — heads bloom in one by one, then sway gently (see .pp-hero-* in globals.css).
 */
export function StaticBouquet({ design, className, label, animated = false }: { design: Design; className?: string; label: string; animated?: boolean }) {
  if (animated) {
    const { back, heads, front } = bouquetLayers(design);
    // Outer <g> blooms in, middle <g> sways; CSS transforms on the drawn <g> would override its own transform attribute.
    const body =
      back +
      heads
        .map(
          (h, i) =>
            `<g class="pp-hero-bloom" style="animation-delay:${(0.25 + i * 0.12).toFixed(2)}s"><g class="pp-hero-sway" style="animation-duration:${(3.6 + (i % 4) * 0.7).toFixed(1)}s;animation-delay:${(-(i * 0.9) % 3).toFixed(1)}s;--sway:${i % 2 ? -3 : 3}deg">${h.markup}</g></g>`,
        )
        .join("") +
      front;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS.w} ${CANVAS.h}" role="img" aria-label="${label.replace(/"/g, "")}" style="display:block;width:100%;height:auto">${body}</svg>`;
    return <div className={className} dangerouslySetInnerHTML={{ __html: svg }} />;
  }
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
